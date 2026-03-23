import { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'

function formatCurrency(value) {
  const n = parseFloat(value || 0)
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNumber(value) {
  const n = parseFloat(value || 0)
  return n.toLocaleString('es-AR')
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const [tabs, setTabs] = useState([])
  const [activeTab, setActiveTab] = useState(0)

  const [showNewTab, setShowNewTab] = useState(false)
  const [newTabName, setNewTabName] = useState('')

  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [campaignError, setCampaignError] = useState('')

  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedCampaignIds, setSelectedCampaignIds] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const savedTabs = JSON.parse(localStorage.getItem('dashTabs') || '[]')
    setTabs(savedTabs)
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (!tabs.length) {
      setSelectedAccountId('')
      setSelectedCampaignIds([])
      setCampaigns([])
      return
    }

    const currentTab = tabs[activeTab]
    if (!currentTab) return

    setSelectedAccountId(currentTab.accountId || '')
    setSelectedCampaignIds(currentTab.campaignIds || [])
  }, [tabs, activeTab])

  useEffect(() => {
    if (selectedAccountId) {
      fetchCampaigns(selectedAccountId)
    } else {
      setCampaigns([])
    }
  }, [selectedAccountId])

  async function fetchAccounts() {
    setLoadingAccounts(true)
    try {
      const res = await fetch('/api/meta/accounts')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch {
      setAccounts([])
    }
    setLoadingAccounts(false)
  }

  async function fetchCampaigns(accountId) {
    setLoadingCampaigns(true)
    setCampaignError('')

    try {
      const res = await fetch(
        `/api/meta/campaigns?accountId=${encodeURIComponent(accountId)}&preset=last_30d&status=ALL`
      )
      const data = await res.json()

      if (data.error) {
        setCampaignError(data.error)
        setCampaigns([])
      } else {
        setCampaigns(data.campaigns || [])
      }
    } catch {
      setCampaignError('No se pudieron cargar las campañas')
      setCampaigns([])
    }

    setLoadingCampaigns(false)
  }

  function persistTabs(updatedTabs, nextActiveTab = activeTab) {
    setTabs(updatedTabs)
    localStorage.setItem('dashTabs', JSON.stringify(updatedTabs))
    setActiveTab(nextActiveTab)
  }

  function saveTab() {
    if (!newTabName.trim()) return

    const updated = [
      ...tabs,
      {
        name: newTabName.trim(),
        accountId: '',
        campaignIds: []
      }
    ]

    persistTabs(updated, updated.length - 1)
    setNewTabName('')
    setShowNewTab(false)
  }

  function deleteTab(index) {
    const updated = tabs.filter((_, i) => i !== index)
    const nextIndex = Math.max(0, Math.min(activeTab, updated.length - 1))
    persistTabs(updated, nextIndex)
  }

  function updateCurrentTab(patch) {
    if (!tabs[activeTab]) return

    const updated = tabs.map((tab, index) =>
      index === activeTab ? { ...tab, ...patch } : tab
    )

    persistTabs(updated, activeTab)
  }

  function handleAccountChange(value) {
    setSelectedAccountId(value)
    setSelectedCampaignIds([])
    updateCurrentTab({
      accountId: value,
      campaignIds: []
    })
  }

  function toggleCampaign(campaignId) {
    const updated = selectedCampaignIds.includes(campaignId)
      ? selectedCampaignIds.filter((id) => id !== campaignId)
      : [...selectedCampaignIds, campaignId]

    setSelectedCampaignIds(updated)
    updateCurrentTab({
      accountId: selectedAccountId,
      campaignIds: updated
    })
  }

  function selectAllVisible() {
    const visibleIds = filteredCampaigns.map((c) => c.id)
    const merged = Array.from(new Set([...selectedCampaignIds, ...visibleIds]))
    setSelectedCampaignIds(merged)
    updateCurrentTab({
      accountId: selectedAccountId,
      campaignIds: merged
    })
  }

  function clearSelection() {
    setSelectedCampaignIds([])
    updateCurrentTab({
      accountId: selectedAccountId,
      campaignIds: []
    })
  }

  const totalSpend = accounts.reduce(
    (sum, a) => sum + parseFloat(a.amount_spent || 0) / 100,
    0
  )

  const currentTab = tabs[activeTab] || null

  const filteredCampaigns = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return campaigns
    return campaigns.filter((c) => (c.name || '').toLowerCase().includes(term))
  }, [campaigns, search])

  const selectedCampaignObjects = campaigns.filter((c) =>
    selectedCampaignIds.includes(c.id)
  )

  const selectedTotals = selectedCampaignObjects.reduce(
    (acc, campaign) => {
      acc.spend += parseFloat(campaign.spend || 0)
      acc.results += parseFloat(campaign.results || 0)
      acc.impressions += parseFloat(campaign.impressions || 0)
      acc.reach += parseFloat(campaign.reach || 0)
      return acc
    },
    { spend: 0, results: 0, impressions: 0, reach: 0 }
  )

  const activeAccount = accounts.find((a) => a.id === selectedAccountId)

  return (
    <Layout title="Dashboard">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px'
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text2)',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}
          >
            Cuentas conectadas
          </div>
          <div style={{ fontSize: '28px', fontWeight: '600' }}>
            {loadingAccounts ? '...' : accounts.length}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px'
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text2)',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}
          >
            Gasto total (últimos 30d)
          </div>
          <div style={{ fontSize: '28px', fontWeight: '600' }}>
            {loadingAccounts ? '...' : formatCurrency(totalSpend)}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px'
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text2)',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}
          >
            Cuentas activas
          </div>
          <div style={{ fontSize: '28px', fontWeight: '600' }}>
            {loadingAccounts ? '...' : accounts.filter((a) => a.status === 1).length}
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: '600' }}>Vistas personalizadas</h2>
          <button
            onClick={() => setShowNewTab(true)}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            + Nueva pestaña
          </button>
        </div>

        {showNewTab && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              placeholder="Nombre de la pestaña"
              style={{
                flex: 1,
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '9px 14px',
                color: 'var(--text)',
                fontSize: '14px'
              }}
              onKeyDown={(e) => e.key === 'Enter' && saveTab()}
            />
            <button
              onClick={saveTab}
              style={{
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Crear
            </button>
            <button
              onClick={() => setShowNewTab(false)}
              style={{
                background: 'none',
                color: 'var(--text2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '13px'
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        {tabs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>◈</div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: '500',
                color: 'var(--text)',
                marginBottom: '6px'
              }}
            >
              No hay pestañas creadas
            </div>
            <div style={{ fontSize: '13px' }}>
              Creá una pestaña para agrupar campañas y ver sus métricas combinadas
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {tabs.map((tab, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setActiveTab(i)}
                    style={{
                      background: activeTab === i ? 'var(--bg3)' : 'none',
                      border: '1px solid',
                      borderColor: activeTab === i ? 'var(--accent)' : 'var(--border)',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      color: activeTab === i ? 'var(--text)' : 'var(--text2)',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    {tab.name}
                  </button>
                  <button
                    onClick={() => deleteTab(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text2)',
                      fontSize: '16px',
                      padding: '2px 4px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div
              style={{
                background: 'var(--bg3)',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid var(--border)'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '280px 1fr auto auto',
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                <select
                  value={selectedAccountId}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text)',
                    fontSize: '13px'
                  }}
                >
                  <option value="">Seleccioná una cuenta publicitaria</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.account_id}
                    </option>
                  ))}
                </select>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar campaña por nombre"
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text)',
                    fontSize: '13px'
                  }}
                />

                <button
                  onClick={selectAllVisible}
                  disabled={!selectedAccountId || filteredCampaigns.length === 0}
                  style={{
                    background: 'none',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px'
                  }}
                >
                  Seleccionar visibles
                </button>

                <button
                  onClick={clearSelection}
                  disabled={selectedCampaignIds.length === 0}
                  style={{
                    background: 'none',
                    color: 'var(--text2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px'
                  }}
                >
                  Limpiar
                </button>
              </div>

              {currentTab && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
                    gap: '12px',
                    marginBottom: '18px'
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                      Cuenta seleccionada
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>
                      {activeAccount?.name || '—'}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                      Campañas elegidas
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {selectedCampaignObjects.length}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                      Gasto combinado
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {formatCurrency(selectedTotals.spend)}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                      Resultados combinados
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {formatNumber(selectedTotals.results)}
                    </div>
                  </div>
                </div>
              )}

              {!selectedAccountId ? (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    background: 'var(--bg2)',
                    color: 'var(--text2)',
                    fontSize: '13px'
                  }}
                >
                  Seleccioná una cuenta publicitaria para cargar sus campañas.
                </div>
              ) : loadingCampaigns ? (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    background: 'var(--bg2)',
                    color: 'var(--text2)',
                    fontSize: '13px'
                  }}
                >
                  Cargando campañas...
                </div>
              ) : campaignError ? (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    background: '#ef444420',
                    color: 'var(--red)',
                    fontSize: '13px'
                  }}
                >
                  {campaignError}
                </div>
              ) : (
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '44px minmax(240px,1fr) 120px 140px 120px',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'var(--bg2)',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text2)',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    <div></div>
                    <div>Campaña</div>
                    <div>Estado</div>
                    <div>Gasto</div>
                    <div>Resultados</div>
                  </div>

                  {filteredCampaigns.length === 0 ? (
                    <div style={{ padding: '20px', color: 'var(--text2)', fontSize: '13px' }}>
                      No hay campañas para mostrar.
                    </div>
                  ) : (
                    filteredCampaigns.map((campaign) => {
                      const checked = selectedCampaignIds.includes(campaign.id)
                      const isActive =
                        (campaign.effective_status || campaign.status) === 'ACTIVE'

                      return (
                        <label
                          key={campaign.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '44px minmax(240px,1fr) 120px 140px 120px',
                            gap: '12px',
                            padding: '12px 16px',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--border)',
                            background: checked ? 'rgba(79,124,255,0.08)' : 'transparent',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCampaign(campaign.id)}
                          />

                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>
                              {campaign.name || '—'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>
                              ID: {campaign.id}
                            </div>
                          </div>

                          <div
                            style={{
                              color: isActive ? 'var(--green)' : 'var(--yellow)',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            ● {isActive ? 'Activa' : 'Pausada'}
                          </div>

                          <div style={{ fontSize: '13px' }}>
                            {formatCurrency(campaign.spend || 0)}
                          </div>

                          <div style={{ fontSize: '13px' }}>
                            {formatNumber(campaign.results || 0)}
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px'
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>
          Cuentas publicitarias
        </h2>

        {loadingAccounts ? (
          <div style={{ color: 'var(--text2)', fontSize: '13px' }}>
            Cargando cuentas desde Meta...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
              gap: '12px'
            }}
          >
            {accounts.map((acc) => (
              <div
                key={acc.id}
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                  {acc.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px' }}>
                  ID: {acc.account_id}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      background: 'var(--bg2)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--text2)'
                    }}
                  >
                    {acc.currency}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: acc.status === 1 ? 'var(--green)' : 'var(--yellow)'
                    }}
                  >
                    {acc.status === 1 ? '● Activa' : '● Inactiva'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
