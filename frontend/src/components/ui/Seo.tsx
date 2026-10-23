import { useEffect } from 'react'

const SITE_SUFFIX = 'کلینیک زیبایی'

function setMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setProperty(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export function Seo({ title, description }: { title?: string; description?: string }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_SUFFIX}` : SITE_SUFFIX
    document.title = fullTitle
    const desc = description?.trim() || 'خدمات کلینیک زیبایی، نمونه‌کارها و درخواست مشاوره'
    setMeta('description', desc)
    setProperty('og:title', fullTitle)
    setProperty('og:description', desc)
  }, [title, description])

  return null
}
