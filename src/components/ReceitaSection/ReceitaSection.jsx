import ReceiptUpload from "../ReceiptUpload/ReceiptUpload";
import { STORE } from "../../config";
import "./ReceitaSection.css";

export default function ReceitaSection({ receipt, onReceiptChange }) {
  const wa = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Olá! Gostaria de enviar uma receita para cotação.")}`;
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
            Envie o PDF da sua receita (inclusive de controlados). Ela fica
            anexada ao seu pedido e a retenção de lote é feita conforme a
            legislação.
          </p>
          <ul>
            <li>✔ Apenas arquivos PDF de até 10 MB</li>
            <li>✔ Conferência por farmacêutico responsável</li>
            <li>✔ Anexada automaticamente ao finalizar o pedido</li>
          </ul>
          <a
            className="btn btn-outline"
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar com um farmacêutico
          </a>
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
