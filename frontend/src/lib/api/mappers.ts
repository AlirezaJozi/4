import type {
  AdminUser,
  AuditLog,
  Branch,
  CareItem,
  Category,
  ClinicSettings,
  Closure,
  ConsultationRequest,
  ConsultationStatus,
  Faq,
  PortfolioCategory,
  PortfolioItem,
  Service,
  ServiceDetail,
  WorkingHour,
} from './types'
import { normalizeTimeValue } from '../format'

type Raw = Record<string, unknown>

export function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Raw)
    : {}
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return fallback
}

export function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return null
}

export function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return fallback
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function toInt(value: unknown, fallback = 0): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function mapCareItem(value: unknown): CareItem {
  const raw = asRecord(value)
  const itemType = toStringValue(raw.item_type)
  return {
    id: raw.id === undefined ? undefined : toInt(raw.id),
    itemType:
      itemType === 'complication' || itemType === 'pre' || itemType === 'after'
        ? itemType
        : 'pre',
    title: toStringValue(raw.title),
    content: toStringValue(raw.content),
    sortOrder: toInt(raw.sort_order),
  }
}

export function mapFaq(value: unknown): Faq {
  const raw = asRecord(value)
  return {
    id: raw.id === undefined ? undefined : toInt(raw.id),
    question: toStringValue(raw.question),
    answer: toStringValue(raw.answer),
    sortOrder: toInt(raw.sort_order),
  }
}

export function mapService(value: unknown, detail = false): Service | ServiceDetail {
  const raw = asRecord(value)
  const service: Service = {
    id: toInt(raw.id),
    title: toStringValue(raw.title),
    name: toStringValue(raw.name, toStringValue(raw.title)),
    slug: toStringValue(raw.slug),
    categoryId: toInt(raw.category_id),
    categoryTitle: toNullableString(raw.category_title),
    shortDescription: toNullableString(raw.short_description),
    description: toNullableString(raw.description),
    imageMain: toNullableString(raw.image_main),
    imageSecondary: toNullableString(raw.image_secondary),
    price: toNumber(raw.price),
    showPrice: toBool(raw.show_price),
    priceText: toNullableString(raw.price_text),
    durationMinutes: toNumber(raw.duration_minutes),
    complications: toNullableString(raw.complications),
    preCare: toNullableString(raw.pre_care),
    afterCare: toNullableString(raw.after_care),
    sortOrder: toInt(raw.sort_order),
    publishedAt: toNullableString(raw.published_at),
    isPublished: raw.is_published === undefined ? undefined : toBool(raw.is_published),
    createdAt: toNullableString(raw.created_at) ?? undefined,
    updatedAt: toNullableString(raw.updated_at) ?? undefined,
  }

  if (!detail) return service

  return {
    ...service,
    careItems: asArray(raw.careItems).map(mapCareItem),
    faqs: asArray(raw.faqs).map(mapFaq),
  } satisfies ServiceDetail
}

export function mapCategory(value: unknown): Category {
  const raw = asRecord(value)
  return {
    id: toInt(raw.id),
    title: toStringValue(raw.title),
    name: toNullableString(raw.name),
    slug: toStringValue(raw.slug),
    description: toNullableString(raw.description),
    image: toNullableString(raw.image),
    sortOrder: toInt(raw.sort_order),
    isActive: raw.is_active === undefined ? undefined : toBool(raw.is_active),
  }
}

export function mapPortfolioCategory(value: unknown): PortfolioCategory {
  const raw = asRecord(value)
  return {
    id: toInt(raw.id),
    title: toStringValue(raw.title),
    slug: toStringValue(raw.slug),
    description: toNullableString(raw.description),
    image: toNullableString(raw.image),
    sortOrder: toInt(raw.sort_order),
    isActive: raw.is_active === undefined ? undefined : toBool(raw.is_active),
  }
}

export function mapPortfolioItem(value: unknown): PortfolioItem {
  const raw = asRecord(value)
  return {
    id: toInt(raw.id),
    title: toStringValue(raw.title),
    slug: toStringValue(raw.slug),
    categoryId: toInt(raw.category_id),
    categoryTitle: toNullableString(raw.category_title),
    serviceId: raw.service_id === null || raw.service_id === undefined ? null : toInt(raw.service_id),
    beforeImage: toStringValue(raw.before_image),
    afterImage: toStringValue(raw.after_image),
    description: toNullableString(raw.description),
    sortOrder: toInt(raw.sort_order),
    publishedAt: toNullableString(raw.published_at),
    isPublished: raw.is_published === undefined ? undefined : toBool(raw.is_published),
    createdAt: toNullableString(raw.created_at) ?? undefined,
    updatedAt: toNullableString(raw.updated_at) ?? undefined,
  }
}

export function mapClinicSettings(value: unknown): ClinicSettings {
  const raw = asRecord(value)
  return Object.fromEntries(
    Object.entries(raw).map(([key, item]) => [
      key,
      item === null || item === undefined ? '' : String(item),
    ]),
  )
}

export function mapBranch(value: unknown): Branch {
  const raw = asRecord(value)
  return {
    id: toInt(raw.id),
    name: toStringValue(raw.name),
    address: toNullableString(raw.address),
    phone: toNullableString(raw.phone),
    latitude: toNumber(raw.latitude),
    longitude: toNumber(raw.longitude),
    googleMapsUrl: toNullableString(raw.google_maps_url),
    badge: toNullableString(raw.badge),
    isActive: raw.is_active === undefined ? undefined : toBool(raw.is_active),
    sortOrder: raw.sort_order === undefined ? undefined : toInt(raw.sort_order),
  }
}

export function mapWorkingHour(value: unknown): WorkingHour {
  const raw = asRecord(value)
  return {
    id: raw.id === undefined ? undefined : toInt(raw.id),
    branchId: toInt(raw.branch_id),
    weekday: toInt(raw.weekday, 0),
    isClosed: toBool(raw.is_closed),
    startTime: normalizeTimeValue(toNullableString(raw.start_time)) || null,
    endTime: normalizeTimeValue(toNullableString(raw.end_time)) || null,
    sortOrder: toInt(raw.sort_order),
  }
}

export function mapClosure(value: unknown): Closure {
  const raw = asRecord(value)
  return {
    id: raw.id === undefined ? undefined : toInt(raw.id),
    branchId: toInt(raw.branch_id),
    closureDate: toStringValue(raw.closure_date),
    reason: toNullableString(raw.reason),
  }
}

const CONSULTATION_STATUSES: ConsultationStatus[] = [
  'new',
  'contacting',
  'contacted',
  'completed',
  'cancelled',
]

export function mapConsultation(value: unknown): ConsultationRequest {
  const raw = asRecord(value)
  const status = toStringValue(raw.status)
  return {
    id: toInt(raw.id),
    firstName: toStringValue(raw.first_name),
    lastName: toStringValue(raw.last_name),
    phone: toStringValue(raw.phone),
    preferredDate: toNullableString(raw.preferred_date),
    preferredTimeRange: toNullableString(raw.preferred_time_range),
    notes: toNullableString(raw.notes),
    status: CONSULTATION_STATUSES.includes(status as ConsultationStatus)
      ? (status as ConsultationStatus)
      : 'new',
    internalNote: toNullableString(raw.internal_note),
    followUpResult: toNullableString(raw.follow_up_result),
    createdAt: toStringValue(raw.created_at),
    updatedAt: toNullableString(raw.updated_at) ?? undefined,
    services: Array.isArray(raw.services)
      ? raw.services.map((item) => {
          const service = asRecord(item)
          return {
            id: toInt(service.id),
            title: toStringValue(service.title),
            slug: toStringValue(service.slug),
          }
        })
      : undefined,
  }
}

export function mapAuditLog(value: unknown): AuditLog {
  const raw = asRecord(value)
  return {
    id: toInt(raw.id),
    adminId: raw.admin_id === null || raw.admin_id === undefined ? null : toInt(raw.admin_id),
    action: toStringValue(raw.action),
    entityType: toStringValue(raw.entity_type),
    entityId: raw.entity_id === null || raw.entity_id === undefined ? null : toInt(raw.entity_id),
    metadata: raw.metadata ?? null,
    createdAt: toStringValue(raw.created_at),
  }
}

export function mapAdmin(value: unknown): AdminUser {
  const raw = asRecord(value)
  return {
    id: toInt(raw.id),
    email: toStringValue(raw.email),
    createdAt: toNullableString(raw.created_at) ?? undefined,
  }
}
