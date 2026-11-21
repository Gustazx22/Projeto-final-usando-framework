import { useState } from "react";
import { useUser } from "../../context/useUser.js";
import { useToast } from "../../context/useToast.js";

const EMPTY = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  nonce: "",
};

export default function ChangePasswordForm() {
  const { changePassword, requestPasswordReauth } = useUser();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [requiresCode, setRequiresCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const requestCode = async () => {
    try {
      await requestPasswordReauth();
      setRequiresCode(true);
      showToast("Código de confirmação enviado para seu e-mail.", "info");
    } catch (err) {
      setError(err.message || "Não foi possível enviar o código.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }
    if (requiresCode && !form.nonce.trim()) {
      setError("Informe o código recebido por e-mail.");
      return;
    }
    setBusy(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        nonce: requiresCode ? form.nonce.trim() : "",
      });
      setForm(EMPTY);
      setRequiresCode(false);
      showToast("Senha alterada com sucesso!", "success");
    } catch (err) {
      if (err.code === "reauthentication_needed" && !requiresCode) {
        setRequiresCode(true);
        await requestCode();
      } else {
        setError(err.message || "Não foi possível alterar sua senha.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="fv-form" onSubmit={submit}>
      <p className="fv-hint" style={{ margin: 0 }}>
        Para proteger sua conta, informe a senha atual e escolha uma nova com
        pelo menos 8 caracteres.
      </p>
      <div className="fv-field">
        <label htmlFor="password-current">Senha atual</label>
        <input
          id="password-current"
          name="current-password"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={(e) => set("currentPassword", e.target.value)}
          required
          disabled={busy}
        />
      </div>
      <div className="fv-field">
        <label htmlFor="password-new">Nova senha</label>
        <input
          id="password-new"
          name="new-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={form.newPassword}
          onChange={(e) => set("newPassword", e.target.value)}
          required
          disabled={busy}
        />
      </div>
      <div className="fv-field">
        <label htmlFor="password-confirm">Confirmar nova senha</label>
        <input
          id="password-confirm"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          required
          disabled={busy}
        />
      </div>
      {requiresCode && (
        <div className="fv-field">
          <label htmlFor="password-nonce">Código enviado por e-mail</label>
          <input
            id="password-nonce"
            name="one-time-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={form.nonce}
            onChange={(e) => set("nonce", e.target.value)}
            required
            disabled={busy}
          />
          <p className="fv-hint" style={{ margin: 0 }}>
            Seu Supabase exige confirmação adicional para a alteração da senha.
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={busy}
            onClick={requestCode}
          >
            Reenviar código
          </button>
        </div>
      )}
      {error && (
        <div className="fv-alert" role="alert">
          {error}
        </div>
      )}
      <button
        type="submit"
        className="btn btn-primary btn-full"
        disabled={busy}
      >
        {busy ? "Alterando senha…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
