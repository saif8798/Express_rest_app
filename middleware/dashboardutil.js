const puppeteer = require("puppeteer");

const BASE_URL =
  "https://oacreportingpoc-iddsu14hgang-4p-ia.analytics.ocp.oraclecloud.com/ui/dv/?pageid=home";

const WORKBOOK_URL =
  "https://oacreportingpoc-iddsu14hgang-4p-ia.analytics.ocp.oraclecloud.com/ui/dv/ui/project.jsp?pageid=visualAnalyzer&reportmode=presentation&reportpath=%2Fshared%2FPOC%2FPOC_Sales%20Dashboard";

async function captureOACScreenshot({
  screenshotPath = "dashboard.png",
  headless = false,
} = {}) {
  const browser = await puppeteer.launch({
    headless,
    userDataDir: "./session",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  // 🔹 Step 1: Login
  await page.goto(BASE_URL, {
    waitUntil: "domcontentloaded",    timeout: 0,
  });

  console.log("👉 Login manually (first time only), then press ENTER...");
  await new Promise((resolve) => process.stdin.once("data", resolve));

  // 🔹 Step 2: Navigate to workbook
  await page.goto(WORKBOOK_URL, {
    waitUntil: "domcontentloaded",
    timeout: 0,
  });

  // 🔹 Step 3: Wait for charts
  try {
    await page.waitForSelector("canvas, svg", { timeout: 30000 });
  } catch {
    console.log("⚠️ Charts not detected, continuing...");
  }

  // Small buffer for OAC rendering
  await new Promise((res) => setTimeout(res, 5000));

  // 🔹 Step 4: Screenshot
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  console.log(`✅ Screenshot saved: ${screenshotPath}`);

  await browser.close();
}

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
        $match: {
          "date.month_name": req.query.month,
          "date.fiscal_year": req.query.year,
        },
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

async function getOACScreenshotBuffer() {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./session",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // 🔹 Step 1: Open base URL (login entry)
  await page.goto(BASE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 0
  });

  // 🔹 Step 2: Detect if login is required
  const isLoginPage = await page.evaluate(() => {
    return document.body.innerText.toLowerCase().includes("sign in");
  });

  if (isLoginPage) {
    console.log("👉 Please login manually in the opened browser...");
    console.log("👉 Press ENTER after login");

    await new Promise((resolve) => process.stdin.once("data", resolve));
  }

  // 🔹 Step 3: Navigate to workbook
  await page.goto(WORKBOOK_URL, {
    waitUntil: "domcontentloaded",
    timeout: 0
  });

  // 🔹 Step 4: Wait for charts to render
  try {
    await page.waitForSelector("canvas, svg", { timeout: 30000 });
  } catch {
    console.log("⚠️ Charts not detected, continuing...");
  }

  // buffer delay for OAC rendering
  await new Promise((res) => setTimeout(res, 5000));

  // 🔹 Step 5: Take screenshot
  const buffer = await page.screenshot({
    fullPage: true
  });

  await browser.close();

  return buffer;
}

module.exports = {
  toKeyValue,
  toMultiValue,
  buildLookups,
  buildMatch,
  getOACScreenshotBuffer,
  captureOACScreenshot,
};
