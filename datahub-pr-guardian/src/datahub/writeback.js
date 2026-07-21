const { graphqlRequest, modelNameToUrn } = require("./client");

// Confirm this mutation and input shape against the DataHub version you deploy.
const WRITEBACK_MUTATION = [
  "mutation UpdateDescription($input: DescriptionUpdateInput!) {",
  "  updateDescription(input: $input)",
  "}",
].join("\n");

const CURRENT_DESCRIPTION_QUERY = [
  "query CurrentDescription($urn: String!) {",
  "  dataset(urn: $urn) {",
  "    properties { description }",
  "    editableProperties { description }",
  "  }",
  "}",
].join("\n");

function appendReviewNote(existingDescription, note) {
  const current = existingDescription?.trim();
  if (!current) return note;
  if (current.includes(note)) return current;
  return current + "\n\n" + note;
}

async function writeIncidentNote(modelName, prNumber, summary) {
  const urn = modelNameToUrn(modelName);
  const note = "[PR Guardian] Reviewed in PR #" + prNumber + ". " + summary;
  const current = await graphqlRequest(CURRENT_DESCRIPTION_QUERY, { urn });
  const existingDescription =
    current?.dataset?.editableProperties?.description ||
    current?.dataset?.properties?.description ||
    "";
  const description = appendReviewNote(existingDescription, note);

  if (description === existingDescription) {
    return { updateDescription: false, skipped: true };
  }

  return graphqlRequest(WRITEBACK_MUTATION, {
    input: { resourceUrn: urn, description },
  });
}

module.exports = {
  WRITEBACK_MUTATION,
  CURRENT_DESCRIPTION_QUERY,
  appendReviewNote,
  writeIncidentNote,
};
