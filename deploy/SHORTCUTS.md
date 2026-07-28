# Hayat — iOS Shortcuts entegrasyonu

Apple Health **adım** ve Screen Time **uygulama/website süresi** verisini iPhone Shortcuts ile Hayat API’sine gönderir.

## 1. Token

1. Hayat web → **Yönetim → Shortcuts**
2. **Token oluştur** → bir kez görünen anahtarı kopyala
3. Shortcuts HTTP isteklerinde header:

```
X-Hayat-Shortcuts-Token: <TOKEN>
```

(Alternatif: `Authorization: Bearer <TOKEN>` — JWT ile karışmasın diye özel header tercih edilir.)

Test:

```
GET https://SENIN_DOMAIN_VEYA_IP/api/shortcuts/ping
Header: X-Hayat-Shortcuts-Token: <TOKEN>
```

## 2. Adımlar (son 7 gün)

**Endpoint:** `POST /api/shortcuts/steps`

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

### Shortcut iskeleti

1. `Repeat` 7 kez (0…6) — her iterasyonda bir gün
2. `Date` → Adjust by −N days
3. `Find Health Samples` → **Step Count**, Start Date is that day
4. `Calculate Statistics` → Sum (veya örnekleri topla)
5. Dictionary’ye `{date, steps}` ekle
6. Döngü bitince JSON body oluştur
7. `Get Contents of URL` → POST, headers Authorization + Content-Type `application/json`

> Health izni: Ayarlar → Shortcuts → Health → Step Count açık olmalı.

## 3. Ekran süresi (uygulama dakikaları)

**Endpoint:** `POST /api/shortcuts/screen-time`

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

### Shortcut iskeleti

1. `Get App & Website Usage` (iOS’ta Screen Time verisi; gün seç)
2. Her öğe için süre → **dakikaya** çevir (`Duration` → minutes)
3. `{ appName, minutes, kind }` listesi kur (`kind`: `app` veya `website`)
4. Body: `{ "days": [ { "date": "YYYY-MM-DD", "entries": [...] } ] }`
5. `POST /api/shortcuts/screen-time`

> Aynı güne tekrar gönderirsen o günün kayıtları **yeniden yazılır** (replace).
> Son 30 günden eski tarihler yok sayılır.

## 4. Otomasyon

Shortcuts → Automation → Time of Day (ör. 22:30) → shortcut’u çalıştır.  
Mümkünse **Ask Before Running** kapalı (iOS sürümüne göre arka plan kısıtı olabilir; gerekirse bildirime dokunman gerekir).

## 5. Hayat’ta görme

**Dijital** menüsü → son 7 gün adım grafiği + ekran süresi + uygulama kırılımı.
