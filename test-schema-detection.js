const { analyzeSchemaChange, hasBreakingChange } = require('./datahub-pr-guardian/src/analysis/schemaChange');

console.log("=== Test 1: Renamed column detection ===");
const baseRename = `
select
    order_id,
    customer_id,
    order_status,
    cast(order_total as decimal(12, 2)) as order_total,
    created_at
from source_orders`;

const headRename = `
select
    order_id,
    customer_id,
    order_status,
    cast(order_total as decimal(12, 2)) as total_amount,
    created_at
from source_orders`;

const renameResult = analyzeSchemaChange(baseRename, headRename);
console.log("Renamed columns:", renameResult.renamedColumns);
console.log("Dropped columns:", renameResult.droppedColumns);
console.log("Added columns:", renameResult.addedColumns);
console.log("Has breaking change:", hasBreakingChange(renameResult));

console.log("\n=== Test 2: Type change detection ===");
const baseType = `
select
    order_id,
    customer_id,
    order_status,
    cast(order_total as decimal(12, 2)) as order_total,
    created_at
from source_orders`;

const headType = `
select
    order_id,
    customer_id,
    order_status,
    cast(order_total as decimal(10, 2)) as order_total,
    created_at
from source_orders`;

const typeResult = analyzeSchemaChange(baseType, headType);
console.log("Type changes:", typeResult.typeChanges);
console.log("Has breaking change:", hasBreakingChange(typeResult));

console.log("\n=== Test 3: Join key detection ===");
const baseJoin = `
select
    o.order_id,
    o.customer_id,
    o.order_status,
    o.order_total,
    o.created_at,
    date_trunc('day', o.created_at) as order_date
from stg_orders o
join dim_customers c on o.customer_id = c.customer_id
where o.order_status = 'completed'`;

const headJoin = `
select
    o.order_id,
    o.customer_id,
    o.order_status,
    o.order_total,
    o.created_at,
    date_trunc('day', o.created_at) as order_date
from stg_orders o
join dim_customers c on o.customer_id = c.customer_id and o.order_status = 'completed'
where o.order_status = 'completed'`;

const joinResult = analyzeSchemaChange(baseJoin, headJoin);
console.log("Join key changes:", joinResult.joinKeyChanges);
console.log("Has breaking change:", hasBreakingChange(joinResult));

console.log("\n=== Test 4: Additive change ===");
const baseAdditive = `
select
    order_id,
    customer_id,
    order_status,
    cast(order_total as decimal(12, 2)) as order_total,
    created_at
from source_orders`;

const headAdditive = `
select
    order_id,
    customer_id,
    order_status,
    cast(order_total as decimal(12, 2)) as order_total,
    created_at,
    date_trunc('day', created_at) as order_day
from source_orders`;

const additiveResult = analyzeSchemaChange(baseAdditive, headAdditive);
console.log("Added columns:", additiveResult.addedColumns);
console.log("Has breaking change:", hasBreakingChange(additiveResult));
