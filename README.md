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


## IPTV katalog

- `catalog.json` sadrži katalog metapodataka izveden iz dostavljene M3U liste: zemlje/grupe kanala, kategorije filmova i serija i nazive sadržaja.
- Frontend otvara KANALI → zemlja → kategorija → nazivi kanala; FILMOVI i SERIJE otvaraju kategorije pa naslove.
- Katalog ne sadrži privatne reprodukcione URL-ove, korisničko ime ni lozinku.
- Radi kao statički katalog; reprodukcija i sinhronizacija sa IPTV serverom nisu povezane. Neki veoma veliki VOD katalozi prikazuju ograničen broj naslova po kategoriji radi brzine.


## Brojač poseta sajta

Brojač je deo isključivo ovog ALEX IPTV WEB SAJTA. Ne povezuje se sa IPTV panelom, IPTV korisnicima, kanalima niti pretplatama. Koristi zaseban fajl `visit-stats.json`.

Za trajno čuvanje na Render-u, dodaj persistent disk ovom web servisu (mount path `/var/data`) i environment variable `COUNTER_DATA_DIR=/var/data`. Bez persistent diska, Render može obrisati lokalne podatke pri novom deploy-u ili restartu. Poseta iz istog pregledača broji se najviše jednom dnevno pomoću first-party cookie-ja; „ukupno” je zbir takvih dnevnih poseta, ne procena stvarnog broja različitih ljudi.


## Važna napomena za brojač (ispravka V2)

Početna stranica poziva `/api/visit-stats` na postojećem ALEX IPTV Telegram servisu `https://alex-iptv-telegram.onrender.com`, jer je javni sajt odvojen od API servisa. Zato se izmene `index.html` objavljuju na servisu sajta, a izmene `server.js` na postojećem Telegram API servisu. Ovo je i dalje isti ALEX IPTV sajt; ne koristi niti menja IPTV panel. Za trajno čuvanje brojača kroz redeploy/restart, podesiti persistent disk na Telegram API servisu sa mount path `/var/data` i `COUNTER_DATA_DIR=/var/data`.
