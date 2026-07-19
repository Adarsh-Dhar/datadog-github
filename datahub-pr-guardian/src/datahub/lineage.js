const { graphqlRequest, modelNameToUrn } = require("./client");

const DOWNSTREAM_QUERY = [
  "query GetDownstream($urn: String!) {",
  "  searchAcrossLineage(",
  "    input: {",
  "      urn: $urn",
  "      query: \"*\"",
  "      count: 50",
  "      start: 0",
  "      direction: DOWNSTREAM",
  "      orFilters: [{ and: [{ field: \"degree\", condition: EQUAL, values: [\"1\", \"2\"] }] }]",
  "    }",
  "  ) {",
  "    searchResults {",
  "      degree",
  "      entity {",
  "        urn",
  "        type",
  "        ... on Dataset {",
  "          name",
  "          ownership { owners { owner { ... on CorpUser { username properties { email } } } } }",
  "        }",
  "        ... on Dashboard {",
  "          dashboardId",
  "          tool",
  "          ownership { owners { owner { ... on CorpUser { username properties { email } } } } }",
  "        }",
  "      }",
  "    }",
  "  }",
  "}",
].join("\n");

function ownerNames(entity) {
  return (entity.ownership?.owners || [])
    .map((ownership) => {
      const owner = ownership.owner || {};
      return owner.username || owner.properties?.email;
    })
    .filter(Boolean);
}

async function getDownstreamImpact(modelName) {
  const urn = modelNameToUrn(modelName);
  const data = await graphqlRequest(DOWNSTREAM_QUERY, { urn });
  const results = data?.searchAcrossLineage?.searchResults || [];

  return results.map((result) => {
    const entity = result.entity;
    return {
      urn: entity.urn,
      type: entity.type,
      name: entity.name || entity.dashboardId || entity.urn,
      degree: result.degree,
      owners: ownerNames(entity),
    };
  });
}

module.exports = { DOWNSTREAM_QUERY, getDownstreamImpact };
