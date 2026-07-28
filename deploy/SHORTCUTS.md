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

### Hızlı manuel test (önce bunu yap)

`days gerekli` hatası genelde gövdede `days` olmamasından gelir. Önce sabit JSON ile dene:

1. **URL İçeriğini Al** → URL: `.../api/shortcuts/steps`
2. Yöntem: **POST**
3. Başlıklar: token + `Content-Type: application/json`
4. **İstek Gövdesi** → **JSON**
5. Alan ekle:
   - Anahtar: `days` → Tip: **Dizi** (*Array*)
   - Diziye bir öğe ekle → Tip: **Sözlük** (*Dictionary*)
   - Sözlük alanları:
     - `date` = `2026-07-27` (metin, `yyyy-MM-dd`)
     - `steps` = `8000` (sayı)

**Tek gün kısayolu** (dizi kurmana gerek yok):

```json
{ "date": "2026-07-27", "steps": 8000 }
```

JSON gövdede üst seviyeye doğrudan `date` + `steps` koyabilirsin; API bunu kabul eder.

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

### URL İçeriğini Al ayarları

1. Aksiyon: **URL İçeriğini Al** (*Get Contents of URL*)
2. URL: `http://167.233.16.12/api/shortcuts/steps`
3. **Yöntem** → `POST`
4. **Başlıklar**:
   - `X-Hayat-Shortcuts-Token` → token
   - `Content-Type` → `application/json`
5. **İstek Gövdesi** → **JSON** (Form / Dosya değil)
6. Ya tek gün `{date, steps}`, ya da `days` dizisi

### Veriyi hazırlama (iskelet)

| Sıra | Türkçe aksiyon | İngilizce |
|------|----------------|-----------|
| 1 | Tekrar (7 kez) | Repeat |
| 2 | Tarih (N gün geri) | Date / Adjust Date |
| 3 | Sağlık Örneklerini Bul → Adım Sayısı | Find Health Samples → Step Count |
| 4 | İstatistikleri Hesapla → Toplam | Calculate Statistics → Sum |
| 5 | Sözlük `{date, steps}` | Dictionary |
| 6 | Listeye ekle | Add to Variable / List |
| 7 | **URL İçeriğini Al** POST JSON | Get Contents of URL |

> Health izni: **Ayarlar → Kısayollar → Sağlık → Adım Sayısı** açık olmalı.

## 3. Ekran süresi — POST

**URL:** `http://167.233.16.12/api/shortcuts/screen-time`

### Body örneği

```json
{
  "days": [
    {
      "date": "2026-07-27",
      "entries": [
        { "appName": "Instagram", "minutes": 48, "kind": "app" },
        { "appName": "Messages", "minutes": 22, "kind": "app" },
        { "appName": "example.com", "minutes": 15, "kind": "website" }
      ]
    }
  ]
}
```

### URL İçeriğini Al ayarları

Aynı şekilde **POST** + header’lar + **İstek Gövdesi = JSON**.

### Veriyi hazırlama

| Sıra | Türkçe aksiyon | İngilizce |
|------|----------------|-----------|
| 1 | Uygulama ve Web Sitesi Kullanımını Al | Get App & Website Usage |
| 2 | Süreleri dakikaya çevir | Convert / Get Duration |
| 3 | Sözlük listesi kur | Dictionary / List |
| 4 | **URL İçeriğini Al** POST | Get Contents of URL |

> Aynı güne tekrar gönderirsen o gün **yeniden yazılır**.  
> 30 günden eski tarihler yok sayılır.

## 4. Otomasyon

Kısayollar → **Otomasyon** → Günün Saati (ör. 22:30) → shortcut’u çalıştır.

## 5. Hayat’ta görme

**Dijital** menüsü → adım + ekran süresi grafikleri.

## Sık karıştırılan isimler

| Aradığın | Gerçek aksiyon (TR) | Gerçek aksiyon (EN) |
|----------|---------------------|---------------------|
| Send JSON / Send Request | **URL İçeriğini Al** | Get Contents of URL |
| Dictionary / Object | **Sözlük** | Dictionary |
| HTTP POST | URL İçeriğini Al → Yöntem: POST | Get Contents of URL → Method: POST |
