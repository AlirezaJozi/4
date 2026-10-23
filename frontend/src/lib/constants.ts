import type { ConsultationStatus } from './api/types'

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  new: 'جدید',
  contacting: 'در حال تماس',
  contacted: 'تماس گرفته شد',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
}

export const CONSULTATION_STATUSES = Object.keys(
  CONSULTATION_STATUS_LABELS,
) as ConsultationStatus[]

export const CARE_TYPE_LABELS = {
  pre: 'مراقبت پیش از درمان',
  after: 'مراقبت پس از درمان',
  complication: 'عوارض احتمالی',
} as const

export interface ClinicField {
  key: string
  label: string
  hint?: string
  multiline?: boolean
  json?: boolean
  maxLength?: number
}

export const CLINIC_FIELDS: ClinicField[] = [
  { key: 'name', label: 'نام کلینیک', maxLength: 190 },
  { key: 'intro', label: 'معرفی کوتاه', multiline: true, maxLength: 1000 },
  { key: 'heroText', label: 'متن هیروی صفحه اصلی', multiline: true, maxLength: 1000 },
  { key: 'about', label: 'درباره کلینیک', multiline: true, maxLength: 10000 },
  { key: 'aboutText', label: 'متن تکمیلی درباره', multiline: true, maxLength: 10000 },
  {
    key: 'team',
    label: 'کادر درمان',
    hint: 'آرایه JSON از اعضا با کلیدهای name، role، image و bio',
    multiline: true,
    json: true,
    maxLength: 10000,
  },
  { key: 'phone', label: 'تلفن تماس', maxLength: 40 },
  { key: 'email', label: 'ایمیل', maxLength: 190 },
  { key: 'address', label: 'آدرس', multiline: true, maxLength: 500 },
  {
    key: 'socials',
    label: 'شبکه‌های اجتماعی',
    hint: 'آرایه یا شیء JSON از label و url',
    multiline: true,
    json: true,
    maxLength: 5000,
  },
  { key: 'logo', label: 'مسیر لوگو', hint: 'مسیر فایل آپلودشده یا آدرس کامل تصویر', maxLength: 500 },
  { key: 'footer', label: 'متن پاورقی', multiline: true, maxLength: 1000, json: true },
]

export const PUBLIC_NAV = [
  { to: '/', label: 'خانه' },
  { to: '/services', label: 'خدمات' },
  { to: '/portfolio', label: 'نمونه‌کارها' },
  { to: '/about', label: 'درباره ما' },
  { to: '/contact', label: 'تماس با ما' },
] as const

export interface AdminNavItem {
  to: string
  label: string
  end?: boolean
}

export interface AdminNavGroup {
  title: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  { title: 'نمای کلی', items: [{ to: '/admin', label: 'داشبورد', end: true }] },
  {
    title: 'محتوا',
    items: [
      { to: '/admin/services', label: 'خدمات' },
      { to: '/admin/service-categories', label: 'دسته‌بندی خدمات' },
      { to: '/admin/portfolio', label: 'نمونه‌کارها' },
      { to: '/admin/portfolio-categories', label: 'دسته‌بندی نمونه‌کارها' },
    ],
  },
  {
    title: 'کلینیک',
    items: [
      { to: '/admin/clinic', label: 'تنظیمات کلینیک' },
      { to: '/admin/branches', label: 'شعب' },
      { to: '/admin/working-hours', label: 'ساعات کاری' },
      { to: '/admin/closures', label: 'تعطیلی‌ها' },
    ],
  },
  {
    title: 'درخواست‌ها',
    items: [{ to: '/admin/consultations', label: 'مشاوره‌ها' }],
  },
  {
    title: 'گزارش‌ها',
    items: [{ to: '/admin/audit-logs', label: 'فعالیت مدیران' }],
  },
]

export const PUBLIC_PAGE_SIZE = 12
export const ADMIN_PAGE_SIZE = 20

export const CARE_TYPES = ['pre', 'after', 'complication'] as const

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  service: 'خدمت',
  service_category: 'دسته خدمات',
  service_care_items: 'مراقبت‌های خدمت',
  service_faqs: 'پرسش‌های خدمت',
  portfolio: 'نمونه‌کار',
  portfolio_category: 'دسته نمونه‌کار',
  clinic_settings: 'تنظیمات کلینیک',
  branch: 'شعبه',
  working_hours: 'ساعات کاری',
  closures: 'تعطیلی‌ها',
  consultation_request: 'درخواست مشاوره',
}
