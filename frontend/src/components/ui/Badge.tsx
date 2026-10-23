import { CONSULTATION_STATUS_LABELS } from '../../lib/constants'
import type { ConsultationStatus } from '../../lib/api/types'

export function StatusBadge({ status }: { status: ConsultationStatus }) {
  return (
    <span className={`badge badge-${status}`}>{CONSULTATION_STATUS_LABELS[status]}</span>
  )
}

export function PublishBadge({ published }: { published: boolean }) {
  return (
    <span className={published ? 'badge badge-published' : 'badge badge-draft'}>
      {published ? 'منتشرشده' : 'پیش‌نویس'}
    </span>
  )
}
