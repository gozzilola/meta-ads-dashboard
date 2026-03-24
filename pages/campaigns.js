import { useEffect, useMemo, useState } from 'react'
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

const DEFAULT_VISIBLE_COLS = [
  'name',
  'status',
  'spend',
  'results',
  'cost_per_result',
  'daily_budget',
  'impressions',
  'reach',
  'ctr',
  'cpc',
  'budget_client',
  'available'
]

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
  { key: 'available', label: 'Disponible' }
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

function getAuthToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function getDisplayStatus(item) {
  return item.effective_status || item.status || 'UNKNOWN'
}

function sanitizeVisibleCols(cols) {
  if (!Array.isArray(cols) || cols.length === 0) return DEFAULT_VISIBLE_COLS
  const validKeys = new Set(ALL_COLUMNS.map((c) => c.key))
  const cleaned = cols.filter((key) => validKeys.has(key))
  return cleaned.length ? cleaned : DEFAULT_VISIBLE_COLS
}

function sanitizeColOrder(order, visibleCols) {
  const validKeys = new Set(ALL_COLUMNS.map((c) => c.key))
  const visibleSet = new Set(visibleCols)

  const cleaned = Array.isArray(order)
    ? order.filter((key) => validKeys.has(key) && visibleSet.has(key))
    : []

  const missing = visibleCols.filter((key) => !cleaned.includes(key))
  return [...cleaned, ...missing]
}

function formatCurrency(value) {
  const n = parseFloat(value || 0)
  return `$${n.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function formatNumber(value) {
  const n = parseFloat(value || 0)
  return n.toLocaleString('es-AR')
}

function getBudgetKey(tabIndex, itemId) {
  return `${tabIndex}:${itemId}`
}

export default function Campaigns() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')

  const [activeTab, setActiveTab] = useState(0)
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [datePreset, setDatePreset] = useState(0)

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE_COLS)
  const [colOrder, setColOrder] = useState(DEFAULT_VISIBLE_COLS)
  const [showColPicker, setShowColPicker] = useState(false)

  const [clientBudgets, setClientBudgets] = useState({})
  const [editingBudget, setEditingBudget] = useState(null)
  const [newBudgetVal, setNewBudgetVal] = useState('')

  const [dragCol, setDragCol] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    fetchAccounts()
    fetchCampaignsConfig()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchData()
    }
  }, [selectedAccount, activeTab, statusFilter, datePreset])

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/meta/accounts')
      const d = await res.json()
      const nextAccounts = d.accounts || []
      setAccounts(nextAccounts)

      if (nextAccounts.length) {
        setSelectedAccount(nextAccounts[0].id)
      }
    } catch {
      setAccounts([])
    }
  }

  async function fetchCampaignsConfig() {
    setLoadingConfig(true)

    try {
      const token = getAuthToken()

      if (!token) {
        setVisibleCols(DEFAULT_VISIBLE_COLS)
        setColOrder(DEFAULT_VISIBLE_COLS)
        setClientBudgets({})
        setLoadingConfig(false)
        return
      }

      const res = await fetch('/api/config/get?section=campaigns', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const d = await res.json()
      const config = d?.config || null

      if (config) {
        const nextVisibleCols = sanitizeVisibleCols(config.visibleCols)
        const nextColOrder = sanitizeColOrder(config.colOrder, nextVisibleCols)
        const nextBudgets =
          config.clientBudgets && typeof config.clientBudgets === 'object'
            ? config.clientBudgets
            : {}

        setVisibleCols(nextVisibleCols)
        setColOrder(nextColOrder)
        setClientBudgets(nextBudgets)
      } else {
        setVisibleCols(DEFAULT_VISIBLE_COLS)
        setColOrder(DEFAULT_VISIBLE_COLS)
        setClientBudgets({})
      }
    } catch {
      setVisibleCols(DEFAULT_VISIBLE_COLS)
      setColOrder(DEFAULT_VISIBLE_COLS)
      setClientBudgets({})
    }

    setLoadingConfig(false)
  }

  async function saveCampaignsConfig(nextVisibleCols, nextColOrder, nextClientBudgets) {
    try {
      const token = getAuthToken()
      if (!token) return

      setSavingConfig(true)

      await fetch('/api/config/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          section: 'campaigns',
          config: {
            visibleCols: nextVisibleCols,
            colOrder: nextColOrder,
            clientBudgets: nextClientBudgets
          }
        })
      })
    } catch (err) {
      console.error('Error guardando configuración de campañas:', err)
    } finally {
      setSavingConfig(false)
    }
  }

  async function fetchData() {
    setLoading(true)
    setError('')

    try {
      const preset = DATE_PRESETS[datePreset]
      const endpoint = activeTab === 0 ? 'campaigns' : activeTab === 1 ? 'adsets' : 'ads'

      let url = `/api/meta/${endpoint}?accountId=${encodeURIComponent(
        selectedAccount
      )}&preset=${encodeURIComponent(preset.preset)}`

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

  function handleToggleColumn(key) {
    let nextVisibleCols
    let nextColOrder

    if (visibleCols.includes(key)) {
      nextVisibleCols = visibleCols.filter((col) => col !== key)
      nextColOrder = colOrder.filter((col) => col !== key)
    } else {
      nextVisibleCols = [...visibleCols, key]
      nextColOrder = [...colOrder, key]
    }

    const safeVisibleCols = sanitizeVisibleCols(nextVisibleCols)
    const safeColOrder = sanitizeColOrder(nextColOrder, safeVisibleCols)

    setVisibleCols(safeVisibleCols)
    setColOrder(safeColOrder)
    saveCampaignsConfig(safeVisibleCols, safeColOrder, clientBudgets)
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

    if (fromIdx === -1 || toIdx === -1) return

    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, dragCol)

    setColOrder(newOrder)
    setDragCol(null)
    setDragOverCol(null)

    saveCampaignsConfig(visibleCols, newOrder, clientBudgets)
  }

  function startEditBudget(item) {
    const budgetKey = getBudgetKey(activeTab, item.id)
    setEditingBudget(budgetKey)
    setNewBudgetVal(clientBudgets[budgetKey] || '')
  }

  function cancelEditBudget() {
    setEditingBudget(null)
    setNewBudgetVal('')
  }

  function saveClientBudget(itemId) {
    const budgetKey = getBudgetKey(activeTab, itemId)
    const nextBudgets = {
      ...clientBudgets,
      [budgetKey]: newBudgetVal
    }

    setClientBudgets(nextBudgets)
    setEditingBudget(null)
    setNewBudgetVal('')

    saveCampaignsConfig(visibleCols, colOrder, nextBudgets)
  }

  function fmt(val, type = 'number') {
    const n = parseFloat(val || 0)

    if (type === 'currency') {
      return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    if (type === 'percent') {
      return `${n.toFixed(2)}%`
    }

    if (type === 'decimal') {
      return n.toFixed(2)
    }

    return n.toLocaleString('es-AR')
  }

  function renderStatus(item) {
    const currentStatus = item.display_status || item.status
    const isActive = currentStatus === 'ACTIVE'

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            color: isActive ? 'var(--green)' : 'var(--yellow)',
            fontSize: '13px',
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}
        >
          ● {isActive ? 'Activa' : 'Pausada'}
        </span>
      </div>
    )
  }

  function renderCell(item, col) {
    if (col === 'name') {
      return (
        <div>
          <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.name || '—'}</div>
          {activeTab > 0 && item.campaign_name ? (
            <div style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '4px' }}>
              ↳ {item.campaign_name}
            </div>
          ) : null}
          {activeTab === 2 && item.adset_name ? (
            <div style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '4px' }}>
              ↳ {item.adset_name}
            </div>
          ) : null}
        </div>
      )
    }

    if (col === 'status') {
      return renderStatus(item)
    }

    if (col === 'objective') {
      return OBJECTIVE_LABELS[item.objective] || item.objective || '—'
    }

    if (col === 'spend' || col === 'daily_budget' || col === 'cpc' || col === 'cpm' || col === 'cost_per_result' || col === 'cost_per_3sec' || col === 'cost_per_2sec') {
      const value = parseFloat(item[col] || 0)
      return value > 0 ? fmt(value, 'currency') : value === 0 ? '$0,00' : '—'
    }

    if (col === 'ctr') {
      const value = parseFloat(item[col] || 0)
      return fmt(value, 'percent')
    }

    if (col === 'frequency' || col === 'video_avg_watch') {
      const value = parseFloat(item[col] || 0)
      return value > 0 ? fmt(value, 'decimal') : '—'
    }

    if (
      [
        'results',
        'messaging_conversation_started',
        'new_messaging_contacts',
        'total_messaging_contacts',
        'messaging_conversation_replied',
        'recurring_messaging_contacts',
        'impressions',
        'reach',
        'clicks',
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
      ].includes(col)
    ) {
      const value = parseFloat(item[col] || 0)
      return value > 0 ? fmt(value) : value === 0 ? '0' : '—'
    }

    if (col === 'budget_client') {
      const budgetKey = getBudgetKey(activeTab, item.id)
      const currentValue = clientBudgets[budgetKey] || ''
      const isEditing = editingBudget === budgetKey

      if (isEditing) {
        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              value={newBudgetVal}
              onChange={(e) => setNewBudgetVal(e.target.value)}
              placeholder="0"
              style={{
                width: '90px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 8px',
                color: 'var(--text)',
                fontSize: '12px'
              }}
            />
            <button
              onClick={() => saveClientBudget(item.id)}
              style={{
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '12px'
              }}
            >
              OK
            </button>
            <button
              onClick={cancelEditBudget}
              style={{
                background: 'none',
                color: 'var(--text2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          </div>
        )
      }

      return (
        <button
          onClick={() => startEditBudget(item)}
          style={{
            background: 'none',
            border: 'none',
            color: currentValue ? 'var(--text)' : 'var(--text2)',
            textDecoration: currentValue ? 'none' : 'underline',
            cursor: 'pointer',
            padding: 0,
            fontSize: '13px'
          }}
        >
          {currentValue ? fmt(currentValue, 'currency') : '+ agregar'}
        </button>
      )
    }

    if (col === 'available') {
      return item.available || '—'
    }

    return item[col] || '—'
  }

  const orderedVisibleCols = useMemo(() => {
    const visibleSet = new Set(visibleCols)
    const ordered = colOrder.filter((key) => visibleSet.has(key))
    const missing = visibleCols.filter((key) => !ordered.includes(key))
    return [...ordered, ...missing]
  }, [visibleCols, colOrder])

  return (
    <Layout title="Campañas">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600' }}>Campañas</h1>
        {(loadingConfig || savingConfig) && (
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
            {loadingConfig ? 'Cargando configuración...' : 'Guardando configuración...'}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          style={{
            minWidth: '320px',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '12px 14px',
            color: 'var(--text)',
            fontSize: '14px'
          }}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            minWidth: '120px',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '12px 14px',
            color: 'var(--text)',
            fontSize: '14px'
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={datePreset}
          onChange={(e) => setDatePreset(Number(e.target.value))}
          style={{
            minWidth: '120px',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '12px 14px',
            color: 'var(--text)',
            fontSize: '14px'
          }}
        >
          {DATE_PRESETS.map((opt, idx) => (
            <option key={opt.preset} value={idx}>
              {opt.label}
            </option>
          ))}
        </select>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowColPicker((s) => !s)}
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: 'var(--text)',
              fontSize: '14px'
            }}
          >
            ◫ Columnas
          </button>

          {showColPicker && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '320px',
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px',
                zIndex: 20,
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
                Elegí columnas visibles
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'grid', gap: '8px' }}>
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px',
                      color: 'var(--text)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(col.key)}
                      onChange={() => handleToggleColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '12px' }}>
                El orden se cambia arrastrando los encabezados de la tabla.
              </div>
            </div>
          )}
        </div>

        <button
          onClick={fetchData}
          style={{
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 18px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          ↻ Actualizar
        </button>
      </div>

      <div style={{ display: 'flex', gap: '28px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0 0 14px',
              color: activeTab === idx ? 'var(--accent)' : 'var(--text2)',
              borderBottom: activeTab === idx ? '2px solid var(--accent)' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {error ? (
        <div
          style={{
            background: '#ef444420',
            color: 'var(--red)',
            border: '1px solid #ef444450',
            borderRadius: '12px',
            padding: '14px 16px'
          }}
        >
          {error}
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflowX: 'auto'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {orderedVisibleCols.map((col) => {
                  const label = ALL_COLUMNS.find((c) => c.key === col)?.label || col
                  const isDragged = dragCol === col
                  const isOver = dragOverCol === col

                  return (
                    <th
                      key={col}
                      draggable
                      onDragStart={() => onDragStart(col)}
                      onDragOver={(e) => onDragOver(e, col)}
                      onDrop={() => onDrop(col)}
                      onDragEnd={() => {
                        setDragCol(null)
                        setDragOverCol(null)
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        color: 'var(--text2)',
                        fontWeight: '500',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        cursor: 'grab',
                        opacity: isDragged ? 0.5 : 1,
                        borderBottom: isOver ? '2px solid var(--accent)' : '1px solid var(--border)'
                      }}
                    >
                      {label}
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={orderedVisibleCols.length}
                    style={{
                      padding: '28px 16px',
                      color: 'var(--text2)',
                      textAlign: 'center'
                    }}
                  >
                    Cargando...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedVisibleCols.length}
                    style={{
                      padding: '28px 16px',
                      color: 'var(--text2)',
                      textAlign: 'center'
                    }}
                  >
                    No hay datos para mostrar.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                    {orderedVisibleCols.map((col) => (
                      <td
                        key={col}
                        style={{
                          padding: '14px 16px',
                          fontSize: '14px',
                          color: 'var(--text)',
                          verticalAlign: 'middle',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {renderCell(item, col)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
