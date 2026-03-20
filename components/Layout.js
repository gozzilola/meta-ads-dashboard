import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/campaigns', label: 'Campañas', icon: '◈' },
  { href: '/alerts', label: 'Alertas', icon: '◉' },
  { href: '/reports', label: 'Reportes', icon: '◧' },
  { href: '/admin', label: 'Administración', icon: '◎', adminOnly: true },
]

export default function Layout({ children, title }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u))
    const stored = JSON.parse(localStorage.getItem('notifications') || '[]')
    setNotifications(stored)
  }, [])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const unread = notifications.filter(n => !n.read).length
  const visibleNav = NAV.filter(n => !n.adminOnly || user?.role === 'admin')

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'var(--bg)'}}>
      <aside style={{width:'220px',background:'var(--bg2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'20px 12px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'0 8px',marginBottom:'28px'}}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#4f7cff"/>
            <path d="M8 22L14 10L20 18L24 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{fontSize:'16px',fontWeight:'600'}}>Meta Ads</span>
        </div>
        <nav style={{display:'flex',flexDirection:'column',gap:'2px',flex:1}}>
          {visibleNav.map(item => (
            <Link key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',borderRadius:'8px',color:router.pathname===item.href?'var(--text)':'var(--text2)',fontSize:'14px',fontWeight:'500',background:router.pathname===item.href?'var(--bg3)':'none',borderLeft:router.pathname===item.href?'3px solid var(--accent)':'3px solid transparent'}}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div style={{borderTop:'1px solid var(--border)',paddingTop:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>
          {user && (
            <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'0 4px'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'600',fontSize:'14px',color:'white',flexShrink:0}}>{user.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{fontSize:'13px',fontWeight:'500'}}>{user.name}</div>
                <div style={{fontSize:'12px',color:'var(--text2)'}}>{user.role==='admin'?'Administrador':'Operador'}</div>
              </div>
            </div>
          )}
          <button onClick={logout} style={{background:'none',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px',color:'var(--text2)',fontSize:'13px',width:'100%'}}>Cerrar sesión</button>
        </div>
      </aside>
      <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'auto'}}>
        <header style={{padding:'20px 28px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--bg2)'}}>
          <h1 style={{fontSize:'18px',fontWeight:'600'}}>{title}</h1>
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowNotif(!showNotif)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'8px',padding:'7px 12px',fontSize:'16px',position:'relative',color:'var(--text)'}}>
              🔔
              {unread>0 && <span style={{position:'absolute',top:'-6px',right:'-6px',background:'var(--red)',color:'white',borderRadius:'50%',width:'18px',height:'18px',fontSize:'11px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'600'}}>{unread}</span>}
            </button>
            {showNotif && (
              <div style={{position:'absolute',right:0,top:'44px',width:'320px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'12px',zIndex:100,maxHeight:'400px',overflowY:'auto'}}>
                <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:600}}>Notificaciones</span>
                  <button onClick={()=>{localStorage.setItem('notifications','[]');setNotifications([])}} style={{background:'none',border:'none',color:'var(--accent)',fontSize:'13px',cursor:'pointer'}}>Limpiar</button>
                </div>
                {notifications.length===0
                  ? <div style={{padding:'24px',textAlign:'center',color:'var(--text2)',fontSize:'13px'}}>Sin notificaciones</div>
                  : notifications.map((n,i)=>(
                    <div key={i} style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
                      <div style={{fontSize:'13px',marginBottom:'4px'}}>{n.message}</div>
                      <div style={{fontSize:'11px',color:'var(--text2)'}}>{n.time}</div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </header>
        <div style={{padding:'28px',flex:1}}>{children}</div>
      </main>
    </div>
  )
}
