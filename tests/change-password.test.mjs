import test from "node:test";
import assert from "node:assert/strict";
import { createRemoteAuth } from "../src/services/auth.js";
import { validatePasswordChange } from "../src/services/passwords.js";
import { db, isRemote } from "../src/services/db.js";

function remoteFixture(overrides = {}) {
  const calls = [];
  const auth = {
    updateUser: async (data) => {
      calls.push(["updateUser", data]);
      return { data: {}, error: null };
    },
    reauthenticate: async () => {
      calls.push(["reauthenticate"]);
      return { error: null };
    },
    ...overrides,
  };
  return { service: createRemoteAuth({ auth }), calls };
}

test("valida senha atual, tamanho e diferença sem modificar as entradas", () => {
  assert.throws(
    () =>
      validatePasswordChange({ currentPassword: "", newPassword: "12345678" }),
    /senha atual/,
  );
  assert.throws(
    () =>
      validatePasswordChange({ currentPassword: "abc", newPassword: "1234" }),
    /8 caracteres/,
  );
  assert.throws(
    () =>
      validatePasswordChange({
        currentPassword: "abcdefgh",
        newPassword: "abcdefgh",
      }),
    /diferente/,
  );
  assert.doesNotThrow(() =>
    validatePasswordChange({
      currentPassword: "abcdefgh",
      newPassword: "abcd1234",
    }),
  );
});

test("Supabase recebe a senha atual e a nova sem fazer login novamente", async () => {
  const { service, calls } = remoteFixture();
  await service.changePassword({
    currentPassword: "antiga123",
    newPassword: "nova45678",
  });
  assert.deepEqual(calls, [
    ["updateUser", { password: "nova45678", current_password: "antiga123" }],
  ]);
});

test("não chama o servidor para senhas inválidas", async () => {
  const { service, calls } = remoteFixture();
  await assert.rejects(
    service.changePassword({
      currentPassword: "senha123",
      newPassword: "senha123",
    }),
    /diferente/,
  );
  assert.deepEqual(calls, []);
});

test("erro do Supabase não é silenciado", async () => {
  const { service } = remoteFixture({
    updateUser: async () => ({ error: { code: "invalid_password" } }),
  });
  await assert.rejects(
    service.changePassword({
      currentPassword: "errada123",
      newPassword: "nova45678",
    }),
    /senha atual está incorreta/,
  );
});

test("exigência de reautenticação preserva o código para a interface enviar OTP", async () => {
  const { service } = remoteFixture({
    updateUser: async () => ({ error: { code: "reauthentication_needed" } }),
  });
  await assert.rejects(
    service.changePassword({
      currentPassword: "antiga123",
      newPassword: "nova45678",
    }),
    (err) =>
      err.code === "reauthentication_needed" && /código/.test(err.message),
  );
});

test("com OTP, o código é enviado somente junto à operação de alteração", async () => {
  const { service, calls } = remoteFixture();
  await service.requestPasswordReauth();
  await service.changePassword({
    currentPassword: "antiga123",
    newPassword: "nova45678",
    nonce: "123456",
  });
  assert.deepEqual(calls, [
    ["reauthenticate"],
    [
      "updateUser",
      { password: "nova45678", current_password: "antiga123", nonce: "123456" },
    ],
  ]);
});

test("envio de OTP falho mostra uma mensagem segura", async () => {
  const { service } = remoteFixture({
    reauthenticate: async () => ({
      error: { status: 429, code: "over_email_send_rate_limit" },
    }),
  });
  await assert.rejects(service.requestPasswordReauth(), /Muitas tentativas/);
});

test("modo demo altera apenas a senha da conta logada e mantém a sessão", async () => {
  assert.equal(isRemote, false);
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
  };
  const accountA = await db.signUp({
    email: "a@example.invalid",
    password: "antiga123",
    nome: "Pessoa A",
    cpf: "",
    telefone: "",
  });
  const accountB = await db.signUp({
    email: "b@example.invalid",
    password: "segredo123",
    nome: "Pessoa B",
    cpf: "",
    telefone: "",
  });
  await assert.rejects(
    db.changePassword({
      currentPassword: "errada123",
      newPassword: "nova45678",
    }),
    /senha atual está incorreta/,
  );
  await db.changePassword({
    currentPassword: "segredo123",
    newPassword: "nova45678",
  });
  assert.equal((await db.restore()).id, accountB.user.id);
  await db.signOut();
  await assert.rejects(
    db.signIn({ email: "b@example.invalid", password: "segredo123" }),
    /incorretos/,
  );
  assert.equal(
    (await db.signIn({ email: "b@example.invalid", password: "nova45678" })).id,
    accountB.user.id,
  );
  await db.signOut();
  assert.equal(
    (await db.signIn({ email: "a@example.invalid", password: "antiga123" })).id,
    accountA.user.id,
  );
  await db.signOut();
  await assert.rejects(
    db.changePassword({
      currentPassword: "antiga123",
      newPassword: "outra45678",
    }),
    /Faça login/,
  );
});
