const { execFileSync } = require("child_process");
const fs = require("fs");
const config = require("../config");
const { analyzeSchemaChange, extractColumns } = require("../analysis/schemaChange");

function requireGitRef(name, value) {
  if (!value) throw new Error(name + " is required to calculate the pull-request diff.");
  return value;
}

// Returns changed dbt model files between the pull request base and head commits.
function getChangedModels() {
  const baseSha = requireGitRef("BASE_SHA", config.baseSha);
  const headSha = requireGitRef("HEAD_SHA", config.headSha);
  const diffOutput = execFileSync("git", [
    "diff",
    "--name-only",
    baseSha,
    headSha,
  ]).toString();

  return diffOutput
    .split("\n")
    .map((file) => file.trim())
    .filter((file) => file.endsWith(".sql") && file.includes("models/"));
}

function diffModel(filePath) {
  const headContent = fs.readFileSync(filePath, "utf8");
  let baseContent;
  try {
    baseContent = execFileSync("git", [
      "show",
      requireGitRef("BASE_SHA", config.baseSha) + ":" + filePath,
    ]).toString();
    
    // Debug logging
    console.log(`=== diffModel for ${filePath} ===`);
    console.log(`BASE_SHA: ${config.baseSha}`);
    console.log(`HEAD_SHA: ${config.headSha}`);
    console.log(`Base content length: ${baseContent.length}`);
    console.log(`Head content length: ${headContent.length}`);
    console.log(`Base content preview: ${baseContent.substring(0, 200)}...`);
    console.log(`Head content preview: ${headContent.substring(0, 200)}...`);
  } catch {
    return {
      modelPath: filePath,
      modelName: filePath.split("/").pop().replace(/\.sql$/, ""),
      isNew: true,
      ...analyzeSchemaChange("", headContent),
      addedColumns: extractColumns(headContent).map((column) => column.name),
    };
  }

  const result = {
    modelPath: filePath,
    modelName: filePath.split("/").pop().replace(/\.sql$/, ""),
    isNew: false,
    ...analyzeSchemaChange(baseContent, headContent),
  };
  
  console.log(`Schema change result: ${JSON.stringify(result, null, 2)}`);
  
  return result;
}

module.exports = { getChangedModels, diffModel };
