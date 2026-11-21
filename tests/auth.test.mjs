import test from "node:test";
import assert from "node:assert/strict";
import { createRemoteAuth, authErrorMessage } from "../src/services/auth.js";
import { readSupabaseConfig } from "../src/services/supabase.js";

const user = {
  id: "user-test",
  email: "teste@example.invalid",
  user_metadata: {
    nome: "Pessoa Teste",
    telefone: "11999999999",
    cpf: "00000000000",
  },
};
const session = { user, access_token: "token-test" };
const ok = (data) => ({ data, error: null });
function fixture(overrides = {}) {
  const calls = [];
  let listener;
  const api = {
    signUp: async (args) => {
      calls.push(["signup", args]);
      return ok({ user, session });
    },
    signInWithPassword: async (args) => {
      calls.push(["signin", args]);
      return ok({ user, session });
    },
    getSession: async () => ok({ session }),
    getUser: async () => {
      calls.push(["getUser"]);
      return ok({ user });
    },
    signOut: async (args) => {
      calls.push(["signout", args]);
      return { error: null };
    },
    onAuthStateChange: (callback) => {
      listener = callback;
      return {
        data: {
          subscription: { unsubscribe: () => calls.push(["unsubscribe"]) },
        },
      };
    },
    ...overrides,
  };
  return {
    auth: createRemoteAuth(
      { auth: api },
      { redirectTo: "http://localhost:5173/" },
    ),
    calls,
    emit: (event, value) => listener(event, value),
  };
}

test("sem configuração mantém o modo demonstração; configuração parcial nunca vira demo", () => {
  assert.equal(readSupabaseConfig().enabled, false);
  const partial = readSupabaseConfig({
    VITE_SUPABASE_URL: "https://example.supabase.co",
  });
  assert.equal(partial.enabled, true);
  assert.match(partial.error, /Preencha/);
});

test("aceita publishable e anon, normaliza URL e rejeita segredo de servidor", () => {
  const env = {
    VITE_SUPABASE_URL: " https://example.supabase.co/ ",
    VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  };
  assert.equal(readSupabaseConfig(env).url, "https://example.supabase.co");
  assert.equal(readSupabaseConfig(env).error, "");
  assert.equal(
    readSupabaseConfig({
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: "legacy-test-key",
    }).error,
    "",
  );
  assert.match(
    readSupabaseConfig({
      ...env,
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test",
    }).error,
    /pública/,
  );
  const jwt =
    "header." +
    Buffer.from(JSON.stringify({ role: "service_role" })).toString(
      "base64url",
    ) +
    ".signature";
  assert.match(
    readSupabaseConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: jwt }).error,
    /pública/,
  );
});

test("rejeita URL inválida e placeholders; permite Supabase local", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://SEU-PROJETO.supabase.co",
    "https://example.supabase.co/path",
  ]) {
    assert.notEqual(
      readSupabaseConfig({
        VITE_SUPABASE_URL: url,
        VITE_SUPABASE_PUBLISHABLE_KEY: "test",
      }).error,
      "",
    );
  }
  assert.equal(
    readSupabaseConfig({
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_ANON_KEY: "test",
    }).error,
    "",
  );
});

test("cadastro envia metadados e redirect; não altera a senha", async () => {
  const { auth, calls } = fixture();
  const result = await auth.signUp({
    email: " TESTE@EXAMPLE.INVALID ",
    password: " senha com espaços ",
    nome: " Pessoa Teste ",
    telefone: "11999999999",
    cpf: "00000000000",
  });
  assert.equal(result.needsConfirmation, false);
  assert.equal(result.user.nome, "Pessoa Teste");
  assert.equal(calls[0][1].email, "teste@example.invalid");
  assert.equal(calls[0][1].password, " senha com espaços ");
  assert.equal(calls[0][1].options.emailRedirectTo, "http://localhost:5173/");
  assert.equal(calls[0][1].options.data.nome, "Pessoa Teste");
});

test("cadastro com confirmação não autentica apenas porque retornou um usuário", async () => {
  const { auth } = fixture({ signUp: async () => ok({ user, session: null }) });
  assert.deepEqual(
    await auth.signUp({
      email: user.email,
      nome: "Pessoa Teste",
      password: "teste123",
    }),
    { user: null, needsConfirmation: true },
  );
});

test("login normaliza e-mail e preserva senha", async () => {
  const { auth, calls } = fixture();
  assert.equal(
    (
      await auth.signIn({
        email: " TESTE@EXAMPLE.INVALID ",
        password: " teste ",
      })
    ).id,
    user.id,
  );
  assert.deepEqual(calls[0], [
    "signin",
    { email: user.email, password: " teste " },
  ]);
});

test("login rejeitado mostra mensagem em português", async () => {
  const { auth } = fixture({
    signInWithPassword: async () => ({
      data: {},
      error: { code: "invalid_credentials" },
    }),
  });
  await assert.rejects(
    auth.signIn({ email: user.email, password: "errada" }),
    /E-mail ou senha incorretos/,
  );
});

test("restauração usa usuário validado no servidor", async () => {
  const { auth, calls } = fixture({
    getSession: async () =>
      ok({
        session: {
          ...session,
          user: { ...user, user_metadata: { nome: "Não confiar" } },
        },
      }),
  });
  assert.equal((await auth.restore()).nome, "Pessoa Teste");
  assert.deepEqual(calls, [["getUser"]]);
});

test("sem sessão não faz consulta de usuário", async () => {
  const { auth, calls } = fixture({
    getSession: async () => ok({ session: null }),
  });
  assert.equal(await auth.restore(), null);
  assert.deepEqual(calls, []);
  await assert.rejects(auth.getToken(), /Faça login/);
});

test("sessão inválida é encerrada", async () => {
  const { auth, calls } = fixture({
    getUser: async () => ({ data: {}, error: { status: 401 } }),
  });
  assert.equal(await auth.restore(), null);
  assert.deepEqual(calls, [["signout", { scope: "local" }]]);
});

test("falha temporária de rede não apaga sessão", async () => {
  const { auth, calls } = fixture({
    getUser: async () => ({
      data: {},
      error: { name: "AuthRetryableFetchError" },
    }),
  });
  await assert.rejects(auth.restore(), /conectar ao servidor/);
  assert.deepEqual(calls, []);
});

test("token usado pelas tabelas vem da sessão gerenciada pelo SDK", async () => {
  const { auth } = fixture();
  assert.equal(await auth.getToken(), "token-test");
});

test("eventos de sessão atualizam usuário; restauração inicial é separada; unsubscribe funciona", () => {
  const { auth, emit, calls } = fixture();
  const events = [];
  const unsubscribe = auth.subscribeAuth((value, event) =>
    events.push([value?.id ?? null, event]),
  );
  emit("INITIAL_SESSION", session);
  emit("SIGNED_IN", session);
  emit("TOKEN_REFRESHED", session);
  emit("SIGNED_OUT", null);
  unsubscribe();
  assert.deepEqual(events, [
    [user.id, "SIGNED_IN"],
    [user.id, "TOKEN_REFRESHED"],
    [null, "SIGNED_OUT"],
  ]);
  assert.deepEqual(calls, [["unsubscribe"]]);
});

test("logout encerra somente a sessão atual e propaga falhas", async () => {
  const { auth, calls } = fixture();
  await auth.signOut();
  assert.deepEqual(calls, [["signout", { scope: "local" }]]);
  const broken = fixture({
    signOut: async () => ({ error: { name: "AuthRetryableFetchError" } }),
  });
  await assert.rejects(broken.auth.signOut(), /conectar/);
});

test("configuração inválida resulta em erro acionável", async () => {
  const auth = createRemoteAuth(null, {
    configurationError: "Preencha o .env",
  });
  await assert.rejects(
    auth.signIn({ email: user.email, password: "teste" }),
    /Preencha o .env/,
  );
  assert.doesNotThrow(() => auth.subscribeAuth(() => {})());
});

test("distingue confirmação pendente, limite de tentativas e erro desconhecido", () => {
  assert.match(authErrorMessage({ code: "email_not_confirmed" }), /Confirme/);
  assert.match(authErrorMessage({ status: 429 }), /Muitas tentativas/);
  assert.doesNotMatch(
    authErrorMessage({ message: "detalhes internos de infraestrutura" }),
    /infraestrutura/,
  );
});
