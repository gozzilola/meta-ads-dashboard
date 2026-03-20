export default async function handler(req, res) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: 'Token de Meta no configurado' })

  try {
    const url = `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id,currency,account_status,amount_spent&limit=50&access_token=${token}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) return res.status(400).json({ error: data.error.message })

    const accounts = (data.data || []).map(acc => ({
      id: acc.id,
      account_id: acc.account_id,
      name: acc.name || `Cuenta ${acc.account_id}`,
      currency: acc.currency,
      status: acc.account_status,
      amount_spent: acc.amount_spent
    }))

    res.json({ accounts })
  } catch (err) {
    res.status(500).json({ error: 'Error al conectar con Meta' })
  }
}
