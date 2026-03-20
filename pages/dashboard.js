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
        </di
