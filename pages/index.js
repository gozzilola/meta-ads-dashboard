import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f1117',padding:'20px'}}>
      <div style={{background:'#161b27',border:'1px solid #2a3245',borderRadius:'16px',padding:'40px',width:'100%',maxWidth:'400px'}}>
        <h1 style={{fontSize:'24px',fontWeight:'600',marginBottom:'6px',color:'#e8eaf0'}}>Bienvenido</h1>
        <p style={{color:'#8b92a8',marginBottom:'28px'}}>Ingresá tus datos para continuar</p>
        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            <label style={{fontSize:'13px',color:'#8b92a8'}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{background:'#1e2535',border:'1px solid #2a3245',borderRadius:'8px',padding:'10px 14px',color:'#e8eaf0',fontSize:'14px'}} />
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            <label style={{fontSize:'13px',color:'#8b92a8'}}>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{background:'#1e2535',border:'1px solid #2a3245',borderRadius:'8px',padding:'10px 14px',color:'#e8eaf0',fontSize:'14px'}} />
          </div>
          {error && <div style={{background:'#ef444420',border:'1px solid #ef444440',borderRadius:'8px',padding:'10px',color:'#ef4444',fontSize:'13px'}}>{error}</div>}
          <button type="submit" disabled={loading} style={{background:'#4f7cff',color:'white',border:'none',borderRadius:'8px',padding:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
