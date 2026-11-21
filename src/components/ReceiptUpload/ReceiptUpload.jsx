import { useState, useRef, useId } from 'react'
import { useToast } from '../../context/ToastContext'
import './ReceiptUpload.css'

export default function ReceiptUpload({ 
  onReceiptChange, 
  required = false, 
  currentReceipt = null,
  label = "Receita controlada (PDF)",
  helpText = "Obrigatório para medicamentos controlados. Retenção de lote conforme legislação."
}) {
  const { showToast } = useToast()
  const [file, setFile] = useState(currentReceipt)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)
  const inputId = useId()

  const validateFile = (f) => {
    if (f.type !== 'application/pdf') {
      showToast('Arquivo deve ser PDF', 'error')
      return false
    }
    if (f.size > 10 * 1024 * 1024) { // 10MB
      showToast('Arquivo deve ter no máximo 10MB', 'error')
      return false
    }
    return true
  }

  const handleFileSelect = (f) => {
    if (!validateFile(f)) return
    setFile(f)
    onReceiptChange(f)
    
    // Create preview URL
    const url = URL.createObjectURL(f)
    setPreview(url)
    showToast(`${f.name} anexado com sucesso`, 'success')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleInputChange = (e) => {
    const f = e.target.files[0]
    if (f) handleFileSelect(f)
  }

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onReceiptChange(null)
    showToast('Receita removida', 'info')
  }

  return (
    <div className={`receipt-upload ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}>
      <label className="receipt-upload-label" htmlFor={inputId}>
        <div className="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div className="upload-text">
          <strong>{file ? 'Receita anexada' : label}</strong>
          <span>{file ? file.name : `Clique ou arraste o arquivo PDF${required ? ' *' : ''}`}</span>
        </div>
        {file && (
          <button
            type="button"
            className="remove-btn"
            onClick={removeFile}
            aria-label="Remover receita"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <input
          ref={fileInputRef}
          id={inputId}
          name="receita"
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          required={required && !file}
        />
      </label>

      {helpText && <span className="upload-help">{helpText}</span>}

      {file && preview && (
        <div className="receipt-preview">
          <iframe
            src={preview}
            title="Visualização da receita"
            className="receipt-iframe"
            sandbox="allow-same-origin"
          />
          <div className="preview-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => window.open(preview, '_blank')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Abrir em nova aba
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const a = document.createElement('a')
                a.href = preview
                a.download = file.name
                a.click()
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Baixar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}