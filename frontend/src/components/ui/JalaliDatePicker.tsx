import DatePicker from 'react-multi-date-picker'
import type { DateObject } from 'react-date-object'
import persian from 'react-date-object/calendars/persian'
import persianFa from 'react-date-object/locales/persian_fa'
import { formatGregorianDateInput } from '../../lib/format'

interface JalaliDatePickerProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaDescribedBy?: string
}

function toDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

export function JalaliDatePicker({
  id,
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  ariaDescribedBy,
}: JalaliDatePickerProps) {
  return (
    <DatePicker
      id={id}
      calendar={persian}
      locale={persianFa}
      value={toDate(value)}
      onChange={(date: DateObject | DateObject[] | null) => {
        if (!date || Array.isArray(date)) {
          onChange('')
          return
        }
        onChange(formatGregorianDateInput(date.toDate()))
      }}
      format="YYYY/MM/DD"
      inputClass="rmdp-input"
      placeholder={placeholder}
      aria-describedby={ariaDescribedBy}
      calendarPosition="bottom-start"
    />
  )
}
