import { useMemo, useRef, useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { useUser } from '../../context/UserContext'
import { STORE } from '../../config'
import {
  formatBRL, maskCard, maskExpiry, cardBrand, isValidCardNumber, isValidExpiry, buildPixPayload,
} from '../../utils/format'
import AddressForm from '../AddressForm/AddressForm'
import ReceiptUpload from '../ReceiptUpload/ReceiptUpload'
import Modal from '../ui/Modal'
import './CheckoutModal.css'

const STEPS = ['Entrega', 'Pagamento', 'Revisão']
const PAYMENTS = [
  { id: 'pix', icon: '⚡', title: 'Pix', desc: 'Simulação: nenhuma transferência real' },
  { id: 'cartao', icon: '💳', title: 'Cartão de crédito', desc: 'Simulação: até 3x sem cobrança real' },
  { id: 'boleto', icon: '🧾', title: 'Boleto bancário', desc: 'Simulação: sem emissão real' },
  { id: 'whatsapp', icon: '💬', title: 'Combinar no WhatsApp', desc: 'Pague direto com a farmácia' },
]
const EMPTY_CARD = { number: '', name: '', expiry: '', cvv: '', installments: '1' }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function CheckoutModal({ isOpen, onClose, receipt, onReceiptChange }) {
  const { items, totalPrice, clearCart } = useCart()
  const { showToast } = useToast()
  const { user, isLoggedIn, loading, addresses, addAddress, placeOrder, openAuth, openAccount } = useUser()

  const [step, setStep] = useState(1)
  const [addressId, setAddressId] = useState(null)
  const [addingAddress, setAddingAddress] = useState(false)
  const [obs, setObs] = useState('')
  const [payment, setPayment] = useState('pix')
  const [card, setCard] = useState(EMPTY_CARD)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const [done, setDone] = useState(null) // pedido concluído

  const deliveryFee = totalPrice >= STORE.freeShippingFrom ? 0 : STORE.deliveryFee
  const total = totalPrice + deliveryFee
  const maxInstallments = Math.max(1, Math.min(3, Math.floor(total / 20)))

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === addressId) || addresses.find((a) => a.isDefault) || addresses[0] || null,
    [addresses, addressId],
  )
  const needsNewAddress = addresses.length === 0 || addingAddress

  const reset = () => {
    setStep(1); setAddressId(null); setAddingAddress(false); setObs(''); setPayment('pix')
    setCard(EMPTY_CARD); setErrors({}); setBusy(false); setDone(null)
  }
  const close = () => { onClose(); if (done) reset() }

  /* ---------- validações ---------- */
  const validateStep = () => {
    const e = {}
    if (step === 1 && !selectedAddress) e.address = 'Escolha ou cadastre um endereço de entrega.'
    if (step === 2 && payment === 'cartao') {
      if (!isValidCardNumber(card.number)) e.number = 'Número de cartão inválido'
      if (card.name.trim().split(' ').filter(Boolean).length < 2) e.name = 'Nome como está no cartão'
      if (!isValidExpiry(card.expiry)) e.expiry = 'Validade inválida'
      if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = 'CVV inválido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const next = () => { if (validateStep()) setStep((s) => s + 1) }
  const back = () => setStep((s) => s - 1)

  const setCardField = (name, value) => {
    setCard((c) => ({ ...c, [name]: value }))
    setErrors((e) => ({ ...e, [name]: '' }))
  }

  /* ---------- endereço novo ---------- */
  const saveAddress = async (data) => {
    setBusy(true)
    try {
      const created = await addAddress(data)
      setAddressId(created.id)
      setAddingAddress(false)
      setErrors({})
    } catch (err) {
      showToast(err.message || 'Erro ao salvar endereço', 'error')
    } finally {
      setBusy(false)
    }
  }

  /* ---------- confirmar pedido ---------- */
  const confirm = async () => {
    if (submitting.current || busy || !selectedAddress || items.length === 0) return
    if (items.some((item) => item.requiresPrescription) && !receipt) {
      showToast('Um dos produtos exige receita. Anexe um PDF para prosseguir.', 'error')
      return
    }
    submitting.current = true
    setBusy(true)
    try {
      if (payment === 'cartao') await sleep(400) // processamento simulado
      const order = await placeOrder({
        items: items.map((i) => ({ id: i.id, qtd: i.quantity })),
        addressId: selectedAddress.id,
        payment,
        expectedTotal: Math.round(total * 100) / 100,
        observacoes: obs,
        receipt,
      })

      const txid = String(order.id).replace(/[^A-Za-z0-9]/g, '').slice(0, 25)
      setDone({
        order,
        // Montantes da confirmação vêm do banco, nunca do snapshot do carrinho.
        items: order.itens.map((i) => ({ id: i.id, name: i.nome, quantity: i.qtd, price: Number(i.preco) })),
        address: order.endereco,
        payment: order.pagamento,
        pix: order.pagamento === 'pix'
          ? buildPixPayload({ key: STORE.pixKey, name: STORE.name, city: STORE.city, amount: Number(order.total), txid })
          : null,
        card: order.pagamento === 'cartao'
          ? { brand: cardBrand(card.number) || 'Cartão', last4: card.number.replace(/\D/g, '').slice(-4), parcelas: Number(card.installments) }
          : null,
      })
      clearCart()
      onReceiptChange(null)
    } catch (err) {
      showToast(err.message || 'Não foi possível concluir o pedido.', 'error')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  const whatsappUrl = (d) => {
    const o = d.order
    const a = d.address
    const lines = d.items.map((i, n) => `${n + 1}. ${i.name} - Qtd: ${i.quantity} - ${formatBRL(i.price * i.quantity)}`).join('\n')
    const msg =
      `*NOVO PEDIDO ${STORE.name.toUpperCase()}* #${String(o.id).replace(/-/g, '').slice(0, 8).toUpperCase()}\n\n` +
      `*Cliente:* ${user.nome}\n*WhatsApp:* ${user.telefone}\n*CPF:* ${user.cpf}\n\n` +
      `*ENTREGA:*\n${a.endereco}, ${a.numero}${a.complemento ? ` - ${a.complemento}` : ''}\n${a.bairro} - ${a.cidade}/${a.estado}\nCEP: ${a.cep}\n\n` +
      `*ITENS:*\n${lines}\n\n*Subtotal:* ${formatBRL(o.subtotal)}\n*Entrega:* ${o.entrega === 0 ? 'Grátis' : formatBRL(o.entrega)}\n*TOTAL:* ${formatBRL(o.total)}\n\n` +
      `*Pagamento:* ${PAYMENTS.find((p) => p.id === d.payment)?.title}\n` +
      `${o.observacoes ? `*Obs:* ${o.observacoes}\n` : ''}${o.receita ? `*Receita:* enviada para análise farmacêutica simulada.` : ''}`
    return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`
  }

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); showToast('Código copiado!', 'success') }
    catch { showToast('Não foi possível copiar. Selecione e copie manualmente.', 'error') }
  }

  /* ======================= TELAS ======================= */
  let body

  if (loading) {
    body = <p className="ck-center">Carregando…</p>
  } else if (!isLoggedIn) {
    body = (
      <div className="ck-gate">
        <div className="ck-gate-icon" aria-hidden="true">🔐</div>
        <h3>Entre para finalizar sua compra</h3>
        <p>Com uma conta você salva seus endereços, acompanha seus pedidos e compra mais rápido da próxima vez.</p>
        <div className="fv-actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-outline" onClick={() => openAuth('register')}>Criar conta</button>
          <button type="button" className="btn btn-primary" onClick={() => openAuth('login')}>Entrar</button>
        </div>
      </div>
    )
  } else if (items.length === 0 && !done) {
    body = (
      <div className="ck-gate">
        <div className="ck-gate-icon" aria-hidden="true">🛒</div>
        <h3>Seu carrinho está vazio</h3>
        <button type="button" className="btn btn-primary" onClick={close}>Voltar às compras</button>
      </div>
    )
  } else if (done) {
    body = (
      <div className="ck-done">
        <div className="ck-done-icon" aria-hidden="true">✓</div>
        <h3>{done.order.status === 'aguardando_analise' ? 'Pedido recebido para análise!' : 'Pedido realizado!'}</h3>
        <p className="ck-code">Pedido #{String(done.order.id).replace(/-/g, '').slice(0, 8).toUpperCase()}</p>

        {done.order.status === 'aguardando_analise' && (
          <div className="fv-alert fv-info" role="status">Sua receita foi armazenada em área privada. Aguardando análise manual do farmacêutico. Nenhum pagamento foi processado. Consulte Minha conta → Pedidos.</div>
        )}
        {done.order.status !== 'aguardando_analise' && done.payment === 'pix' && (
          <div className="ck-pay-box">
            <p><strong>Pix simulado — não pague</strong> · {formatBRL(done.order.total)}</p>
            <img
              className="ck-qr" alt="QR Code do Pix" width="220" height="220"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(done.pix)}`}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <label className="ck-label" htmlFor="pix-code">Pix copia e cola</label>
            <textarea id="pix-code" className="ck-code-area" readOnly rows={3} value={done.pix} onFocus={(e) => e.target.select()} />
            <button type="button" className="btn btn-primary btn-full" onClick={() => copy(done.pix)}>Copiar código Pix</button>
            <small>Código de demonstração: não efetue transferências reais.</small>
          </div>
        )}

        {done.order.status !== 'aguardando_analise' && done.payment === 'cartao' && (
          <div className="fv-alert fv-ok">
            Pagamento com {done.card.brand} final {done.card.last4} simulado (sem cobrança)
            {done.card.parcelas > 1 ? ` em ${done.card.parcelas}x de ${formatBRL(done.order.total / done.card.parcelas)}` : ' à vista'}.
          </div>
        )}

        {done.order.status !== 'aguardando_analise' && done.payment === 'boleto' && (
          <div className="ck-pay-box">
            <p><strong>Boleto bancário</strong> · {formatBRL(done.order.total)}</p>
            <small>Pagamento por boleto apenas demonstrativo. Nenhum boleto real é emitido ou enviado.</small>
          </div>
        )}

        {done.order.status !== 'aguardando_analise' && done.payment === 'whatsapp' && (
          <div className="fv-alert fv-info">Envie o pedido pelo WhatsApp para combinar a forma de pagamento com a farmácia.</div>
        )}

        <p className="ck-demo">
          Ambiente de demonstração: pedido registrado, mas nenhum pagamento foi realizado ou aprovado. Para cobranças reais, é obrigatório integrar um gateway de pagamento.
        </p>

        <div className="ck-done-actions">
          <a className="btn btn-primary" href={whatsappUrl(done)} target="_blank" rel="noopener noreferrer">Enviar pedido pelo WhatsApp</a>
          <button type="button" className="btn btn-outline" onClick={() => { close(); openAccount('pedidos') }}>Ver meus pedidos</button>
        </div>
      </div>
    )
  } else {
    body = (
      <>
        <ol className="ck-steps" aria-label="Etapas do pedido">
          {STEPS.map((label, i) => (
            <li key={label} className={i + 1 < step ? 'done' : i + 1 === step ? 'active' : ''}>
              <span>{i + 1 < step ? '✓' : i + 1}</span>{label}
            </li>
          ))}
        </ol>

        {/* ---- Passo 1: entrega ---- */}
        {step === 1 && (
          <div className="ck-section">
            {needsNewAddress ? (
              <>
                <h3>{addresses.length === 0 ? 'Onde vamos entregar?' : 'Novo endereço'}</h3>
                <AddressForm
                  onSubmit={saveAddress} busy={busy} submitLabel="Salvar e usar este endereço"
                  onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined}
                />
              </>
            ) : (
              <>
                <h3>Endereço de entrega</h3>
                <div className="ck-addr-list">
                  {addresses.map((a) => (
                    <label key={a.id} className={`ck-addr ${selectedAddress?.id === a.id ? 'selected' : ''}`}>
                      <input type="radio" name="address" checked={selectedAddress?.id === a.id} onChange={() => { setAddressId(a.id); setErrors({}) }} />
                      <div>
                        <strong>{a.label}</strong>
                        <p>{a.endereco}, {a.numero}{a.complemento ? ` - ${a.complemento}` : ''}</p>
                        <p>{a.bairro} · {a.cidade}/{a.estado} · CEP {a.cep}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <button type="button" className="ck-link" onClick={() => setAddingAddress(true)}>+ Usar outro endereço</button>
                {errors.address && <div className="fv-alert" role="alert">{errors.address}</div>}

                <div className="fv-field" style={{ marginTop: '1rem' }}>
                  <label htmlFor="ck-obs">Observações para a entrega (opcional)</label>
                  <textarea id="ck-obs" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: portão azul, tocar o interfone 101" />
                </div>
              </>
            )}
          </div>
        )}

        {/* ---- Passo 2: pagamento ---- */}
        {step === 2 && (
          <div className="ck-section">
            <h3>Forma de pagamento</h3>
            <div className="ck-pays" role="radiogroup">
              {PAYMENTS.map((p) => (
                <label key={p.id} className={`ck-pay ${payment === p.id ? 'selected' : ''}`}>
                  <input type="radio" name="payment" checked={payment === p.id} onChange={() => { setPayment(p.id); setErrors({}) }} />
                  <span className="ck-pay-ico" aria-hidden="true">{p.icon}</span>
                  <span><strong>{p.title}</strong><small>{p.desc}</small></span>
                </label>
              ))}
            </div>

            {payment === 'cartao' && (
              <div className="fv-form ck-card">
                <div className={`fv-field ${errors.number ? 'fv-invalid' : ''}`}>
                  <label htmlFor="cc-number">Número do cartão {cardBrand(card.number) && <em className="ck-brand">{cardBrand(card.number)}</em>}</label>
                  <input id="cc-number" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000"
                    value={card.number} onChange={(e) => setCardField('number', maskCard(e.target.value))} />
                  {errors.number && <span className="fv-error">{errors.number}</span>}
                </div>
                <div className={`fv-field ${errors.name ? 'fv-invalid' : ''}`}>
                  <label htmlFor="cc-name">Nome impresso no cartão</label>
                  <input id="cc-name" autoComplete="cc-name" placeholder="MARIA DA SILVA"
                    value={card.name} onChange={(e) => setCardField('name', e.target.value.toUpperCase())} />
                  {errors.name && <span className="fv-error">{errors.name}</span>}
                </div>
                <div className="fv-row">
                  <div className={`fv-field ${errors.expiry ? 'fv-invalid' : ''}`}>
                    <label htmlFor="cc-exp">Validade</label>
                    <input id="cc-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA"
                      value={card.expiry} onChange={(e) => setCardField('expiry', maskExpiry(e.target.value))} />
                    {errors.expiry && <span className="fv-error">{errors.expiry}</span>}
                  </div>
                  <div className={`fv-field ${errors.cvv ? 'fv-invalid' : ''}`}>
                    <label htmlFor="cc-cvv">CVV</label>
                    <input id="cc-cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4}
                      value={card.cvv} onChange={(e) => setCardField('cvv', e.target.value.replace(/\D/g, ''))} />
                    {errors.cvv && <span className="fv-error">{errors.cvv}</span>}
                  </div>
                </div>
                <div className="fv-field">
                  <label htmlFor="cc-inst">Parcelas</label>
                  <select id="cc-inst" value={card.installments} onChange={(e) => setCardField('installments', e.target.value)}>
                    {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}x de {formatBRL(total / n)} sem juros</option>
                    ))}
                  </select>
                </div>
                <p className="fv-hint">🔒 Use somente dados fictícios/de teste. Nenhuma cobrança ou armazenamento de cartão é realizado.</p>
              </div>
            )}

            <div className="ck-receipt">
              <h4>Receita médica {items.some((item) => item.requiresPrescription) ? '(obrigatória para um dos produtos)' : '(opcional)'}</h4>
              <ReceiptUpload onReceiptChange={onReceiptChange} currentReceipt={receipt} required={items.some((item) => item.requiresPrescription)} helpText="PDF até 10 MB, armazenado de forma privada ao confirmar. Use receitas fictícias no projeto acadêmico." />
            </div>
          </div>
        )}

        {/* ---- Passo 3: revisão ---- */}
        {step === 3 && selectedAddress && (
          <div className="ck-section">
            <h3>Confira seu pedido</h3>
            <div className="ck-review">
              <section>
                <h4>📍 Entrega</h4>
                <p>{selectedAddress.endereco}, {selectedAddress.numero}{selectedAddress.complemento ? ` - ${selectedAddress.complemento}` : ''}</p>
                <p>{selectedAddress.bairro} · {selectedAddress.cidade}/{selectedAddress.estado} · CEP {selectedAddress.cep}</p>
                {obs && <p><em>Obs.: {obs}</em></p>}
              </section>
              <section>
                <h4>💳 Pagamento</h4>
                <p>
                  {PAYMENTS.find((p) => p.id === payment)?.title}
                  {payment === 'cartao' && ` · ${cardBrand(card.number) || 'Cartão'} final ${card.number.replace(/\D/g, '').slice(-4)} · ${card.installments}x`}
                </p>
                {receipt && <p>📄 Receita: {receipt.name}</p>}
              </section>
              <section>
                <h4>🛒 Itens</h4>
                {items.map((i) => (
                  <div key={i.id} className="ck-line"><span>{i.quantity}× {i.name}</span><span>{formatBRL(i.price * i.quantity)}</span></div>
                ))}
                <div className="ck-line ck-muted"><span>Subtotal</span><span>{formatBRL(totalPrice)}</span></div>
                <div className="ck-line ck-muted"><span>Entrega</span><span>{deliveryFee === 0 ? 'Grátis' : formatBRL(deliveryFee)}</span></div>
                <div className="ck-line ck-total"><span>Total</span><span>{formatBRL(total)}</span></div>
              </section>
            </div>
          </div>
        )}
      </>
    )
  }

  const showFooter = isLoggedIn && !done && items.length > 0 && !loading && !(step === 1 && needsNewAddress)
  const footer = showFooter && (
    <div className="ck-footer">
      <div className="ck-footer-total"><span>Total</span><strong>{formatBRL(total)}</strong></div>
      <div className="fv-actions">
        {step > 1 && <button type="button" className="btn btn-outline" onClick={back} disabled={busy}>Voltar</button>}
        {step < 3 ? (
          <button type="button" className="btn btn-primary" onClick={next}>Continuar</button>
        ) : (
          <button type="button" className="btn btn-primary btn-lg" onClick={confirm} disabled={busy}>
            {busy ? (receipt ? 'Enviando receita e pedido…' : 'Registrando pedido…') : `Confirmar pedido · ${formatBRL(total)}`}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <Modal open={isOpen} onClose={close} size="lg" title={done ? 'Tudo certo!' : 'Finalizar pedido'} footer={footer || null} className="ck-modal">
      {body}
    </Modal>
  )
}
