import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

const DATE_PRESETS = [
  { label: 'Hoy', preset: 'today' },
  { label: 'Ayer', preset: 'yesterday' },
  { label: 'Últimos 7 días', preset: 'last_7d' },
  { label: 'Últimos 14 días', preset: 'last_14d' },
  { label: 'Últimos 30 días', preset: 'last_30d' },
  { label: 'Este mes', preset: 'this_month' },
  { label: 'Mes pasado', preset: 'last_month' }
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'PAUSED', label: 'Pausadas' }
]

const TABS = ['Campañas', 'Conjuntos de anuncios', 'Anuncios']

const ALL_COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'status', label: 'Estado' },
  { key: 'objective', label: 'Objetivo' },
  { key: 'spend', label: 'Importe gastado' },
  { key: 'results', label: 'Resultados' },
  { key: 'messaging_conversation_started', label: 'Conversaciones con mensajes iniciadas' },
  { key: 'new_messaging_contacts', label: 'Nuevos contactos de mensajes' },
  { key: 'total_messaging_contacts', label: 'Contactos de mensajes' },
  { key: 'messaging_conversation_replied', label: 'Conversaciones con mensajes respondidas' },
  { key: 'recurring_messaging_contacts', label: 'Contactos de mensajes recurrentes' },
  { key: 'cost_per_result', label: 'Costo por resultado' },
  { key: 'daily_budget', label: 'Presupuesto' },
  { key: 'impressions', label: 'Impresiones' },
  { key: 'reach', label: 'Alcance' },
  { key: 'clicks', label: 'Clics' },
  { key: 'ctr', label: 'CTR' },
  { key: 'cpc', label: 'CPC' },
  { key: 'cpm', label: 'CPM' },
  { key: 'frequency', label: 'Frecuencia' },
  { key: 'video_plays', label: 'Reproducciones de video' },
  { key: 'video_2sec', label: 'Video continuo 2s' },
  { key: 'video_3sec', label: 'Video 3s (ThruPlay)' },
  { key: 'video_2sec_unique', label: 'Video 2s únicos' },
  { key: 'video_p25', label: 'Video 25%' },
  { key: 'video_p50', label: 'Video 50%' },
  { key: 'video_p75', label: 'Video 75%' },
  { key: 'video_p95', label: 'Video 95%' },
  { key: 'video_p100', label: 'Video 100%' },
  { key: 'video_avg_watch', label: 'Tiempo promedio video' },
  { key: 'cost_per_3sec', label: 'Costo por video 3s' },
  { key: 'cost_per_2sec', label: 'Costo por video 2s' },
  { key: 'ig_follows', label: 'Seguimientos Instagram' },
  { key: 'budget_client', label: 'Presupuesto cliente' },
  { key: 'available', label: 'Disponible' },
]
const OBJECTIVE_LABELS = {
  OUTCOME_LEADS: 'Clientes potenciales',
  OUTCOME_SALES: 'Ventas',
  OUTCOME_ENGAGEMENT: 'Interacción',
  OUTCOME_TRAFFIC: 'Tráfico',
  OUTCOME_AWARENESS: 'Reconocimiento',
  OUTCOME_APP_PROMOTION: 'Promoción de app',
  MESSAGES: 'Mensajes',
  LINK_CLICKS: 'Clics en enlace',
  PAGE_LIKES: 'Me gusta',
  VIDEO_VIEWS: 'Reproducciones de video',
  REACH: 'Alcance',
  CONVERSIONS: 'Conversiones',
  LEAD_GENERATION: 'Generación de leads'
}

function getDisplayStatus(item) {
  return item.effective_status || item.status || 'UNKNOWN'
}

export default function Campaigns() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [datePreset, setDatePreset] = useState(0)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visibleCols, setVisibleCols] = useState(['name', 'status', 'spend', 'results', 'cost_per_result', 'daily_budget', 'impressions', 'reach', 'ctr', 'cpc', 'budget_client', 'available'])
  const [colOrder, setColOrder] = useState([])
  const [colWidths, setColWidths] = useState({})
  const [showColPicker, setShowColPicker] = useState(false)
  const [clientBudgets, setClientBudgets] = useState({})
  const [editingBudget, setEditingBudget] = useState(null)
  const [editingStatus, setEditingStatus] = useState(null)
  const [newBudgetVal, setNewBudgetVal] = useState('')
  const [dragCol, setDragCol] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('clientBudgets') || '{}')
    setClientBudgets(saved)
    const savedWidths = JSON.parse(localStorage.getItem('colWidths') || '{}')
    setColWidths(savedWidths)
    fetchAccounts()
  }, [])

  useEffect(() => {
    setColOrder(visibleCols)
  }, [visibleCols])

  useEffect(() => {
    if (selectedAccount) fetchData()
  }, [selectedAccount, activeTab, statusFilter, datePreset])

  async function fetchAccounts() {
    const res = await fetch('/api/meta/accounts')
    const d = await res.json()
    setAccounts(d.accounts || [])
    if (d.accounts?.length) setSelectedAccount(d.accounts[0].id)
  }

  async function fetchData() {
    setLoading(true)
    setError('')

    try {
      const preset = DATE_PRESETS[datePreset]
      const endpoint = activeTab === 0 ? 'campaigns' : activeTab === 1 ? 'adsets' : 'ads'
      let url = `/api/meta/${endpoint}?accountId=${encodeURIComponent(selectedAccount)}&preset=${encodeURIComponent(preset.preset)}`

      if (statusFilter !== 'ALL' && activeTab === 0) {
        url += `&status=${encodeURIComponent(statusFilter)}`
      }

      const res = await fetch(url)
      const d = await res.json()

      if (d.error) {
        setError(d.error)
        setData([])
        return
      }

      const raw = d.campaigns || d.adsets || d.ads || []
      const normalized = raw.map((item) => ({
        ...item,
        display_status: getDisplayStatus(item)
      }))

      const filtered = normalized.filter((item) => {
        if (statusFilter === 'ALL') return true
        return item.display_status === statusFilter
      })

      setData(filtered)
    } catch {
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  async function toggleStatus(item) {
    const currentStatus = item.display_status || item.status
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setEditingStatus(item.id)

    await fetch('/api/meta/update-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: item.id, action: newStatus })
    })

    setData((prev) => prev.map((row) => (
      row.id === item.id
        ? { ...row, status: newStatus, effective_status: newStatus, display_status: newStatus }
        : row
    )))

    setEditingStatus(null)
  }

  function saveClientBudget(itemId) {
    const updated = { ...clientBudgets, [itemId]: newBudgetVal }
    setClientBudgets(updated)
    localStorage.setItem('clientBudgets', JSON.stringify(updated))
    setEditingBudget(null)
    setNewBudgetVal('')
  }

  function fmt(val, type = 'number') {
    const n = parseFloat(val || 0)
    if (type === 'currency') return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
    if (type === 'percent') return `${n.toFixed(2)}%`
    if (type === 'decimal') return n.toFixed(2)
    return n.toLocaleString('es-AR')
  }

  function onDragStart(key) {
    setDragCol(key)
  }

  function onDragOver(e, key) {
    e.preventDefault()
    setDragOverCol(key)
  }

  function onDrop(key) {
    if (!dragCol || dragCol === key) return
    const newOrder = [...colOrder]
    const fromIdx = newOrder.indexOf(dragCol)
    const toIdx = newOrder.indexOf(key)
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, dragCol)
    setColOrder(newOrder)
    setDragCol(null)
    setDragOverCol(null)
  }

  function startResize(e, key) {
    e.preventDefault()
    const startX = e.clientX
    const startW = colWidths[key] || 150

    function onMove(ev) {
      const newW = Math.max(80, startW + ev.clientX - startX)
      setColWidths((prev) => {
        const updated = { ...prev, [key]: newW }
        localStorage.setItem('colWidths', JSON.stringify(updated))
        return updated
      })
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function renderCell(item, col) {
    const currentStatus = item.display_status || item.status

    if (col === 'name') {
      return (
        <div>
          <div style={{ fontWeight: 500 }}>{item.name || '—'}</div>
          {item.campaign_name && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>↳ {item.campaign_name}</div>}
          {item.adset_name && <div style={{ fontSize: '11px', color: 'var(--text2)' }}>↳ {item.adset_name}</div>}
        </div>
      )
    }

    if (col === 'status') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: currentStatus === 'ACTIVE' ? 'var(--green)' : 'var(--yellow)', fontSize: '12px', fontWeight: '500' }}>
            ● {currentStatus === 'ACTIVE' ? 'Activa' : 'Pausada'}
          </span>
          {activeTab === 0 && (
            <button
              onClick={() => toggleStatus(item)}
              disabled={editingStatus === item.id}
              style={{
                border: 'none',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: '500',
                background: currentStatus === 'ACTIVE' ? '#ef444420' : '#22c55e20',
                color: currentStatus === 'ACTIVE' ? 'var(--red)' : 'var(--green)'
              }}
            >
              {editingStatus === item.id ? '...' : currentStatus === 'ACTIVE' ? 'Pausar' : 'Activar'}
            </button>
          )}
        </div>
      )
    }

    if (col === 'objective') return OBJECTIVE_LABELS[item.objective] || item.objective || '—'
    if (col === 'spend') return fmt(item.spend, 'currency')
    if (col === 'cost_per_result') return item.cost_per_result && parseFloat(item.cost_per_result) > 0 ? fmt(item.cost_per_result, 'currency') : '—'
    if (col === 'cost_per_3sec' || col === 'cost_per_2sec') return item[col] && parseFloat(item[col]) > 0 ? fmt(item[col], 'currency') : '—'
    if (col === 'ctr') return fmt(item.ctr, 'percent')
    if (col === 'cpc' || col === 'cpm') return fmt(item[col], 'currency')
    if (col === 'frequency' || col === 'video_avg_watch') return fmt(item[col], 'decimal')
    if (col === 'daily_budget') return item.daily_budget ? fmt(item.daily_budget, 'currency') : item.lifetime_budget ? `${fmt(item.lifetime_budget, 'currency')} (total)` : '—'
    if (col === 'results') return item.results && parseFloat(item.results) > 0 ? fmt(item.results) : '—'

    if ([
  'messaging_conversation_started',
  'new_messaging_contacts',
  'total_messaging_contacts',
  'messaging_conversation_replied',
  'recurring_messaging_contacts',
  'video_plays',
  'video_2sec',
  'video_3sec',
  'video_2sec_unique',
  'video_p25',
  'video_p50',
  'video_p75',
  'video_p95',
  'video_p100',
  'ig_follows'
].includes(col)) {
  return item[col] && parseFloat(item[col]) > 0 ? fmt(item[col]) : '—'
}

    if (col === 'budget_client') {
      const val = clientBudgets[item.id]
      return editingBudget === item.id ? (
        <div style={{ display: 'flex', gap: '4px' }}>
          <input value={newBudgetVal} onChange={(e) => setNewBudgetVal(e.target.value)} style={{ width: '90px', background: 'var(--bg3)', border: '1px solid var(--accent)', borderRadius: '5px', padding: '3px 6px', color: 'var(--text)', fontSize: '12px' }} autoFocus />
          <button onClick={() => saveClientBudget(item.id)} style={{ background: '#22c55e20', border: 'none', borderRadius: '5px', padding: '3px 6px', color: 'var(--green)', fontSize: '12px' }}>✓</button>
          <button onClick={() => setEditingBudget(null)} style={{ background: '#ef444420', border: 'none', borderRadius: '5px', padding: '3px 6px', color: 'var(--red)', fontSize: '12px' }}>✕</button>
        </div>
      ) : (
        <span onClick={() => { setEditingBudget(item.id); setNewBudgetVal(val || '') }} style={{ cursor: 'pointer', borderBottom: '1px dashed var(--border)', paddingBottom: '1px' }}>
          {val ? fmt(val, 'currency') : <span style={{ color: 'var(--text2)', fontSize: '12px' }}>+ agregar</span>}
        </span>
      )
    }

    if (col === 'available') {
      const budget = parseFloat(clientBudgets[item.id] || 0)
      const spend = parseFloat(item.spend || 0)
      if (!budget) return <span style={{ color: 'var(--text2)', fontSize: '12px' }}>—</span>
      const avail = budget - spend
      return <span style={{ color: avail < 0 ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>{fmt(avail, 'currency')}</span>
    }

    return item[col] || '—'
  }

  const orderedCols = colOrder.length > 0
    ? colOrder.map((k) => ALL_COLUMNS.find((c) => c.key === k)).filter(Boolean)
    : ALL_COLUMNS.filter((c) => visibleCols.includes(c.key))

  return (
    <Layout title="Campañas">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '13px' }}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name || a.account_id}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '13px' }}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select value={datePreset} onChange={(e) => setDatePreset(parseInt(e.target.value, 10))} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '13px' }}>
          {DATE_PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
        </select>

        <button onClick={() => setShowColPicker(!showColPicker)} style={{ background: showColPicker ? 'var(--accent)' : 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', color: showColPicker ? 'white' : 'var(--text)', fontSize: '13px' }}>
          ⊞ Columnas
        </button>

        <button onClick={fetchData} style={{ background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '8px 14px', color: 'white', fontSize: '13px', fontWeight: '500' }}>
          ↻ Actualizar
        </button>
      </div>

      {showColPicker && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '12px', color: 'var(--text2)' }}>Seleccioná las columnas a mostrar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ALL_COLUMNS.map((c) => (
              <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', background: visibleCols.includes(c.key) ? 'var(--bg3)' : 'transparent' }}>
                <input
                  type="checkbox"
                  checked={visibleCols.includes(c.key)}
                  onChange={(e) => {
                    const updated = e.target.checked ? [...visibleCols, c.key] : visibleCols.filter((k) => k !== c.key)
                    setVisibleCols(updated)
                    setColOrder(updated)
                  }}
                />
                <span style={{ color: visibleCols.includes(c.key) ? 'var(--text)' : 'var(--text2)' }}>{c.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{ background: 'none', border: 'none', borderBottom: activeTab === i ? '2px solid var(--accent)' : '2px solid transparent', padding: '8px 16px', color: activeTab === i ? 'var(--accent)' : 'var(--text2)', fontSize: '13px', fontWeight: '500', marginBottom: '-1px' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'auto' }}>
        {error && <div style={{ padding: '14px 16px', background: '#ef444420', color: 'var(--red)', fontSize: '13px', borderBottom: '1px solid var(--border)' }}>{error}</div>}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)', fontSize: '13px' }}>Cargando datos desde Meta...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {orderedCols.map((c) => (
                  <th
                    key={c.key}
                    draggable
                    onDragStart={() => onDragStart(c.key)}
                    onDragOver={(e) => onDragOver(e, c.key)}
                    onDrop={() => onDrop(c.key)}
                    style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: '500', fontSize: '12px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', background: dragOverCol === c.key ? 'var(--bg2)' : 'var(--bg3)', cursor: 'grab', position: 'relative', width: colWidths[c.key] ? `${colWidths[c.key]}px` : 'auto', userSelect: 'none' }}
                  >
                    {c.label}
                    <div onMouseDown={(e) => startResize(e, c.key)} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px', cursor: 'col-resize' }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={orderedCols.length} style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>No hay datos para mostrar</td>
                </tr>
              ) : data.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {orderedCols.map((c) => (
                    <td key={c.key} style={{ padding: '10px 16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {renderCell(item, c.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
