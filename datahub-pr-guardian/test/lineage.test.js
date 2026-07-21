const test = require("node:test");
const assert = require("node:assert/strict");
const { dedupeImpactByName } = require("../src/datahub/lineage");

test("collapses dbt and DuckDB representations of the same downstream model", () => {
  const impact = dedupeImpactByName([
    {
      urn: "urn:li:dataset:(urn:li:dataPlatform:dbt,pr_guardian_demo.main.dim_customers,PROD)",
      type: "DATASET",
      name: "dim_customers",
      degree: 1,
      owners: ["analytics@example.com"],
    },
    {
      urn: "urn:li:dataset:(urn:li:dataPlatform:duckdb,pr_guardian_demo.main.dim_customers,PROD)",
      type: "DATASET",
      name: "pr_guardian_demo.main.dim_customers",
      degree: 2,
      owners: ["finance@example.com"],
    },
    {
      urn: "urn:li:dataset:(urn:li:dataPlatform:dbt,pr_guardian_demo.main.fct_revenue,PROD)",
      type: "DATASET",
      name: "fct_revenue",
      degree: 1,
      owners: [],
    },
    {
      urn: "urn:li:dataset:(urn:li:dataPlatform:duckdb,pr_guardian_demo.main.fct_revenue,PROD)",
      type: "DATASET",
      name: "pr_guardian_demo.main.fct_revenue",
      degree: 2,
      owners: [],
    },
  ]);

  assert.equal(impact.length, 2);
  assert.deepEqual(impact[0], {
    urn: "urn:li:dataset:(urn:li:dataPlatform:dbt,pr_guardian_demo.main.dim_customers,PROD)",
    type: "DATASET",
    name: "dim_customers",
    degree: 1,
    owners: ["analytics@example.com", "finance@example.com"],
  });
  assert.equal(impact[1].name, "fct_revenue");
});
