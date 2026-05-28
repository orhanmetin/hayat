# Hayat — Hetzner Docker deployment

Sunucu IP örneği: **167.233.16.12**

## Mimari

```
Internet :80
    └── web (nginx) ── /api/* ──► api (.NET 9, :8080)
                                      └── SQLite volume (/data/hayat.db)
```

Frontend ve API aynı origin üzerinden sunulur (`/api`), CORS sorunu olmaz.

---

## 1. Sunucuda hazırlık

```bash
sudo apt update && sudo apt upgrade -y
# Docker + Compose zaten kurulu varsayılıyor

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp   # HTTPS için (ileride)
sudo ufw enable

sudo mkdir -p /opt/hayat
sudo chown $USER:$USER /opt/hayat
cd /opt/hayat
```

## 2. Projeyi al

```bash
git clone https://github.com/orhanmetin/hayat.git .
cp .env.example .env
nano .env
```

`.env` içinde mutlaka ayarlayın:

| Değişken | Örnek |
|----------|--------|
| `PUBLIC_URL` | `http://167.233.16.12` (domain varsa `https://hayat.example.com`) |
| `JWT_SECRET` | `openssl rand -base64 48` çıktısı |
| `STRAVA_CLIENT_ID` | Strava developer panel |
| `STRAVA_CLIENT_SECRET` | Strava developer panel |

## 3. Strava callback (canlı)

[Strava API Settings](https://www.strava.com/settings/api) → **Authorization Callback Domain**:

- IP ile: `167.233.16.12` (Strava bazen IP kabul etmez; domain + HTTPS tercih edilir)
- Domain ile: `yourdomain.com`

Uygulama callback URL’si otomatik: `{PUBLIC_URL}/api/strava/callback`

## 4. Build ve çalıştır

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
docker compose logs -f api
```

İlk açılışta migration + admin seed çalışır.

- **Giriş:** `admin` / `Admin123!` (hemen şifreyi değiştirmeniz önerilir)

## 5. Kontrol

```bash
curl -s -o /dev/null -w "%{http_code}" http://167.233.16.12/
curl -s http://167.233.16.12/api/strava/status
# 401 beklenir (auth yok) — API ayakta demektir
```

Tarayıcı: `http://167.233.16.12`

## 6. Güncelleme

```bash
cd /opt/hayat
git pull
docker compose build
docker compose up -d
```

## 7. HTTPS (önerilir)

Strava production için genelde HTTPS + domain gerekir. Seçenekler:

- **Caddy / Traefik** reverse proxy + Let’s Encrypt
- **Cloudflare** proxy önünde SSL

HTTPS sonrası `.env` içinde `PUBLIC_URL=https://yourdomain.com` yapıp:

```bash
docker compose up -d
```

Strava panelindeki callback domain’i de güncelleyin.

---

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| 502 / API yok | `docker compose logs api` |
| CORS hatası | `PUBLIC_URL` tarayıcıdaki origin ile aynı mı? |
| Strava bağlanmıyor | Callback URL ve `STRAVA_*` env |
| Veri kaybı | Volume: `docker volume inspect hayat_hayat-db` |

## Neon PostgreSQL

Şu an Docker imajı **SQLite** kullanır (mevcut migration’lar). Neon’a geçiş için repoda Npgsql + Postgres migration eklenmesi gerekir; connection string’i `.env` ile vermek yeterli olmaz.

---

## Faydalı komutlar

```bash
docker compose down          # durdur
docker compose down -v       # volume ile birlikte sil (VERİ GİDER)
docker compose exec api ls -la /data
```
