# Hayat — iOS Shortcuts entegrasyonu

Apple Health **adım** ve Screen Time **uygulama/website süresi** verisini iPhone Shortcuts ile Hayat API’sine gönderir.

> **Önemli:** Shortcuts’ta “Send JSON” diye bir aksiyon **yok**.  
> HTTP isteği için aksiyon adı: **URL İçeriğini Al** (İngilizce: *Get Contents of URL*).

## 1. Token

1. Hayat web → **Yönetim → Shortcuts**
2. **Token oluştur** → bir kez görünen anahtarı kopyala
3. Her istekte header ekle:

| Anahtar | Değer |
|---------|--------|
| `X-Hayat-Shortcuts-Token` | oluşturduğun token |
| `Content-Type` | `application/json` |

### Hızlı test (ping)

1. Yeni Shortcut → aksiyon ara: **URL İçeriğini Al**
2. URL: `http://167.233.16.12/api/shortcuts/ping`
3. Yöntem: **GET**
4. Başlıklar: `X-Hayat-Shortcuts-Token` = token
5. Çalıştır → `{ "ok": true, ... }` benzeri cevap gelmeli

## 2. Adımlar (son 7 gün) — POST

**URL:** `http://167.233.16.12/api/shortcuts/steps`

> **Kritik:** *Sağlık Örneklerini Bul* çıktısı **HTTP gövdesine otomatik gitmez.**  
> Shortcuts “karar vermez” — `URL İçeriğini Al` içinde **İstek Gövdesi → JSON → `days`** alanına listeyi **sen bağlamalısın**.  
> Bağlamazsan sunucu şunu döner: `JSON gövde boş`.

### Senin ekranın (Sağlık Örneklerini Bul) — doğru ayarlar

| Ayar | Değer |
|------|--------|
| Tür | Adımlar / Steps |
| Başlangıç Tarihi | son 7 gün içinde |
| Birim | sayı / count |
| Şuna göre grupla | Gün / Day |
| Eksikleri doldur | Açık |
| Sırala | Başlangıç Tarihi, Eskiden yeniye |

Bu adım sadece veriyi **toplar**. Sonraki adımlar JSON’a çevirip POST eder.

### Tam kısayol sırası (ekrandaki adımdan sonra)

1. **Değişkeni Ayarla** → ad: `GunlukAdimlar` → değer: **Liste** (boş)
2. **Her Birinde Tekrarla** → giriş: *Sağlık Örnekleri* (önceki aksiyon)
3. Döngü içinde:
   1. **Sağlık Örneği Ayrıntılarını Al** → **Değer** (*Value*) → adımlar
   2. **Sağlık Örneği Ayrıntılarını Al** → **Başlangıç Tarihi**
   3. **Tarihi Biçimlendir** → Özel → `yyyy-MM-dd`
   4. **Sözlük**:
      - `date` → biçimlendirilmiş tarih
      - `steps` → değer (sayı)
   5. **Değişkene Ekle** → `GunlukAdimlar` ← bu sözlük
4. **URL İçeriğini Al**
   - URL: `http://167.233.16.12/api/shortcuts/steps`
   - Yöntem: **POST**
   - Başlıklar: `X-Hayat-Shortcuts-Token` + `Content-Type: application/json`
   - **İstek Gövdesi** → **JSON**
   - Alan: `days` = değişken **`GunlukAdimlar`**
   - (isteğe bağlı) `source` = `shortcuts`

Başarılı cevap örneği: `{ "upserted": 7, "skipped": 0 }`.

### Hızlı manuel test (Health’siz)

Önce sabit gövde ile API’yi doğrula:

1. **URL İçeriğini Al** → POST `.../api/shortcuts/steps`
2. İstek Gövdesi → JSON → tek alanlar: `date` = `2026-07-27`, `steps` = `8000`

### Body örneği (çok gün)

```json
{
  "source": "shortcuts",
  "days": [
    { "date": "2026-07-22", "steps": 8120 },
    { "date": "2026-07-23", "steps": 10450 },
    { "date": "2026-07-24", "steps": 6900 }
  ]
}
```

> Health izni: **Ayarlar → Kısayollar → Sağlık → Adım Sayısı** açık olmalı.


## 3. Ekran süresi — POST (sade format)

**URL:** `http://167.233.16.12/api/shortcuts/screen-time`

Sadece **uygulama** satırları. Website yok. Her satır:

`UygulamaAdı (süre)` → örn. `Chrome (33m)`, `Shortcuts (2h 5m)`

API uygulama adını ve süreyi ayırır; süreyi dakikaya çevirir (`2h 5m` → 125).

### Body

```json
{
  "date": "2026-07-29",
  "apps": [
    "Chrome (33m)",
    "Shortcuts (2h 5m)",
    "Instagram (1h)"
  ]
}
```

`date` yoksa **bugün** kullanılır. Ham dizi de olur: `["Chrome (33m)", "Shortcuts (2h 5m)"]`.

### Shortcuts iskeleti

1. **Uygulama ve Web Sitesi Kullanımını Al** → sadece app’ler (website’leri atla)
2. Her app için metin satırı üret: `Ad (Xm)` / `Ad (Yh Zm)`
3. Listeyi `apps` alanına bağla
4. **URL İçeriğini Al** → POST → İstek Gövdesi **JSON**:
   - `date` = `yyyy-MM-dd`
   - `apps` = satır listesi

> Aynı güne tekrar gönderirsen o gün **yeniden yazılır**.  
> 30 günden eski tarihler yok sayılır.


## 4. Otomasyon

Kısayollar → **Otomasyon** → Günün Saati (ör. 22:30) → shortcut’u çalıştır.

## 5. Hayat’ta görme

**Dashboard** → Adım ve Ekran kartları (tıklayınca trend).  
Hedefler: **Yönetim → Haftalık Hedefler**.

## Sık karıştırılan isimler

| Aradığın | Gerçek aksiyon (TR) | Gerçek aksiyon (EN) |
|----------|---------------------|---------------------|
| Send JSON / Send Request | **URL İçeriğini Al** | Get Contents of URL |
| Dictionary / Object | **Sözlük** | Dictionary |
| HTTP POST | URL İçeriğini Al → Yöntem: POST | Get Contents of URL → Method: POST |
