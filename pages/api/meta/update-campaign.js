export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { campaignId, action, budget } = req.body
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: 'Token de Meta no configurado' })
  if (!campaignId) return res.status(400).json({ error: 'campaignId requerido' })

  try {
    let body = {}
    if (action === 'ACTIVE') body.status = 'ACTIVE'
    else if (action === 'PAUSED') body.status = 'PAUSED'
    else if (budget) body.daily_budget = Math.round(parseFloat(budget) * 100)

    const response = await fetch(`https://graph.facebook.com/v19.0/${campaignId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, access_token: token })
    })
    const data = await response.json()

    if (data.error) return res.status(400).json({ error: data.error.message })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar campaña' })
  }
}
