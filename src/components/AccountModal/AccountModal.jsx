import { useState } from 'react'
import { useUser } from '../../context/useUser.js'
import { useToast } from '../../context/useToast.js'
import { formatBRL } from '../../utils/format'
import { isRemote } from '../../services/db'
import AddressForm from '../AddressForm/AddressForm'
import ChangePasswordForm from '../ChangePasswordForm/ChangePasswordForm'
import Modal from '../ui/Modal'
import './AccountModal.css'

const PAY_LABEL = { pix: 'Pix', cartao: 'Cartão', boleto: 'Boleto', whatsapp: 'WhatsApp' }
const STATUS_LABEL = { pendente: 'Pendente', aguardando_pagamento: 'Aguardando pagamento (simulado)', pago: 'Pago', aguardando_analise: 'Aguardando análise', receita_aprovada: 'Receita aprovada', receita_rejeitada: 'Receita rejeitada', cancelado: 'Cancelado', enviado: 'Enviado', entregue: 'Entregue' }

export default function AccountModal() {
  const {
    user, accountOpen, accountTab, setAccountTab, closeAccount, logout,
    addresses, addAddress, updateAddress, removeAddress, setDefaultAddress, orders,
    dataError, dataLoading, reloadAccountData,
    receipts, receiptEvents, getReceiptUrl,
  } = useUser()
  const { showToast } = useToast()
  const [editor, setEditor] = useState(null) // null | { mode: "add" } | { mode: "edit", address }
  const [busy, setBusy] = useState(false)
  const [openReceipt, setOpenReceipt] = useState(null)

  if (!user) return null
  const currentEditor = editor?.userId === user.id ? editor : null
  const handleClose = () => { setEditor(null); closeAccount() }

  const handleSave = async (data) => {
    if (busy) return
    setBusy(true)
    try {
      if (currentEditor?.mode === 'edit') {
        await updateAddress(currentEditor.address.id, data)
        showToast('Endereço atualizado!', 'success')
      } else {
        await addAddress(data)
        showToast('Endereço salvo!', 'success')
      }
      setEditor(null)
    } catch (err) {
      showToast(err.message || 'Erro ao salvar endereço', 'error')
    } finally {
      setBusy(false)
    }
  }

  const run = async (fn, okMsg) => {
    if (busy) return
    setBusy(true)
    try { await fn(); if (okMsg) showToast(okMsg, 'success') }
    catch (err) { showToast(err.message || 'Erro ao atualizar endereço', 'error') }
    finally { setBusy(false) }
  }

  const viewReceipt = async (receipt) => {
    setOpenReceipt(null)
    try {
      const url = await getReceiptUrl(receipt.storage_path)
      setOpenReceipt({ id: receipt.id, url })
    } catch (error) { showToast(error.message || 'Erro ao abrir PDF.', 'error') }
  }

  const handleRemove = async (address) => {
    if (!window.confirm(`Remover o endereço "${address.label}"?`)) return
    await run(() => removeAddress(address.id), 'Endereço removido')
  }

  const tabs = [['dados', 'Meus dados'], ['enderecos', 'Endereços'], ['pedidos', 'Pedidos'], ['seguranca', 'Segurança']]

  return (
    <Modal open={accountOpen} onClose={handleClose} size="md"
      title="Minha conta" subtitle={user.email}>
      <div className="fv-tabs ac-tabs" role="group" aria-label="Seções da conta">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" aria-current={accountTab === key ? 'page' : undefined}
            className={`fv-tab ${accountTab === key ? 'active' : ''}`} onClick={() => { setEditor(null); setAccountTab(key) }}>
            {label}
          </button>
        ))}
      </div>

      {dataLoading && <p className="fv-hint" role="status">Carregando dados da conta…</p>}
      {dataError && (
        <div className="fv-alert" role="alert">
          <p>{dataError}</p>
          <button type="button" className="btn btn-outline btn-sm" disabled={dataLoading} onClick={reloadAccountData}>Tentar novamente</button>
        </div>
      )}

      {accountTab === 'dados' && (
        <div className="ac-profile">
          <div className="ac-avatar" aria-hidden="true">{(user.nome || user.email)[0].toUpperCase()}</div>
          <dl>
            <div><dt>Nome</dt><dd>{user.nome || '—'}</dd></div>
            <div><dt>E-mail</dt><dd>{user.email}</dd></div>
            <div><dt>WhatsApp</dt><dd>{user.telefone || '—'}</dd></div>
            <div><dt>CPF</dt><dd>{user.cpf || '—'}</dd></div>
          </dl>
          {!isRemote && <p className="fv-hint">Modo demonstração: dados salvos só neste navegador.</p>}
          <button type="button" className="btn btn-outline" onClick={() => run(logout)}>Sair da conta</button>
        </div>
      )}

      {accountTab === 'seguranca' && <ChangePasswordForm key={user.id} />}

      {accountTab === 'enderecos' && (
        currentEditor ? (
          <div>
            <h3 className="ac-editor-title">{currentEditor.mode === 'edit' ? 'Editar endereço' : 'Novo endereço'}</h3>
            <AddressForm
              key={currentEditor.mode === 'edit' ? currentEditor.address.id : 'new'}
              initialValues={currentEditor.mode === 'edit' ? currentEditor.address : null}
              onSubmit={handleSave} onCancel={() => setEditor(null)} busy={busy}
              submitLabel={currentEditor.mode === 'edit' ? 'Salvar alterações' : 'Salvar endereço'}
            />
          </div>
        ) : (
          <div className="ac-list">
            {addresses.length === 0 && !dataLoading && !dataError && <p className="ac-empty">Você ainda não tem endereços salvos.</p>}
            {addresses.map((a) => (
              <article key={a.id} className={`ac-card ${a.isDefault ? 'is-default' : ''}`}>
                <div>
                  <strong>{a.label} {a.isDefault && <span className="ac-badge">Principal</span>}</strong>
                  <p>{a.endereco}, {a.numero}{a.complemento ? ` - ${a.complemento}` : ''}</p>
                  <p>{a.bairro} · {a.cidade}/{a.estado} · CEP {a.cep}</p>
                </div>
                <div className="ac-card-actions">
                  {!a.isDefault && <button type="button" disabled={busy} onClick={() => run(() => setDefaultAddress(a.id), 'Endereço principal atualizado')}>Tornar principal</button>}
                  <button type="button" disabled={busy} onClick={() => setEditor({ userId: user.id, mode: 'edit', address: a })}>Editar</button>
                  <button type="button" className="danger" disabled={busy} onClick={() => handleRemove(a)}>Remover</button>
                </div>
              </article>
            ))}
            <button type="button" className="btn btn-primary" disabled={busy || dataLoading} onClick={() => setEditor({ userId: user.id, mode: 'add' })}>+ Adicionar endereço</button>
          </div>
        )
      )}

      {accountTab === 'pedidos' && (
        <div className="ac-list">
          {orders.length === 0 && <p className="ac-empty">Você ainda não fez nenhum pedido.</p>}
          {orders.map((o) => (
            <article key={o.id} className="ac-card ac-order">
              <div style={{ flex: 1 }}>
                <div className="ac-order-top">
                  <strong>Pedido #{String(o.id).replace(/-/g, '').slice(0, 8).toUpperCase()}</strong>
                  <span className={`ac-status s-${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span>
                </div>
                <p>{new Date(o.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {PAY_LABEL[o.pagamento] || o.pagamento}</p>
                <ul>
                  {o.itens.map((i, idx) => <li key={idx}>{i.qtd}× {i.nome}</li>)}
                </ul>
                <p className="ac-order-total">Total: <strong>{formatBRL(o.total)}</strong></p>
                {receipts.filter((r) => r.order_id === o.id).map((receipt) => (
                  <section key={receipt.id} className="ac-receipt-summary">
                    <p><strong>Receita:</strong> {receipt.file_name}</p>
                    <p><strong>Estado:</strong> {receipt.status === 'aguardando_analise' ? 'Aguardando análise' : receipt.status === 'aprovada' ? 'Aprovada' : 'Rejeitada'}</p>
                    {receipt.review_note && <p><strong>Observação:</strong> {receipt.review_note}</p>}
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => viewReceipt(receipt)}>Gerar acesso ao PDF</button>
                    {openReceipt?.id === receipt.id && <a href={openReceipt.url} target="_blank" rel="noopener noreferrer">Abrir PDF privado (60 segundos)</a>}
                    {receiptEvents.filter((ev) => ev.receipt_id === receipt.id).map((event) => (
                      <p key={event.id} className="fv-hint">{new Date(event.created_at).toLocaleString('pt-BR')}: {event.action} {event.note ? `— ${event.note}` : ''}</p>
                    ))}
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </Modal>
  )
}
