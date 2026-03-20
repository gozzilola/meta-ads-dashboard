export default async function handler(req, res) {
  const { accountId, since, until } = req.query
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: 'Token de Meta no configurado' })
  if (!accountId) return res.status(400).json({ error: 'accountId requerido' })

  try {
    const timeRange = since && until
      ? `time_range={"since":"${since}","until":"${until}"}`
      : `date_preset=last_30d`

    const fields = `id,name,status,campaign_id,campaign{name},daily_budget,lifetime_budget,budget_remaining,insights{spend,impressions,reach,clicks,ctr,cpm,cpc,actions,frequency}`

    const url = `https://graph.facebook.com/v19.0/${accountId}/adsets?fields=${fields}&${timeRange}&limit=100&access_token=${token}`

    const response = await fetch(url)
    const data = await response.json()
    if (data.error) return res.status(400).json({ error: data.error.message })

    const adsets = (data.data || []).map(s => {
      const ins = s.insights?.data?.[0] || {}
      const actions = ins.actions || []
      return {
        id: s.id,
        name: s.name,
        status: s.status,
        campaign_id: s.campaign_id,
        campaign_name: s.campaign?.name || '',
        daily_budget: s.daily_budget ? (parseInt(s.daily_budget) / 100).toFixed(2) : null,
        lifetime_budget: s.lifetime_budget ? (parseInt(s.lifetime_budget) / 100).toFixed(2) : null,
        spend: ins.spend || '0',
        impressions: ins.impressions || '0',
        reach: ins.reach || '0',
        clicks: ins.clicks || '0',
        ctr: ins.ctr || '0',
        cpm: ins.cpm || '0',
        cpc: ins.cpc || '0',
        frequency: ins.frequency || '0',
        results: actions[0]?.value || '0',
      }
    })

    res.json({ adsets })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener conjuntos: ' + err.message })
  }
}
