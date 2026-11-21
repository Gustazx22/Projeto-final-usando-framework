-- FarmaVida | painel do farmacêutico - métricas acadêmicas agregadas
-- Execute DEPOIS de etapas6-7-receitas.sql. Repetível. Não apaga tabelas.
-- Acesso condicionado ao papel em public.pharmacist_users.
-- Os valores representam pedidos SIMULADOS, não faturamento ou pagamentos reais.

create or replace function public.farmavida_pharmacist_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  summary jsonb;
begin
  if auth.uid() is null or not private.farmavida_has_pharmacist_role() then
    raise exception 'Acesso restrito ao farmacêutico autorizado.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'orders_total', (select count(*) from public.orders),
    'orders_last_30_days', (select count(*) from public.orders where created_at >= now() - interval '30 days'),
    'orders_value', (select coalesce(sum(total),0) from public.orders where status not in ('cancelado','receita_rejeitada')),
    'orders_value_last_30_days', (select coalesce(sum(total),0) from public.orders
      where status not in ('cancelado','receita_rejeitada') and created_at >= now() - interval '30 days'),
    'pending_receipts', (select count(*) from public.receipt_documents where status = 'aguardando_analise'),
    'approved_receipts', (select count(*) from public.receipt_documents where status = 'aprovada'),
    'rejected_receipts', (select count(*) from public.receipt_documents where status = 'rejeitada'),
    'daily_orders', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'date', to_char(day.day, 'YYYY-MM-DD'),
        'count', (select count(*) from public.orders o where o.created_at::date = day.day::date),
        'value', (select coalesce(sum(o.total), 0) from public.orders o
                  where o.created_at::date = day.day::date
                  and o.status not in ('cancelado','receita_rejeitada'))
      ) order by day.day), '[]'::jsonb)
      from generate_series((current_date - 6)::timestamp, current_date::timestamp,
                           interval '1 day') as day(day)
    ),
    'order_statuses', (
      select coalesce(jsonb_agg(jsonb_build_object('status', grouped.status, 'count', grouped.qty)
                                order by grouped.qty desc), '[]'::jsonb)
      from (select status, count(*) as qty from public.orders group by status) grouped
    )
  ) into summary;

  return summary;
end;
$$;

revoke all on function public.farmavida_pharmacist_dashboard() from public, anon;
grant execute on function public.farmavida_pharmacist_dashboard() to authenticated;
