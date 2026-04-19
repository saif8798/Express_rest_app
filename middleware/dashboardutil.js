const toKeyValue = (arr, valueKey = "revenue") => {
  const obj = {};
  arr.forEach((item) => {
    obj[item._id || "Unknown"] = item[valueKey];
  });
  return obj;
};

const toMultiValue = (arr) => {
  const obj = {};
  arr.forEach((item) => {
    obj[item._id || "Unknown"] = {
      revenue: item.revenue,
      profit: item.profit,
    };
  });
  return obj;
};

const buildLookups = (req, options = {}) => {
  const pipeline = [];

  const {
    needCategory = false,
    needRegion = false,
    needChannel = false,
    needMonth = false,
  } = options;

  // 🔹 CATEGORY
  if (needCategory || req.query.category) {
    pipeline.push(
      {
        $lookup: {
          from: "dim_product",
          localField: "product_id",
          foreignField: "product_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    );

    if (needCategory && req.query.category) {
      pipeline.push({
        $match: { "product.category": req.query.category },
      });
    }
  }

  // 🔹 REGION
  if (needRegion || req.query.region) {
    pipeline.push(
      {
        $lookup: {
          from: "dim_geo",
          localField: "geo_id",
          foreignField: "geo_id",
          as: "geo",
        },
      },
      { $unwind: "$geo" },
    );

    if (needRegion && req.query.region) {
      pipeline.push({
        $match: { "geo.region": req.query.region },
      });
    }
  }

  if (needChannel || req.query.channel) {
    pipeline.push(
      {
        $lookup: {
          from: "dim_channel",
          localField: "channel_id",
          foreignField: "channel_id",
          as: "channel",
        },
      },
      { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } },
    );

    if (needChannel && req.query.channel) {
      pipeline.push({
        $match: { "channel.sales_channel": req.query.channel },
      });
    }
  }

  if (needMonth || req.query.month) {
    pipeline.push(
      {
        $lookup: {
          from: "dim_date",
          localField: "date_key",
          foreignField: "date_key",
          as: "date",
        },
      },
      { $unwind: { path: "$date", preserveNullAndEmptyArrays: true } },
    );

    if (needMonth && req.query.month) {
      pipeline.push({
        $match: { "date.month_name": req.query.month },
      });
    }
  }

  return pipeline;
};

const buildMatch = (query) => {
  const match = {};

  if (query.category) match["product.category"] = query.category;
  if (query.region) match["geo.region"] = query.region;
  if (query.month) match["date.month_name"] = query.month;
  if (query.channel) match["channel.sales_channel"] = query.channel;

  return Object.keys(match).length ? { $match: match } : null;
};

module.exports = { toKeyValue, toMultiValue, buildLookups, buildMatch };
