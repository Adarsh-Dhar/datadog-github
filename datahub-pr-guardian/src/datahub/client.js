const config = require("../config");

function requireDataHubConfig() {
  if (!config.datahubGmsUrl) throw new Error("DATAHUB_GMS_URL is required.");
  if (!config.datahubToken) throw new Error("DATAHUB_TOKEN is required.");
}

async function graphqlRequest(query, variables = {}) {
  requireDataHubConfig();
  const endpoint = new URL("/api/graphql", config.datahubGmsUrl).toString();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + config.datahubToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      "DataHub GraphQL request failed (" +
        response.status +
        "): " +
        (json.message || JSON.stringify(json)),
    );
  }
  if (json.errors?.length) {
    throw new Error("DataHub GraphQL error: " + JSON.stringify(json.errors));
  }
  return json.data;
}

function modelNameToUrn(modelName) {
  const datasetName = config.datasetPrefix
    ? config.datasetPrefix + "." + modelName
    : modelName;
  return (
    "urn:li:dataset:(urn:li:dataPlatform:" +
    config.platform +
    "," +
    datasetName +
    "," +
    config.env +
    ")"
  );
}

module.exports = { graphqlRequest, modelNameToUrn };
