import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useToast } from '../../context/useToast.js'
import { validateReceiptFile } from '../../services/receipts.js'
import './ReceiptUpload.css'

export default function ReceiptUpload({
  onReceiptChange,
  required = false,
  currentReceipt = null,
  label = 'Receita médica (PDF)',
  helpText = 'PDF de até 10 MB. O envio privado ocorre ao confirmar o pedido.',
}) {
  const { showToast } = useToast()
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const inputId = useId()
  // A seleção é controlada pelo App: retirar o arquivo em outra seção atualiza esta.
  const file = currentReceipt
  const preview = useMemo(() => file ? URL.createObjectURL(file) : null, [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const handleFileSelect = (candidate) => {
    try {
      const next = validateReceiptFile(candidate)
      onReceiptChange(next)
      showToast(`${next.name} selecionado. O PDF será enviado somente ao finalizar o pedido.`, 'info')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }
  const removeFile = () => {
    onReceiptChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    showToast('Receita removida', 'info')
  }

  return (
    <div className={`receipt-upload ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
      onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }}
      onDragOver={(event) => { event.preventDefault(); setDragActive(true) }}
      onDragLeave={(event) => { event.preventDefault(); setDragActive(false) }}
      onDrop={(event) => { event.preventDefault(); setDragActive(false); if (event.dataTransfer.files[0]) handleFileSelect(event.dataTransfer.files[0]) }}>
      <label className="receipt-upload-label" htmlFor={inputId}>
        <div className="upload-icon" aria-hidden="true">📄</div>
        <div className="upload-text">
          <strong>{file ? 'Receita selecionada — aguardando envio' : label}</strong>
          <span>{file ? file.name : `Clique ou arraste o PDF${required ? ' *' : ''}`}</span>
        </div>
      </label>
      <input ref={fileInputRef} id={inputId} name="receita" type="file" accept=".pdf,application/pdf"
        onChange={(event) => { if (event.target.files?.[0]) handleFileSelect(event.target.files[0]) }}
        className="receipt-file-input" required={required && !file} />
      {file && <button type="button" className="remove-btn" onClick={removeFile} aria-label="Remover receita">× Remover</button>}
      {helpText && <span className="upload-help">{helpText}</span>}
      {preview && (
        <div className="receipt-preview">
          <iframe src={preview} title="Prévia local da receita" className="receipt-iframe" sandbox="allow-same-origin" />
          <div className="preview-actions">
            <a className="btn btn-outline btn-sm" href={preview} target="_blank" rel="noopener noreferrer">Abrir prévia</a>
          </div>
        </div>
      )}
    </div>
  )
}
