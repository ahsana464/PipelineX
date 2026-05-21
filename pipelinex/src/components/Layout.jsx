import Sidebar from './Sidebar'

export default function Layout({ children, title, subtitle }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '2rem', minHeight: '100vh' }}>
        {(title || subtitle) && (
          <div style={{ marginBottom: '2rem' }}>
            {title && <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.25rem' }}>{title}</h1>}
            {subtitle && <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
