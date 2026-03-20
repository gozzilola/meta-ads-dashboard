import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'

const ADMIN_PIN = '1234'

export default function Admin() {
  const router = useRouter()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', plan: '', price: '', frequency: 'mensual', paid: false, payMethod: '', notes: '' })

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    if (sessionStorage.getItem('adminUnlocked')) setUnlocked(true)
    setClients(JSON.parse(localStorage.getItem('adminClients') || '[]'))
  }, [])

  function checkPin() {
    if (pin === ADMIN_PIN) {
      setUnlocked(true)
      sessionStorage.setItem('adminUnlocked', '1')
    } else {
      setPinError('PIN incorrecto')
      setPin('')
    }
  }

  function saveClient() {
    if (!form.name) return
    const updated = [...clients, { ...form, id: Date.now() }]
    setClients(updated)
    localStorage.setItem('adminClients', JSON.stringify(updated))
    setForm({ name: '', plan: '', price: '', frequency: 'mensual', paid: false, payMethod: '', notes: '' })
    setShowForm(false)
  }

  function togglePaid(id) {
    const updated = clients.map(c=>c.id===id?{...c,paid:!c.paid}:c)
    setClients(updated)
    localStorage.setItem('adminClients', JSON.stringify(updated))
  }

  function remove(id) {
    const updated = clients.filter(c=>c.id!==id)
    setClients(updated)
    localStorage.setItem('adminClients', JSON.stringify(updated))
  }

  if (!unlocked) return (
    <Layout title="Administración">
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'16px',padding:'40px',maxWidth:'360px',width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'36px',marginBottom:'16px'}}>🔒</div>
          <h2 style={{fontSize:'20px',fontWeight:'600',marginBottom:'8px'}}>Sección privada</h2>
          <p style={{fontSize:'13px',color:'var(--text2)',marginBottom:'24px',lineHeight:1.6}}>Esta sección solo es visible para el administrador. Ingresá el PIN para continuar.</p>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&checkPin()} placeholder="PIN de acceso" maxLength={8} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'8px',padding:'12px',color:'var(--text)',fontSize:'18px',letterSpacing:'8px',textAlign:'center',width:'100%',marginBottom:'8px'}} />
          {pinError && <div style={{color:'var(--red)',fontSize:'13px',marginBottom:'12px'}}>{pinError}</div>}
          <button onClick={checkPin} style={{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'11px 32px',fontSize:'14px',fontWeight:'500',width:'100%'}}>Ingresar</button>
        </div>
      </div>
    </Layout>
  )

  const totalRevenue = clients.filter(c=>c.paid).reduce((sum,c)=>sum+parseFloat(c.price||0),0)
  const pending = clients.filter(c=>!c.paid).reduce((sum,c)=>sum+parseFloat(c.price||0),0)

  return (
    <Layout title="Administración">
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'24px'}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px 24px'}}>
          <div style={{fontSize:'12px',color:'var(--text2)',fontWeight:'500',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px'}}>Clientes totales</div>
          <div style={{fontSize:'28px',fontWeight:'600'}}>{clients.length}</div>
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px 24px'}}>
          <div style={{fontSize:'12px',color:'var(--text2)',fontWeight:'500',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px'}}>Ingresos cobrados</div>
          <div style={{fontSize:'28px',fontWeight:'600',color:'var(--green)'}}>${totalRevenue.toLocaleString('es-AR',{minimumFractionDigits:2})}</div>
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px 24px'}}>
          <div style={{fontSize:'12px',color:'var(--text2)',fontWeight:'500',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px'}}>Pendiente de cobro</div>
          <div style={{fontSize:'28px',fontWeight:'600',color:'var(--yellow)'}}>${pending.toLocaleString('es-AR',{minimumFractionDigits:2})}</div>
        </div>
      </div>

      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600'}}>Clientes</h2>
          <button onClick={()=>setShowForm(!showForm)} style={{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'9px 18px',fontSize:'13px',fontWeight:'500'}}>+ Agregar cliente</button>
        </div>

        {showForm && (
          <div style={{background:'var(--bg3)',borderRadius:'10px',padding:'20px',marginBottom:'20px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'16px',marginBottom:'12px'}}>
              {[
                {label:'Nombre del cliente',key:'name',placeholder:''},
                {label:'Plan',key:'plan',placeholder:'Ej: Gestión básica'},
                {label:'Valor de cuota ($)',key:'price',placeholder:'',type:'number'},
                {label:'Medio de pago',key:'payMethod',placeholder:'Ej: Transferencia'},
              ].map(f=>(
                <div key={f.key} style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>{f.label}</label>
                  <input type={f.type||'text'} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}} placeholder={f.placeholder} />
                </div>
              ))}
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Frecuencia</label>
                <select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px'}}>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>¿Pagó?</label>
                <label style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'4px'}}>
                  <input type="checkbox" checked={form.paid} onChange={e=>setForm({...form,paid:e.target.checked})} />
                  <span style={{fontSize:'14px'}}>Sí, pagó</span>
                </label>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'16px'}}>
              <label style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)'}}>Notas</label>
              <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'var(--text)',fontSize:'14px',height:'80px',resize:'vertical'}} />
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={saveClient} style={{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'9px 20px',fontSize:'13px',fontWeight:'500'}}>Guardar</button>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 16px',color:'var(--text2)',fontSize:'13px'}}>Cancelar</button>
            </div>
          </div>
        )}

        {clients.length===0 ? (
          <div style={{textAlign:'center',padding:'48px 20px',color:'var(--text2)'}}>
            <div style={{fontSize:'32px',marginBottom:'12px'}}>◎</div>
            <div style={{fontSize:'15px',fontWeight:'500',color:'var(--text)',marginBottom:'6px'}}>Sin clientes cargados</div>
            <div style={{fontSize:'13px'}}>Agregá tus clientes para llevar el control de pagos y planes.</div>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
              <thead>
                <tr>{['Cliente','Plan','Cuota','Frecuencia','Medio de pago','Estado','Acciones'].map(h=><th key={h} style={{padding:'10px 16px',textAlign:'left',color:'var(--text2)',fontWeight:'500',fontSize:'12px',borderBottom:'1px solid var(--border)',background:'var(--bg3)',whiteSpace:'nowrap'}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {clients.map(c=>(
                  <tr key={c.id}>
                    <td style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}><div style={{fontWeight:500}}>{c.name}</div>{c.notes&&<div style={{fontSize:'11px',color:'var(--text2)',marginTop:'2px'}}>{c.notes}</div>}</td>
                    <td style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>{c.plan}</td>
                    <td style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>${parseFloat(c.price||0).toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
                    <td style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>{c.frequency}</td>
                    <td style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>{c.payMethod}</td>
                    <td style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
                      <button onClick={()=>togglePaid(c.id)} style={{border:'none',borderRadius:'6px',padding:'4px 10px',fontSize:'12px',fontWeight:'500',background:c.paid?'#22c55e20':'#f59e0b20',color:c.paid?'var(--green)':'var(--yellow)'}}>{c.paid?'✓ Pagó':'⏳ Pendiente'}</button>
                    </td>
                    <td style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
                      <button onClick={()=>remove(c.id)} style={{background:'none',border:'1px solid var(--border)',borderRadius:'7px',padding:'4px 10px',color:'var(--red)',fontSize:'12px'}}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
