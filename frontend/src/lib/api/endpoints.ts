import {
  apiDelete,
  apiGet,
  apiGetPaged,
  apiSend,
} from './client'
import {
  asRecord,
  mapAdmin,
  mapAuditLog,
  mapBranch,
  mapCategory,
  mapClinicSettings,
  mapClosure,
  mapConsultation,
  mapFaq,
  mapCareItem,
  mapPortfolioCategory,
  mapPortfolioItem,
  mapService,
  mapWorkingHour,
  toStringValue,
  toInt,
} from './mappers'
import type {
  AdminPortfolioListParams,
  AdminServiceListParams,
  AdminUser,
  AuditLog,
  AuditLogListParams,
  Branch,
  BranchPayload,
  CareItem,
  Category,
  CategoryPayload,
  ClinicSettings,
  Closure,
  ConsultationListParams,
  ConsultationRequest,
  ConsultationUpdatePayload,
  Faq,
  PortfolioCategory,
  PortfolioCategoryPayload,
  PortfolioItem,
  PortfolioListParams,
  PortfolioPayload,
  Service,
  ServiceDetail,
  ServiceListParams,
  ServicePayload,
  UploadedImage,
  WorkingHour,
} from './types'

interface ConsultationCreatePayload {
  firstName: string
  lastName: string
  phone: string
  serviceIds: number[]
  preferredDate?: string | null
  preferredTimeRange?: string | null
  notes?: string | null
}

export const publicApi = {
  services(params: ServiceListParams = {}) {
    return apiGetPaged('/services', params, (item) => mapService(item) as Service)
  },
  service(slug: string) {
    return apiGet<unknown>(`/services/${encodeURIComponent(slug)}`).then(
      (item) => mapService(item, true) as ServiceDetail,
    )
  },
  serviceCategories() {
    return apiGet<unknown[]>('/service-categories').then((items) => items.map(mapCategory))
  },
  portfolioCategories() {
    return apiGet<unknown[]>('/portfolio-categories').then((items) =>
      items.map(mapPortfolioCategory),
    )
  },
  portfolio(params: PortfolioListParams = {}) {
    return apiGetPaged('/portfolio', params, (item) => mapPortfolioItem(item))
  },
  portfolioItem(slug: string) {
    return apiGet<unknown>(`/portfolio/${encodeURIComponent(slug)}`).then((item) =>
      mapPortfolioItem(item),
    )
  },
  clinic() {
    return apiGet<unknown>('/clinic').then(mapClinicSettings)
  },
  branches() {
    return apiGet<unknown[]>('/branches').then((items) => items.map(mapBranch))
  },
  workingHours() {
    return apiGet<unknown[]>('/working-hours').then((items) => items.map(mapWorkingHour))
  },
  closures() {
    return apiGet<unknown[]>('/closures').then((items) => items.map(mapClosure))
  },
  createConsultation(payload: ConsultationCreatePayload) {
    return apiSend<{ id: number }>('/consultation-requests', 'POST', payload)
  },
}

export const authApi = {
  async login(email: string, password: string) {
    const data = await apiSend<unknown>('/admin/auth/login', 'POST', { email, password })
    const raw = asRecord(data)
    return {
      challengeId: toStringValue(raw.challengeId),
      expiresIn: toInt(raw.expiresIn, 300),
    }
  },
  async verifyOtp(challengeId: string, otp: string) {
    const data = await apiSend<unknown>('/admin/auth/verify-otp', 'POST', {
      challengeId,
      otp,
    })
    return mapAdmin(asRecord(data).admin) as AdminUser
  },
  async resendOtp(challengeId: string) {
    const data = await apiSend<unknown>('/admin/auth/resend-otp', 'POST', { challengeId })
    const raw = asRecord(data)
    return { expiresIn: toInt(raw.expiresIn, 300) }
  },
  async me() {
    const data = await apiGet<unknown>('/admin/auth/me')
    return mapAdmin(data) as AdminUser
  },
  logout() {
    return apiSend<null>('/admin/auth/logout', 'POST')
  },
}

type Query = Record<string, string | number | boolean | undefined | null>

export const adminApi = {
  uploadImage(file: File) {
    const form = new FormData()
    form.append('file', file)
    return apiSend<UploadedImage>('/admin/uploads/images', 'POST', undefined, form)
  },

  services: {
    list(params: AdminServiceListParams = {}) {
      return apiGetPaged('/admin/services', params as Query, (item) => mapService(item) as Service)
    },
    create(payload: ServicePayload) {
      return apiSend<{ id: number }>('/admin/services', 'POST', payload)
    },
    update(id: number, payload: Partial<ServicePayload>) {
      return apiSend<{ id: number }>(`/admin/services/${id}`, 'PATCH', payload)
    },
    remove(id: number) {
      return apiDelete<{ id: number }>(`/admin/services/${id}`)
    },
    careItems(id: number) {
      return apiGet<unknown[]>(`/admin/services/${id}/care-items`).then((items) =>
        items.map(mapCareItem),
      )
    },
    replaceCareItems(id: number, items: CareItem[]) {
      return apiSend<unknown[]>(`/admin/services/${id}/care-items`, 'PUT', items).then((items) =>
        items.map(mapCareItem),
      )
    },
    faqs(id: number) {
      return apiGet<unknown[]>(`/admin/services/${id}/faqs`).then((items) => items.map(mapFaq))
    },
    replaceFaqs(id: number, items: Faq[]) {
      return apiSend<unknown[]>(`/admin/services/${id}/faqs`, 'PUT', items).then((items) =>
        items.map(mapFaq),
      )
    },
    async findById(id: number): Promise<Service | null> {
      let page = 1
      let totalPages = 1
      while (page <= totalPages && page <= 50) {
        const result = await apiGetPaged(
          '/admin/services',
          { page, limit: 100 },
          (item) => mapService(item) as Service,
        )
        const found = result.items.find((item) => item.id === id)
        if (found) return found
        totalPages = result.meta.totalPages
        page += 1
      }
      return null
    },
  },

  serviceCategories: {
    list() {
      return apiGet<unknown[]>('/admin/service-categories').then((items) =>
        items.map(mapCategory),
      )
    },
    create(payload: CategoryPayload) {
      return apiSend<{ id: number }>('/admin/service-categories', 'POST', payload)
    },
    update(id: number, payload: Partial<CategoryPayload>) {
      return apiSend<{ id: number }>(`/admin/service-categories/${id}`, 'PATCH', payload)
    },
    remove(id: number) {
      return apiDelete<{ id: number }>(`/admin/service-categories/${id}`)
    },
  },

  portfolioCategories: {
    list() {
      return apiGet<unknown[]>('/admin/portfolio-categories').then((items) =>
        items.map(mapPortfolioCategory),
      )
    },
    create(payload: PortfolioCategoryPayload) {
      return apiSend<{ id: number }>('/admin/portfolio-categories', 'POST', payload)
    },
    update(id: number, payload: Partial<PortfolioCategoryPayload>) {
      return apiSend<{ id: number }>(`/admin/portfolio-categories/${id}`, 'PATCH', payload)
    },
    remove(id: number) {
      return apiDelete<{ id: number }>(`/admin/portfolio-categories/${id}`)
    },
  },

  portfolio: {
    list(params: AdminPortfolioListParams = {}) {
      return apiGetPaged('/admin/portfolio', params as Query, (item) =>
        mapPortfolioItem(item),
      )
    },
    create(payload: PortfolioPayload, before: File, after: File) {
      return apiSend<{ id: number }>(
        '/admin/portfolio',
        'POST',
        undefined,
        portfolioForm(payload, before, after, false),
      )
    },
    update(
      id: number,
      payload: Partial<PortfolioPayload>,
      before?: File,
      after?: File,
    ) {
      return apiSend<{ id: number }>(
        `/admin/portfolio/${id}`,
        'PATCH',
        undefined,
        portfolioForm(payload, before, after, true),
      )
    },
    remove(id: number) {
      return apiDelete<{ id: number }>(`/admin/portfolio/${id}`)
    },
    async findById(id: number): Promise<PortfolioItem | null> {
      let page = 1
      let totalPages = 1
      while (page <= totalPages && page <= 50) {
        const result = await apiGetPaged(
          '/admin/portfolio',
          { page, limit: 100 },
          (item) => mapPortfolioItem(item),
        )
        const found = result.items.find((item) => item.id === id)
        if (found) return found
        totalPages = result.meta.totalPages
        page += 1
      }
      return null
    },
  },

  clinic: {
    get() {
      return apiGet<unknown>('/admin/clinic').then(mapClinicSettings)
    },
    update(payload: ClinicSettings) {
      return apiSend<unknown>('/admin/clinic', 'PATCH', payload).then(mapClinicSettings)
    },
  },

  branches: {
    list() {
      return apiGet<unknown[]>('/admin/branches').then((items) => items.map(mapBranch))
    },
    create(payload: BranchPayload) {
      return apiSend<{ id: number }>('/admin/branches', 'POST', payload)
    },
    update(id: number, payload: Partial<BranchPayload>) {
      return apiSend<{ id: number }>(`/admin/branches/${id}`, 'PATCH', payload)
    },
  },

  workingHours: {
    list() {
      return apiGet<unknown[]>('/admin/working-hours').then((items) =>
        items.map(mapWorkingHour),
      )
    },
    replace(branchId: number, hours: WorkingHour[]) {
      return apiSend<unknown[]>(
        '/admin/working-hours',
        'PUT',
        {
          branchId,
          hours: hours.map(({ weekday, isClosed, startTime, endTime, sortOrder }) => ({
            weekday,
            isClosed,
            startTime: startTime || null,
            endTime: endTime || null,
            sortOrder,
          })),
        },
      ).then((items) => items.map(mapWorkingHour))
    },
  },

  closures: {
    list() {
      return apiGet<unknown[]>('/admin/closures').then((items) => items.map(mapClosure))
    },
    replace(branchId: number, closures: Array<{ closureDate: string; reason?: string | null }>) {
      return apiSend<unknown[]>(
        '/admin/closures',
        'PUT',
        { branchId, closures },
      ).then((items) => items.map(mapClosure))
    },
  },

  consultations: {
    list(params: ConsultationListParams = {}) {
      return apiGetPaged('/admin/consultation-requests', params as Query, (item) =>
        mapConsultation(item),
      )
    },
    detail(id: number) {
      return apiGet<unknown>(`/admin/consultation-requests/${id}`).then(
        (item) => mapConsultation(item) as ConsultationRequest,
      )
    },
    update(id: number, payload: ConsultationUpdatePayload) {
      return apiSend<unknown>(`/admin/consultation-requests/${id}`, 'PATCH', payload).then(
        (item) => mapConsultation(item),
      )
    },
  },

  auditLogs: {
    list(params: AuditLogListParams = {}) {
      return apiGetPaged('/admin/audit-logs', params as Query, (item) => mapAuditLog(item) as AuditLog)
    },
  },
}

function portfolioForm(
  payload: Partial<PortfolioPayload>,
  before: File | undefined,
  after: File | undefined,
  partial: boolean,
): FormData {
  const form = new FormData()
  const append = (key: string, value: string | number | boolean | null | undefined) => {
    if (value === undefined || value === null) return
    form.append(key, String(value))
  }

  if (!partial || payload.title !== undefined) append('title', payload.title)
  if (!partial || payload.slug !== undefined) append('slug', payload.slug)
  if (!partial || payload.categoryId !== undefined) append('categoryId', payload.categoryId)
  if (!partial || payload.serviceId !== undefined) append('serviceId', payload.serviceId ?? '')
  if (!partial || payload.description !== undefined) append('description', payload.description)
  if (!partial || payload.sortOrder !== undefined) append('sortOrder', payload.sortOrder)
  if (!partial || payload.isPublished !== undefined) {
    form.append('isPublished', payload.isPublished ? 'true' : 'false')
  }
  if (before) form.append('beforeImage', before)
  if (after) form.append('afterImage', after)
  return form
}

export type { ConsultationCreatePayload }

export type AdminCategory = Category
export type AdminPortfolioCategory = PortfolioCategory
export type AdminBranch = Branch
export type AdminClosure = Closure
