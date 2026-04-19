const FactSales = require("../models/dashboard");
const {
  toKeyValue,
  toMultiValue,
  buildLookups,
  buildMatch,
} = require("../middleware/dashboardutil");

exports.getKpis = async (req, res, next) => {
  try {
    const pipeline = [
      ...buildLookups(req),
      ...(buildMatch(req.query) ? [buildMatch(req.query)] : []),

      {
        $group: {
          _id: "$order_id",
          net_sales: { $sum: { $toDouble: "$net_sales" } },
          profit: { $sum: { $toDouble: "$profit" } },
          isReturned: {
            $max: {
              $cond: [{ $eq: ["$returned_flag", "Y"] }, 1, 0],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          revenue: { $sum: "$net_sales" },
          profit: { $sum: "$profit" },
          returnOrders: { $sum: "$isReturned" },
        },
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          revenue: 1,
          profit: 1,
          returnOrders: 1,
          AOV: {
            $cond: [
              { $eq: ["$totalOrders", 0] },
              0,
              { $divide: ["$revenue", "$totalOrders"] },
            ],
          },
          returnRate: {
            $cond: [
              { $eq: ["$totalOrders", 0] },
              0,
              { $divide: ["$returnOrders", "$totalOrders"] },
            ],
          },
        },
      },
    ];

    console.log(pipeline);

    const result = await FactSales.aggregate(pipeline);
    res.json(result[0]);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getbyCategory = async (req, res, next) => {
  try {
    const pipeline = [
      ...buildLookups(req, { needCategory: true }),

      {
        $group: {
          _id: "$product.category",
          revenue: { $sum: { $toDouble: "$net_sales" } },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          revenue: 1,
        },
      },
    ];

    const result = await FactSales.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getbyMonth = async (req, res, next) => {
  try {
    const pipeline = [
      ...buildLookups(req, { needMonth: true }),

      {
        $group: {
          _id: "$date.month_name",
          revenue: { $sum: { $toDouble: "$net_sales" } },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          revenue: 1,
        },
      },
    ];

    const result = await FactSales.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getbyRegion = async (req, res, next) => {
  try {
    const pipeline = [
      ...buildLookups(req, { needRegion: true }),

      {
        $group: {
          _id: "$geo.region",
          revenue: { $sum: { $toDouble: "$net_sales" } },
        },
      },
      {
        $project: {
          _id: 0,
          region: "$_id",
          revenue: 1,
        },
      },
    ];

    const result = await FactSales.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getbyChannel = async (req, res, next) => {
  try {
    const pipeline = [
      ...buildLookups(req, { needChannel: true }),

      {
        $group: {
          _id: "$channel.sales_channel",
          revenue: { $sum: { $toDouble: "$net_sales" } },
          profit: { $sum: { $toDouble: "$profit" } },
        },
      },
      {
        $project: {
          _id: 0,
          channel: "$_id",
          revenue: 1,
          profit: 1,
        },
      },
    ];

    console.log(pipeline)

    const result = await FactSales.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getSalesData = async (req, res, next) => {
  try {
    const pipeline = [
      // 🔗 Joins
      {
        $lookup: {
          from: "dim_geo",
          localField: "geo_id",
          foreignField: "geo_id",
          as: "geo",
        },
      },
      { $unwind: { path: "$geo", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "dim_product",
          localField: "product_id",
          foreignField: "product_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "dim_date",
          localField: "date_key",
          foreignField: "date_key",
          as: "date",
        },
      },
      { $unwind: { path: "$date", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "dim_channel",
          localField: "channel_id",
          foreignField: "channel_id",
          as: "channel",
        },
      },
      { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } },

      // 🎯 Metrics
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,
                revenue: { $sum: "$net_sales" },
                profit: { $sum: "$profit" },
                grossSales: { $sum: "$gross_sales" },
              },
            },
            {
              $project: {
                _id: 0,
                revenue: 1,
                profit: 1,
                grossSales: 1,
                profitMargin: {
                  $cond: [
                    { $eq: ["$revenue", 0] },
                    0,
                    { $divide: ["$profit", "$revenue"] },
                  ],
                },
              },
            },
          ],

          byRegion: [
            {
              $group: {
                _id: "$geo.region",
                revenue: { $sum: "$net_sales" },
              },
            },
          ],

          byCategory: [
            {
              $group: {
                _id: "$product.category",
                revenue: { $sum: "$net_sales" },
              },
            },
          ],

          byMonth: [
            {
              $group: {
                _id: "$date.month_name",
                revenue: { $sum: "$net_sales" },
              },
            },
          ],

          byChannel: [
            {
              $group: {
                _id: "$channel.sales_channel",
                revenue: { $sum: "$net_sales" },
                profit: { $sum: "$profit" },
              },
            },
          ],
        },
      },
    ];

    const data = await FactSales.aggregate(pipeline);

    const result = data[0] || {};

    res.json({
      kpis: result.kpis?.[0] || {},

      revenueByRegion: toKeyValue(result.byRegion || []),
      revenueByCategory: toKeyValue(result.byCategory || []),
      revenueByMonth: toKeyValue(result.byMonth || []),

      channelMetrics: toMultiValue(result.byChannel || []),
    });
  } catch (err) {
    console.error("❌ Error:", err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOrdersData = async (req, res, next) => {
  try {
    const pipeline = [
      // 🔗 Join with dim_product
      {
        $lookup: {
          from: "dim_product",
          localField: "product_id",
          foreignField: "product_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,

                orders: { $addToSet: "$order_id" },
                customers: { $addToSet: "$customer_id" },

                returnedOrders: {
                  $addToSet: {
                    $cond: [
                      { $eq: ["$returned_flag", "Y"] },
                      "$order_id",
                      null,
                    ],
                  },
                },

                totalSales: { $sum: { $toDouble: "$net_sales" } },
              },
            },
            {
              $project: {
                _id: 0,

                totalOrders: { $size: "$orders" },
                totalCustomers: { $size: "$customers" },

                returnOrders: {
                  $size: {
                    $setDifference: ["$returnedOrders", [null]],
                  },
                },

                totalSales: 1,

                AOV: {
                  $cond: [
                    { $eq: [{ $size: "$orders" }, 0] },
                    0,
                    { $divide: ["$totalSales", { $size: "$orders" }] },
                  ],
                },

                returnRate: {
                  $cond: [
                    { $eq: [{ $size: "$orders" }, 0] },
                    0,
                    {
                      $divide: [
                        {
                          $size: {
                            $setDifference: ["$returnedOrders", [null]],
                          },
                        },
                        { $size: "$orders" },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: "$product.category",

                orders: { $addToSet: "$order_id" },

                returnedOrders: {
                  $addToSet: {
                    $cond: [
                      { $eq: ["$returned_flag", "Y"] },
                      "$order_id",
                      null,
                    ],
                  },
                },

                totalSales: { $sum: { $toDouble: "$net_sales" } },
              },
            },
            {
              $project: {
                _id: 0,
                category: "$_id",

                totalOrders: { $size: "$orders" },

                returnOrders: {
                  $size: {
                    $setDifference: ["$returnedOrders", [null]],
                  },
                },

                totalSales: 1,

                AOV: {
                  $cond: [
                    { $eq: [{ $size: "$orders" }, 0] },
                    0,
                    { $divide: ["$totalSales", { $size: "$orders" }] },
                  ],
                },

                returnRate: {
                  $cond: [
                    { $eq: [{ $size: "$orders" }, 0] },
                    0,
                    {
                      $divide: [
                        {
                          $size: {
                            $setDifference: ["$returnedOrders", [null]],
                          },
                        },
                        { $size: "$orders" },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    ];
    const data = await FactSales.aggregate(pipeline);
    const result = data[0] || {};
    res.json({ kpis: result.kpis[0], byCategory: result.byCategory });
  } catch {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
