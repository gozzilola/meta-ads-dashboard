function buildInsightParam(preset, since, until) {
  if (since && until) {
    return `time_range(${JSON.stringify({ since, until })})`
  }
  return `date_preset(${preset || 'today'})`
}

function getActionValue(list = [], actionTypes = []) {
  for (const actionType of actionTypes) {
    const found = list.find((item) => item.action_type === actionType)
    if (found && found.value != null) {
      const value = parseFloat(found.value)
      if (!Number.isNaN(value)) return value
    }
  }
  return 0
}

function getCampaignResultTypes(objective, actions = []) {
  const hasMessagingResults = actions.some(
    (a) =>
      a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
      a.action_type === 'onsite_conversion.total_messaging_connection'
  )

  if (objective === 'OUTCOME_ENGAGEMENT') {
    if (hasMessagingResults) {
      return [
        'onsite_conversion.messaging_conversation_started_7d',
        'onsite_conversion.total_messaging_connection'
      ]
    }
    return ['post_engagement', 'page_engagement']
  }

  const objectiveActionMap = {
    OUTCOME_LEADS: ['lead', 'onsite_conversion.lead_grouped'],
    OUTCOME_SALES: ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase'],
    OUTCOME_TRAFFIC: ['link_click', 'landing_page_view'],
    OUTCOME_AWARENESS: ['reach'],
    OUTCOME_APP_PROMOTION: ['app_install', 'mobile_app_install'],
    MESSAGES: [
      'onsite_conversion.messaging_conversation_started_7d',
      'onsite_conversion.total_messaging_connection'
    ],
    LINK_CLICKS: ['link_click'],
    PAGE_LIKES: ['like'],
    VIDEO_VIEWS: ['video_view'],
    REACH: ['reach'],
    CONVERSIONS: ['purchase', 'offsite_conversion.fb_pixel_purchase'],
    LEAD_GENERATION: ['lead']
  }

  return objectiveActionMap[objective] || []
}

function getMetricValue(list = []) {
  const value = list?.[0]?.value
  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export default async function handler(req, res) {
  const { accountId, status, preset, since, until } = req.query
  const token = process.env.META_ACCESS_TOKEN

  if (!token) {
    return res.status(500).json({ error: 'Token de Meta no configurado' })
  }

  if (!accountId) {
    return res.status(400).json({ error: 'accountId requerido' })
  }

  try {
    const insightParam = buildInsightParam(preset, since, until)

    const insightFields = [
      'spend',
      'impressions',
      'reach',
      'clicks',
      'ctr',
      'cpm',
      'cpc',
      'frequency',
      'actions',
      'cost_per_action_type',
      'video_p25_watched_actions',
      'video_p50_watched_actions',
      'video_p75_watched_actions',
      'video_p95_watched_actions',
      'video_p100_watched_actions',
      'video_play_actions',
      'video_continuous_2_sec_watched_actions',
      'video_thruplay_watched_actions',
      'unique_video_continuous_2_sec_watched_actions',
      'video_avg_time_watched_actions',
      'cost_per_thruplay'
    ].join(',')

    const fields = [
      'id',
      'name',
      'status',
      'effective_status',
      'objective',
      'daily_budget',
      'lifetime_budget',
      'budget_remaining',
      `insights.${insightParam}.action_report_time(mixed){${insightFields}}`
    ].join(',')

    let url =
      `https://graph.facebook.com/v19.0/${accountId}/campaigns` +
      `?fields=${encodeURIComponent(fields)}` +
      `&limit=100` +
      `&access_token=${encodeURIComponent(token)}`

    if (status && status !== 'ALL') {
      url += `&effective_status=${encodeURIComponent(JSON.stringify([status]))}`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      return res.status(400).json({ error: data.error.message })
    }

    const campaigns = (data.data || []).map((campaign) => {
      const insights = campaign.insights?.data?.[0] || {}
      const actions = insights.actions || []
      const costPerAction = insights.cost_per_action_type || []
      const resultTypes = getCampaignResultTypes(campaign.objective || '', actions)

      const results = getActionValue(actions, resultTypes)
      const costPerResult = getActionValue(costPerAction, resultTypes)
      const igFollows = getActionValue(actions, ['instagram_profile_follow', 'follow'])

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        effective_status: campaign.effective_status,
        objective: campaign.objective || '',
        daily_budget: campaign.daily_budget ? (parseInt(campaign.daily_budget, 10) / 100).toFixed(2) : null,
        lifetime_budget: campaign.lifetime_budget ? (parseInt(campaign.lifetime_budget, 10) / 100).toFixed(2) : null,
        budget_remaining: campaign.budget_remaining ? (parseInt(campaign.budget_remaining, 10) / 100).toFixed(2) : null,
        spend: insights.spend || '0',
        impressions: insights.impressions || '0',
        reach: insights.reach || '0',
        clicks: insights.clicks || '0',
        ctr: insights.ctr || '0',
        cpm: insights.cpm || '0',
        cpc: insights.cpc || '0',
        frequency: insights.frequency || '0',
        results: String(results),
        cost_per_result: costPerResult > 0 ? costPerResult.toFixed(2) : '0',
        video_p25: getMetricValue(insights.video_p25_watched_actions),
        video_p50: getMetricValue(insights.video_p50_watched_actions),
        video_p75: getMetricValue(insights.video_p75_watched_actions),
        video_p95: getMetricValue(insights.video_p95_watched_actions),
        video_p100: getMetricValue(insights.video_p100_watched_actions),
        video_plays: getMetricValue(insights.video_play_actions),
        video_2sec: getMetricValue(insights.video_continuous_2_sec_watched_actions),
        video_3sec: getMetricValue(insights.video_thruplay_watched_actions),
        video_2sec_unique: getMetricValue(insights.unique_video_continuous_2_sec_watched_actions),
        video_avg_watch: insights.video_avg_time_watched_actions?.[0]?.value || '0',
        cost_per_3sec: insights.cost_per_thruplay?.[0]?.value || '0',
        cost_per_2sec: '0',
        ig_follows: String(igFollows)
      }
    })

    return res.json({ campaigns })
  } catch (err) {
    return res.status(500).json({ error: 'Error: ' + err.message })
  }
}
