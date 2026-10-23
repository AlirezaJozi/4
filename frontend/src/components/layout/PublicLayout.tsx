import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../lib/api/endpoints'
import { PUBLIC_NAV } from '../../lib/constants'
import { parseSocialLinks } from '../../lib/format'
import { SmartImage } from '../ui/SmartImage'

function Brand({ name, logo }: { name: string; logo?: string }) {
  return (
    <Link to="/" className="brand" aria-label={name}>
      <span className="brand-mark" aria-hidden="true">
        {logo ? <SmartImage src={logo} alt="" /> : '+'}
      </span>
      <span className="brand-name">{name}</span>
    </Link>
  )
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const clinicQuery = useQuery({
    queryKey: ['public', 'clinic'],
    queryFn: () => publicApi.clinic(),
  })

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.search])

  const settings = clinicQuery.data ?? {}
  const name = settings.name?.trim() || 'کلینیک'
  const socials = parseSocialLinks(settings.socials)
  const year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date())

  return (
    <>
      <a href="#main-content" className="skip-link">
        پرش به محتوای اصلی
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand name={name} logo={settings.logo} />
          <nav className="nav" aria-label="ناوبری اصلی">
            {PUBLIC_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <Link to="/consultation" className="btn btn-primary">
              درخواست مشاوره
            </Link>
            <button
              type="button"
              className="icon-button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? '×' : '☰'}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="container mobile-menu" id="mobile-menu">
            <nav className="nav" aria-label="ناوبری موبایل">
              {PUBLIC_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink to="/consultation" className="btn btn-primary btn-block">
                درخواست مشاوره
              </NavLink>
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" className="app-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Brand name={name} logo={settings.logo} />
            {settings.intro && <p className="prose mt-4">{settings.intro}</p>}
          </div>
          <div>
            <h3>دسترسی سریع</h3>
            <div className="footer-links">
              {PUBLIC_NAV.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
              <Link to="/consultation">درخواست مشاوره</Link>
            </div>
          </div>
          <div>
            <h3>اطلاعات تماس</h3>
            <div className="footer-links">
              {settings.phone && <span>تلفن: {settings.phone}</span>}
              {settings.email && <span>ایمیل: {settings.email}</span>}
              {settings.address && <span>{settings.address}</span>}
              {!settings.phone && !settings.email && !settings.address && (
                <span className="text-muted">اطلاعات تماس در تنظیمات کلینیک ثبت نشده است.</span>
              )}
              {socials.length > 0 && (
                <div className="chip-row mt-4">
                  {socials.map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      className="chip"
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
              <Link to="/admin/login" className="text-muted text-small mt-4">
                ورود مدیر
              </Link>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          {settings.footer || 'تمام حقوق محفوظ است.'}
          <span>© {year}</span>
        </div>
      </footer>
    </>
  )
}
