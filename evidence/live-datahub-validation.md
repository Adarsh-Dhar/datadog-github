# Live DataHub validation

Captured locally on 2026-07-21 against a running DataHub v1.5.0.6 instance.
The GraphQL requests below were also verified through a temporary public tunnel
used for the GitHub Actions test.

## GitHub pull-request proof

Proof PR: https://github.com/Adarsh-Dhar/datadog-github/pull/2

The PR intentionally removes `customer_id` from
`pr-guardian-demo/models/staging/stg_orders.sql`, which is the model whose
downstream DataHub lineage is shown below.

Manual proof comment:
https://github.com/Adarsh-Dhar/datadog-github/pull/2#issuecomment-5031511090

The first GitHub Action run reached the DataHub GraphQL lookup and failed with:

```text
Error: DataHub GraphQL request failed (404): {}
```

This failure was caused by the saved `DATAHUB_GMS_URL` pointing to an expired
temporary ngrok tunnel. It does not invalidate the local DataHub schema,
lineage, or writeback proof captured below.

A fresh ngrok URL was then created and saved back to `DATAHUB_GMS_URL`. The
rerun reached the new tunnel and failed with:

```text
Error: DataHub GraphQL request failed (502): {}
```

That means the tunnel itself was reachable, but local DataHub was not listening
on `localhost:8080` because Docker Desktop was not exposing a working Docker
daemon.

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
