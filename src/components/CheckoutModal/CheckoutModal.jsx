import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { useState, useEffect } from 'react'
import './CheckoutModal.css'

export default function CheckoutModal({ isOpen, onClose }) {
  const { items, totalPrice, clearCart } = useCart()
  const { showToast } = useToast()
  const [step, setStep] = useState(1) // 1: dados, 2: endereço, 3: pagamento, 4: confirmação
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cpf: '',
    observacoes: '',
    receita: null,
    pagamento: 'whatsapp', // 'whatsapp', 'pix', 'cartao', 'boleto'
  })
  const [cepLoading, setCepLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const formatPrice = (price) => `R$ ${price.toFixed(2).replace('.', ',')}`
  const deliveryFee = totalPrice >= 100 ? 0 : 12.90
  const total = totalPrice + deliveryFee

  // CEP autocomplete via ViaCEP
  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '')
    if (cep.length !== 8) return

    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        }))
      } else {
        setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }))
      }
    } catch {
      setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP' }))
    } finally {
      setCepLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateStep = () => {
    const newErrors = {}
    if (step === 1) {
      if (!formData.nome.trim()) newErrors.nome = 'Nome completo é obrigatório'
      if (!formData.telefone.trim()) newErrors.telefone = 'WhatsApp para contato é obrigatório'
      if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'E-mail inválido'
      if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório para receitas controladas'
      else if (!/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(formData.cpf.replace(/\D/g, ''))) newErrors.cpf = 'CPF inválido'
    } else if (step === 2) {
      if (!formData.cep.trim()) newErrors.cep = 'CEP é obrigatório'
      else if (!/^\d{5}-?\d{3}$/.test(formData.cep)) newErrors.cep = 'CEP inválido'
      if (!formData.endereco.trim()) newErrors.endereco = 'Endereço é obrigatório'
      if (!formData.numero.trim()) newErrors.numero = 'Número é obrigatório'
      if (!formData.bairro.trim()) newErrors.bairro = 'Bairro é obrigatório'
      if (!formData.cidade.trim()) newErrors.cidade = 'Cidade é obrigatória'
      if (!formData.estado.trim()) newErrors.estado = 'Estado é obrigatório'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep()) setStep(prev => prev + 1)
  }

  const prevStep = () => setStep(prev => prev - 1)

  const handleSubmit = async () => {
    if (!validateStep()) return

    // Generate WhatsApp message
    const itemsList = items.map((item, i) => 
      `${i + 1}. ${item.name} - Qtd: ${item.quantity} - ${formatPrice(item.price * item.quantity)}`
    ).join('\n')

    const message = `*NOVO PEDIDO FARMAVIDA*\n\n` +
      `*Cliente:* ${formData.nome}\n` +
      `*WhatsApp:* ${formData.telefone}\n` +
      `*E-mail:* ${formData.email}\n` +
      `*CPF:* ${formData.cpf}\n\n` +
      `*ENDEREÇO DE ENTREGA:*\n` +
      `${formData.endereco}, ${formData.numero}${formData.complemento ? ` - ${formData.complemento}` : ''}\n` +
      `${formData.bairro} - ${formData.cidade}/${formData.estado}\n` +
      `CEP: ${formData.cep}\n\n` +
      `*ITENS DO PEDIDO:*\n${itemsList}\n\n` +
      `*Subtotal:* ${formatPrice(totalPrice)}\n` +
      `*Entrega:* ${deliveryFee === 0 ? 'Grátis' : formatPrice(deliveryFee)}\n` +
      `*TOTAL:* ${formatPrice(total)}\n\n` +
      `*Pagamento:* ${formData.pagamento === 'whatsapp' ? 'À combinar no WhatsApp' : formData.pagamento.toUpperCase()}\n` +
      `${formData.observacoes ? `*Obs:* ${formData.observacoes}\n` : ''}` +
      `${formData.receita ? `*Receita anexada:* ${formData.receita.name}` : 'Sem receita controlada'}`

    const phone = '5511999999999'
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')

    clearCart()
    onClose()
    setStep(1)
    setFormData({
      nome: '', telefone: '', email: '', cep: '', endereco: '', numero: '', complemento: '',
      bairro: '', cidade: '', estado: '', cpf: '', observacoes: '', receita: null, pagamento: 'whatsapp'
    })
    showToast('Pedido enviado para o WhatsApp!', 'success')
  }

  const steps = [
    { num: 1, label: 'Dados', icon: '👤' },
    { num: 2, label: 'Endereço', icon: '📍' },
    { num: 3, label: 'Pagamento', icon: '💳' },
    { num: 4, label: 'Confirmar', icon: '✅' },
  ]

  return (
    <>
      <div className="modal-overlay" onClick={onClose} aria-hidden="true"></div>
      <div className="modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button className="modal-close" onClick={onClose} aria-label="Fechar checkout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal-body checkout-body">
          {/* Progress indicator */}
          <div className="checkout-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
            {steps.map((s, i) => (
              <div key={s.num} className={`progress-step ${i + 1 < step ? 'completed' : i + 1 === step ? 'active' : ''}`}>
                <div className="step-circle">
                  {i + 1 < step ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    s.icon
                  )}
                </div>
                <span className="step-label">{s.label}</span>
                {i < steps.length - 1 && <div className={`step-line ${i + 1 < step ? 'completed' : ''}`}></div>}
              </div>
            ))}
          </div>

          <h2 id="checkout-title" className="checkout-title">Finalizar Pedido</h2>

          {/* Step 1: Dados pessoais */}
          {step === 1 && (
            <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nome">Nome completo *</label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={formData.nome}
                    onChange={handleChange}
                    className={errors.nome ? 'error' : ''}
                    placeholder="João da Silva"
                    required
                    autoFocus
                  />
                  {errors.nome && <span className="error-message">{errors.nome}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefone">WhatsApp *</label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={handleChange}
                    className={errors.telefone ? 'error' : ''}
                    placeholder="(11) 99999-9999"
                    required
                  />
                  {errors.telefone && <span className="error-message">{errors.telefone}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="email">E-mail *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="joao@email.com"
                    required
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cpf">CPF * (para receitas controladas)</label>
                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={formData.cpf}
                    onChange={handleChange}
                    className={errors.cpf ? 'error' : ''}
                    placeholder="000.000.000-00"
                    required
                    maxLength={14}
                  />
                  {errors.cpf && <span className="error-message">{errors.cpf}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="observacoes">Observações</label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Ex: Entregar no portão azul, tocar interfone 101..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Próximo: Endereço</button>
              </div>
            </form>
          )}

          {/* Step 2: Endereço */}
          {step === 2 && (
            <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cep">CEP *</label>
                  <div className="cep-input-wrapper">
                    <input
                      id="cep"
                      name="cep"
                      type="text"
                      value={formData.cep}
                      onChange={handleChange}
                      onBlur={handleCepBlur}
                      className={errors.cep ? 'error' : ''}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                    />
                    {cepLoading && <span className="cep-loading">🔍</span>}
                  </div>
                  {errors.cep && <span className="error-message">{errors.cep}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="endereco">Endereço *</label>
                  <input
                    id="endereco"
                    name="endereco"
                    type="text"
                    value={formData.endereco}
                    onChange={handleChange}
                    className={errors.endereco ? 'error' : ''}
                    placeholder="Rua das Flores"
                    required
                  />
                  {errors.endereco && <span className="error-message">{errors.endereco}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="numero">Número *</label>
                  <input
                    id="numero"
                    name="numero"
                    type="text"
                    value={formData.numero}
                    onChange={handleChange}
                    className={errors.numero ? 'error' : ''}
                    placeholder="123"
                    required
                  />
                  {errors.numero && <span className="error-message">{errors.numero}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="complemento">Complemento</label>
                  <input
                    id="complemento"
                    name="complemento"
                    type="text"
                    value={formData.complemento}
                    onChange={handleChange}
                    placeholder="Apto 45, Bloco B, Casa 2..."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bairro">Bairro *</label>
                  <input
                    id="bairro"
                    name="bairro"
                    type="text"
                    value={formData.bairro}
                    onChange={handleChange}
                    className={errors.bairro ? 'error' : ''}
                    placeholder="Centro"
                    required
                  />
                  {errors.bairro && <span className="error-message">{errors.bairro}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="cidade">Cidade *</label>
                  <input
                    id="cidade"
                    name="cidade"
                    type="text"
                    value={formData.cidade}
                    onChange={handleChange}
                    className={errors.cidade ? 'error' : ''}
                    placeholder="São Paulo"
                    required
                  />
                  {errors.cidade && <span className="error-message">{errors.cidade}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="estado">Estado *</label>
                  <select
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className={errors.estado ? 'error' : ''}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                  {errors.estado && <span className="error-message">{errors.estado}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={prevStep}>Voltar</button>
                <button type="submit" className="btn btn-primary">Próximo: Pagamento</button>
              </div>
            </form>
          )}

          {/* Step 3: Pagamento */}
          {step === 3 && (
            <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
              <div className="form-group">
                <label>Forma de pagamento *</label>
                <div className="payment-options">
                  <label className={`payment-option ${formData.pagamento === 'whatsapp' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="pagamento"
                      value="whatsapp"
                      checked={formData.pagamento === 'whatsapp'}
                      onChange={handleChange}
                    />
                    <div className="payment-card">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.67-.297-.472-.404-.475-.67-.475h-.374c-.197 0-.497.124-.745.347-.248.224-.621.573-.94.82-.322.248-.57.372-.843.472-.272.099-.67.173-1.044.025-.372-.149-.916-.52-1.363-.82-.446-.298-.694-.372-.943-.372-.024 0-.149-.025-.223-.025-.074 0-.148.025-.198.075-.124.1-.248.248-.298.446-.049.198-.049.446-.049.744 0 .297.124.573.372.82.248.248.497.373.868.67.372.298.497.497.57.52.074.049.323.073.347.124.223.373 1.53 2.88 1.413 3.004-.173.197-.372.297-.768.373-.397.074-1.017.025-1.363-.223-.347-.248-.794-.448-1.19-.598-.397-.149-.718-.223-1.043-.322-.322-.099-.57-.223-.718-.223-.073 0-.147.025-.223.074-.075.049-.223.174-.223.322 0 .149.025.149.298.149.149 0 .297-.025.372-.149.075-.124.149-.223.223-.323.074-.099.148-.199.223-.323.073-.124.073-.223-.024-.446-.148-.297-.422-.573-.744-.871-.322-.297-.718-.67-1.043-.967-.322-.298-.57-.447-.718-.52-.149-.075-.248-.075-.347-.075-.148 0-.272.05-.347.1-.074.049-.149.124-.174.223-.024.075-.074.223-.099.347-.025.124-.099.173-.174.223-.074.049-.124.049-.173.049h-.398z"/></svg>
                      <span>WhatsApp (combinar)</span>
                      <small>Você finaliza o pagamento direto com a gente</small>
                    </div>
                  </label>

                  <label className={`payment-option ${formData.pagamento === 'pix' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="pagamento"
                      value="pix"
                      checked={formData.pagamento === 'pix'}
                      onChange={handleChange}
                    />
                    <div className="payment-card">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 12h20M7 4v16M17 4v16"/></svg>
                      <span>PIX</span>
                      <small>Chave: farmavida@email.com</small>
                    </div>
                  </label>

                  <label className={`payment-option ${formData.pagamento === 'cartao' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="pagamento"
                      value="cartao"
                      checked={formData.pagamento === 'cartao'}
                      onChange={handleChange}
                    />
                    <div className="payment-card">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      <span>Cartão de crédito/débito</span>
                      <small>Link de pagamento enviado no WhatsApp</small>
                    </div>
                  </label>

                  <label className={`payment-option ${formData.pagamento === 'boleto' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="pagamento"
                      value="boleto"
                      checked={formData.pagamento === 'boleto'}
                      onChange={handleChange}
                    />
                    <div className="payment-card">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      <span>Boleto bancário</span>
                      <small>Vencimento em 3 dias úteis</small>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="receita">Receita controlada (PDF) *</label>
                <input
                  id="receita"
                  name="receita"
                  type="file"
                  accept=".pdf"
                  onChange={handleChange}
                  className={formData.receita ? '' : 'error'}
                />
                {formData.receita && <span className="file-name">{formData.receita.name}</span>}
                <span className="help-text">Obrigatório para medicamentos controlados. Retenção de lote conforme legislação.</span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={prevStep}>Voltar</button>
                <button type="submit" className="btn btn-primary">Próximo: Confirmar</button>
              </div>
            </form>
          )}

          {/* Step 4: Confirmação */}
          {step === 4 && (
            <div className="checkout-confirm">
              <div className="confirm-section">
                <h3>👤 Dados do cliente</h3>
                <p><strong>Nome:</strong> {formData.nome}</p>
                <p><strong>WhatsApp:</strong> {formData.telefone}</p>
                <p><strong>E-mail:</strong> {formData.email}</p>
                <p><strong>CPF:</strong> {formData.cpf}</p>
              </div>

              <div className="confirm-section">
                <h3>📍 Endereço de entrega</h3>
                <p>{formData.endereco}, {formData.numero}{formData.complemento ? ` - ${formData.complemento}` : ''}</p>
                <p>{formData.bairro} - {formData.cidade}/{formData.estado}</p>
                <p>CEP: {formData.cep}</p>
              </div>

              <div className="confirm-section">
                <h3>💳 Pagamento</h3>
                <p>{formData.pagamento === 'whatsapp' ? 'WhatsApp (combinar)' : formData.pagamento.toUpperCase()}</p>
                {formData.receita && <p>📄 Receita: {formData.receita.name}</p>}
              </div>

              <div className="confirm-section">
                <h3>🛒 Itens do pedido</h3>
                {items.map((item, i) => (
                  <div key={item.id} className="confirm-item">
                    <span>{i + 1}. {item.name} x {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="confirm-totals">
                  <div><span>Subtotal</span> <span>{formatPrice(totalPrice)}</span></div>
                  <div><span>Entrega</span> <span>{deliveryFee === 0 ? 'Grátis' : formatPrice(deliveryFee)}</span></div>
                  <div className="confirm-total"><span>TOTAL</span> <span>{formatPrice(total)}</span></div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={prevStep}>Voltar</button>
                <button type="button" className="btn btn-primary btn-lg" onClick={handleSubmit}>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.67-.297-.472-.404-.475-.67-.475h-.374c-.197 0-.497.124-.745.347-.248.224-.621.573-.94.82-.322.248-.57.372-.843.472-.272.099-.67.173-1.044.025-.372-.149-.916-.52-1.363-.82-.446-.298-.694-.372-.943-.372-.024 0-.149-.025-.223-.025-.074 0-.148.025-.198.075-.124.1-.248.248-.298.446-.049.198-.049.446-.049.744 0 .297.124.573.372.82.248.248.497.373.868.67.372.298.497.497.57.52.074.049.323.073.347.124.223.373 1.53 2.88 1.413 3.004-.173.197-.372.297-.768.373-.397.074-1.017.025-1.363-.223-.347-.248-.794-.448-1.19-.598-.397-.149-.718-.223-1.043-.322-.322-.099-.57-.223-.718-.223-.073 0-.147.025-.223.074-.075.049-.223.174-.223.322 0 .149.025.149.298.149.149 0 .297-.025.372-.149.075-.124.149-.223.223-.323.074-.099.148-.199.223-.323.073-.124.073-.223-.024-.446-.148-.297-.422-.573-.744-.871-.322-.297-.718-.67-1.043-.967-.322-.298-.57-.447-.718-.52-.149-.075-.248-.075-.347-.075-.148 0-.272.05-.347.1-.074.049-.149.124-.174.223-.024.075-.074.223-.099.347-.025.124-.099.173-.174.223-.074.049-.124.049-.173.049h-.398z"/></svg>
                  Confirmar e enviar para WhatsApp
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}