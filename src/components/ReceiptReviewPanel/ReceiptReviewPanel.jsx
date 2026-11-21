import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import './ReceiptReviewPanel.css'

const STATUS = {
  aguardando_analise: 'Aguardando análise',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
}

export default function ReceiptReviewPanel({ queue, onReview, getReceiptUrl, onRefresh, loading }) {
  const { showToast } = useToast()
  const [notes, setNotes] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [view, setView] = useState(null)

  const openDocument = async (receipt) => {
    setBusyId(receipt.id)
    setView(null)
    try {
      const url = await getReceiptUrl(receipt.storage_path)
      setView({ id: receipt.id, url })
    } catch (error) {
      showToast(error.message || 'Não foi possível abrir o PDF.', 'error')
    } finally { setBusyId(null) }
  }

  const decide = async (receipt, decision) => {
    const note = (notes[receipt.id] || '').trim()
    if (decision === 'rejeitada' && !note) {
      showToast('Escreva o motivo da rejeição.', 'error')
      return
    }
    if (!window.confirm(`Confirmar decisão de ${decision === 'aprovada' ? 'aprovar' : 'rejeitar'} esta receita? Não será possível reverter.`)) return
    setBusyId(receipt.id)
    try {
      await onReview(receipt.id, decision, note)
      setView(null)
      setNotes((previous) => ({ ...previous, [receipt.id]: '' }))
      showToast('Análise registrada e histórico atualizado.', 'success')
    } catch (error) {
      showToast(error.message || 'Não foi possível registrar a decisão.', 'error')
    } finally { setBusyId(null) }
  }

  const pendingCount = queue.filter((entry) => entry.status === 'aguardando_analise').length

  return (
    <section className="review-panel" aria-label="Análise farmacêutica simulada">
      <div className="review-toolbar">
        <div className="review-toolbar-copy">
          <h3>Análise de receitas</h3>
          <p className="fv-hint">Acesso restrito a farmacêutico autorizado. Simulação acadêmica, sem dispensação real.</p>
        </div>
        <button className="btn btn-outline btn-sm review-refresh" type="button"
          disabled={loading || busyId !== null} onClick={onRefresh}>
          {loading ? 'Atualizando…' : 'Atualizar fila'}
        </button>
      </div>
      <p className="review-queue-count" role="status">
        {pendingCount === 1 ? '1 receita aguardando análise' : `${pendingCount} receitas aguardando análise`}
      </p>
      {queue.length === 0 && !loading && <p className="ac-empty">Não há receitas para analisar.</p>}
      <div className="review-list">
        {queue.map((entry) => (
          <article className="review-card" key={entry.id} aria-busy={busyId === entry.id}>
            <header className="review-card-head">
              <div className="review-card-heading">
                <span className="review-overline">PEDIDO</span>
                <h4>#{String(entry.order_id).slice(0, 8).toUpperCase()}</h4>
                <time className="review-date" dateTime={entry.created_at}>
                  {new Date(entry.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </time>
              </div>
              <span className={`review-status review-status--${entry.status in STATUS ? entry.status : 'outro'}`}>
                {STATUS[entry.status] || entry.status}
              </span>
            </header>

            <div className="review-card-body">
              <div className="review-info">
                <div className="review-info-section">
                  <h5>Receita enviada</h5>
                  <p className="review-file-name">{entry.file_name}</p>
                  <button className="btn btn-outline btn-sm review-pdf-button" type="button"
                    disabled={busyId !== null} onClick={() => openDocument(entry)}>
                    {busyId === entry.id ? 'Preparando PDF…' : 'Gerar acesso ao PDF'}
                  </button>
                  {view?.id === entry.id && (
                    <a className="review-pdf-link" href={view.url} target="_blank" rel="noopener noreferrer">
                      Abrir receita (link válido por 60 segundos)
                    </a>
                  )}
                </div>
                <div className="review-info-section">
                  <h5>Itens do pedido</h5>
                  <ul className="review-items">
                    {(entry.itens || []).map((item, index) => (
                      <li key={`${item.id || item.nome}-${index}`}>
                        <strong>{item.qtd}×</strong> {item.nome}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {entry.status === 'aguardando_analise' ? (
                <div className="review-actions">
                  <h5>Parecer farmacêutico</h5>
                  <label htmlFor={`review-note-${entry.id}`}>Observação <span>(obrigatória ao rejeitar)</span></label>
                  <textarea id={`review-note-${entry.id}`} rows={4} maxLength={1000}
                    value={notes[entry.id] || ''}
                    onChange={(event) => setNotes((prev) => ({ ...prev, [entry.id]: event.target.value }))}
                    placeholder="Descreva a decisão de forma objetiva" />
                  <div className="review-buttons">
                    <button type="button" className="btn btn-primary btn-sm"
                      disabled={busyId !== null} onClick={() => decide(entry, 'aprovada')}>
                      Aprovar manualmente
                    </button>
                    <button type="button" className="btn btn-outline btn-sm review-reject"
                      disabled={busyId !== null} onClick={() => decide(entry, 'rejeitada')}>
                      Rejeitar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="review-completed">
                  <h5>Decisão registrada</h5>
                  <p>{entry.review_note || 'Sem observações adicionais.'}</p>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
