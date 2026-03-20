export default async function handler(req, res) {
  const { accountId, status, since, until } = req.query
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: 'Token de Meta no configurado' })
  if (!accountId) return res.status(400).json({ error: 'accountId requerido' })

  try {
    const fields = 'id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,insights.date_preset(last_30d){spend,impressions,reach,clicks,ctr,cpm,cpc,actions,cost_per_action_type,frequency}'

    let url = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=${fields}&limit=100&access_token=${token}`
    if (status && status !== 'ALL') url += `&effective_status=["${status}"]`
    if (since && until) url += `&time_range={"since":"${since}","until":"${until}"}`

    const response = await fetch(url)
    const data = await response.json()
    if (data.error) return res.status(400).json({ error: data.error.message })

    const campaigns = (data.data || []).map(c => {
      const ins = c.insights?.data?.[0] || {}
      const results = ins.actions?.find(a => a.action_type === 'lead' || a.action_type === 'purchase')
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        daily_budget: c.daily_budget ? (parseInt(c.daily_budget) / 100).toFixed(2) : null,
        lifetime_budget: c.lifetime_budget ? (parseInt(c.lifetime_budget) / 100).toFixed(2) : null,
        budget_remaining: c.budget_remaining ? (parseInt(c.budget_remaining) / 100).toFixed(2) : null,
        spend: ins.spend || '0',
        impressions: ins.impressions || '0',
        reach: ins.reach || '0',
        clicks: ins.clicks || '0',
        ctr: ins.ctr || '0',
        cpm: ins.cpm || '0',
        cpc: ins.cpc || '0',
        frequency: ins.frequency || '0',
        results: results?.value || '0',
        cost_per_result: ins.cost_per_action_type?.[0]?.value || '0',
      }
    })

    res.json({ campaigns })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener campañas' })
  }
}
