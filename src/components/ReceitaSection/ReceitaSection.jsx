import ReceiptUpload from "../ReceiptUpload/ReceiptUpload";
import "./ReceitaSection.css";

export default function ReceitaSection({ receipt, onReceiptChange }) {
  return (
    <section
      id="receita"
      className="receita-section"
      aria-labelledby="receita-title"
    >
      <div className="container receita-grid">
        <div className="receita-text">
          <span className="receita-tag">📄 Receita digital</span>
          <h2 id="receita-title">Tem receita? A gente encontra para você</h2>
          <p>
            Selecione um PDF para anexar à compra. Após o envio privado, a
            receita ficará aguardando análise manual por um perfil farmacêutico
            autorizado.
          </p>
          <ul>
            <li>✔ Apenas arquivos PDF de até 10 MB</li>
            <li>✔ Análise farmacêutica simulada e manual</li>
            <li>✔ O PDF será enviado ao concluir um pedido</li>
          </ul>
          <p className="fv-hint">
            Projeto acadêmico: use somente receitas fictícias para testes. Não
            envie receitas reais com dados pessoais.
          </p>
          <p className="fv-hint">
            A revisão é feita por um perfil autorizado dentro da simulação, sem
            atendimento farmacêutico real.
          </p>
        </div>
        <div className="receita-upload">
          <ReceiptUpload
            onReceiptChange={onReceiptChange}
            currentReceipt={receipt}
          />
        </div>
      </div>
    </section>
  );
}
