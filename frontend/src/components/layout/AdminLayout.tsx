import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_NAV } from '../../lib/constants'
import { useAuth } from '../../app/AuthProvider'
import { useToast } from '../ui/Toast'
import { getApiErrorMessage } from '../../lib/validation'
import { Spinner } from '../ui/Feedback'

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { push } = useToast()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      push('از پنل خارج شدید', 'success')
      navigate('/admin/login', { replace: true })
    } catch (error) {
      push(getApiErrorMessage(error), 'error')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="admin-shell">
      <div
        className={open ? 'admin-backdrop open' : 'admin-backdrop'}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside className={open ? 'admin-sidebar open' : 'admin-sidebar'} aria-label="ناوبری پنل">
        <div className="admin-brand">
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          <div>
            <strong>پنل مدیریت</strong>
            <small>کلینیک زیبایی</small>
          </div>
        </div>
        <nav className="admin-nav">
          {ADMIN_NAV.map((group) => (
            <div key={group.title}>
              <div className="admin-nav-title">{group.title}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    isActive ? 'admin-nav-link active' : 'admin-nav-link'
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
          <Link to="/" className="admin-nav-link">
            مشاهده سایت
          </Link>
        </nav>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <button
            type="button"
            className="icon-button admin-mobile-toggle"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="منوی پنل"
          >
            ☰
          </button>
          <span className="text-muted text-small">مدیریت محتوا و درخواست‌ها</span>
          <div className="user">
            <span dir="ltr">{user?.email}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
            >
              {loggingOut && <Spinner />}
              خروج
            </button>
          </div>
        </div>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
