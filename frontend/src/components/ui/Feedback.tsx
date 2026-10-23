import type { ReactNode } from 'react'

export function Spinner({ large = false }: { large?: boolean }) {
  return <span className={large ? 'spinner spinner-lg' : 'spinner'} aria-hidden="true" />
}

export function LoadingState({ label = 'در حال دریافت اطلاعات…' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <Spinner large />
      <p>{label}</p>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton skeleton-card" key={index} />
      ))}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="state">
      <span className="state-icon" aria-hidden="true">
        —
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

interface ErrorStateProps {
  message: string
  title?: string
  onRetry?: () => void
}

export function ErrorState({ message, title = 'خطا در دریافت اطلاعات', onRetry }: ErrorStateProps) {
  return (
    <div className="state" role="alert">
      <span className="state-icon" aria-hidden="true">
        !
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          تلاش دوباره
        </button>
      )}
    </div>
  )
}

export function Alert({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'error'
  children: ReactNode
}) {
  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
