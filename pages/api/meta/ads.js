export default async function handler(req, res) {
  const { accountId, since, until } = req.query
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: 'Token de Meta no configurado' })
  if (!accountId) return res.status(400).json({ error: 'accountId requerido' })

  try {
    const fields = 'id,name,status,campaign_id,campaign{name},adset_id,adset{name},insights.date_preset(last_30d){spend,impressions,reach,clicks,ctr,cpm,cpc,actions,frequency}'

    let url = `https://graph.facebook.com/v19.0/${accountId}/ads?fields=${fields}&limit=100&access_token=${token}`
    if (since && until) url += `&time_range={"since":"${since}","until":"${until}"}`

    const response = await fetch(url)
    const data = await response.json()
    if (data.error) return res.status(400).json({ error: data.error.message })

    const ads = (data.data || []).map(a => {
      const ins = a.insights?.data?.[0] || {}
      return {
        id: a.id,
        name: a.name,
        status: a.status,
        campaign_id: a.campaign_id,
        campaign_name: a.campaign?.name || '',
        adset_id: a.adset_id,
        adset_name: a.adset?.name || '',
        spend: ins.spend || '0',
        impressions: ins.impressions || '0',
        reach: ins.reach || '0',
        clicks: ins.clicks || '0',
        ctr: ins.ctr || '0',
        cpm: ins.cpm || '0',
        cpc: ins.cpc || '0',
        frequency: ins.frequency || '0',
      }
    })

    res.json({ ads })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener anuncios' })
  }
}
