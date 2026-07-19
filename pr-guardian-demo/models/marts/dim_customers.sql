select
    customer_id,
    min(created_at) as first_order_at,
    max(created_at) as most_recent_order_at,
    count(*) as lifetime_orders,
    sum(order_total) as lifetime_revenue
from {{ ref('stg_orders') }}
group by customer_id
