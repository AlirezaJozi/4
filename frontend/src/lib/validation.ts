import { z } from 'zod'
import { ApiError } from './api/types'
import { toPersianDigits } from './format'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'ایمیل را وارد کنید').email('ایمیل معتبر نیست').max(190),
  password: z
    .string()
    .min(8, 'رمز عبور حداقل ۸ کاراکتر است')
    .max(128, 'رمز عبور حداکثر ۱۲۸ کاراکتر است'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'کد شش‌رقمی را وارد کنید'),
})
export type OtpValues = z.infer<typeof otpSchema>

export const consultationSchema = z.object({
  firstName: z.string().trim().min(2, 'نام حداقل ۲ کاراکتر است').max(100),
  lastName: z.string().trim().min(2, 'نام خانوادگی حداقل ۲ کاراکتر است').max(100),
  phone: z
    .string()
    .trim()
    .min(7, 'شماره تماس حداقل ۷ کاراکتر است')
    .max(30, 'شماره تماس حداکثر ۳۰ کاراکتر است'),
  serviceIds: z
    .array(z.number().int().positive())
    .min(1, 'حداقل یک خدمت انتخاب کنید')
    .max(10, 'حداکثر ۱۰ خدمت قابل انتخاب است')
    .refine((ids) => new Set(ids).size === ids.length, 'خدمات تکراری مجاز نیست'),
  preferredDate: z
    .string()
    .refine(
      (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
      'تاریخ معتبر نیست',
    ),
  preferredTimeRange: z.string().max(100, 'حداکثر ۱۰۰ کاراکتر'),
  notes: z.string().max(3000, 'حداکثر ۳۰۰۰ کاراکتر'),
  website: z.string().optional(),
})
export type ConsultationValues = z.infer<typeof consultationSchema>

const numericOptional = (message: string) =>
  z
    .string()
    .refine((value) => value === '' || /^\d+$/.test(value), message)

const decimalOptional = (message: string) =>
  z
    .string()
    .refine((value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value), message)

export const serviceFormSchema = z.object({
  title: z.string().trim().min(2, 'عنوان حداقل ۲ کاراکتر است').max(190),
  name: z.string().trim().max(190),
  slug: z
    .string()
    .trim()
    .min(1, 'اسلاگ الزامی است')
    .max(190)
    .regex(slugRegex, 'اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد'),
  categoryId: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  shortDescription: z.string().max(1000, 'حداکثر ۱۰۰۰ کاراکتر'),
  description: z.string().max(10000, 'حداکثر ۱۰۰۰۰ کاراکتر'),
  imageMain: z.string(),
  imageSecondary: z.string(),
  price: decimalOptional('قیمت باید عدد غیرمنفی باشد'),
  showPrice: z.boolean(),
  priceText: z.string().max(190, 'حداکثر ۱۹۰ کاراکتر'),
  durationMinutes: numericOptional('مدت باید عدد صحیح مثبت باشد'),
  complications: z.string().max(5000, 'حداکثر ۵۰۰۰ کاراکتر'),
  preCare: z.string().max(5000, 'حداکثر ۵۰۰۰ کاراکتر'),
  afterCare: z.string().max(5000, 'حداکثر ۵۰۰۰ کاراکتر'),
  sortOrder: numericOptional('ترتیب باید عدد صحیح غیرمنفی باشد'),
  isPublished: z.boolean(),
  careItems: z.array(
    z.object({
      itemType: z.enum(['complication', 'pre', 'after']),
      title: z.string().trim().min(1, 'عنوان الزامی است').max(190),
      content: z.string().trim().min(1, 'متن الزامی است').max(5000),
      sortOrder: numericOptional('ترتیب باید عدد صحیح غیرمنفی باشد'),
    }),
  ),
  faqs: z.array(
    z.object({
      question: z.string().trim().min(1, 'سؤال الزامی است').max(500),
      answer: z.string().trim().min(1, 'پاسخ الزامی است').max(10000),
      sortOrder: numericOptional('ترتیب باید عدد صحیح غیرمنفی باشد'),
    }),
  ),
})
export type ServiceFormValues = z.infer<typeof serviceFormSchema>

export const categoryFormSchema = z.object({
  title: z.string().trim().min(2, 'عنوان حداقل ۲ کاراکتر است').max(190),
  name: z.string().trim().max(190),
  slug: z
    .string()
    .trim()
    .min(1, 'اسلاگ الزامی است')
    .max(190)
    .regex(slugRegex, 'اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد'),
  description: z.string().max(3000, 'حداکثر ۳۰۰۰ کاراکتر'),
  sortOrder: numericOptional('ترتیب باید عدد صحیح غیرمنفی باشد'),
  isActive: z.boolean(),
})
export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const portfolioCategoryFormSchema = categoryFormSchema.omit({ name: true })
export type PortfolioCategoryFormValues = z.infer<typeof portfolioCategoryFormSchema>

export const portfolioFormSchema = z.object({
  title: z.string().trim().min(2, 'عنوان حداقل ۲ کاراکتر است').max(190),
  slug: z
    .string()
    .trim()
    .min(1, 'اسلاگ الزامی است')
    .max(190)
    .regex(slugRegex, 'اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد'),
  categoryId: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  serviceId: z.string(),
  description: z.string().max(5000, 'حداکثر ۵۰۰۰ کاراکتر'),
  sortOrder: numericOptional('ترتیب باید عدد صحیح غیرمنفی باشد'),
  isPublished: z.boolean(),
})
export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>

export const branchFormSchema = z.object({
  name: z.string().trim().min(2, 'نام شعبه حداقل ۲ کاراکتر است').max(190),
  address: z.string().max(500, 'حداکثر ۵۰۰ کاراکتر'),
  phone: z.string().max(40, 'حداکثر ۴۰ کاراکتر'),
  latitude: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        (Number.isFinite(Number(value)) && Number(value) >= -90 && Number(value) <= 90),
      'عرض جغرافیایی باید بین ‎-90 و 90 باشد',
    ),
  longitude: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        (Number.isFinite(Number(value)) && Number(value) >= -180 && Number(value) <= 180),
      'طول جغرافیایی باید بین ‎-180 و 180 باشد',
    ),
  googleMapsUrl: z
    .string()
    .refine(
      (value) => value === '' || /^https?:\/\/\S+$/i.test(value),
      'لینک نقشه باید با http یا https شروع شود',
    ),
  badge: z.string().max(190, 'حداکثر ۱۹۰ کاراکتر'),
  isActive: z.boolean(),
  sortOrder: numericOptional('ترتیب باید عدد صحیح غیرمنفی باشد'),
})
export type BranchFormValues = z.infer<typeof branchFormSchema>

export const consultationUpdateSchema = z.object({
  status: z.enum(['new', 'contacting', 'contacted', 'completed', 'cancelled']),
  internalNote: z.string().max(5000, 'حداکثر ۵۰۰۰ کاراکتر'),
  followUpResult: z.string().max(5000, 'حداکثر ۵۰۰۰ کاراکتر'),
})
export type ConsultationUpdateValues = z.infer<typeof consultationUpdateSchema>

const SERVER_MESSAGE_MAP: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Required$/i, () => 'این فیلد الزامی است'],
  [
    /at least (\d+) character/i,
    (match) => `حداقل ${toPersianDigits(match[1])} کاراکتر وارد کنید`,
  ],
  [
    /at most (\d+) character/i,
    (match) => `حداکثر ${toPersianDigits(match[1])} کاراکتر مجاز است`,
  ],
  [/Invalid email/i, () => 'ایمیل معتبر نیست'],
  [/Invalid date/i, () => 'تاریخ معتبر نیست'],
  [/Invalid input/i, () => 'مقدار واردشده معتبر نیست'],
  [/Expected number, received nan/i, () => 'عدد معتبر وارد کنید'],
  [/Expected (string|number|array|boolean)/i, () => 'نوع مقدار واردشده معتبر نیست'],
]

export function translateServerMessage(message: string | undefined): string {
  if (!message) return 'مقدار واردشده معتبر نیست'
  for (const [pattern, translate] of SERVER_MESSAGE_MAP) {
    const match = message.match(pattern)
    if (match) return translate(match)
  }
  return message
}

export function mapApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {}
  const result: Record<string, string> = {}
  for (const issue of error.errors) {
    const field = issue.path?.[0]
    if (typeof field !== 'string' || result[field]) continue
    result[field] = translateServerMessage(issue.message)
  }
  return result
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message
    if (error.status === 429) return error.message
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'خطای نامشخصی رخ داد'
}
