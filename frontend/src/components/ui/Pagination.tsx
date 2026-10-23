interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  disabled?: boolean
}

function pageNumbers(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b)
  const result: Array<number | 'ellipsis'> = []
  let previous = 0
  for (const item of sorted) {
    if (item - previous > 1) result.push('ellipsis')
    result.push(item)
    previous = item
  }
  return result
}

export function Pagination({ page, totalPages, onChange, disabled }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="صفحه‌بندی">
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="صفحه قبل"
      >
        قبلی
      </button>
      {pageNumbers(page, totalPages).map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="page-info" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={item === page ? 'page-btn active' : 'page-btn'}
            onClick={() => onChange(item)}
            disabled={disabled}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`صفحه ${item}`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="صفحه بعد"
      >
        بعدی
      </button>
    </nav>
  )
}
