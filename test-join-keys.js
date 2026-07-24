const { extractJoinKeys, analyzeSchemaChange, hasBreakingChange } = require('./datahub-pr-guardian/src/analysis/schemaChange');

const baseSql = `select
    o.order_id,
    o.customer_id,
    o.order_status,
    o.order_total,
    o.created_at,
    date_trunc('day', o.created_at) as order_date
from {{ ref('stg_orders') }} o
join {{ ref('dim_customers') }} c on o.customer_id = c.customer_id
where o.order_status = 'completed'`;

const headSql = `select
    o.order_id,
    o.customer_id,
    o.order_status,
    o.order_total,
    o.created_at,
    date_trunc('day', o.created_at) as order_date
from {{ ref('stg_orders') }} o
join {{ ref('dim_customers') }} c on o.customer_id = c.customer_id and o.order_status = 'completed'`;

console.log("=== Testing join key extraction ===");
console.log("Base SQL:", baseSql);
console.log("Head SQL:", headSql);
console.log("");

console.log("Base join keys:", extractJoinKeys(baseSql));
console.log("Head join keys:", extractJoinKeys(headSql));
console.log("");

const result = analyzeSchemaChange(baseSql, headSql);
console.log("Full result:", JSON.stringify(result, null, 2));
console.log("Has breaking change:", hasBreakingChange(result));
