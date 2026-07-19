select
    order_id,
    order_status,
    order_total,
    created_at,
    date_trunc('day', created_at) as order_date
from {{ ref('stg_orders') }}
where order_status = 'completed'
