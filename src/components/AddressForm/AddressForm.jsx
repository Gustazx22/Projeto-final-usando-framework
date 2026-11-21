import { useState } from 'react'
import { maskCEP } from '../../utils/format'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const EMPTY = { label: 'Casa', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }

export default function AddressForm({ onSubmit, onCancel, submitLabel = 'Salvar endereço', busy = false }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [cepLoading, setCepLoading] = useState(false)

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: '' }))
  }

  const lookupCep = async (value) => {
    const cep = value.replace(/\D/g, '')
    if (cep.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) {
        setErrors((e) => ({ ...e, cep: 'CEP não encontrado' }))
      } else {
        setForm((f) => ({
          ...f,
          endereco: data.logradouro || f.endereco,
          bairro: data.bairro || f.bairro,
          cidade: data.localidade || f.cidade,
          estado: data.uf || f.estado,
        }))
      }
    } catch {
      setErrors((e) => ({ ...e, cep: 'Não foi possível buscar o CEP. Preencha manualmente.' }))
    } finally {
      setCepLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (form.cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP inválido'
    if (!form.endereco.trim()) e.endereco = 'Informe a rua'
    if (!form.numero.trim()) e.numero = 'Informe o número'
    if (!form.bairro.trim()) e.bairro = 'Informe o bairro'
    if (!form.cidade.trim()) e.cidade = 'Informe a cidade'
    if (!form.estado) e.estado = 'Selecione o estado'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    if (validate()) onSubmit(form)
  }

  const field = (name, label, props = {}) => (
    <div className={`fv-field ${errors[name] ? 'fv-invalid' : ''}`}>
      <label htmlFor={`addr-${name}`}>{label}</label>
      <input id={`addr-${name}`} value={form[name]} onChange={(e) => set(name, e.target.value)} {...props} />
      {errors[name] && <span className="fv-error">{errors[name]}</span>}
    </div>
  )

  return (
    <form className="fv-form" onSubmit={submit} noValidate>
      <div className="fv-row">
        <div className={`fv-field ${errors.cep ? 'fv-invalid' : ''}`}>
          <label htmlFor="addr-cep">CEP</label>
          <input
            id="addr-cep" inputMode="numeric" placeholder="00000-000" value={form.cep}
            onChange={(e) => { const v = maskCEP(e.target.value); set('cep', v); if (v.length === 9) lookupCep(v) }}
          />
          {cepLoading && <span className="fv-hint">Buscando endereço…</span>}
          {errors.cep && <span className="fv-error">{errors.cep}</span>}
        </div>
        {field('label', 'Nome do endereço', { placeholder: 'Casa, Trabalho…' })}
      </div>
      <div className="fv-row fv-row-3">
        {field('endereco', 'Rua / Avenida', { placeholder: 'Rua das Flores' })}
        {field('numero', 'Número', { placeholder: '123' })}
      </div>
      <div className="fv-row">
        {field('complemento', 'Complemento (opcional)', { placeholder: 'Apto 45, Bloco B' })}
        {field('bairro', 'Bairro', { placeholder: 'Centro' })}
      </div>
      <div className="fv-row fv-row-3">
        {field('cidade', 'Cidade', { placeholder: 'São Paulo' })}
        <div className={`fv-field ${errors.estado ? 'fv-invalid' : ''}`}>
          <label htmlFor="addr-estado">UF</label>
          <select id="addr-estado" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
            <option value="">UF</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          {errors.estado && <span className="fv-error">{errors.estado}</span>}
        </div>
      </div>
      <div className="fv-actions">
        {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Salvando…' : submitLabel}</button>
      </div>
    </form>
  )
}
