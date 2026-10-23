export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
}

export interface ApiErrorIssue {
  path?: Array<string | number>
  message?: string
  code?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly errors: ApiErrorIssue[]

  constructor(message: string, status: number, errors: ApiErrorIssue[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

export type ItemType = 'complication' | 'pre' | 'after'

export interface CareItem {
  id?: number
  itemType: ItemType
  title: string
  content: string
  sortOrder: number
}

export interface Faq {
  id?: number
  question: string
  answer: string
  sortOrder: number
}

export interface Service {
  id: number
  title: string
  name: string
  slug: string
  categoryId: number
  categoryTitle: string | null
  shortDescription: string | null
  description: string | null
  imageMain: string | null
  imageSecondary: string | null
  price: number | null
  showPrice: boolean
  priceText: string | null
  durationMinutes: number | null
  complications: string | null
  preCare: string | null
  afterCare: string | null
  sortOrder: number
  publishedAt: string | null
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
  careItems?: CareItem[]
  faqs?: Faq[]
}

export interface ServiceDetail extends Service {
  careItems: CareItem[]
  faqs: Faq[]
}

export interface Category {
  id: number
  title: string
  name: string | null
  slug: string
  description: string | null
  image: string | null
  sortOrder: number
  isActive?: boolean
}

export interface PortfolioCategory {
  id: number
  title: string
  slug: string
  description: string | null
  image: string | null
  sortOrder: number
  isActive?: boolean
}

export interface PortfolioItem {
  id: number
  title: string
  slug: string
  categoryId: number
  categoryTitle: string | null
  serviceId: number | null
  beforeImage: string
  afterImage: string
  description: string | null
  sortOrder: number
  publishedAt: string | null
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
}

export type ClinicSettings = Record<string, string>

export interface Branch {
  id: number
  name: string
  address: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string | null
  badge: string | null
  isActive?: boolean
  sortOrder?: number
}

export interface WorkingHour {
  id?: number
  branchId: number
  weekday: number
  isClosed: boolean
  startTime: string | null
  endTime: string | null
  sortOrder: number
}

export interface Closure {
  id?: number
  branchId: number
  closureDate: string
  reason: string | null
}

export type ConsultationStatus =
  | 'new'
  | 'contacting'
  | 'contacted'
  | 'completed'
  | 'cancelled'

export interface ConsultationRequest {
  id: number
  firstName: string
  lastName: string
  phone: string
  preferredDate: string | null
  preferredTimeRange: string | null
  notes: string | null
  status: ConsultationStatus
  internalNote: string | null
  followUpResult: string | null
  createdAt: string
  updatedAt?: string
  services?: Array<{ id: number; title: string; slug: string }>
}

export interface AuditLog {
  id: number
  adminId: number | null
  action: string
  entityType: string
  entityId: number | null
  metadata: unknown
  createdAt: string
}

export interface AdminUser {
  id: number
  email: string
  createdAt?: string
}

export interface UploadedImage {
  path: string
  filename: string
}

export interface ServicePayload {
  title: string
  name?: string
  slug: string
  categoryId: number
  shortDescription?: string | null
  description?: string | null
  imageMain?: string | null
  imageSecondary?: string | null
  price?: number | null
  showPrice?: boolean
  priceText?: string | null
  durationMinutes?: number | null
  complications?: string | null
  preCare?: string | null
  afterCare?: string | null
  sortOrder?: number
  isPublished?: boolean
}

export interface CategoryPayload {
  title: string
  name?: string
  slug: string
  description?: string | null
  sortOrder: number
  isActive: boolean
}

export interface PortfolioCategoryPayload {
  title: string
  slug: string
  description?: string | null
  sortOrder: number
  isActive: boolean
}

export interface PortfolioPayload {
  title: string
  slug: string
  categoryId: number
  serviceId?: number | null
  description?: string | null
  sortOrder: number
  isPublished: boolean
}

export interface BranchPayload {
  name: string
  address?: string | null
  phone?: string | null
  latitude?: number | null
  longitude?: number | null
  googleMapsUrl?: string | null
  badge?: string | null
  isActive: boolean
  sortOrder: number
}

export interface ConsultationUpdatePayload {
  status?: ConsultationStatus
  internalNote?: string | null
  followUpResult?: string | null
}

export interface ListParams {
  page?: number
  limit?: number
}

export interface ServiceListParams extends ListParams {
  search?: string
  categoryId?: number
}

export interface AdminServiceListParams extends ServiceListParams {
  isPublished?: boolean
}

export interface PortfolioListParams extends ListParams {
  categoryId?: number
  serviceId?: number
}

export interface AdminPortfolioListParams extends PortfolioListParams {
  search?: string
  isPublished?: boolean
}

export interface ConsultationListParams extends ListParams {
  status?: ConsultationStatus
  serviceId?: number
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface AuditLogListParams extends ListParams {
  adminId?: number
  entityType?: string
}
