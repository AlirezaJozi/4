const jalaliDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const jalaliDateTime = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const faNumber = new Intl.NumberFormat('fa-IR')

export const WEEKDAY_LABELS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
] as const

export const WEEKDAY_ORDER = [6, 0, 1, 2, 3, 4, 5] as const

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])
}

export function formatNumber(value: number | string, maximumFractionDigits = 0): string {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return '—'
  return faNumber.format(parsed, { maximumFractionDigits })
}

function parseDateInput(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0)
  }

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const normalized = trimmed.replace(' ', 'T')
    return new Date(`${normalized}Z`)
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatJalaliDate(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = parseDateInput(value)
  return parsed ? jalaliDate.format(parsed) : '—'
}

export function formatJalaliDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = parseDateInput(value)
  return parsed ? jalaliDateTime.format(parsed) : '—'
}

export function formatGregorianDateInput(value: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) return ''
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function normalizeTimeValue(value: string | null | undefined): string {
  if (!value) return ''
  const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return ''
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

export function formatTime(value: string | null | undefined): string {
  const normalized = normalizeTimeValue(value)
  return normalized ? toPersianDigits(normalized) : '—'
}

export function formatPrice(
  price: number | null,
  showPrice: boolean,
  priceText: string | null,
): string {
  if (priceText) return priceText
  if (showPrice && price !== null) return `${formatNumber(price)} تومان`
  return 'قیمت اعلام نشده'
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '—'
  if (minutes < 60) return `${formatNumber(minutes)} دقیقه`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const hourText = `${formatNumber(hours)} ساعت`
  return rest ? `${hourText} و ${formatNumber(rest)} دقیقه` : hourText
}

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[weekday] ?? '—'
}

export function todayWeekday(): number {
  return new Date().getDay()
}

export interface SocialLink {
  label: string
  url: string
}

export function parseSocialLinks(value: string | undefined | null): SocialLink[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.flatMap((item) => {
        if (typeof item === 'string' && /^https?:\/\//.test(item)) {
          return [{ label: item, url: item }]
        }
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>
          const url = typeof record.url === 'string' ? record.url : ''
          if (!/^https?:\/\//.test(url)) return []
          const label =
            (typeof record.label === 'string' && record.label) ||
            (typeof record.name === 'string' && record.name) ||
            url
          return [{ label, url }]
        }
        return []
      })
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as Record<string, unknown>).flatMap(([label, url]) =>
        typeof url === 'string' && /^https?:\/\//.test(url) ? [{ label, url }] : [],
      )
    }
  } catch {
    return []
  }
  return []
}

export interface TeamMember {
  name: string
  role: string | null
  image: string | null
  bio: string | null
}

export function parseTeam(value: string | undefined | null): TeamMember[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const record = item as Record<string, unknown>
      const name = typeof record.name === 'string' ? record.name.trim() : ''
      if (!name) return []
      return [
        {
          name,
          role: typeof record.role === 'string' ? record.role : null,
          image: typeof record.image === 'string' ? record.image : null,
          bio: typeof record.bio === 'string' ? record.bio : null,
        },
      ]
    })
  } catch {
    return []
  }
}

export function parseJsonText(
  value: string,
): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(value) }
  } catch {
    return { ok: false }
  }
}

const assetBase = (import.meta.env.VITE_ASSET_BASE_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  '',
)

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${assetBase}${path.startsWith('/') ? '' : '/'}${path}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`
  if (bytes < 1024 * 1024) return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`
  return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`
}
