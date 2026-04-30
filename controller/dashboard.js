const FactSales = require("../models/dashboard");
const {
  toKeyValue,
  toMultiValue,
  buildLookups,
  buildMatch,
} = require("../middleware/dashboardutil");
const client = require("../middleware/oci");
const speechClient = require("../middleware/speech");

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
          gross_sales: { $sum: { $toDouble: "$gross_sales" } },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          revenue: { $sum: "$net_sales" },
          profit: { $sum: "$profit" },
          grossSales: { $sum: "$gross_sales" },
        },
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
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

exports.getOrderKpis = async (req, res, next) => {
  try {
    const pipeline = [
      ...buildLookups(req),
      ...(buildMatch(req.query) ? [buildMatch(req.query)] : []),

      {
        $facet: {
          orders: [
            {
              $group: {
                _id: "$order_id",
                net_sales: { $sum: { $toDouble: "$net_sales" } },
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
                returnOrders: { $sum: "$isReturned" },
              },
            },
          ],
          customers: [
            {
              $group: {
                _id: "$customer_id",
              },
            },
            {
              $count: "totalCustomers",
            },
          ],
        },
      },

      {
        $project: {
          totalOrders: { $arrayElemAt: ["$orders.totalOrders", 0] },
          revenue: { $arrayElemAt: ["$orders.revenue", 0] },
          returnOrders: { $arrayElemAt: ["$orders.returnOrders", 0] },
          totalCustomers: {
            $arrayElemAt: ["$customers.totalCustomers", 0],
          },
        },
      },

      {
        $project: {
          totalOrders: 1,
          returnOrders: 1,
          totalCustomers: 1,

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
      ...(buildMatch(req.query) ? [buildMatch(req.query)] : []),

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
      ...(buildMatch(req.query) ? [buildMatch(req.query)] : []),

      {
        $group: {
          _id: {
            month: "$date.month_name",
            year: "$date.fiscal_year",
            monthIndex: "$date.month_num", // IMPORTANT (1–12)
          },
          revenue: { $sum: { $toDouble: "$net_sales" } },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          monthIndex: "$_id.monthIndex",
          monthYear: {
            $concat: ["$_id.month", " ", { $toString: "$_id.year" }],
          },
          revenue: 1,
        },
      },
      {
        $sort: {
          year: 1,
          monthIndex: 1,
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
      ...(buildMatch(req.query) ? [buildMatch(req.query)] : []),

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
      ...(buildMatch(req.query) ? [buildMatch(req.query)] : []),

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

    console.log(pipeline);

    const result = await FactSales.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOrdersbyCategory = async (req, res, next) => {
  try {
    const pipeline = [
      ...buildLookups(req, { needCategory: true }),
      ...(buildMatch(req.query) ? [buildMatch(req.query)] : []),
      {
        $group: {
          _id: {
            order_id: "$order_id",
            category: "$product.category",
          },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          totalOrders: { $sum: 1 },
        },
      },

      {
        $project: {
          _id: 0,
          category: "$_id",
          totalOrders: 1,
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

exports.getAvgOrderbyCategroy = async (req, res, next) => {
  try {
    const pipeline = [
      ...buildLookups(req, { needCategory: true }),
      ...(buildMatch(req.query) ? [buildMatch(req.query)] : []),
      {
        $group: {
          _id: {
            order_id: "$order_id",
            category: "$product.category",
          },
          net_sales: { $sum: { $toDouble: "$net_sales" } },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          totalOrders: { $sum: 1 },
          revenue: { $sum: "$net_sales" },
        },
      },

      {
        $project: {
          _id: 0,
          category: "$_id",
          AOV: {
            $cond: [
              { $eq: ["$totalOrders", 0] },
              0,
              { $divide: ["$revenue", "$totalOrders"] },
            ],
          },
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

exports.getReturnOrdersandpercbyCategroy = async (req, res, next) => {
  try {
    const pipeline = [
      ...buildLookups(req, { needCategory: true }),
      ...(buildMatch(req.query) ? [buildMatch(req.query)] : []),
      {
        $group: {
          _id: {
            order_id: "$order_id",
            category: "$product.category",
          },
          isReturned: {
            $max: {
              $cond: [{ $eq: ["$returned_flag", "Y"] }, 1, 0],
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          totalOrders: { $sum: 1 },
          returnOrders: { $sum: "$isReturned" },
        },
      },

      {
        $project: {
          _id: 0,
          category: "$_id",
          returnOrders: 1,
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
    const result = await FactSales.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postDashboardSummary = async (req, res, next) => {
  const compartmentId =
    "ocid1.compartment.oc1..aaaaaaaagxzw7l7iwzofrmc3a6bxmlurlikzowpe6rbbj4rrg7oy6ra6l4qq";
  const modelId = process.env.OCI_MODEL_ID || "google.gemini-2.5-flash";

  if (!compartmentId) {
    return res.status(400).json({
      success: false,
      message: "Missing OCI_COMPARTMENT_ID",
    });
  }

  try {
    console.log(req.body, "kpis");
    const kpiData = req.body.kpis;
    const filters = req.body.filters;
    const prompt = `
You are giving a 1-minute voice update.
 
Rules:
- Natural spoken tone
- No headings, no bullets
- Max 120 words
- Do NOT include quotes
- Do NOT use placeholders like [Manager's Name]
- Start directly with the update

Filters applied:
${JSON.stringify(filters)}
 
Data:
${JSON.stringify(kpiData, null, 2)}
`;

    const response = await client.chat({
      chatDetails: {
        compartmentId,
        servingMode: {
          servingType: "ON_DEMAND",
          modelId,
        },
        chatRequest: {
          apiFormat: "GENERIC",
          messages: [
            {
              role: "USER",
              content: [
                {
                  type: "TEXT",
                  text: prompt,
                },
              ],
            },
          ],
          isStream: false,
          temperature: 0.7,
        },
      },
    });

    // ✅ extract text
    let text =
      response.chatResult?.chatResponse?.choices?.[0]?.message?.content?.[0]
        ?.text || "";

    // ✅ clean unwanted quotes
    text = text.replace(/^"+|"+$/g, "").trim();

    res.json({
      success: true,
      response: response,
      summary: text,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postSummaryAudio = async (req, res, next) => {
  try {
    const response = await speechClient.synthesizeSpeech({
      synthesizeSpeechDetails: {
        compartmentId: process.env.OCI_COMPARTMENT_ID,
        text: req.body.text,
        configuration: {
          modelFamily: "ORACLE",
        },
        audioConfig: {
          configType: "BASE_AUDIO_CONFIG",
        },
      },
    });

    // Convert ReadableStream to Buffer
    const chunks = [];
    for await (const chunk of response.value) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString("base64");

    // Send properly serialized JSON response
    res.json({
      success: true,
      audio: audioBase64,
      opcRequestId: response.opcRequestId,
      audioLength: audioBuffer.length,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
