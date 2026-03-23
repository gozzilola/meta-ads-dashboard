function buildInsightParam(preset, since, until) {
  if (since && until) {
    return `time_range(${JSON.stringify({ since, until })})`
  }
  return `date_preset(${preset || 'today'})`
}

function getActionValueByTypes(list = [], actionTypes = []) {
  for (const actionType of actionTypes) {
    const found = list.find((item) => item.action_type === actionType)
    if (found && found.value != null) {
      const value = parseFloat(found.value)
      if (!Number.isNaN(value)) return value
    }
  }
  return 0
}

function getMetricValue(list = []) {
  const value = list?.[0]?.value
  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getMessagingMetrics(actions = []) {
  const messagingConversationStarted = getActionValueByTypes(actions, [
    'onsite_conversion.messaging_conversation_started_7d'
  ])

  const newMessagingContacts = getActionValueByTypes(actions, [
    'onsite_conversion.messaging_first_reply',
    'onsite_conversion.new_messaging_connection'
  ])

  const totalMessagingContacts = getActionValueByTypes(actions, [
    'onsite_conversion.total_messaging_connection'
  ])

  const messagingConversationReplied = getActionValueByTypes(actions, [
    'onsite_conversion.messaging_conversation_replied_7d'
  ])

  const recurringMessagingContactsDirect = getActionValueByTypes(actions, [
    'onsite_conversion.recurring_messaging_connection',
    'onsite_conversion.messaging_recurring_contact',
    'onsite_conversion.recurring_messaging_conversation'
  ])

  const recurringMessagingContacts =
    recurringMessagingContactsDirect > 0
      ? recurringMessagingContactsDirect
      : Math.max(totalMessagingContacts - newMessagingContacts, 0)

  return {
    messagingConversationStarted,
    newMessagingContacts,
    totalMessagingContacts,
    messagingConversationReplied,
    recurringMessagingContacts
  }
}

function getResultTypesByGoal({ optimizationGoal, objective, actions }) {
  const hasMessagingResults = actions.some(
    (a) =>
      a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
      a.action_type === 'onsite_conversion.total_messaging_connection'
  )

  const optimizationMap = {
    MESSAGING_CONVERSATIONS: [
      'onsite_conversion.messaging_conversation_started_7d',
      'onsite_conversion.total_messaging_connection'
    ],
    QUALITY_LEAD: ['lead', 'onsite_conversion.lead_grouped'],
    LEAD_GENERATION: ['lead', 'onsite_conversion.lead_grouped'],
    LINK_CLICKS: ['link_click'],
    LANDING_PAGE_VIEWS: ['landing_page_view', 'link_click'],
    THRUPLAY: ['video_view'],
    REACH: ['reach'],
    PAGE_LIKES: ['like'],
    OFFSITE_CONVERSIONS: ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
  }

  if (optimizationGoal && optimizationMap[optimizationGoal]) {
    return optimizationMap[optimizationGoal]
  }

  if (objective === 'OUTCOME_ENGAGEMENT') {
    if (hasMessagingResults) {
      return [
        'onsite_conversion.messaging_conversation_started_7d',
        'onsite_conversion.total_messaging_connection'
      ]
    }
    return ['post_engagement', 'page_engagement']
  }

  const objectiveMap = {
    OUTCOME_LEADS: ['lead', 'onsite_conversion.lead_grouped'],
    OUTCOME_SALES: ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase'],
    OUTCOME_TRAFFIC: ['link_click', 'landing_page_view'],
    OUTCOME_AWARENESS: ['reach'],
    MESSAGES: [
      'onsite_conversion.messaging_conversation_started_7d',
      'onsite_conversion.total_messaging_connection'
    ],
    CONVERSIONS: ['purchase', 'offsite_conversion.fb_pixel_purchase'],
    LEAD_GENERATION: ['lead']
  }

  return objectiveMap[objective] || []
}

export default async function handler(req, res) {
  const { accountId, preset, datePreset, since, until } = req.query
  const token = process.env.META_ACCESS_TOKEN

  if (!token) {
    return res.status(500).json({ error: 'Token de Meta no configurado' })
  }

  if (!accountId) {
    return res.status(400).json({ error: 'accountId requerido' })
  }

  try {
    const selectedPreset = datePreset || preset || 'today'
    const insightParam = buildInsightParam(selectedPreset, since, until)

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
      'campaign_id',
      'campaign{name,objective}',
      'adset_id',
      'adset{name,optimization_goal}',
      `insights.${insightParam}.action_report_time(mixed){${insightFields}}`
    ].join(',')

    const url =
      `https://graph.facebook.com/v19.0/${accountId}/ads` +
      `?fields=${encodeURIComponent(fields)}` +
      `&limit=100` +
      `&access_token=${encodeURIComponent(token)}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      return res.status(400).json({ error: data.error.message })
    }

    const ads = (data.data || []).map((ad) => {
      const insights = ad.insights?.data?.[0] || {}
      const actions = insights.actions || []
      const costPerAction = insights.cost_per_action_type || []

      const resultTypes = getResultTypesByGoal({
        optimizationGoal: ad.adset?.optimization_goal || '',
        objective: ad.campaign?.objective || '',
        actions
      })

      const results = getActionValueByTypes(actions, resultTypes)
      const costPerResult = getActionValueByTypes(costPerAction, resultTypes)
      const messagingMetrics = getMessagingMetrics(actions)

      return {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        effective_status: ad.effective_status,
        objective: ad.campaign?.objective || '',
        campaign_id: ad.campaign_id,
        campaign_name: ad.campaign?.name || '',
        adset_id: ad.adset_id,
        adset_name: ad.adset?.name || '',
        daily_budget: null,
        lifetime_budget: null,
        budget_remaining: null,
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

        messaging_conversation_started: messagingMetrics.messagingConversationStarted,
        new_messaging_contacts: messagingMetrics.newMessagingContacts,
        total_messaging_contacts: messagingMetrics.totalMessagingContacts,
        messaging_conversation_replied: messagingMetrics.messagingConversationReplied,
        recurring_messaging_contacts: messagingMetrics.recurringMessagingContacts,

        video_p25: getMetricValue(insights.video_p25_watched_actions),
        video_p50: getMetricValue(insights.video_p50_watched_actions),
        video_p75: getMetricValue(insights.video_p75_watched_actions),
        video_p95: getMetricValue(insights.video_p95_watched_actions),
        video_p100: getMetricValue(insights.video_p100_watched_actions),
        video_plays: getMetricValue(insights.video_play_actions),
        video_2sec: getMetricValue(insights.video_continuous_2_sec_watched_actions),
        video_3sec: getMetricValue(insights.video_thruplay_watched_actions),
        video_2sec_unique: getMetricValue(
          insights.unique_video_continuous_2_sec_watched_actions
        ),
        video_avg_watch: insights.video_avg_time_watched_actions?.[0]?.value || '0',
        cost_per_3sec: insights.cost_per_thruplay?.[0]?.value || '0',
        cost_per_2sec: '0',
        ig_follows: '0'
      }
    })

    return res.status(200).json({ ads })
  } catch (err) {
    return res.status(500).json({ error: 'Error: ' + err.message })
  }
}
