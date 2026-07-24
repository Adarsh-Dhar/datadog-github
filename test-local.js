const { analyzeSchemaChange, hasBreakingChange } = require('./datahub-pr-guardian/src/analysis/schemaChange');

const baseSql = `with source_orders as (
    select
        order_id,
        customer_id,
        order_status,
        order_total,
        created_at
    from {{ source('raw', 'orders') }}
)

select
    order_id,
    customer_id,
    order_status,
    cast(order_total as decimal(12, 2)) as order_total,
    created_at
from source_orders`;

const headSql = `with source_orders as (
    select
        order_id,
        customer_id,
        order_status,
        order_total,
        created_at
    from {{ source('raw', 'orders') }}
)

select
    order_id,
    customer_id,
    order_status,
    cast(order_total as decimal(10, 2)) as order_total,
    created_at
from source_orders`;

console.log("=== Testing type change detection ===");
console.log("");

const result = analyzeSchemaChange(baseSql, headSql);
console.log("Result:", JSON.stringify(result, null, 2));
console.log("Has breaking change:", hasBreakingChange(result));
