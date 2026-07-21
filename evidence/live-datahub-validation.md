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

After Docker/DataHub restarted successfully, a new working ngrok tunnel was
created and saved to `DATAHUB_GMS_URL`. The same PR workflow was rerun and
passed:

```text
guardian pass 22s
```

The GitHub Actions bot posted the real PR Guardian comment:
https://github.com/Adarsh-Dhar/datadog-github/pull/2#issuecomment-5031829798

After deduplicating the dbt and DuckDB representations, the guardian was run
again on commit `563e244d1cdfd522150fb46232eebbe255a0883b`:

https://github.com/Adarsh-Dhar/datadog-github/actions/runs/29816238044

That run passed and updated the same bot comment. It reported `stg_orders` as
HIGH risk, detected the dropped `customer_id` column, and listed exactly 2
downstream assets from DataHub lineage: `dim_customers` and `fct_revenue`.

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

## Live downstream-lineage result after deduplication

The action's `getDownstreamImpact("stg_orders")` function initially found both
the dbt model and its DuckDB representation for each downstream asset. The
guardian now collapses platform-qualified names to their logical model name,
keeps the closest lineage edge, and combines any owners. After adding
`meta.owner: Adarsh-Dhar` to the dbt models and re-ingesting, the same live
lookup returns exactly two owned downstream assets:

```json
[
  {
    "urn": "urn:li:dataset:(urn:li:dataPlatform:dbt,pr_guardian_demo.main.dim_customers,PROD)",
    "type": "DATASET",
    "name": "dim_customers",
    "degree": 1,
    "owners": [
      "Adarsh-Dhar"
    ]
  },
  {
    "urn": "urn:li:dataset:(urn:li:dataPlatform:dbt,pr_guardian_demo.main.fct_revenue,PROD)",
    "type": "DATASET",
    "name": "fct_revenue",
    "degree": 1,
    "owners": [
      "Adarsh-Dhar"
    ]
  }
]
```

The real guardian comment on PR #3 now names `Adarsh-Dhar` as the downstream
owner rather than reporting these assets as unowned:

https://github.com/Adarsh-Dhar/datadog-github/pull/3#issuecomment-5032138869

## Automated writeback on merge

PR #3 merged at `2026-07-21T09:08:38Z`:

https://github.com/Adarsh-Dhar/datadog-github/pull/3

The top-level `writeback.yml` workflow fired from that merge and completed
successfully at `2026-07-21T09:09:01Z`:

https://github.com/Adarsh-Dhar/datadog-github/actions/runs/29817075422/job/88590811919

Its CI log says `Wrote a DataHub review note for stg_orders.`, proving that the
write came from the merged-PR workflow rather than a manual local invocation.

### Before automated merge

```json
{
  "data": {
    "dataset": {
      "urn": "urn:li:dataset:(urn:li:dataPlatform:duckdb,pr_guardian_demo.main.stg_orders,PROD)",
      "editableProperties": null,
      "properties": null
    }
  }
}
```

### After automated merge

```json
{
  "data": {
    "dataset": {
      "urn": "urn:li:dataset:(urn:li:dataPlatform:duckdb,pr_guardian_demo.main.stg_orders,PROD)",
      "editableProperties": {
        "description": "[PR Guardian] Reviewed in PR #3. Severity: high."
      },
      "properties": null
    }
  }
}
```
