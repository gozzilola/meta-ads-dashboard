import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabs, setTabs] = useState([])
  const [activeTab, setActiveTab] = useState(0)
  const [showNewTab, setShowNewTab] = useState(false)
  const [newTabName, setNewTabName] = useState('')

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('dashTabs') || '[]')
    setTabs(saved)
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    setLoading(true)
    try {
      const res = await fetch('/api/meta/accounts')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch {}
    setLoading(false)
  }

  function saveTab() {
    if (!newTabName.trim()) return
    const updated = [...tabs, { name: newTabName, campaigns: [] }]
    setTabs(updated)
    localStorage.setItem('dashTabs', JSON.stringify(updated))
    setNewTabName('')
    setShowNewTab(false)
    setActiveTab(updated.length - 1)
  }

  function deleteTab(i) {
    const updated = tabs.filter((_, idx) => idx !== i)
    setTabs(updated)
    localStorage.setItem('dashTabs', JSON.stringify(updated))
    setActiveTab(0)
  }

  const totalSpend = accounts.reduce((sum, a) => sum + parseFloat(a.amount_spent || 0) / 100, 0)

  return (
    <Layout title="Dashboard">
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'28px'}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px 24px'}}>
          <div style={{fontSize:'12px',color:'var(--text2)',fontWeight:'500',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px'}}>Cuentas conectadas</div>
          <div style={{fontSize:'28px',fontWeight:'600'}}>{loading ? '...' : accounts.length}</div>
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px 24px'}}>
          <div style={{fontSize:'12px',color:'var(--text2)',fontWeight:'500',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px'}}>Gasto total (últimos 30d)</div>
          <div style={{fontSize:'28px',fontWeight:'600'}}>${loading ? '...' : totalSpend.toLocaleString('es-AR',{minimumFractionDigits:2})}</div>
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px 24px'}}>
          <div style={{fontSize:'12px',color:'var(--text2)',fontWeight:'500',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px'}}>Cuentas activas</div>
          <div style={{fontSize:'28px',fontWeight:'600'}}>{loading ? '...' : accounts.filter(a=>a.status===1).length}</div>
        </div>
      </div>

      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px',marginBottom:'20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600'}}>Vistas personalizadas</h2>
          <button onClick={()=>setShowNewTab(true)} style={{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'13px',fontWeight:'500'}}>+ Nueva pestaña</button>
        </div>
        {showNewTab && (
          <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
            <input value={newTabName} onChange={e=>setNewTabName(e.target.value)} placeholder="Nombre de la pestaña" style={{flex:1,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 14px',color:'var(--text)',fontSize:'14px'}} onKeyDown={e=>e.key==='Enter'&&saveTab()} />
            <button onClick={saveTab} style={{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'9px 20px',fontSize:'13px',fontWeight:'500'}}>Crear</button>
            <button onClick={()=>setShowNewTab(false)} style={{background:'none',color:'var(--text2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 16px',fontSize:'13px'}}>Cancelar</button>
          </div>
        )}
        {tabs.length===0 ? (
          <div style={{textAlign:'center',padding:'48px 20px',color:'var(--text2)'}}>
            <div style={{fontSize:'32px',marginBottom:'12px'}}>◈</div>
            <div style={{fontSize:'15px',fontWeight:'500',color:'var(--text)',marginBottom:'6px'}}>No hay pestañas creadas</div>
            <div style={{fontSize:'13px'}}>Creá una pestaña para agrupar campañas y ver sus métricas combinadas</div>
          </div>
        ) : (
          <div>
            <div style={{display:'flex',gap:'4px',marginBottom:'16px',flexWrap:'wrap'}}>
              {tabs.map((tab,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                  <button onClick={()=>setActiveTab(i)} style={{background:activeTab===i?'var(--bg3)':'none',border:'1px solid',borderColor:activeTab===i?'var(--accent)':'var(--border)',borderRadius:'8px',padding:'6px 14px',color:activeTab===i?'var(--text)':'var(--text2)',fontSize:'13px',fontWeight:'500'}}>{tab.name}</button>
                  <button onClick={()=>deleteTab(i)} style={{background:'none',border:'none',color:'var(--text2)',fontSize:'16px',padding:'2px 4px'}}>×</button>
                </div>
              ))}
            </div>
            <div style={{background:'var(--bg3)',borderRadius:'8px',padding:'20px'}}>
              <p style={{color:'var(--text2)',fontSize:'13px'}}>Seleccioná campañas para agregar a esta pestaña desde la sección Campañas.</p>
            </div>
          </div>
        )}
      </div>

      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px'}}>
        <h2 style={{fontSize:'15px',fontWeight:'600',marginBottom:'16px'}}>Cuentas publicitarias</h2>
        {loading ? (
          <div style={{color:'var(--text2)',fontSize:'13px'}}>Cargando cuentas desde Meta...</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'12px'}}>
            {accounts.map(acc=>(
              <div key={acc.id} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'16px'}}>
                <div style={{fontSize:'13px',fontWeight:'500',marginBottom:'4px'}}>{acc.name}</div>
                <div style={{fontSize:'12px',color:'var(--text2)',marginBottom:'10px'}}>ID: {acc.account_id}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'12px',background:'var(--bg2)',padding:'2px 8px',borderRadius:'4px',color:'var(--text2)'}}>{acc.currency}</span>
                  <span style={{fontSize:'12px',fontWeight:'500',color:acc.status===1?'var(--green)':'var(--yellow)'}}>{acc.status===1?'● Activa':'● Inactiva'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
