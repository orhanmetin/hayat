# Hayat — Faz 1 Tamamlama Rehberi (Walkthrough)

Yaşam tarzı takip uygulamasının ilk adımı olan **Login ekranı, JWT tabanlı kimlik doğrulama yapısı ve temel proje iskeleti** başarıyla kuruldu.

## Gerçekleştirilen Çalışmalar

### 1. Backend: .NET 9.0 Web API (Clean Architecture)
4 katmanlı temiz mimari prensiplerine uygun olarak aşağıdaki yapılar kuruldu:
* **[Hayat.Domain](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Domain)**: Temel veritabanı modellerini içerir.
  * [User.cs](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Domain/Entities/User.cs) entity sınıfı oluşturuldu.
* **[Hayat.Application](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Application)**: DTO ve servis arayüzlerini (interface) barındırır.
  * [LoginRequest.cs](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Application/DTOs/LoginRequest.cs), [LoginResponse.cs](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Application/DTOs/LoginResponse.cs) ve servis interface'leri oluşturuldu.
* **[Hayat.Infrastructure](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Infrastructure)**: EF Core ve SQLite veritabanı işlemlerini, JWT ve şifreleme mantığını içerir.
  * [AppDbContext.cs](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Infrastructure/Data/AppDbContext.cs) (SQLite yapılandırması)
  * [SeedData.cs](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Infrastructure/Data/SeedData.cs): Veritabanını otomatik migrate eder ve başlangıç için `admin / Admin123!` kullanıcısını BCrypt ile hash'leyerek ekler.
  * [TokenService.cs](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Infrastructure/Services/TokenService.cs): Güvenli 256-bit HMAC JWT Token üretir (7 günlük geçerlilik).
  * [AuthService.cs](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Infrastructure/Services/AuthService.cs): Şifre doğrulaması yapar.
* **[Hayat.Api](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Api)**: Presentation katmanıdır.
  * [AuthController.cs](file:///c:/Users/TEMP/Documents/antigravity/hayat/backend/src/Hayat.Api/Controllers/AuthController.cs): Giriş yapma (`POST /api/auth/login`) ve oturum doğrulama (`GET /api/auth/me`) endpoint'lerini sunar.
  * CORS kuralları React dev sunucusu (`http://localhost:5173`) için yapılandırıldı.

### 2. Frontend: React + Vite + Tailwind CSS v3
Kullanıcının yerel ortamındaki Node.js sürümüne (`v18.15.0`) tam uyumluluk sağlamak adına kararlı ve performanslı **Tailwind CSS v3** sürümüyle aşağıdaki sayfalar ve state yapıları kuruldu:
* **Tema ve Görsel Arayüz**:
  * [index.css](file:///c:/Users/TEMP/Documents/antigravity/hayat/frontend/src/index.css): Sage Green (Adaçayı Yeşili) ağırlıklı, modern, minimalist ve sakinleştirici bir renk paleti.
  * Premium **glassmorphism** kartlar, canlı **gradient** geçişleri ve **micro-animations** (shake efekti, lift efekti) entegre edildi.
* **State ve Routing Yönetimi**:
  * [AuthContext.tsx](file:///c:/Users/TEMP/Documents/antigravity/hayat/frontend/src/contexts/AuthContext.tsx): Kullanıcı oturum durumunu, JWT saklama mantığını ve dark mode temasını tek bir global context üzerinde yönetir. Sayfa yenilendiğinde oturum durumunu korur.
  * [ProtectedRoute.tsx](file:///c:/Users/TEMP/Documents/antigravity/hayat/frontend/src/components/ProtectedRoute.tsx): Giriş yapmamış kullanıcıları otomatik olarak `/login` sayfasına yönlendiren route koruyucu.
  * [api.ts](file:///c:/Users/TEMP/Documents/antigravity/hayat/frontend/src/services/api.ts): Axios isteklerine JWT token'ını otomatik ekleyen ve 401 Unauthorized durumlarında oturumu sonlandıran interceptor yapısı.
* **Sayfalar**:
  * [LoginPage.tsx](file:///c:/Users/TEMP/Documents/antigravity/hayat/frontend/src/pages/LoginPage.tsx): Zod şema doğrulamalı, göz alıcı cam efekti ve mobil-first duyarlı form tasarımı. Koyu tema (dark mode) geçişi barındırır.
  * [DashboardPage.tsx](file:///c:/Users/TEMP/Documents/antigravity/hayat/frontend/src/pages/DashboardPage.tsx): Oturum açan kullanıcıları karşılayan; uyku, spor, deep work ve habit streak metriklerinin yer aldığı premium dashboard şablonu (Bottom Nav Bar iskeleti ile birlikte).

---

## Nasıl Test Edilir?

Şu anda hem .NET API sunucunuz hem de React frontend geliştirme sunucunuz arka planda çalışmaktadır. 

1. Tarayıcınızı açın ve şu adrese gidin:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Giriş ekranındaki bilgileri kullanarak sisteme erişebilirsiniz:
   * **Kullanıcı Adı:** `admin`
   * **Şifre:** `Admin123!`
3. Hatalı şifre girildiğinde oluşan sallantı (shake) efektini ve hata mesajını gözlemleyebilirsiniz.
4. Başarılı giriş sonrasında sizi karşılayan dashboard panelinde sağ üstteki güneş/ay butonuna tıklayarak **Karanlık Tema (Dark Mode)** geçişini test edebilirsiniz.
