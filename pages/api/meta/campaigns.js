export default async function handler(req, res) {
  const { accountId, status, since, until } = req.query
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: 'Token de Meta no configurado' })
  if (!accountId) return res.status(400).json({ error: 'accountId requerido' })

  try {
    const fields = [
      'id','name','status','objective',
      'daily_budget','lifetime_budget','budget_remaining',
      'insights.date_preset(last_30d){',
        'spend,impressions,reach,clicks,ctr,cpm,cpc,frequency,',
        'actions,action_values,cost_per_action_type,',
        'video_p25_watched_actions,video_p50_watched_actions,',
        'video_p75_watched_actions,video_p95_watched_actions,',
        'video_p100_watched_actions,',
        'video_play_actions,',
        'video_continuous_2_sec_watched_actions,',
        'video_thruplay_watched_actions,',
        'unique_video_continuous_2_sec_watched_actions,',
        'video_avg_time_watched_actions,',
        'cost_per_thruplay,',
        'cost_per_unique_action_type,',
        'objective,optimization_goal',
      '}'
    ].join('')

    let url = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=${fields}&limit=100&access_token=${token}`
    if (status && status !== 'ALL') url += `&effective_status=["${status}"]`
    if (since && until) url += `&time_range={"since":"${since}","until":"${until}"}`

    const response = await fetch(url)
    const data = await response.json()
    if (data.error) return res.status(400).json({ error: data.error.message })

    const campaigns = (data.data || []).map(c => {
      const ins = c.insights?.data?.[0] || {}
      const actions = ins.actions || []
      const costPerAction = ins.cost_per_action_type || []

      // Resultados según objetivo de campaña
      const objectiveActionMap = {
        'OUTCOME_LEADS': ['lead','onsite_conversion.lead_grouped'],
        'OUTCOME_SALES': ['purchase','offsite_conversion.fb_pixel_purchase','omni_purchase'],
        'OUTCOME_ENGAGEMENT': ['post_engagement','page_engagement'],
        'OUTCOME_TRAFFIC': ['link_click','landing_page_view'],
        'OUTCOME_AWARENESS': ['reach','impressions'],
        'OUTCOME_APP_PROMOTION': ['app_install','mobile_app_install'],
        'MESSAGES': ['onsite_conversion.messaging_conversation_started_7d','onsite_conversion.total_messaging_connection'],
        'LINK_CLICKS': ['link_click'],
        'PAGE_LIKES': ['like'],
        'VIDEO_VIEWS': ['video_view'],
        'REACH': ['reach'],
        'BRAND_AWARENESS': ['reach'],
        'CONVERSIONS': ['purchase','offsite_conversion.fb_pixel_purchase'],
        'LEAD_GENERATION': ['lead'],
      }

      const obj = c.objective || ins.objective || ''
      const targetActions = objectiveActionMap[obj] || []
      
      let results = 0
      let costPerResult = 0

      if (targetActions.length > 0) {
        for (const actionType of targetActions) {
          const found = actions.find(a => a.action_type === actionType)
          if (found) { results = parseFloat(found.value || 0); break }
        }
        for (const actionType of targetActions) {
          const found = costPerAction.find(a => a.action_type === actionType)
          if (found) { costPerResult = parseFloat(found.value || 0); break }
        }
      } else {
        // fallback: primer action disponible
        if (actions.length > 0) results = parseFloat(actions[0]?.value || 0)
        if (costPerAction.length > 0) costPerResult = parseFloat(costPerAction[0]?.value || 0)
      }

      // Métricas de video
      const getVideoMetric = (arr) => arr?.[0]?.value ? parseFloat(arr[0].value) : 0
      const getVideoMetricArr = (arr) => arr || []

      // Instagram follows
      const igFollows = actions.find(a => a.action_type === 'follow' || a.action_type === 'instagram_profile_follow')

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: obj,
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
        results: results.toString(),
        cost_per_result: costPerResult.toFixed(2),
        // Video
        video_p25: getVideoMetric(ins.video_p25_watched_actions),
        video_p50: getVideoMetric(ins.video_p50_watched_actions),
        video_p75: getVideoMetric(ins.video_p75_watched_actions),
        video_p95: getVideoMetric(ins.video_p95_watched_actions),
        video_p100: getVideoMetric(ins.video_p100_watched_actions),
        video_plays: getVideoMetric(ins.video_play_actions),
        video_2sec: getVideoMetric(ins.video_continuous_2_sec_watched_actions),
        video_3sec: getVideoMetric(ins.video_thruplay_watched_actions),
        video_2sec_unique: getVideoMetric(ins.unique_video_continuous_2_sec_watched_actions),
        video_avg_watch: ins.video_avg_time_watched_actions?.[0]?.value || '0',
        cost_per_3sec: ins.cost_per_thruplay?.[0]?.value || '0',
        cost_per_2sec: ins.cost_per_unique_action_type?.find(a => a.action_type === 'video_continuous_2_sec_watched_actions')?.value || '0',
        ig_follows: igFollows?.value || '0',
      }
    })

    res.json({ campaigns })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener campañas: ' + err.message })
  }
}
