import { validatePasswordChange } from "./passwords.js";

const toUser = (user) =>
  user
    ? {
        id: user.id,
        email: user.email || "",
        nome: user.user_metadata?.nome || "",
        telefone: user.user_metadata?.telefone || "",
        cpf: user.user_metadata?.cpf || "",
      }
    : null;

export function authErrorMessage(error) {
  const code = error?.code || "";
  const message = String(error?.message || error || "").toLowerCase();
  if (code === "invalid_credentials" || message.includes("invalid login"))
    return "E-mail ou senha incorretos.";
  if (code === "email_not_confirmed" || message.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar. Confira também a pasta de spam.";
  if (
    ["user_already_exists", "email_exists"].includes(code) ||
    message.includes("already registered")
  )
    return "Este e-mail já está cadastrado. Entre com sua senha.";
  if (
    ["over_email_send_rate_limit", "over_request_rate_limit"].includes(code) ||
    error?.status === 429
  )
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (
    ["weak_password", "validation_failed"].includes(code) &&
    message.includes("password")
  )
    return "A senha não atende aos requisitos. Use pelo menos 6 caracteres e confira a política de senhas do projeto.";
  if (code === "same_password") return "Escolha uma senha diferente da atual.";
  if (code === "reauthentication_needed")
    return "O Supabase exige um código de confirmação para trocar sua senha.";
  if (
    code === "invalid_password" ||
    message.includes("current password is incorrect")
  )
    return "A senha atual está incorreta.";
  if (code === "signup_disabled")
    return "O cadastro está desativado. Entre em contato com o responsável pelo projeto.";
  if (message.includes("invalid api key") || message.includes("invalid apikey"))
    return "A chave pública do Supabase é inválida. Confira o arquivo .env.";
  if (
    error?.name === "AuthRetryableFetchError" ||
    /fetch|network|conexão/.test(message)
  )
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
  if (
    [
      "session_not_found",
      "refresh_token_not_found",
      "refresh_token_already_used",
    ].includes(code)
  )
    return "Sua sessão expirou. Entre novamente.";
  return "Não foi possível concluir a autenticação. Tente novamente.";
}

export function createRemoteAuth(
  client,
  { configurationError = "", redirectTo } = {},
) {
  const requireClient = () => {
    if (!client)
      throw new Error(
        configurationError || "Configure o Supabase antes de continuar.",
      );
    return client.auth;
  };
  const check = (error) => {
    if (!error) return;
    const err = new Error(authErrorMessage(error));
    err.code = error.code || "";
    throw err;
  };

  return {
    async signUp({ email, password, nome, telefone, cpf }) {
      const options = { data: { nome: nome.trim(), telefone, cpf } };
      if (redirectTo) options.emailRedirectTo = redirectTo;
      const { data, error } = await requireClient().signUp({
        email: email.trim().toLowerCase(),
        password,
        options,
      });
      check(error);
      return {
        user: data.session ? toUser(data.user) : null,
        needsConfirmation: !data.session,
      };
    },
    async signIn({ email, password }) {
      const { data, error } = await requireClient().signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      check(error);
      return toUser(data.user);
    },
    async changePassword({ currentPassword, newPassword, nonce = "" }) {
      validatePasswordChange({ currentPassword, newPassword });
      const changes = {
        password: newPassword,
        current_password: currentPassword,
      };
      if (nonce) changes.nonce = nonce;
      const { error } = await requireClient().updateUser(changes);
      check(error);
    },
    async requestPasswordReauth() {
      const { error } = await requireClient().reauthenticate();
      check(error);
    },
    async signOut() {
      const { error } = await requireClient().signOut({ scope: "local" });
      check(error);
    },
    async restore() {
      const auth = requireClient();
      const { data: sessionData, error: sessionError } =
        await auth.getSession();
      check(sessionError);
      if (!sessionData.session) return null;
      // Confirma a sessão no Supabase Auth.
      const { data, error } = await auth.getUser();
      if (error && [401, 403].includes(error.status)) {
        const { error: logoutError } = await auth.signOut({ scope: "local" });
        check(logoutError);
        return null;
      }
      check(error);
      return toUser(data.user);
    },
    async getToken() {
      const { data, error } = await requireClient().getSession();
      check(error);
      if (!data.session?.access_token)
        throw new Error("Faça login para continuar.");
      return data.session.access_token;
    },
    subscribeAuth(listener) {
      if (!client) return () => {};
      const { data } = client.auth.onAuthStateChange((event, session) => {
        if (event !== "INITIAL_SESSION") listener(toUser(session?.user), event);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
