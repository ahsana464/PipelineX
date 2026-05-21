import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard',    icon: '⊞',  label: 'Dashboard' },
  { path: '/new-pipeline', icon: '+',  label: 'New Pipeline' },
  { path: '/monitor',      icon: '◈',  label: 'Monitor' },
  { path: '/ai-chat',      icon: '◎',  label: 'AI Assistant' },
  { path: '/settings',     icon: '⚙',  label: 'Settings' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside style={s.sidebar}>
      <Link to="/dashboard" style={s.logo}>
        Pipeline<span style={{ color: 'var(--accent)' }}>X</span>
      </Link>

      <nav style={s.nav}>
        {navItems.map(item => {
          const active = pathname === item.path
          return (
            <Link key={item.path} to={item.path} style={{ ...s.navItem, ...(active ? s.navActive : {}) }}>
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {active && <span style={s.activeDot} />}
            </Link>
          )
        })}
      </nav>

      <div style={s.bottom}>
        <div style={s.userCard}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || 'A'}</div>
          <div>
            <div style={s.userName}>{user?.name || 'Ahsan'}</div>
            <div style={s.userEmail}>{user?.email || 'user@pipelinex.app'}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={s.logoutBtn}>
          ⇥ Logout
        </button>
      </div>
    </aside>
  )
}

const s = {
  sidebar: {
    width: 220,
    minHeight: '100vh',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1rem',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: '1.3rem',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: 'var(--text)',
    marginBottom: '2rem',
    paddingLeft: '0.5rem',
    display: 'block',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    padding: '0.6rem 0.75rem',
    borderRadius: 'var(--radius)',
    color: 'var(--muted)',
    fontSize: '0.88rem',
    fontWeight: 500,
    transition: 'all 0.15s',
    position: 'relative',
    textDecoration: 'none',
  },
  navActive: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid var(--accent-border)',
  },
  navIcon: {
    fontSize: '1rem',
    width: 20,
    textAlign: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent)',
    marginLeft: 'auto',
  },
  bottom: {
    borderTop: '1px solid var(--border)',
    paddingTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.5rem',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.8rem',
    flexShrink: 0,
  },
  userName: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  userEmail: {
    fontSize: '0.72rem',
    color: 'var(--muted)',
    fontFamily: 'var(--mono)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 130,
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--muted)',
    borderRadius: 'var(--radius)',
    padding: '0.4rem 0.75rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s',
    fontFamily: 'var(--font)',
  },
}
