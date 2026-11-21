import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { formatBRL } from "../../utils/format";
import { isRemote } from "../../services/db";
import AddressForm from "../AddressForm/AddressForm";
import Modal from "../ui/Modal";
import "./AccountModal.css";

const PAY_LABEL = {
  pix: "Pix",
  cartao: "Cartão",
  boleto: "Boleto",
  whatsapp: "WhatsApp",
};
const STATUS_LABEL = {
  pendente: "Pendente",
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
};

export default function AccountModal() {
  const {
    user,
    accountOpen,
    accountTab,
    setAccountTab,
    closeAccount,
    logout,
    addresses,
    addAddress,
    removeAddress,
    setDefaultAddress,
    orders,
    dataError,
    dataLoading,
    reloadAccountData,
  } = useUser();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const handleAdd = async (data) => {
    setBusy(true);
    try {
      await addAddress(data);
      setAdding(false);
      showToast("Endereço salvo!", "success");
    } catch (err) {
      showToast(err.message || "Erro ao salvar endereço", "error");
    } finally {
      setBusy(false);
    }
  };

  const run = async (fn, okMsg) => {
    try {
      await fn();
      if (okMsg) showToast(okMsg, "success");
    } catch (err) {
      showToast(err.message || "Erro", "error");
    }
  };

  const tabs = [
    ["dados", "Meus dados"],
    ["enderecos", "Endereços"],
    ["pedidos", "Pedidos"],
  ];

  return (
    <Modal
      open={accountOpen}
      onClose={closeAccount}
      size="md"
      title="Minha conta"
      subtitle={user.email}
    >
      <div className="fv-tabs" role="tablist">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={accountTab === key}
            className={`fv-tab ${accountTab === key ? "active" : ""}`}
            onClick={() => setAccountTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {dataLoading && (
        <p className="fv-hint" role="status">
          Carregando dados da conta…
        </p>
      )}
      {dataError && (
        <div className="fv-alert" role="alert">
          <p>{dataError}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={dataLoading}
            onClick={reloadAccountData}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {accountTab === "dados" && (
        <div className="ac-profile">
          <div className="ac-avatar" aria-hidden="true">
            {(user.nome || user.email)[0].toUpperCase()}
          </div>
          <dl>
            <div>
              <dt>Nome</dt>
              <dd>{user.nome || "—"}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>{user.telefone || "—"}</dd>
            </div>
            <div>
              <dt>CPF</dt>
              <dd>{user.cpf || "—"}</dd>
            </div>
          </dl>
          {!isRemote && (
            <p className="fv-hint">
              Modo demonstração: dados salvos só neste navegador.
            </p>
          )}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => run(logout)}
          >
            Sair da conta
          </button>
        </div>
      )}

      {accountTab === "enderecos" &&
        (adding ? (
          <AddressForm
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
            busy={busy}
          />
        ) : (
          <div className="ac-list">
            {addresses.length === 0 && (
              <p className="ac-empty">Você ainda não tem endereços salvos.</p>
            )}
            {addresses.map((a) => (
              <article
                key={a.id}
                className={`ac-card ${a.isDefault ? "is-default" : ""}`}
              >
                <div>
                  <strong>
                    {a.label}{" "}
                    {a.isDefault && <span className="ac-badge">Principal</span>}
                  </strong>
                  <p>
                    {a.endereco}, {a.numero}
                    {a.complemento ? ` - ${a.complemento}` : ""}
                  </p>
                  <p>
                    {a.bairro} · {a.cidade}/{a.estado} · CEP {a.cep}
                  </p>
                </div>
                <div className="ac-card-actions">
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          () => setDefaultAddress(a.id),
                          "Endereço principal atualizado",
                        )
                      }
                    >
                      Tornar principal
                    </button>
                  )}
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      run(() => removeAddress(a.id), "Endereço removido")
                    }
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAdding(true)}
            >
              + Adicionar endereço
            </button>
          </div>
        ))}

      {accountTab === "pedidos" && (
        <div className="ac-list">
          {orders.length === 0 && (
            <p className="ac-empty">Você ainda não fez nenhum pedido.</p>
          )}
          {orders.map((o) => (
            <article key={o.id} className="ac-card ac-order">
              <div style={{ flex: 1 }}>
                <div className="ac-order-top">
                  <strong>
                    Pedido #
                    {String(o.id).replace(/-/g, "").slice(0, 8).toUpperCase()}
                  </strong>
                  <span className={`ac-status s-${o.status}`}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
                <p>
                  {new Date(o.created_at).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}{" "}
                  · {PAY_LABEL[o.pagamento] || o.pagamento}
                </p>
                <ul>
                  {o.itens.map((i, idx) => (
                    <li key={idx}>
                      {i.qtd}× {i.nome}
                    </li>
                  ))}
                </ul>
                <p className="ac-order-total">
                  Total: <strong>{formatBRL(o.total)}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </Modal>
  );
}
