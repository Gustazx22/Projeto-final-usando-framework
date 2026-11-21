import { useState } from 'react'
import { useUser } from '../../context/UserContext'
import { useToast } from '../../context/ToastContext'
import { isRemote } from '../../services/db'
import { isEmail, isValidCPF, maskCPF, maskPhone } from '../../utils/format'
import Modal from '../ui/Modal'

const EMPTY = { nome: '', email: '', telefone: '', cpf: '', password: '', confirm: '' }

export default function AuthModal() {
  const { authOpen, authTab, setAuthTab, closeAuth, login, register } = useUser()
  const { showToast } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState(false)

  const isLogin = authTab === 'login'

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: '' }))
    setServerError('')
  }

  const switchTab = (tab) => { setAuthTab(tab); setErrors({}); setServerError(''); setConfirmEmail(false) }

  const close = () => { closeAuth(); setForm(EMPTY); setErrors({}); setServerError(''); setConfirmEmail(false) }

  const validate = () => {
    const e = {}
    if (!isEmail(form.email)) e.email = 'E-mail inválido'
    if (form.password.length < 6) e.password = 'Mínimo de 6 caracteres'
    if (!isLogin) {
      if (form.nome.trim().split(' ').filter(Boolean).length < 2) e.nome = 'Informe nome e sobrenome'
      if (form.telefone.replace(/\D/g, '').length < 10) e.telefone = 'Telefone inválido'
      if (!isValidCPF(form.cpf)) e.cpf = 'CPF inválido'
      if (form.password !== form.confirm) e.confirm = 'As senhas não conferem'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setBusy(true)
    setServerError('')
    try {
      if (isLogin) {
        const u = await login({ email: form.email, password: form.password })
        showToast(`Bem-vindo(a), ${u.nome.split(' ')[0] || 'cliente'}!`, 'success')
        close()
      } else {
        const result = await register({
          email: form.email.trim(), password: form.password,
          nome: form.nome.trim(), telefone: form.telefone, cpf: form.cpf,
        })
        if (result.needsConfirmation) {
          setConfirmEmail(true)
        } else {
          showToast('Conta criada com sucesso!', 'success')
          close()
        }
      }
    } catch (err) {
      setServerError(err.message || 'Algo deu errado. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const field = (name, label, props = {}, mask) => (
    <div className={`fv-field ${errors[name] ? 'fv-invalid' : ''}`}>
      <label htmlFor={`auth-${name}`}>{label}</label>
      <input
        id={`auth-${name}`} value={form[name]}
        onChange={(e) => set(name, mask ? mask(e.target.value) : e.target.value)}
        {...props}
      />
      {errors[name] && <span className="fv-error">{errors[name]}</span>}
    </div>
  )

  return (
    <Modal
      open={authOpen}
      onClose={close}
      size="sm"
      title={isLogin ? 'Entrar na sua conta' : 'Criar conta'}
      subtitle={isLogin ? 'Acompanhe pedidos e salve seus endereços.' : 'Leva menos de 1 minuto.'}
    >
      {confirmEmail ? (
        <div className="fv-form">
          <div className="fv-alert fv-ok">
            Conta criada! Enviamos um e-mail de confirmação para <strong>{form.email}</strong>. Depois de confirmar, é só entrar.
          </div>
          <button type="button" className="btn btn-primary" onClick={() => switchTab('login')}>Ir para o login</button>
        </div>
      ) : (
        <>
          <div className="fv-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={isLogin} className={`fv-tab ${isLogin ? 'active' : ''}`} onClick={() => switchTab('login')}>Entrar</button>
            <button type="button" role="tab" aria-selected={!isLogin} className={`fv-tab ${!isLogin ? 'active' : ''}`} onClick={() => switchTab('register')}>Criar conta</button>
          </div>

          <form className="fv-form" onSubmit={submit} noValidate>
            {!isLogin && field('nome', 'Nome completo', { placeholder: 'Maria da Silva', autoComplete: 'name' })}
            {field('email', 'E-mail', { type: 'email', placeholder: 'voce@email.com', autoComplete: 'email' })}
            {!isLogin && (
              <div className="fv-row">
                {field('telefone', 'WhatsApp', { placeholder: '(11) 99999-9999', inputMode: 'tel' }, maskPhone)}
                {field('cpf', 'CPF', { placeholder: '000.000.000-00', inputMode: 'numeric' }, maskCPF)}
              </div>
            )}
            {field('password', 'Senha', { type: 'password', placeholder: 'Mínimo 6 caracteres', autoComplete: isLogin ? 'current-password' : 'new-password' })}
            {!isLogin && field('confirm', 'Confirmar senha', { type: 'password', autoComplete: 'new-password' })}

            {serverError && <div className="fv-alert" role="alert">{serverError}</div>}

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={busy}>
              {busy ? 'Aguarde…' : isLogin ? 'Entrar' : 'Criar minha conta'}
            </button>

            {!isRemote && (
              <p className="fv-hint" style={{ margin: 0, textAlign: 'center' }}>
                Modo demonstração: sua conta fica salva apenas neste navegador.
              </p>
            )}
          </form>
        </>
      )}
    </Modal>
  )
}
