import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', accountId: '', metrics: ['spend','clicks','ctr'], emails: '', schedule: '' })

  useEffect(() => {
    setReports(JSON.parse(localStorage.getItem('reports') || '[]'))
    fetch('/api/meta/accounts').then(r=>r.json()).then(d=>setAccounts(d.accounts||[]))
  }, [])

  const ALL_METRICS = ['spend','impressions','reach','clicks','ctr','cpc','cpm','frequency','results','cost_per_result']

  function save() {
    if (!form.name) return
    const updated = [...reports, { ...form, id: Date.now(), emails: form.emails.split(',').map(e=>e.trim()).filter(Boolean) }]
    setReports(updated)
    localStorage.setItem('reports', JSON.stringify(updated))
    setForm({ name: '', accountId: '', metrics: ['spend','clicks','ctr'], emails: '', schedule: '' })
    setShowForm(false)
  }

  function duplicate(report) {
    const updated = [...reports, { ...report, id: Date.now(), name: report.name+' (copia)' }]
    setReports(updated)
    localStorage.setItem('reports', JSON.stringify(updated))
  }

  function remove(id) {
    const updated = reports.filter(r=>r.id!==id)
    setReports(updated)
    localStorage.setItem('reports', JSON.stringify(updated))
  }

  function toggleMetric(m) {
    setForm(prev=>({...prev, metrics: prev.metrics.includes(m)?prev.metrics.filter(x=>x!==m):[...prev.metrics,m]}))
  }

  return (
    <Layout title="Reportes">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px'}}>
        <div>
          <h2 style={{fontSize:'15px',fontWeight:'500',marginBottom:'4px'}}>Reportes configurables</h2>
          <p style={{fontSize:'13px',color:'var(--text2)'}}>Creá reportes personalizados, exportalos en PDF o Excel, y programá envíos automáticos.</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} style={{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'9px 18px',fontSize:'13px',fontWeight:'500'}}>+ Nuevo reporte</button>
      </div>

      {showForm && (
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px',marginBottom:'24px'}}>
          <h3 style={{fontSize:'15px',fontWeight:'600',marginBottom:'20px'}}>Nuevo reporte</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'16px',marginBottom:'12px'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Nombre del reporte</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}} placeholder="Ej: Reporte mensual cliente X" />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Cuenta publicitaria</label>
              <select value={form.accountId} onChange={e=>setForm({...form,accountId:e.target.value})} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}}>
                <option value="">Todas las cuentas</option>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.name||a.account_id}</option>)}
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Emails (separados por coma)</label>
              <input value={form.emails} onChange={e=>setForm({...form,emails:e.target.value})} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}} placeholder="email@dominio.com" />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Envío automático</label>
              <select value={form.schedule} onChange={e=>setForm({...form,schedule:e.target.value})} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}}>
                <option value="">Sin automatización</option>
                <option value="weekly">Todos los lunes</option>
                <option value="monthly">Día 1 de cada mes</option>
                <option value="friday">Cada viernes</option>
              </select>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Métricas a incluir</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:'10px',background:'var(--bg3)',padding:'12px',borderRadius:'8px'}}>
              {ALL_METRICS.map(m=>(
                <label key={m} style={{display:'flex',alignItems:'center',fontSize:'13px',cursor:'pointer'}}>
                  <input type="checkbox" checked={form.metrics.includes(m)} onChange={()=>toggleMetric(m)} />
                  <span style={{marginLeft:'6px',textTransform:'capitalize'}}>{m.replace(/_/g,' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={save} style={{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'9px 20px',fontSize:'13px',fontWeight:'500'}}>Guardar reporte</button>
            <button onClick={()=>setShowForm(false)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 16px',color:'var(--text2)',fontSize:'13px'}}>Cancelar</button>
          </div>
        </div>
      )}

      {reports.length===0 ? (
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'60px 20px',textAlign:'center'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>◧</div>
          <div style={{fontSize:'15px',fontWeight:'500',color:'var(--text)',marginBottom:'6px'}}>No hay reportes creados</div>
          <div style={{fontSize:'13px',color:'var(--text2)',maxWidth:'400px',margin:'0 auto'}}>Creá un reporte para exportar métricas en PDF o Excel y programar envíos automáticos.</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {reports.map(report=>(
            <div key={report.id} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'16px'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px',fontWeight:'600',marginBottom:'4px'}}>{report.name}</div>
                <div style={{fontSize:'13px',color:'var(--text2)',marginBottom:'4px',display:'flex',alignItems:'center',gap:'8px'}}>
                  {report.accountId ? accounts.find(a=>a.id===report.accountId)?.name||report.accountId : 'Todas las cuentas'}
                  {report.schedule && <span style={{fontSize:'11px',background:'var(--bg3)',padding:'2px 8px',borderRadius:'20px'}}>⏰ {report.schedule==='weekly'?'Lunes':report.schedule==='monthly'?'Mensual':'Viernes'}</span>}
                </div>
                <div style={{fontSize:'12px',color:'var(--text2)'}}>{report.metrics?.join(', ')}</div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button style={{background:'#4f7cff20',border:'1px solid #4f7cff40',borderRadius:'7px',padding:'5px 12px',color:'var(--accent)',fontSize:'12px',fontWeight:'500'}}>PDF</button>
                <button style={{background:'#22c55e20',border:'1px solid #22c55e40',borderRadius:'7px',padding:'5px 12px',color:'var(--green)',fontSize:'12px',fontWeight:'500'}}>Excel</button>
                <button onClick={()=>duplicate(report)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'7px',padding:'5px 12px',color:'var(--text2)',fontSize:'12px'}}>Duplicar</button>
                <button onClick={()=>remove(report.id)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'7px',padding:'5px 12px',color:'var(--red)',fontSize:'12px'}}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
