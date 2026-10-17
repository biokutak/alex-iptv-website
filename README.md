# ALEX IPTV — dvojezični frontend

Ova verzija koristi pravi HTML/CSS tekstualni frontend umesto jedne velike slike, pa se vidljivi sadržaj menja između srpskog (SRB) i mađarskog (HU).

## Fajlovi
- `index.html` — frontend i postojeći modalni obrasci/katalog
- `catalog.json` — katalog stavki
- `server.js` — postojeći Telegram API backend, ne menjati tajne
- `package.json` — Node/Express podešavanje

## Postavljanje
1. Napravite rezervnu kopiju trenutnog projekta.
2. U GitHub repozitorijumu zamenite `index.html` ovim fajlom.
3. Ostavite `catalog.json`, `server.js` i `package.json` iz projekta.
4. Sačekajte Render deploy.
5. Proverite SRB/HU, otvaranje kataloga, probni zahtev i zahtev za paket.

Forme koriste postojeći `/api/telegram-request` endpoint. Cene su 1.000 / 2.500 / 5.000 / 10.000 RSD. Ne stavljajte Telegram token u frontend.
