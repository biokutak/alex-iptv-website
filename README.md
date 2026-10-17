# ALEX IPTV — Telegram obaveštenja

Ova verzija uklanja klikabilne tokove za registraciju i prijavu. Besplatan test traži samo e-mail. Zahtev za paket traži ime i prezime, e-mail, telefon i izbor jednog od četiri paketa. Oba zahteva šalju serversku poruku Telegram botu.

## Render podešavanje

1. U Renderu koristite **Web Service** (ne Static Site), povezan sa ovim repozitorijumom.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. U Environment Variables podesite `TELEGRAM_BOT_TOKEN` i `TELEGRAM_CHAT_ID`.
5. Deploy i proverite `/health` — treba da vrati `{"ok":true}`.
6. Pošaljite test zahtev i zahtev za paket sa sajta i proverite da li oba stižu u Telegram.

## Obaveštenja

- Test: samo e-mail adresa.
- Paket: ime i prezime, e-mail, telefon, izabrani paket i cena.
- Cene: 1 mesec 1.000 RSD; 3 meseca 2.500 RSD; 6 meseci 5.000 RSD; 12 meseci 10.000 RSD.

Bot token mora ostati u Render Environment Variables. Ne stavljajte ga u HTML ili GitHub.
