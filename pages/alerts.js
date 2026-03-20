import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', metric: 'spend', condition: 'greater', value: '', emails: '', active: true })

  useEffect(() => {
    setAlerts(JSON.parse(localStorage.getItem('alerts') || '[]'))
  }, [])

  function save() {
    if (!form.name || !form.value) return
    const updated = [...alerts, { ...form, id: Date.now(), emails: form.emails.split(',').map(e=>e.trim()).filter(Boolean) }]
    setAlerts(updated)
    localStorage.setItem('alerts', JSON.stringify(updated))
    setForm({ name: '', metric: 'spend', condition: 'greater', value: '', emails: '', active: true })
    setShowForm(false)
  }

  function remove(id) {
    const updated = alerts.filter(a=>a.id!==id)
    setAlerts(updated)
    localStorage.setItem('alerts', JSON.stringify(updated))
  }

  function toggle(id) {
    const updated = alerts.map(a=>a.id===id?{...a,active:!a.active}:a)
    setAlerts(updated)
    localStorage.setItem('alerts', JSON.stringify(updated))
  }

  const METRICS = [
    { value: 'spend', label: 'Gasto' },
    { value: 'cpc', label: 'CPC' },
    { value: 'ctr', label: 'CTR' },
    { value: 'results', label: 'Resultados' },
    { value: 'budget_remaining', label: 'Presupuesto restante' },
  ]

  return (
    <Layout title="Alertas">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px'}}>
        <div>
          <h2 style={{fontSize:'15px',fontWeight:'500',marginBottom:'4px'}}>Alertas automáticas</h2>
          <p style={{fontSize:'13px',color:'var(--text2)'}}>Recibí notificaciones por email cuando una métrica supere o baje del valor configurado.</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} style={{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'9px 18px',fontSize:'13px',fontWeight:'500',flexShrink:0}}>+ Nueva alerta</button>
      </div>

      {showForm && (
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px',marginBottom:'24px'}}>
          <h3 style={{fontSize:'15px',fontWeight:'600',marginBottom:'20px'}}>Nueva alerta</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'16px',marginBottom:'16px'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Nombre</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}} placeholder="Ej: Gasto superado" />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Métrica</label>
              <select value={form.metric} onChange={e=>setForm({...form,metric:e.target.value})} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}}>
                {METRICS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Condición</label>
              <select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}}>
                <option value="greater">Mayor que</option>
                <option value="less">Menor que</option>
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Valor</label>
              <input type="number" value={form.value} onChange={e=>setForm({...form,value:e.target.value})} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}} placeholder="Ej: 1000" />
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Emails destinatarios (separados por coma)</label>
            <input value={form.emails} onChange={e=>setForm({...form,emails:e.target.value})} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}} placeholder="email1@dominio.com, email2@dominio.com" />
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={save} style={{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'9px 20px',fontSize:'13px',fontWeight:'500'}}>Guardar alerta</button>
            <button onClick={()=>setShowForm(false)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 16px',color:'var(--text2)',fontSize:'13px'}}>Cancelar</button>
          </div>
        </div>
      )}

      {alerts.length===0 ? (
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'60px 20px',textAlign:'center',color:'var(--text2)'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>◉</div>
          <div style={{fontSize:'15px',fontWeight:'500',color:'var(--text)',marginBottom:'6px'}}>No hay alertas configuradas</div>
          <div style={{fontSize:'13px',maxWidth:'400px',margin:'0 auto'}}>Creá una alerta para recibir notificaciones cuando una métrica supere o baje del valor que definas.</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {alerts.map(alert=>(
            <div key={alert.id} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'16px',opacity:alert.active?1:0.6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px',fontWeight:'600',marginBottom:'4px'}}>{alert.name}</div>
                <div style={{fontSize:'13px',color:'var(--text2)',marginBottom:'4px'}}>
                  {METRICS.find(m=>m.value===alert.metric)?.label} {alert.condition==='greater'?'mayor a':'menor a'} {alert.value}
                </div>
                <div style={{fontSize:'12px',color:'var(--text2)'}}>✉ {alert.emails?.join(', ') || 'Sin destinatarios'}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{fontSize:'12px',padding:'3px 10px',borderRadius:'20px',fontWeight:'500',background:alert.active?'#22c55e20':'#88888820',color:alert.active?'var(--green)':'var(--text2)'}}>{alert.active?'Activa':'Inactiva'}</span>
                <button onClick={()=>toggle(alert.id)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'7px',padding:'5px 12px',color:'var(--text2)',fontSize:'12px'}}>{alert.active?'Desactivar':'Activar'}</button>
                <button onClick={()=>remove(alert.id)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'7px',padding:'5px 12px',color:'var(--red)',fontSize:'12px'}}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
