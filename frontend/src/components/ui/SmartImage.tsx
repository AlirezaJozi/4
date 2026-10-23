import { useState } from 'react'
import { assetUrl } from '../../lib/format'

interface SmartImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  width?: number
  height?: number
  eager?: boolean
  placeholder?: string
}

export function SmartImage({
  src,
  alt,
  className,
  width,
  height,
  eager = false,
  placeholder = 'تصویر در دسترس نیست',
}: SmartImageProps) {
  const [failed, setFailed] = useState(false)
  const url = assetUrl(src)

  if (!url || failed) {
    return (
      <div className={`image-placeholder ${className ?? ''}`} role="img" aria-label={placeholder}>
        <span aria-hidden="true">+</span>
        <span>{placeholder}</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      onError={() => setFailed(true)}
    />
  )
}
