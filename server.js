const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 10000;
const ALLOWED_ORIGIN = 'https://alex-iptv-website.onrender.com';

app.disable('x-powered-by');

// The public website and Telegram API are on different Render subdomains.
// Handle the browser's CORS preflight before JSON parsing or route handling.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS' && req.path === '/api/telegram-request') {
    if (origin !== ALLOWED_ORIGIN) return res.status(403).end();
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname)));

const allowedTypes = new Set(['test', 'package']);
const allowedPlans = new Set(['1 mesec', '3 meseca', '6 meseci', '12 meseci']);
const prices = { '1 mesec': '1.000 RSD', '3 meseca': '2.500 RSD', '6 meseci': '5.000 RSD', '12 meseci': '10.000 RSD' };
const esc = (v) => String(v ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Independent website visit counter. Configure COUNTER_DATA_DIR to a persistent
// Render disk mount (for example /var/data) so counts survive deploys/restarts.
const counterDir = process.env.COUNTER_DATA_DIR || path.join(__dirname, 'data');
const counterFile = path.join(counterDir, 'visit-stats.json');
let counterQueue = Promise.resolve();
const belgradeDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
async function readCounter() {
  try {
    const data = JSON.parse(await fs.readFile(counterFile, 'utf8'));
    return { total: Number.isSafeInteger(data.total) && data.total >= 0 ? data.total : 0,
      daily: data.daily && typeof data.daily === 'object' && !Array.isArray(data.daily) ? data.daily : {} };
  } catch (err) {
    if (err.code === 'ENOENT') return { total: 0, daily: {} };
    throw err;
  }
}
async function updateCounter(shouldCount) {
  let result;
  const task = counterQueue.then(async () => {
    await fs.mkdir(counterDir, { recursive: true });
    const stats = await readCounter();
    const today = belgradeDate();
    if (shouldCount) {
      stats.total += 1;
      stats.daily[today] = (Number.isSafeInteger(stats.daily[today]) ? stats.daily[today] : 0) + 1;
      // Keep the last 400 days of daily totals; total remains cumulative.
      for (const day of Object.keys(stats.daily)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || (Date.parse(day + 'T00:00:00Z') < Date.now() - 400 * 86400000)) delete stats.daily[day];
      }
      await fs.writeFile(counterFile, JSON.stringify(stats), 'utf8');
    }
    result = { total: stats.total, today: Number(stats.daily[today] || 0), date: today };
  });
  counterQueue = task.catch(() => {});
  await task;
  return result;
}
app.get('/api/visit-stats', async (req, res) => {
  try {
    const today = belgradeDate();
    const countedToday = req.cookies?.alex_visit_date === today ||
      String(req.headers.cookie || '').split(';').some(part => part.trim() === `alex_visit_date=${today}`);
    if (!countedToday) {
      res.setHeader('Set-Cookie', `alex_visit_date=${today}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax; Secure`);
    }
    const stats = await updateCounter(!countedToday);
    res.setHeader('Cache-Control', 'no-store');
    return res.json(stats);
  } catch (err) {
    console.error('Visit counter error:', err.message);
    return res.status(503).json({ error: 'Statistika trenutno nije dostupna.' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/telegram-request', async (req, res) => {
  console.log('Received Telegram request:', String(req.body?.type || 'unknown'));
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('Telegram configuration missing:', { tokenPresent: Boolean(token), chatIdPresent: Boolean(chatId) });
    return res.status(503).json({ error: 'Slanje zahteva trenutno nije podešeno. Pokušaj kasnije.' });
  }

  const type = String(req.body?.type || '');
  const email = String(req.body?.email || '').trim();
  const name = String(req.body?.name || '').trim();
  const phone = String(req.body?.phone || '').trim();
  const plan = String(req.body?.plan || '').trim();
  if (!allowedTypes.has(type)) return res.status(400).json({ error: 'Nepoznat tip zahteva.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Unesi ispravnu e-mail adresu.' });
  if (type === 'package' && (!name || name.length > 120 || !phone || phone.length > 60)) return res.status(400).json({ error: 'Unesi ime i prezime i broj telefona.' });
  if (type === 'package' && !allowedPlans.has(plan)) return res.status(400).json({ error: 'Izaberi važeći paket.' });

  const labels = { test: '🆓 BESPLATAN IPTV TEST', package: '📦 ZAHTEV ZA IPTV PAKET' };
  const lines = [labels[type], '', `E-mail: ${esc(email)}`];
  if (type === 'package') lines.push(`Ime i prezime: ${esc(name)}`, `Telefon: ${esc(phone)}`);
  if (type === 'package') lines.push(`Paket: ${esc(plan)}`, `Cena: ${prices[plan]}`);
  lines.push('', `Vreme: ${new Date().toLocaleString('sr-RS', { timeZone: 'Europe/Belgrade' })}`);

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), disable_web_page_preview: true })
    });
    const result = await tg.json();
    if (!tg.ok || !result.ok) {
      console.error('Telegram API request failed:', result.description || tg.status);
      return res.status(502).json({ error: 'Telegram nije prihvatio poruku. Pokušaj ponovo kasnije.' });
    }
    console.log('Telegram notification sent successfully.');
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
