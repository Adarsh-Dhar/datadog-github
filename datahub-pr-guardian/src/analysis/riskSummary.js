const config = require("../config");

const SEVERITIES = new Set(["low", "medium", "high"]);

function fallbackRisk(modelDiff, downstreamImpact) {
  const changedAssets = downstreamImpact.length;
  const hasStructuralBreak =
    modelDiff.droppedColumns.length ||
    modelDiff.renamedColumns?.length ||
    modelDiff.typeChanges?.length ||
    modelDiff.joinKeyChanges?.removed?.length ||
    modelDiff.joinKeyChanges?.added?.length;
  const severity = hasStructuralBreak && changedAssets ? "high" : hasStructuralBreak ? "medium" : "low";
  const owners = [...new Set(downstreamImpact.flatMap((asset) => asset.owners))];
  return {
    severity,
    summary:
      "Detected " +
      (hasStructuralBreak ? "a structural change" : "a non-breaking additive change") +
      " affecting " +
      changedAssets +
      " downstream asset(s). " +
      (owners.length
        ? "Ask " + owners.join(", ") + " to review before merging."
        : "No downstream owner is recorded in DataHub."),
  };
}

function promptFor(modelDiff, downstreamImpact) {
  const consumers = downstreamImpact
    .map(
      (asset) =>
        "- " +
        asset.type +
        " \"" +
        asset.name +
        "\" (degree " +
        asset.degree +
        "), owners: " +
        (asset.owners.join(", ") || "unowned"),
    )
    .join("\n");
  return [
    "You are a senior data engineer reviewing a dbt model change for breaking impact.",
    "",
    "Model: " + modelDiff.modelName,
    "Dropped columns: " + (modelDiff.droppedColumns.join(", ") || "none"),
    "Renamed columns: " + ((modelDiff.renamedColumns || []).map((change) => change.from + " -> " + change.to).join(", ") || "none"),
    "Type changes: " + ((modelDiff.typeChanges || []).map((change) => change.column + " (" + change.from + " -> " + change.to + ")").join(", ") || "none"),
    "Changed join keys: " + ((modelDiff.joinKeyChanges?.removed || []).join(", ") || "none"),
    "Added columns: " + (modelDiff.addedColumns.join(", ") || "none"),
    "",
    "Downstream consumers (from the lineage graph):",
    consumers || "none",
    "",
    "In 3-4 sentences, state the concrete risk, who should review it, and include a line formatted Severity: low, medium, or high.",
  ].join("\n");
}

async function summarizeRisk(modelDiff, downstreamImpact) {
  if (!config.llmToken) return fallbackRisk(modelDiff, downstreamImpact);

  const response = await fetch("https://models.github.ai/inference/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.llmToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: promptFor(modelDiff, downstreamImpact) }],
      temperature: 0.2,
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error("GitHub Models request failed (" + response.status + ").");
  }

  const summary = json.choices?.[0]?.message?.content?.trim();
  if (!summary) return fallbackRisk(modelDiff, downstreamImpact);
  const matched = summary.match(/severity\s*:\s*(low|medium|high)/i);
  const severity = matched?.[1]?.toLowerCase();
  return {
    severity: SEVERITIES.has(severity) ? severity : "medium",
    summary,
  };
}

module.exports = { fallbackRisk, promptFor, summarizeRisk };
