require("./loadEnv");

const common = require("oci-common");
const { GenerativeAiInferenceClient } = require("oci-generativeaiinference");

const provider = new common.ConfigFileAuthenticationDetailsProvider(
  process.env.OCI_CONFIG_FILE,
  process.env.OCI_CONFIG_PROFILE,
);

const client = new GenerativeAiInferenceClient({
  authenticationDetailsProvider: provider,
});

if (process.env.OCI_REGION) {
  client.regionId = process.env.OCI_REGION;
}

module.exports = client;
// require("./loadEnv");

// const common = require("oci-common");
// const { GenerativeAiInferenceClient } = require("oci-generativeaiinference");

// const provider = new common.ConfigFileAuthenticationDetailsProvider(
//   process.env.OCI_CONFIG_FILE,
//   process.env.OCI_CONFIG_PROFILE
// );

// const client = new GenerativeAiInferenceClient({
//   authenticationDetailsProvider: provider,
// });

// client.regionId = process.env.OCI_REGION;

// module.exports = client;
