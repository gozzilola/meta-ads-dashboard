export default async function handler(req, res) {
  const { accountId, status, since, until, resultMetric } = req.query;
  const token = process.env.META_ACCESS_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "Token de Meta no configurado" });
  }

  if (!accountId) {
    return res.status(400).json({ error: "accountId requerido" });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const s = since || today;
    const u = until || today;

    const timeRange = encodeURIComponent(JSON.stringify({ since: s, until: u }));

    // 1) Traer metadata de campañas
    let campaignsUrl =
      `https://graph.facebook.com/v19.0/${accountId}/campaigns` +
      `?fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_remaining` +
      `&limit=100` +
      `&access_token=${encodeURIComponent(token)}`;

    // Ojo: effective_status conviene filtrarlo acá si lo necesitás.
    // Puede requerir encoding fino según cómo lo armes.
    if (status && status !== "ALL") {
      campaignsUrl += `&effective_status=${encodeURIComponent(JSON.stringify([status]))}`;
    }

    const campaignsResp = await fetch(campaignsUrl);
    const campaignsJson = await campaignsResp.json();

    if (campaignsJson.error) {
      return res.status(400).json({ error: campaignsJson.error.message });
    }

    const campaignList = campaignsJson.data || [];
    const campaignMap = new Map(campaignList.map(c => [c.id, c]));

    // 2) Traer insights a nivel campaign
    const insightFields = [
      "campaign_id",
      "campaign_name",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "ctr",
      "cpm",
      "cpc",
      "frequency",
      "actions",
      "cost_per_action_type",
      "video_p25_watched_actions",
      "video_p50_watched_actions",
      "video_p75_watched_actions",
      "video_p95_watched_actions",
      "video_p100_watched_actions",
      "video_play_actions",
      "video_continuous_2_sec_watched_actions",
      "video_thruplay_watched_actions",
      "unique_video_continuous_2_sec_watched_actions",
      "video_avg_time_watched_actions",
      "cost_per_thruplay"
    ].join(",");

    const insightsUrl =
      `https://graph.facebook.com/v19.0/${accountId}/insights` +
      `?level=campaign` +
      `&fields=${encodeURIComponent(insightFields)}` +
      `&time_range=${timeRange}` +
      `&action_report_time=mixed` +
      `&limit=100` +
      `&access_token=${encodeURIComponent(token)}`;

    const insightsResp = await fetch(insightsUrl);
    const insightsJson = await insightsResp.json();

    if (insightsJson.error) {
      return res.status(400).json({ error: insightsJson.error.message });
    }

    const insightsMap = new Map(
      (insightsJson.data || []).map(i => [i.campaign_id, i])
    );

    const getActionValue = (arr, actionType) => {
      const found = (arr || []).find(x => x.action_type === actionType);
      return found ? parseFloat(found.value || 0) : 0;
    };

    const getFirstValue = (arr) => {
      return arr?.[0]?.value ? parseFloat(arr[0].value) : 0;
    };

    // Resultado principal:
    // lo ideal es que venga del frontend según la vista elegida
    // Ej: messaging, lead, purchase, link_click
    const metric = resultMetric || "onsite_conversion.messaging_conversation_started_7d";

    const campaigns = campaignList.map(c => {
      const ins = insightsMap.get(c.id) || {};

      const results = getActionValue(ins.actions, metric);
      const costPerResult = getActionValue(ins.cost_per_action_type, metric);
      const igFollows =
        getActionValue(ins.actions, "follow") ||
        getActionValue(ins.actions, "instagram_profile_follow");

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        effective_status: c.effective_status,
        objective: c.objective,

        daily_budget: c.daily_budget ? (parseInt(c.daily_budget, 10) / 100).toFixed(2) : null,
        lifetime_budget: c.lifetime_budget ? (parseInt(c.lifetime_budget, 10) / 100).toFixed(2) : null,
        budget_remaining: c.budget_remaining ? (parseInt(c.budget_remaining, 10) / 100).toFixed(2) : null,

        spend: ins.spend || "0",
        impressions: ins.impressions || "0",
        reach: ins.reach || "0",
        clicks: ins.clicks || "0",
        ctr: ins.ctr || "0",
        cpm: ins.cpm || "0",
        cpc: ins.cpc || "0",
        frequency: ins.frequency || "0",

        results: results.toString(),
        cost_per_result: costPerResult ? costPerResult.toFixed(2) : "0.00",

        video_p25: getFirstValue(ins.video_p25_watched_actions),
        video_p50: getFirstValue(ins.video_p50_watched_actions),
        video_p75: getFirstValue(ins.video_p75_watched_actions),
        video_p95: getFirstValue(ins.video_p95_watched_actions),
        video_p100: getFirstValue(ins.video_p100_watched_actions),
        video_plays: getFirstValue(ins.video_play_actions),
        video_2sec: getFirstValue(ins.video_continuous_2_sec_watched_actions),
        video_thruplay: getFirstValue(ins.video_thruplay_watched_actions),
        video_2sec_unique: getFirstValue(ins.unique_video_continuous_2_sec_watched_actions),
        video_avg_watch: ins.video_avg_time_watched_actions?.[0]?.value || "0",
        cost_per_thruplay: ins.cost_per_thruplay?.[0]?.value || "0",
        ig_follows: igFollows.toString()
      };
    });

    return res.json({ campaigns });
  } catch (err) {
    return res.status(500).json({ error: "Error: " + err.message });
  }
}
