with source_orders as (
    select
        order_id,
        order_total,
        created_at
    from {{ source('raw', 'orders') }}
)

select
    order_id,
    cast(order_total as decimal(12, 2)) as order_total,
    created_at
from source_orders
