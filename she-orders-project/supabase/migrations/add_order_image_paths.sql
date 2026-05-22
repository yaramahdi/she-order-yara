-- Add order_image_paths column to order_items for storing order photo paths
alter table public.order_items
  add column if not exists order_image_paths text[] not null default '{}';
