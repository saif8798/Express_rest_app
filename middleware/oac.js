const dotenv = require("dotenv");
const axios = require("axios");
const puppeteer = require("puppeteer");
// CONFIG
const OAC_HOST =
  "https://oacreportingpoc-iddsu14hgang-4p-ia.analytics.ocp.oraclecloud.com";
const WORKBOOK_URL =
  "https://oacreportingpoc-iddsu14hgang-4p-ia.analytics.ocp.oraclecloud.com/ui/dv/?pageid=visualAnalyzer&reportmode=full&reportpath=%2F%40Catalog%2Fshared%2FPOC%2FPOC_Sales%20Dashboard";

const COOKIE_VALUE = "<ORA_BIPS_NQID_cookie>";

async function screenShotOac() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  // Inject cookie
  await page.setCookie({
    name: "ORA_BIPS_NQID",
    value: COOKIE_VALUE,
    domain: new URL(OAC_HOST).hostname,
    path: "/",
  });

  // Open workbook
  await page.goto(WORKBOOK_URL, {
    waitUntil: "networkidle2",
  });

  // Wait for charts
  await new Promise((res) => setTimeout(res, 8000));

  // Screenshot
  await page.screenshot({
    path: "dashboard.png",
    fullPage: true,
  });

  console.log("✅ Screenshot saved");

  await browser.close();
}

// const getPowerBIData = async (accessToken, queryString, workspaceId, datasetId) => {
//   const response = await axios.post(
//     `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/executeQueries`,
//     {
//       queries: [
//         {
//           query: `${queryString}`
//         }
//       ]
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${accessToken}`
//       }
//     }
//   );

//   return response.data.results[0].tables[0].rows[0];
// };

// const getAccessToken = async (tenantId) => {
//   const res = await axios.post(
//     `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
//     new URLSearchParams({
//       grant_type: "client_credentials",
//       client_id: process.env.CLIENT_ID,
//       client_secret: process.env.CLIENT_SECRET,
//       scope: "https://analysis.windows.net/powerbi/api/.default"
//     })
//   );

//   return res.data.access_token;
// };

dotenv.config();

const { OAC_BASE_URL, OAC_USERNAME, OAC_PASSWORD } = process.env;

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`,
  ).toString("base64");

  const response = await axios.post(
    process.env.TOKEN_URL,
    new URLSearchParams({
      grant_type: "client_credentials",
      scope: "urn:opc:resource:consumer::all",
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  return response.data.access_token;
}

// async function getAccessToken() {
//   const credentials = Buffer.from(
//     `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
//   ).toString("base64");

//   const response = await axios.post(
//     process.env.TOKEN_URL,
//     new URLSearchParams({
//       grant_type: "client_credentials",
//       scope: "urn:opc:resource:consumer::all"
//     }),
//     {
//       headers: {
//         "Authorization": `Basic ${credentials}`,
//         "Content-Type": "application/x-www-form-urlencoded"
//       }
//     }
//   );

//   return response.data.access_token;
// }

async function getCatalog(token) {
  const response = await axios.get(
    `${process.env.OAC_BASE_URL}/api/1.0/catalog`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

// async function getCatalog(token) {
//   const response = await axios.get(
//     `${process.env.OAC_BASE_URL}/api/1.0/catalog`,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     }
//   );

//   return response.data;
// }

async function fetchOACData(token) {
  const response = await axios.post(
    `${OAC_BASE_URL}/api/1.0/datasets/actions/executeQuery`,
    {
      sql: "SELECT * FROM your_dataset LIMIT 10",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export { screenShotOac };
