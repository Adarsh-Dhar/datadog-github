const { graphqlRequest, modelNameToUrn } = require("./client");

// Confirm this mutation and input shape against the DataHub version you deploy.
const WRITEBACK_MUTATION = [
  "mutation UpdateDescription($input: DescriptionUpdateInput!) {",
  "  updateDescription(input: $input)",
  "}",
].join("\n");

async function writeIncidentNote(modelName, prNumber, summary) {
  const urn = modelNameToUrn(modelName);
  const note = "[PR Guardian] Reviewed in PR #" + prNumber + ". " + summary;
  return graphqlRequest(WRITEBACK_MUTATION, {
    input: { resourceUrn: urn, description: note },
  });
}

module.exports = { WRITEBACK_MUTATION, writeIncidentNote };
