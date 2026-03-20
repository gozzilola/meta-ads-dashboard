import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

const DATE_PRESETS = [
  { label: 'Hoy', since: 0, until: 0 },
  { label: 'Ayer', since: 1, until: 1 },
  { label: 'Últimos 7 días', since: 7, until: 0 },
  { label: 'Últimos 14 días', since: 14, until: 0 },
  { label: 'Últimos 30 días', since: 30, until: 0 },
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'PAUSED', label: 'Pausadas' },
]

const TABS = ['Campañas', 'Conjuntos de anuncios', 'Anuncios']

const ALL_COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'status', label: 'Estado' },
  { key: 'spend', label: 'Gasto' },
  { key: 'impressions', label: 'Impresiones' },
  { key: 'reach', label: 'Alcance' },
  { key: 'clicks', label: 'Clics' },
  { key: 'ctr', label: 'CTR' },
  { key: 'cpc', label: 'CPC' },
  { key: 'cpm', label: 'CPM' },
  { key: 'frequency', label: 'Frecuencia' },
  { key: 'results', label: 'Resultados' },
  { key: 'budget_client', label: 'Presupuesto cliente' },
  { key: 'available', label: 'Disponible' },
]

function getDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

export default function Campaigns() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [datePreset, setDatePreset] = useState(2)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visibleCols, setVisibleCols] = useState(['name','status','spend','clicks','ctr','cpc','results','budget_client','available'])
  const [showColPicker, setShowColPicker] = useState(false)
  const [clientBudgets, setClientBudgets] = useState({})
  const [editingBudget, setEditingBudget] = useState(null)
  const [editingStatus, setEditingStatus] = useState(null)
  const [newBudgetVal, setNewBudgetVal] = useState('')

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('clientBudgets') || '{}')
    setClientBudgets(saved)
    fetchAccounts()
  }, [])

  useEffect(() => { if (selectedAccount) fetchData() }, [selectedAccount, activeTab, statusFilter, datePreset])

  async function fetchAccounts() {
    const res = await fetch('/api/meta/accounts')
    const d = await res.json()
    setAccounts(d.accounts || [])
    if (d.accounts?.length) setSelectedAccount(d.accounts[0].id)
  }

  async function fetchData() {
    setLoading(true)
    setError('')
    const preset = DATE_PRESETS[datePreset]
    const since = getDate(preset.since)
    const until = getDate(preset.until)
    try {
      const endpoint = activeTab===0 ? 'campaigns' : activeTab===1 ? 'adsets' : 'ads'
      let url = `/api/meta/${endpoint}?accountId=${selectedAccount}&since=${since}&until=${until}`
      if (statusFilter!=='ALL' && activeTab===0) url += `&status=${statusFilter}`
      const res = await fetch(url)
      const d = await res.json()
      if (d.error) { setError(d.error); setData([]); return }
      const raw = d.campaigns || d.adsets || d.ads || []
      setData(raw.filter(item => statusFilter==='ALL' || item.status===statusFilter))
    } catch { setError('Error al cargar datos') }
    setLoading(false)
  }

  async function toggleStatus(item) {
    const newStatus = item.status==='ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setEditingStatus(item.id)
    await fetch('/api/meta/update-campaign', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ campaignId: item.id, action: newStatus })
    })
    setData(prev => prev.map(c => c.id===item.id ? {...c, status: newStatus} : c))
    setEditingStatus(null)
  }

  function saveClientBudget(itemId) {
    const updated = {...clientBudgets, [itemId]: newBudgetVal}
    setClientBudgets(updated)
    localStorage.setItem('clientBudgets', JSON.stringify(updated))
    setEditingBudget(null)
    setNewBudgetVal('')
  }

  function renderCell(item, col) {
    if (col==='name') return (
      <div>
        <div style={{fontWeight:500}}>{item.name}</div>
        {item.campaign_name && <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'2px'}}>↳ {item.campaign_name}</div>}
        {item.adset_name && <div style={{fontSize:'11px',color:'var(--text2)'}}>↳ {item.adset_name}</div>}
      </div>
    )
    if (col==='status') return (
      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
        <span style={{color:item.status==='ACTIVE'?'var(--green)':'var(--yellow)',fontSize:'12px',fontWeight:'500'}}>● {item.status==='ACTIVE'?'Activa':'Pausada'}</span>
        {activeTab===0 && <button onClick={()=>toggleStatus(item)} disabled={editingStatus===item.id} style={{border:'none',borderRadius:'5px',padding:'3px 8px',fontSize:'11px',fontWeight:'500',background:item.status==='ACTIVE'?'#ef444420':'#22c55e20',color:item.status==='ACTIVE'?'var(--red)':'var(--green)'}}>{editingStatus===item.id?'...':item.status==='ACTIVE'?'Pausar':'Activar'}</button>}
      </div>
    )
    if (col==='spend') return `$${parseFloat(item.spend||0).toLocaleString('es-AR',{minimumFractionDigits:2})}`
    if (col==='ctr') return `${parseFloat(item.ctr||0).toFixed(2)}%`
    if (col==='cpc'||col==='cpm') return `$${parseFloat(item[col]||0).toFixed(2)}`
    if (col==='frequency') return parseFloat(item.frequency||0).toFixed(2)
    if (col==='budget_client') {
      const val = clientBudgets[item.id]
      return editingBudget===item.id ? (
        <div style={{display:'flex',gap:'4px'}}>
          <input value={newBudgetVal} onChange={e=>setNewBudgetVal(e.target.value)} style={{width:'80px',background:'var(--bg3)',border:'1px solid var(--accent)',borderRadius:'5px',padding:'3px 6px',color:'var(--text)',fontSize:'12px'}} autoFocus />
          <button onClick={()=>saveClientBudget(item.id)} style={{background:'#22c55e20',border:'none',borderRadius:'5px',padding:'3px 6px',color:'var(--green)',fontSize:'12px'}}>✓</button>
          <button onClick={()=>setEditingBudget(null)} style={{background:'#ef444420',border:'none',borderRadius:'5px',padding:'3px 6px',color:'var(--red)',fontSize:'12px'}}>✕</button>
        </div>
      ) : (
        <span onClick={()=>{setEditingBudget(item.id);setNewBudgetVal(val||'')}} style={{cursor:'pointer',borderBottom:'1px dashed var(--border)',paddingBottom:'1px'}}>
          {val ? `$${parseFloat(val).toLocaleString('es-AR',{minimumFractionDigits:2})}` : <span style={{color:'var(--text2)',fontSize:'12px'}}>+ agregar</span>}
        </span>
      )
    }
    if (col==='available') {
      const budget = parseFloat(clientBudgets[item.id]||0)
      const spend = parseFloat(item.spend||0)
      if (!budget) return <span style={{color:'var(--text2)',fontSize:'12px'}}>—</span>
      const avail = budget - spend
      return <span style={{color:avail<0?'var(--red)':'var(--green)',fontWeight:500}}>${avail.toLocaleString('es-AR',{minimumFractionDigits:2})}</span>
    }
    return item[col] || '—'
  }

  const cols = ALL_COLUMNS.filter(c => visibleCols.includes(c.key))

  return (
    <Layout title="Campañas">
      <div style={{display:'flex',gap:'10px',marginBottom:'16px',flexWrap:'wrap',alignItems:'center'}}>
        <select value={selectedAccount} onChange={e=>setSelectedAccount(e.target.value)} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 12px',color:'var(--text)',fontSize:'13px'}}>
          {accounts.map(a=><option key={a.id} value={a.id}>{a.name||a.account_id}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 12px',color:'var(--text)',fontSize:'13px'}}>
          {STATUS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={datePreset} onChange={e=>setDatePreset(parseInt(e.target.value))} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 12px',color:'var(--text)',fontSize:'13px'}}>
          {DATE_PRESETS.map((p,i)=><option key={i} value={i}>{p.label}</option>)}
        </select>
        <button onClick={()=>setShowColPicker(!showColPicker)} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 14px',color:'var(--text)',fontSize:'13px'}}>⊞ Columnas</button>
        <button onClick={fetchData} style={{background:'var(--accent)',border:'none',borderRadius:'8px',padding:'8px 14px',color:'white',fontSize:'13px',fontWeight:'500'}}>↻ Actualizar</button>
      </div>

      {showColPicker && (
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'10px',padding:'16px',marginBottom:'16px'}}>
          <div style={{fontSize:'13px',fontWeight:'500',marginBottom:'12px'}}>Columnas visibles</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'10px'}}>
            {ALL_COLUMNS.map(c=>(
              <label key={c.key} style={{display:'flex',alignItems:'center',fontSize:'13px',cursor:'pointer'}}>
                <input type="checkbox" checked={visibleCols.includes(c.key)} onChange={e=>setVisibleCols(prev=>e.target.checked?[...prev,c.key]:prev.filter(k=>k!==c.key))} />
                <span style={{marginLeft:'6px'}}>{c.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:'4px',marginBottom:'16px',borderBottom:'1px solid var(--border)'}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setActiveTab(i)} style={{background:'none',border:'none',borderBottom:activeTab===i?'2px solid var(--accent)':'2px solid transparent',padding:'8px 16px',color:activeTab===i?'var(--accent)':'var(--text2)',fontSize:'13px',fontWeight:'500',marginBottom:'-1px'}}>
            {t}
          </button>
        ))}
      </div>

      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'auto'}}>
        {error && <div style={{padding:'14px 16px',background:'#ef444420',color:'var(--red)',fontSize:'13px',borderBottom:'1px solid var(--border)'}}>{error}</div>}
        {loading ? (
          <div style={{padding:'40px',textAlign:'center',color:'var(--text2)',fontSize:'13px'}}>Cargando datos desde Meta...</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
            <thead>
              <tr>{cols.map(c=><th key={c.key} style={{padding:'10px 16px',textAlign:'left',color:'var(--text2)',fontWeight:'500',fontSize:'12px',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap',background:'var(--bg3)'}}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {data.length===0
                ? <tr><td colSpan={cols.length} style={{padding:'40px',textAlign:'center',color:'var(--text2)'}}>No hay datos para mostrar</td></tr>
                : data.map(item=>(
                  <tr key={item.id}>
                    {cols.map(c=><td key={c.key} style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap'}}>{renderCell(item,c.key)}</td>)}
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
