import { useCallback, useEffect, useMemo, useState } from 'react'
import { db } from '../../services/db.js'
import { useUser } from '../../context/useUser.js'
import { useToast } from '../../context/useToast.js'
import { formatBRL } from '../../utils/format.js'
import ReceiptReviewPanel from '../ReceiptReviewPanel/ReceiptReviewPanel.jsx'
import './PharmacistWorkspace.css'

const ORDER_STATUS = {
  pendente: 'Pendente',
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  aguardando_analise: 'Aguardando análise',
  receita_aprovada: 'Receita aprovada',
  receita_rejeitada: 'Receita rejeitada',
  cancelado: 'Cancelado',
  enviado: 'Enviado',
  entregue: 'Entregue',
}
const REVIEW_STATUS = [
  { key: 'todos', label: 'Todas' },
  { key: 'aguardando_analise', label: 'Pendentes' },
  { key: 'aprovada', label: 'Aprovadas' },
  { key: 'rejeitada', label: 'Rejeitadas' },
]

const countLabel = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`

function SummaryCard({ label, value, detail, glyph, emphasis }) {
  return (
    <article className={`ph-kpi ${emphasis ? 'ph-kpi-emphasis' : ''}`}>
      <div className="ph-kpi-head"><span>{label}</span><span className="ph-kpi-glyph" aria-hidden="true">{glyph}</span></div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function OrdersChart({ days }) {
  const max = Math.max(1, ...days.map((entry) => entry.count))
  const total = days.reduce((sum, entry) => sum + entry.count, 0)
  return (
    <section className="ph-panel ph-chart" aria-labelledby="ph-chart-title">
      <div className="ph-panel-title">
        <div>
          <h3 id="ph-chart-title">Pedidos nos últimos 7 dias</h3>
          <p>Volume de pedidos registrados no sistema</p>
        </div>
        <span className="ph-quiet-badge">{countLabel(total, 'pedido', 'pedidos')}</span>
      </div>
      <div className="ph-bars" role="img" aria-label={`Distribuição de ${total} pedidos nos últimos sete dias`}>
        {days.map((entry) => (
          <div className="ph-bar-column" key={entry.date}>
            <span className="ph-bar-count">{entry.count}</span>
            <div className="ph-bar-track">
              <div className="ph-bar-fill" style={{ height: `${Math.max(3, 100 * entry.count / max)}%` }} />
            </div>
            <time dateTime={entry.date}>
              {/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? entry.date.slice(8, 10) + '/' + entry.date.slice(5, 7) : '—'}
            </time>
          </div>
        ))}
      </div>
      <p className="ph-chart-note">Indicadores atualizados com base nos pedidos cadastrados no sistema.</p>
    </section>
  )
}

function OrderStatuses({ data }) {
  const total = data.reduce((sum, status) => sum + status.count, 0)
  return (
    <section className="ph-panel" aria-labelledby="ph-status-title">
      <div className="ph-panel-title">
        <div><h3 id="ph-status-title">Situação dos pedidos</h3><p>Distribuição por etapa</p></div>
      </div>
      {data.length === 0 ? <p className="ph-empty">Nenhum pedido registrado até agora.</p> : (
        <div className="ph-status-list">
          {data.map((status) => (
            <div className="ph-status-row" key={status.status}>
              <div className="ph-status-row-label">
                <span>{ORDER_STATUS[status.status] || status.status.replaceAll('_', ' ')}</span>
                <strong>{status.count}</strong>
              </div>
              <div className="ph-status-progress" aria-hidden="true">
                <span style={{ width: `${total > 0 ? 100 * status.count / total : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Dashboard({ stats, statsLoading, statsError, queue, onRefresh, onGoReceipts }) {
  if (statsLoading && !stats) return <div className="ph-state" role="status">Carregando indicadores do Supabase…</div>
  if (statsError) return (
    <div className="ph-state ph-state-error" role="alert">
      <h3>Indicadores indisponíveis</h3>
      <p>{statsError}</p>
      <button type="button" className="ph-btn ph-btn-primary" onClick={onRefresh}>Tentar novamente</button>
      <p>A página de receitas continua disponível no menu lateral.</p>
    </div>
  )
  if (!stats) return null
  const pendingPreview = queue.filter((receipt) => receipt.status === 'aguardando_analise').slice(0, 3)
  return (
    <div className="ph-dashboard">
      <div className="ph-kpis">
        <SummaryCard label="Pedidos cadastrados" value={stats.orders_total} glyph="▣" detail={`${stats.orders_last_30_days} nos últimos 30 dias`} />
        <SummaryCard label="Valor dos pedidos" value={formatBRL(stats.orders_value)} glyph="↗" detail="Total acumulado dos pedidos registrados" />
        <SummaryCard label="Receitas pendentes" value={stats.pending_receipts} glyph="◷" detail="Aguardando decisão manual" emphasis />
        <SummaryCard label="Receitas analisadas" value={stats.approved_receipts + stats.rejected_receipts} glyph="✓" detail={`${stats.approved_receipts} aprovadas · ${stats.rejected_receipts} rejeitadas`} />
      </div>
      <div className="ph-panels-grid">
        <OrdersChart days={stats.daily_orders} />
        <OrderStatuses data={stats.order_statuses} />
      </div>
      <section className="ph-panel ph-pending" aria-labelledby="ph-pending-title">
        <div className="ph-panel-title">
          <div><h3 id="ph-pending-title">Receitas aguardando análise</h3><p>Documentos que precisam de conferência manual</p></div>
          <button type="button" className="ph-link-button" onClick={onGoReceipts}>Ver todas as receitas <span aria-hidden="true">→</span></button>
        </div>
        {pendingPreview.length === 0 ? (
          <p className="ph-empty">Nenhuma receita pendente entre os documentos recentes da fila.</p>
        ) : (
          <div className="ph-pending-list">
            {pendingPreview.map((receipt) => (
              <div className="ph-pending-item" key={receipt.id}>
                <span className="ph-file-symbol" aria-hidden="true">▤</span>
                <div><strong>Pedido #{String(receipt.order_id).slice(0, 8).toUpperCase()}</strong><p>{receipt.file_name}</p></div>
                <span className="ph-tag">Pendente</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <p className="ph-disclaimer">Painel acadêmico de acompanhamento interno para pedidos e receitas cadastrados na plataforma.</p>
    </div>
  )
}

export default function PharmacistWorkspace({ onViewStore }) {
  const { user, isPharmacist, isLoggedIn, logout, openAccount, reviewQueue,
    reviewReceipt, getReceiptUrl, reloadAccountData, dataLoading, dataError } = useUser()
  const { showToast } = useToast()
  const [page, setPage] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [search, setSearch] = useState('')

  const refreshStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const result = await db.getPharmacistDashboard()
      setStats(result)
      setStatsError('')
    } catch (error) {
      setStatsError(error.message || 'Não foi possível consultar os indicadores.')
    } finally { setStatsLoading(false) }
  }, [])

  useEffect(() => {
    // Resposta assíncrona evita cascatas de render ao montar o painel.
    let active = true
    void db.getPharmacistDashboard()
      .then((result) => {
        if (!active) return
        setStats(result)
        setStatsError('')
      })
      .catch((error) => {
        if (active) setStatsError(error.message || 'Não foi possível consultar os indicadores.')
      })
      .finally(() => { if (active) setStatsLoading(false) })
    return () => { active = false }
  }, [])

  const refreshAll = async () => {
    await Promise.all([reloadAccountData(), refreshStats()])
  }

  const handleReview = async (id, decision, note) => {
    const result = await reviewReceipt(id, decision, note)
    await refreshStats()
    return result
  }

  const filteredQueue = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return reviewQueue.filter((receipt) =>
      (statusFilter === 'todos' || receipt.status === statusFilter) &&
      (!term || `${receipt.file_name} ${receipt.order_id}`.toLocaleLowerCase('pt-BR').includes(term))
    )
  }, [reviewQueue, statusFilter, search])

  const signOut = async () => {
    try { await logout() }
    catch (error) { showToast(error.message || 'Não foi possível sair da conta.', 'error') }
  }

  // A UI nunca é uma fonte de permissão. RPCs e Storage aplicam validação no servidor.
  if (!isLoggedIn || !isPharmacist) return null

  return (
    <div className="ph-workspace">
      <a href="#ph-main" className="skip-link">Pular para o conteúdo do painel</a>
      <aside className="ph-sidebar" aria-label="Menu do farmacêutico">
        <div className="ph-brand"><div className="ph-brand-icon" aria-hidden="true">✳</div><div><strong>Farma<span>Vida</span></strong><small>PAINEL FARMACÊUTICO</small></div></div>
        <span className="ph-menu-caption">GERENCIAMENTO</span>
        <nav className="ph-nav" aria-label="Páginas do farmacêutico">
          <button type="button" className={page === 'dashboard' ? 'active' : ''} aria-current={page === 'dashboard' ? 'page' : undefined} onClick={() => setPage('dashboard')}><span aria-hidden="true">▦</span> Visão geral</button>
          <button type="button" className={page === 'receitas' ? 'active' : ''} aria-current={page === 'receitas' ? 'page' : undefined} onClick={() => setPage('receitas')}><span aria-hidden="true">▤</span> Receitas <span className="ph-nav-count">{reviewQueue.filter((receipt) => receipt.status === 'aguardando_analise').length}</span></button>
        </nav>
        <div className="ph-sidebar-bottom">
          <button className="ph-store-switch" type="button" onClick={onViewStore}><span aria-hidden="true">↗</span> Ver loja do cliente</button>
          <div className="ph-side-profile">
            <span className="ph-profile-icon" aria-hidden="true">{(user.nome || user.email || 'F')[0].toUpperCase()}</span>
            <span><strong>{user.nome || 'Farmacêutico'}</strong><small>{user.email}</small></span>
          </div>
          <button className="ph-logout" type="button" onClick={signOut}>Sair da conta</button>
        </div>
      </aside>
      <div className="ph-content-wrap">
        <header className="ph-topbar">
          <div><span className="ph-context">ÁREA RESTRITA · GESTÃO FARMACÊUTICA</span><p>Painel de gestão FarmaVida</p></div>
          <div className="ph-top-actions">
            <button type="button" className="ph-btn ph-btn-soft" onClick={() => openAccount('dados')}>Minha conta</button>
            <button type="button" className="ph-btn ph-btn-primary" onClick={onViewStore}>Ver loja do cliente <span aria-hidden="true">↗</span></button>
          </div>
        </header>
        <main id="ph-main" tabIndex={-1} className="ph-main">
          <div className="ph-page-heading">
            <div><p className="ph-eyebrow">CENTRAL FARMAVIDA</p><h1>{page === 'dashboard' ? 'Visão geral' : 'Análise de receitas'}</h1><p>{page === 'dashboard' ? 'Acompanhe pedidos e análises em um só lugar.' : 'Consulte os PDFs e registre pareceres manualmente.'}</p></div>
            <button type="button" className="ph-btn ph-btn-outline" disabled={dataLoading || statsLoading} onClick={() => void refreshAll()}>↻ Atualizar dados</button>
          </div>
          {page === 'dashboard' ? (
            <Dashboard stats={stats} statsError={statsError} statsLoading={statsLoading} queue={reviewQueue}
              onRefresh={refreshStats} onGoReceipts={() => setPage('receitas')} />
          ) : (
            <div className="ph-receipts-page">
              <div className="ph-receipt-controls">
                <div className="ph-receipt-controls-top"><strong>Receitas recebidas</strong><span>{countLabel(filteredQueue.length, 'documento', 'documentos')} na lista</span></div>
                <label className="ph-search-label" htmlFor="ph-search">Buscar por nome do PDF ou pedido</label>
                <input id="ph-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar receitas…" />
                <div className="ph-filters" role="group" aria-label="Filtrar receitas pelo status">
                  {REVIEW_STATUS.map((item) => <button key={item.key} type="button" className={statusFilter === item.key ? 'active' : ''} aria-pressed={statusFilter === item.key} onClick={() => setStatusFilter(item.key)}>{item.label}</button>)}
                </div>
              </div>
              {dataError && <p className="ph-inline-error" role="alert">{dataError}</p>}
              <ReceiptReviewPanel queue={filteredQueue} onReview={handleReview} getReceiptUrl={getReceiptUrl}
                onRefresh={refreshAll} loading={dataLoading} />
              <p className="ph-disclaimer">A fila mostra os registros recentes conforme a função protegida do Supabase.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
