// const common = require("oci-common");
// const oci = require("oci-sdk");

// // ✅ correct path
// const AIServiceSpeechClient = oci.aispeech.AIServiceSpeechClient;

// const provider = new common.ConfigFileAuthenticationDetailsProvider();

// const speechClient = new AIServiceSpeechClient({
//   authenticationDetailsProvider: provider,
// });

// module.exports = speechClient;
require("./loadEnv");

const common = require("oci-common");
const { AIServiceSpeechClient } = require("oci-aispeech");

const provider = new common.ConfigFileAuthenticationDetailsProvider(
  process.env.OCI_CONFIG_FILE,
  process.env.OCI_CONFIG_PROFILE
);

const speechClient = new AIServiceSpeechClient({
  authenticationDetailsProvider: provider,
});

module.exports = speechClient;
