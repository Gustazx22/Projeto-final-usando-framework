export const RECEIPT_BUCKET = "farmavida-receitas";
export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateReceiptFile(file) {
  if (
    !file ||
    typeof file.name !== "string" ||
    typeof file.size !== "number" ||
    typeof file.type !== "string"
  ) {
    throw new Error("Selecione um PDF válido.");
  }
  if (file.type !== "application/pdf" || !/\.pdf$/i.test(file.name)) {
    throw new Error("A receita precisa ser um arquivo PDF.");
  }
  if (file.size < 1 || file.size > MAX_RECEIPT_BYTES) {
    throw new Error(
      "A receita deve ter no máximo 10 MB e não pode estar vazia.",
    );
  }
  return file;
}

export function receiptStoragePath(userId, fileId) {
  if (!UUID.test(userId) || !UUID.test(fileId))
    throw new Error("Identificador de arquivo inválido.");
  return `${userId}/${fileId}.pdf`;
}

export function displayReceiptError(error) {
  if (["PGRST202", "42883"].includes(error?.code)) {
    return new Error(
      "Receitas não configuradas no Supabase. Execute supabase/etapas6-7-receitas.sql.",
    );
  }
  if (error?.code === "42501" || error?.status === 403) {
    return new Error("Você não tem permissão para realizar essa operação.");
  }
  return new Error(error?.message || "Não foi possível processar a receita.");
}

export function createRemoteReceipts(client, { getToken } = {}) {
  const ensure = async () => {
    if (!client)
      throw new Error("Configure o Supabase no .env para enviar receitas.");
    if (getToken) await getToken();
  };
  return {
    async listMyReceipts() {
      await ensure();
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData?.user?.id)
        throw new Error("Entre novamente para acessar suas receitas.");
      const { data, error } = await client
        .from("receipt_documents")
        .select(
          "id,order_id,file_name,storage_path,status,review_note,created_at,reviewed_at",
        )
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false });
      if (error) throw displayReceiptError(error);
      return data || [];
    },
    async listReceiptEvents() {
      await ensure();
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData?.user?.id)
        throw new Error("Entre novamente para acessar seu histórico.");
      const { data, error } = await client
        .from("receipt_events")
        .select("id,receipt_id,action,note,created_at")
        .eq("owner_id", authData.user.id)
        .order("created_at", { ascending: true });
      if (error) throw displayReceiptError(error);
      return data || [];
    },
    async isPharmacist() {
      await ensure();
      const { data, error } = await client.rpc("farmavida_is_pharmacist");
      if (error) throw displayReceiptError(error);
      return data === true;
    },
    async listReviewQueue() {
      await ensure();
      const { data, error } = await client.rpc("farmavida_review_queue");
      if (error) throw displayReceiptError(error);
      return data || [];
    },
    async reviewReceipt(receiptId, decision, note = "") {
      await ensure();
      if (!UUID.test(receiptId)) throw new Error("Receita inválida.");
      if (!["aprovada", "rejeitada"].includes(decision))
        throw new Error("Decisão inválida.");
      const text = String(note).trim();
      if (text.length > 1000 || (decision === "rejeitada" && !text)) {
        throw new Error(
          "Informe uma justificativa (até 1.000 caracteres) para rejeitar.",
        );
      }
      const { data, error } = await client.rpc("farmavida_review_receipt", {
        p_receipt_id: receiptId,
        p_decision: decision,
        p_note: text,
      });
      if (error) throw displayReceiptError(error);
      return data;
    },
    async getReceiptUrl(path) {
      await ensure();
      if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/i.test(path))
        throw new Error("Caminho da receita inválido.");
      const { data, error } = await client.storage
        .from(RECEIPT_BUCKET)
        .createSignedUrl(path, 60);
      if (error) throw displayReceiptError(error);
      return data.signedUrl;
    },
  };
}

// PDFs não são armazenados no navegador.
export function createLocalReceipts() {
  return {
    async listMyReceipts() {
      return [];
    },
    async listReceiptEvents() {
      return [];
    },
    async isPharmacist() {
      return false;
    },
    async listReviewQueue() {
      return [];
    },
    async reviewReceipt() {
      throw new Error(
        "Análise farmacêutica requer Supabase e perfil autorizado.",
      );
    },
    async getReceiptUrl() {
      throw new Error("Não há PDF armazenado no modo demonstração.");
    },
  };
}
