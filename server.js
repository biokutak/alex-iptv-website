const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname)));

const allowedTypes = new Set(['test', 'package']);
const allowedPlans = new Set(['1 mesec', '3 meseca', '6 meseci', '12 meseci']);
const prices = { '1 mesec': '1.000 RSD', '3 meseca': '2.500 RSD', '6 meseci': '5.000 RSD', '12 meseci': '10.000 RSD' };
const esc = (v) => String(v ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/telegram-request', async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(503).json({ error: 'Slanje zahteva trenutno nije podešeno. Pokušaj kasnije.' });

  const type = String(req.body?.type || '');
  const email = String(req.body?.email || '').trim();
  const name = String(req.body?.name || '').trim();
  const phone = String(req.body?.phone || '').trim();
  const plan = String(req.body?.plan || '').trim();
  if (!allowedTypes.has(type)) return res.status(400).json({ error: 'Nepoznat tip zahteva.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Unesi ispravnu e-mail adresu.' });
  if (type !== 'test' && (!name || name.length > 120 || !phone || phone.length > 60)) return res.status(400).json({ error: 'Unesi ime i prezime i broj telefona.' });
  if (type === 'package' && !allowedPlans.has(plan)) return res.status(400).json({ error: 'Izaberi važeći paket.' });

  const labels = { test: '🆓 BESPLATAN IPTV TEST', package: '📦 ZAHTEV ZA IPTV PAKET' };
  const lines = [labels[type], '', `E-mail: ${esc(email)}`];
  if (type !== 'test') lines.push(`Ime i prezime: ${esc(name)}`, `Telefon: ${esc(phone)}`);
  if (type === 'package') lines.push(`Paket: ${esc(plan)}`, `Cena: ${prices[plan]}`);
  lines.push('', `Vreme: ${new Date().toLocaleString('sr-RS', { timeZone: 'Europe/Belgrade' })}`);

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), disable_web_page_preview: true })
    });
    const result = await tg.json();
    if (!tg.ok || !result.ok) {
      console.error('Telegram API request failed:', result.description || tg.status);
      return res.status(502).json({ error: 'Telegram nije prihvatio poruku. Pokušaj ponovo kasnije.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Telegram send error:', err.message);
    return res.status(502).json({ error: 'Poruka trenutno nije mogla da se pošalje. Pokušaj ponovo.' });
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API ruta nije pronađena.' });
  res.sendFile(path.join(__dirname, 'index.html'), err => { if (err) next(err); });
});

app.listen(PORT, () => console.log(`ALEX IPTV web service listening on ${PORT}`));
