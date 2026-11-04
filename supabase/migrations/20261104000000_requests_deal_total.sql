-- A request's negotiated total: the manager may enter the final sum of a large order (a discount, a bargain).
-- null — the total is the sum of the lines.
alter table public.requests add column deal_total bigint check (deal_total between 0 and 100000000000);
