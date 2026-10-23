import { useEffect, useId, useState } from 'react'
import { adminApi } from '../../lib/api/endpoints'
import { getApiErrorMessage } from '../../lib/validation'
import { formatFileSize } from '../../lib/format'
import { SmartImage } from './SmartImage'
import { Spinner, Alert } from './Feedback'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

function validateFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return 'فقط تصویر JPEG، PNG یا WebP مجاز است'
  if (file.size > MAX_BYTES) return `حجم فایل باید کمتر از ${formatFileSize(MAX_BYTES)} باشد`
  return null
}

interface ImageUploaderProps {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  required?: boolean
}

export function ImageUploader({ label, value, onChange, hint, required }: ImageUploaderProps) {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    const validation = validateFile(file)
    if (validation) {
      setError(validation)
      return
    }
    setError(null)
    setBusy(true)
    try {
      const uploaded = await adminApi.uploadImage(file)
      onChange(uploaded.path)
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="field image-uploader">
      <label htmlFor={id}>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      <div className="image-drop">
        <div className="image-preview">
          <SmartImage src={value || null} alt={label} placeholder="بدون تصویر" />
        </div>
        <div className="stack" style={{ flex: 1 }}>
          <input
            id={id}
            type="file"
            className="input"
            accept={ACCEPTED.join(',')}
            disabled={busy}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <div className="image-uploader-actions">
            {busy && (
              <span className="loading-inline">
                <Spinner /> در حال آپلود…
              </span>
            )}
            {value && !busy && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>
                حذف تصویر
              </button>
            )}
            {hint && <span className="hint">{hint}</span>}
          </div>
        </div>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  )
}

interface FileImageInputProps {
  label: string
  file: File | null
  existingPath?: string | null
  onChange: (file: File | null) => void
  required?: boolean
  hint?: string
}

export function FileImageInput({
  label,
  file,
  existingPath,
  onChange,
  required,
  hint,
}: FileImageInputProps) {
  const id = useId()
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleFile(next: File | undefined) {
    if (!next) return
    const validation = validateFile(next)
    if (validation) {
      setError(validation)
      return
    }
    setError(null)
    onChange(next)
  }

  return (
    <div className="field image-uploader">
      <label htmlFor={id}>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      <div className="image-drop">
        <div className="image-preview">
          {preview ? (
            <img src={preview} alt="پیش‌نمایش تصویر انتخاب‌شده" />
          ) : (
            <SmartImage src={existingPath ?? null} alt={label} placeholder="بدون تصویر" />
          )}
        </div>
        <div className="stack" style={{ flex: 1 }}>
          <input
            id={id}
            type="file"
            className="input"
            accept={ACCEPTED.join(',')}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <div className="image-uploader-actions">
            {file && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>
                لغو انتخاب فایل
              </button>
            )}
            {hint && <span className="hint">{hint}</span>}
          </div>
        </div>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  )
}
