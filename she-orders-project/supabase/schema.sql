create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  email_name text not null unique,
  created_date date not null,
  order_cost_with_coordination numeric(10,2) not null check (order_cost_with_coordination >= 0),
  is_finished boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  name text not null,
  instagram_url text not null,
  total_price numeric(10,2) not null check (total_price >= 0),
  deposit_paid numeric(10,2) not null default 0 check (deposit_paid >= 0),
  remaining_price numeric(10,2) not null default 0 check (remaining_price >= 0),
  payment_proof_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deposit_not_more_than_total check (deposit_paid <= total_price)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.calculate_remaining_price()
returns trigger language plpgsql as $$
begin
  new.remaining_price = new.total_price - new.deposit_paid;
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists trg_order_items_updated_at on public.order_items;
create trigger trg_order_items_updated_at before update on public.order_items for each row execute function public.set_updated_at();

drop trigger if exists trg_order_items_remaining_price on public.order_items;
create trigger trg_order_items_remaining_price before insert or update on public.order_items for each row execute function public.calculate_remaining_price();

create or replace view public.order_summaries as
select
  o.id,
  o.email_name,
  o.created_date,
  o.order_cost_with_coordination,
  o.is_finished,
  o.created_at,
  o.updated_at,
  coalesce(count(oi.id), 0)::int as girls_count,
  coalesce(sum(oi.total_price), 0)::numeric(10,2) as girls_total_price,
  coalesce(sum(oi.deposit_paid), 0)::numeric(10,2) as total_deposit,
  (coalesce(sum(oi.total_price), 0) - o.order_cost_with_coordination)::numeric(10,2) as profit
from public.orders o
left join public.order_items oi on oi.order_id = o.id
group by o.id, o.email_name, o.created_date, o.order_cost_with_coordination, o.is_finished, o.created_at, o.updated_at;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
