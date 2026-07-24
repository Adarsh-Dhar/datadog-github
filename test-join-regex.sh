#!/bin/bash

# Test the join key extraction regex manually

base_sql="select
    o.order_id,
    o.customer_id,
    o.order_status,
    o.order_total,
    o.created_at,
    date_trunc('day', o.created_at) as order_date
from {{ ref('stg_orders') }} o
join {{ ref('dim_customers') }} c on o.customer_id = c.customer_id
where o.order_status = 'completed'"

head_sql="select
    o.order_id,
    o.customer_id,
    o.order_status,
    o.order_total,
    o.created_at,
    date_trunc('day', o.created_at) as order_date
from {{ ref('stg_orders') }} o
join {{ ref('dim_customers') }} c on o.customer_id = c.customer_id and o.order_status = 'completed'"

echo "=== Base SQL ==="
echo "$base_sql"
echo ""
echo "=== Extracted join key from base ==="
echo "$base_sql" | grep -oiP 'join.*?on\s+\K[^\n;]+?(?=join|where|group|order|having|union|$)' | head -1
echo ""

echo "=== Head SQL ==="
echo "$head_sql"
echo ""
echo "=== Extracted join key from head ==="
echo "$head_sql" | grep -oiP 'join.*?on\s+\K[^\n;]+?(?=join|where|group|order|having|union|$)' | head -1
echo ""

echo "=== Comparison ==="
base_key=$(echo "$base_sql" | grep -oiP 'join.*?on\s+\K[^\n;]+?(?=join|where|group|order|having|union|$)' | head -1 | tr -s ' ' | tr '[:upper:]' '[:lower:]')
head_key=$(echo "$head_sql" | grep -oiP 'join.*?on\s+\K[^\n;]+?(?=join|where|group|order|having|union|$)' | head -1 | tr -s ' ' | tr '[:upper:]' '[:lower:]')

echo "Base key (normalized): $base_key"
echo "Head key (normalized): $head_key"
echo ""

if [ "$base_key" = "$head_key" ]; then
    echo "❌ KEYS ARE IDENTICAL - No change detected"
else
    echo "✅ KEYS ARE DIFFERENT - Change detected"
fi
