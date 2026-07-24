#!/usr/bin/env python3
import re
import json

# Test the join key extraction regex
base_sql = """select
    o.order_id,
    o.customer_id,
    o.order_status,
    o.order_total,
    o.created_at,
    date_trunc('day', o.created_at) as order_date
from {{ ref('stg_orders') }} o
join {{ ref('dim_customers') }} c on o.customer_id = c.customer_id
where o.order_status = 'completed'"""

head_sql = """select
    o.order_id,
    o.customer_id,
    o.order_status,
    o.order_total,
    o.created_at,
    date_trunc('day', o.created_at) as order_date
from {{ ref('stg_orders') }} o
join {{ ref('dim_customers') }} c on o.customer_id = c.customer_id and o.order_status = 'completed'"""

# The regex from the JavaScript code
join_pattern = r'\bjoin\b[\s\S]*?\bon\b\s*([^\n;]+?)(?=\bjoin\b|\bwhere\b|\bgroup\b|\border\b|\bhaving\b|\bunion\b|$)'

def extract_join_keys(sql):
    matches = re.findall(join_pattern, sql, re.IGNORECASE | re.DOTALL)
    return [re.sub(r'\s+', ' ', m).strip().lower() for m in matches]

def normalize(s):
    return re.sub(r'\s+', ' ', s).strip().lower()

print("=== Base SQL ===")
print(base_sql)
print("")

print("=== Head SQL ===")
print(head_sql)
print("")

print("=== Extracted join keys from base ===")
base_matches = re.findall(join_pattern, base_sql, re.IGNORECASE | re.MULTILINE)
for i, match in enumerate(base_matches):
    print(f"Match {i}: '{match}' -> Normalized: '{normalize(match)}'")
print("")

print("=== Extracted join keys from head ===")
head_matches = re.findall(join_pattern, head_sql, re.IGNORECASE | re.MULTILINE)
for i, match in enumerate(head_matches):
    print(f"Match {i}: '{match}' -> Normalized: '{normalize(match)}'")
print("")

print("=== Comparison ===")
if base_matches and head_matches:
    base_key = normalize(base_matches[0])
    head_key = normalize(head_matches[0])
    print(f"Base key (normalized): '{base_key}'")
    print(f"Head key (normalized): '{head_key}'")
    print("")
    if base_key == head_key:
        print("❌ KEYS ARE IDENTICAL - No change detected")
    else:
        print("✅ KEYS ARE DIFFERENT - Change detected")
else:
    print("❌ No matches found")
