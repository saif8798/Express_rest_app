const dotenv = require("dotenv");
const axios = require("axios");

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
    `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios.post(
    process.env.TOKEN_URL,
    new URLSearchParams({
      grant_type: "client_credentials",
      scope: "urn:opc:resource:consumer::all"
    }),
    {
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
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
        Authorization: `Bearer ${token}`
      }
    }
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

