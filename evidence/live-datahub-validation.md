# Live DataHub validation

Captured locally on 2026-07-21 against a running DataHub v1.5.0.6 instance.
The GraphQL requests below were also verified through a temporary public tunnel
used for the GitHub Actions test. These are DataHub integration artifacts; the
separate GitHub pull-request comment still requires a signed-in GitHub session
and repository secrets.

## Schema: `updateDescription`

```text
Operation: updateDescription
Type: Mutation
Description: Incubating. Updates the description of a resource. Currently only supports Dataset Schema Fields, Containers
Arguments:
  - input: DescriptionUpdateInput!
```

## Input shape: `DescriptionUpdateInput`

```text
Type: DescriptionUpdateInput
Kind: INPUT_OBJECT
Fields:
  - description: String! - The new description
  - resourceUrn: String! - The primary key of the resource to attach the description to, eg dataset urn
  - subResourceType: SubResourceType - An optional sub resource type
  - subResource: String - A sub resource identifier, eg dataset field path
```

This confirms that the writeback mutation must receive `resourceUrn`, not
`urn`.

## Persisted writeback result

The live GraphQL readback of the DuckDB dataset returned:

```json
{
  "data": {
    "dataset": {
      "urn": "urn:li:dataset:(urn:li:dataPlatform:duckdb,pr_guardian_demo.main.fct_revenue,PROD)",
      "editableProperties": {
        "description": "[PR Guardian] Reviewed in PR #0. Live mutation validation.\n\n[PR Guardian] Reviewed in PR #1. Append-only writeback validation."
      }
    }
  }
}
```

The second writeback appended to the first. Repeating the same writeback
returned `{ "updateDescription": false, "skipped": true }`, proving the
deduplication path.

## Live downstream-lineage result

The action's `getDownstreamImpact("stg_orders")` function returned:

```json
[
  {
    "urn": "urn:li:dataset:(urn:li:dataPlatform:dbt,pr_guardian_demo.main.dim_customers,PROD)",
    "type": "DATASET",
    "name": "dim_customers",
    "degree": 1,
    "owners": []
  },
  {
    "urn": "urn:li:dataset:(urn:li:dataPlatform:dbt,pr_guardian_demo.main.fct_revenue,PROD)",
    "type": "DATASET",
    "name": "fct_revenue",
    "degree": 1,
    "owners": []
  },
  {
    "urn": "urn:li:dataset:(urn:li:dataPlatform:duckdb,pr_guardian_demo.main.dim_customers,PROD)",
    "type": "DATASET",
    "name": "pr_guardian_demo.main.dim_customers",
    "degree": 2,
    "owners": []
  },
  {
    "urn": "urn:li:dataset:(urn:li:dataPlatform:duckdb,pr_guardian_demo.main.fct_revenue,PROD)",
    "type": "DATASET",
    "name": "pr_guardian_demo.main.fct_revenue",
    "degree": 2,
    "owners": []
  }
]
```

The fixture intentionally has no ownership metadata yet, so the action reports
these assets as unowned rather than inventing an owner.
