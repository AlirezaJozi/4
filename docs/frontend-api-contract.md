# قرارداد فرانت‌اند با API کلینیک زیبایی

نسخه بررسی: ۲۰۲۶-۱۰-۲۳  
دامنه بررسی: فقط بک‌اند `C:\Users\User\Desktop\clinic-api`  
وضعیت: فاز ۱ (بررسی بک‌اند) — هیچ فایل فرانت‌اند و هیچ کد بک‌اند تغییر نکرده است.

---

## ۱. روش بررسی و نتیجه اجرای واقعی

فایل‌های خوانده‌شده:

- `package.json`, `.env.example`, `README.md`, `openapi.md`, `DELIVERY_REPORT.md`
- همه فایل‌های `src/`
- `database/schema.sql`
- `tests/` و `scripts/create-admin.js`

دستورهای اجراشده و خروجی واقعی:

| بررسی | نتیجه |
|---|---|
| `npm test` | موفق: ۳ suite، ۸ تست از ۸ تست |
| `npm run check` | موفق |
| `node src/server.js` | سرور روی پورت ۴۰۰۰ بالا آمد |
| `GET /api/v1/csrf` | `200` و ست‌شدن کوکی `clinic_csrf` |
| `GET /api/v1/does-not-exist` | `404` با قالب استاندارد خطا |
| `OPTIONS /api/v1/services` با Origin مجاز | `204` و `Access-Control-Allow-Origin: http://localhost:3000` |
| `OPTIONS` با Origin غیرمجاز | بدون هدر `Access-Control-Allow-Origin` (مرورگر بلاک می‌کند) |
| `GET /api/v1/health` | `500` با پیام `connect ECONNREFUSED 127.0.0.1:3306` |
| `GET /uploads/<uuid>.webp` ناموجود | `500` (نه ۴۰۴) و افشای مسیر مطلق در حالت development |
| `PATCH /api/v1/admin/clinic` با کوکی جعلی نشست و بدون CSRF | `403` |

وضعیت سرویس‌های بیرونی:

- MySQL در دسترس نیست: سرویس‌های WAMP با نام‌های `wampmariadb64` و `wampmysqld64` در وضعیت `Stopped` هستند و پورت `3306` باز نیست.
- SMTP تنظیم نشده است: `SMTP_HOST`، `MAIL_FROM` و `ADMIN_NOTIFICATION_EMAIL` خالی‌اند.
- به همین دلیل هیچ Endpoint وابسته به دیتابیس با داده واقعی اجرا نشد. نمونه‌های این سند برای این Endpointها «از کد استخراج‌شده» هستند، نه خروجی واقعی. موارد واقعی با برچسب «اجراشده» مشخص شده‌اند.

مقادیر غیرحساس محیط فعلی:

- `PORT=4000`، `PUBLIC_BASE_URL=http://localhost:4000`
- `CORS_ORIGIN=http://localhost:3000`
- `COOKIE_SECURE=false`، `CSRF_COOKIE_NAME=clinic_csrf`
- `OTP_LENGTH=6`، `OTP_TTL_SECONDS=300`، `OTP_RESEND_SECONDS=60`، `OTP_MAX_ATTEMPTS=5`
- `MAX_UPLOAD_BYTES=5242880`، `MAX_IMAGE_WIDTH=5000`، `MAX_IMAGE_HEIGHT=5000`
- `DB_PASSWORD` و `JWT_SECRET` و `SESSION_SECRET` مقدار دارند (مقدار آن‌ها در این سند ثبت نشده است).

---

## ۲. آدرس پایه، CORS و کوکی‌ها

- Base URL: `http://localhost:4000/api/v1`
- فایل‌های آپلود: `http://localhost:4000/uploads/...` (خارج از `/api/v1`)
- CORS از `CORS_ORIGIN` خوانده می‌شود و می‌تواند با کاما چند Origin داشته باشد. `credentials: true` است.
- Origin فعلی فقط `http://localhost:3000` است. فرانت‌اند باید روی همین Origin اجرا شود یا `.env` بک‌اند با تأیید تغییر کند.
- در همه درخواست‌های احراز هویت‌شده باید `credentials: 'include'` استفاده شود.
- کوکی نشست: `clinic_session`، `HttpOnly`، `SameSite=Strict`، `Secure` فقط اگر `COOKIE_SECURE=true` باشد، عمر ۲۸۸۰۰ ثانیه.
- کوکی CSRF: `clinic_csrf`، عمداً `HttpOnly=false` تا فرانت بتواند بخواند، `SameSite=Strict`.
- `SameSite=Strict` یعنی فرانت و API باید same-site باشند. `localhost:3000` و `localhost:4000` same-site هستند؛ `localhost` و `127.0.0.1` برای کوکی یکسان نیستند و باعث می‌شود نشست ارسال نشود.
- هیچ مکانیزم refresh یا sliding expiry برای نشست وجود ندارد؛ پس از انقضا، هر درخواست پنل `401` می‌گیرد.

### CSRF

1. `GET /api/v1/csrf` را صدا بزنید.
2. توکن هم در `data.csrfToken` برمی‌گردد و هم در کوکی `clinic_csrf` ست می‌شود.
3. برای هر درخواست تغییردهنده مدیر (POST/PATCH/PUT/DELETE) هدر `x-csrf-token` را برابر مقدار کوکی بفرستید.
4. هر بار صدا زدن `/csrf` توکن جدید می‌سازد و کوکی را عوض می‌کند؛ آن را یک بار بگیرید و در حین عملیات‌های موازی دوباره نگیرید.

معاف‌ها از CSRF:

- همه GET/HEAD/OPTIONS
- `POST /admin/auth/login`
- `POST /admin/auth/verify-otp`
- `POST /admin/auth/resend-otp`
- `POST /consultation-requests`

نکته مهم: `POST /admin/auth/logout` معاف نیست و چون کوکی نشست وجود دارد، CSRF لازم دارد.

---

## ۳. قالب پاسخ‌ها، نام‌گذاری و انواع داده

پاسخ موفق:

```json
{
  "success": true,
  "message": "پیام فارسی",
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

- `meta` فقط در فهرست‌های صفحه‌بندی‌شده وجود دارد.
- پاسخ‌های تک‌منبعی فقط `data` دارند.
- خطا:

```json
{ "success": false, "message": "پیام فارسی", "errors": [] }
```

- در خطای اعتبارسنجی Zod، `errors` آرایه‌ای از `{ "path": ["field"], "message": "..." }` است. پیام‌های Zod به انگلیسی هستند.
- در سایر خطاها `errors` معمولاً آرایه خالی است.

نکات نوع داده که فرانت باید نرمال‌سازی کند:

- ورودی‌ها camelCase هستند (`categoryId`, `isPublished`, `preferredDate`).
- خروجی‌های دیتابیس snake_case هستند (`category_id`, `is_published`, `preferred_date`). یک لایه mapper لازم است.
- فیلدهای Boolean دیتابیس به‌صورت `0` و `1` برمی‌گردند، نه `true/false`.
- فیلدهای `DECIMAL` مثل `price`، `latitude` و `longitude` به‌صورت رشته برمی‌گردند (مثلاً `"1500000.00"`).
- زمان‌ها به‌صورت رشته برمی‌گردند (مثلاً `"2026-10-23 10:44:00"`).
- فیلدهای `TIME` ممکن است `"09:00:00"` باشند، در حالی که ورودی مدیر فقط `"09:00"` می‌پذیرد.

### صفحه‌بندی، جست‌وجو و فیلتر

- `page` پیش‌فرض ۱، `limit` پیش‌فرض ۲۰ و حداکثر ۱۰۰.
- فهرست‌ها `meta` شامل `page`, `limit`, `total`, `totalPages` دارند.
- `GET /services`: `search` روی `title` و `short_description`؛ `categoryId`.
- `GET /portfolio`: `categoryId`, `serviceId`؛ جست‌وجوی متنی ندارد.
- `GET /admin/services`: `search` روی `title` و `slug`؛ `categoryId`, `isPublished`.
- `GET /admin/portfolio`: `search` روی `title` و `slug`؛ `categoryId`, `isPublished`.
- `GET /admin/consultation-requests`: `status`, `serviceId`, `search` (تلفن/نام/نام خانوادگی)، `dateFrom`, `dateTo` (بر اساس `created_at`، نه `preferred_date`).
- `GET /admin/audit-logs`: `adminId`, `entityType`.

---

## ۴. جریان احراز هویت مدیر

```text
POST /admin/auth/login
  { email, password }
      ↓  200 { challengeId, expiresIn }
  ایمیل حاوی OTP ارسال می‌شود (در محیط فعلی SMTP خالی است)
      ↓
POST /admin/auth/verify-otp
  { challengeId, otp }
      ↓  200 { admin: { id, email } } + Set-Cookie: clinic_session
POST /admin/auth/resend-otp
  { challengeId }
      ↓  200 { expiresIn }
GET /admin/auth/me
      ↓  200 { id, email, created_at }
POST /admin/auth/logout   (نیازمند CSRF)
      ↓  200 data: null
```

قوانین:

- `email`: معتبر و حداکثر ۱۹۰ کاراکتر.
- `password`: حداقل ۸ و حداکثر ۱۲۸ کاراکتر. اسکریپت ساخت مدیر حداقل ۱۲ کاراکتر می‌خواهد؛ برای فرم ورود حداقل ۸ کافی است.
- `challengeId`: UUID.
- `otp`: دقیقاً ۶ رقم (`OTP_LENGTH`).
- خطای ایمیل/رمز: `401` با پیام «ایمیل یا رمز عبور نادرست است».
- OTP نادرست: `401`.
- OTP منقضی/استفاده‌شده: `401`.
- اتمام تلاش‌ها یا ارسال مجدد زودهنگام: `429`.
- `challengeId` نامعتبر برای resend: `400` با پیام «چالش معتبر نیست».
- OTP هرگز در پاسخ API برنمی‌گردد.
- `login` حتی وقتی `notifyAdmin` شکست بخورد یا SMTP تنظیم نشده باشد، پاسخ موفق می‌دهد. در محیط فعلی کاربر `challengeId` می‌گیرد ولی ایمیلی نمی‌رسد.
- پاسخ `login` فقط `expiresIn` (۳۰۰ ثانیه) دارد. مقدار `OTP_RESEND_SECONDS` (۶۰ ثانیه) یا زمان دقیق مجاز بودن ارسال مجدد در پاسخ نیست؛ فرانت نمی‌تواند شمارنده را از API بگیرد.

---

## ۵. فهرست کامل Endpointها

### ۵.۱ عمومی

| متد | مسیر | ورودی | پاسخ موفق | توضیح |
|---|---|---|---|---|
| GET | `/health` | — | `200 { data: { status: "ok" } }` | به دیتابیس وابسته است؛ در قطعی DB `500` می‌دهد. برای liveness فرانت مناسب نیست. |
| GET | `/csrf` | — | `200 { data: { csrfToken } }` + کوکی | هر بار توکن جدید |
| GET | `/services` | `page`, `limit`, `search`, `categoryId` | `200` آرایه + `meta` | فقط خدمات منتشرشده و دسته فعال |
| GET | `/services/:slug` | slug | `200` شیء خدمت + `careItems` + `faqs` | ۴۰۴ اگر منتشر نشده باشد |
| GET | `/service-categories` | — | `200` آرایه | فقط فعال و حذف‌نشده |
| GET | `/portfolio-categories` | — | `200` آرایه | فقط فعال و حذف‌نشده |
| GET | `/portfolio` | `page`, `limit`, `categoryId`, `serviceId` | `200` آرایه + `meta` | فقط منتشرشده |
| GET | `/portfolio/:slug` | slug | `200` شیء نمونه‌کار | ۴۰۴ اگر منتشر نشده باشد |
| GET | `/clinic` | — | `200` شیء key/value | فقط کلیدهای عمومی |
| GET | `/settings/public` | — | همان `/clinic` | alias |
| GET | `/branches` | — | `200` آرایه | فقط شعب فعال |
| GET | `/working-hours` | — | `200` آرایه | فقط شعب فعال |
| GET | `/closures` | — | `200` آرایه | فقط تعطیلی‌های امروز و آینده (بر اساس UTC) |
| POST | `/consultation-requests` | بدنه زیر | `201 { data: { id } }` | بدون CSRF؛ rate limit ۵ در ۱۵ دقیقه به ازای IP |

بدنه `POST /consultation-requests`:

```json
{
  "firstName": "سارا",
  "lastName": "احمدی",
  "phone": "09120000000",
  "serviceIds": [1, 2],
  "preferredDate": "2026-11-01",
  "preferredTimeRange": "16:00-18:00",
  "notes": "تماس عصر"
}
```

- `firstName`, `lastName`: trim شده، ۲ تا ۱۰۰ کاراکتر.
- `phone`: trim شده، ۷ تا ۳۰ کاراکتر؛ الگوی موبایل ایران در سرور اجباری نیست.
- `serviceIds`: آرایه ۱ تا ۱۰ عضو، اعداد صحیح مثبت و یکتا. رشته عددی هم با coerce پذیرفته می‌شود.
- `preferredDate`: اختیاری/Nullable، تاریخ معتبر `YYYY-MM-DD`.
- `preferredTimeRange`: اختیاری/Nullable، حداکثر ۱۰۰ کاراکتر، متن آزاد.
- `notes`: اختیاری/Nullable، حداکثر ۳۰۰۰ کاراکتر.
- همه خدمات باید published و حذف‌نشده باشند؛ در غیر این صورت `422`.
- فیلدهای ناشناخته (از جمله honeypot) توسط Zod حذف می‌شوند و هیچ اثری ندارند.

### ۵.۲ احراز هویت مدیر

| متد | مسیر | ورودی | پاسخ موفق | خطاهای مهم |
|---|---|---|---|---|
| POST | `/admin/auth/login` | `email`, `password` | `200 { data: { challengeId, expiresIn } }` | `401`, `422`, `429` |
| POST | `/admin/auth/verify-otp` | `challengeId`, `otp` | `200 { data: { admin } }` + کوکی | `401`, `429` |
| POST | `/admin/auth/resend-otp` | `challengeId` | `200 { data: { expiresIn } }` | `400`, `429` |
| GET | `/admin/auth/me` | — | `200 { data: { id, email, created_at } }` | `401`, `404` |
| POST | `/admin/auth/logout` | — | `200 { data: null }` | `401`, `403` |

rate limit ورود/OTP: ۲۰ درخواست در ۱۵ دقیقه؛ اگر ایمیل در بدنه باشد بر اساس ایمیل، وگرنه بر اساس IP. `verify-otp` و `resend-otp` ایمیل در بدنه ندارند، پس بر اساس IP محدود می‌شوند.

### ۵.۳ مدیریت محتوا و تنظیمات (همه نیازمند نشست؛ تغییردهنده‌ها نیازمند CSRF)

| متد | مسیر | ورودی | پاسخ موفق |
|---|---|---|---|
| POST | `/admin/uploads/images` | multipart فیلد `file` | `201 { data: { path, filename } }` |
| GET | `/admin/services` | `page`, `limit`, `search`, `categoryId`, `isPublished` | آرایه + meta |
| POST | `/admin/services` | بدنه service | `201 { id, ...body }` |
| PATCH | `/admin/services/:id` | همان بدنه به‌صورت partial | `200 { id, ...body }` |
| DELETE | `/admin/services/:id` | — | `200 { id }` (soft delete) |
| GET | `/admin/services/:id/care-items` | — | آرایه |
| PUT | `/admin/services/:id/care-items` | آرایه کامل | `200` آرایه |
| GET | `/admin/services/:id/faqs` | — | آرایه |
| PUT | `/admin/services/:id/faqs` | آرایه کامل | `200` آرایه |
| GET | `/admin/service-categories` | — | آرایه |
| POST | `/admin/service-categories` | بدنه category | `201 { id, ...body }` |
| PATCH | `/admin/service-categories/:id` | partial | `200 { id, ...body }` |
| DELETE | `/admin/service-categories/:id` | — | `200 { id }`؛ در صورت وابستگی `409` |
| GET | `/admin/portfolio-categories` | — | آرایه |
| POST | `/admin/portfolio-categories` | بدنه portfolio category | `201` |
| PATCH | `/admin/portfolio-categories/:id` | partial | `200` |
| DELETE | `/admin/portfolio-categories/:id` | — | `200`؛ در صورت وابستگی `409` |
| GET | `/admin/portfolio` | `page`, `limit`, `search`, `categoryId`, `isPublished` | آرایه + meta |
| POST | `/admin/portfolio` | multipart: متن‌ها + `beforeImage` + `afterImage` | `201` |
| PATCH | `/admin/portfolio/:id` | multipart partial (حداقل یک فیلد یا تصویر) | `200` |
| DELETE | `/admin/portfolio/:id` | — | `200` (soft delete) |
| GET | `/admin/clinic` | — | شیء همه تنظیمات |
| PATCH | `/admin/clinic` | شیء کلید/مقدار مجاز | `200` شیء تنظیمات |
| GET | `/admin/branches` | — | آرایه |
| POST | `/admin/branches` | بدنه branch | `201 { id, ...body }` |
| PATCH | `/admin/branches/:id` | partial | `200 { id, ...body }` |
| GET | `/admin/working-hours` | — | آرایه همه شعب |
| PUT | `/admin/working-hours` | `{ branchId, hours: [] }` | `200` آرایه |
| GET | `/admin/closures` | — | آرایه همه تعطیلی‌ها |
| PUT | `/admin/closures` | `{ branchId, closures: [] }` | `200` آرایه |
| GET | `/admin/consultation-requests` | `page`, `limit`, `status`, `serviceId`, `search`, `dateFrom`, `dateTo` | آرایه + meta |
| GET | `/admin/consultation-requests/:id` | — | شیء + `services` |
| PATCH | `/admin/consultation-requests/:id` | `status?`, `internalNote?`, `followUpResult?` | `200 { id, ...body }` |
| GET | `/admin/audit-logs` | `page`, `limit`, `adminId`, `entityType` | آرایه + meta |

نکته: `GET /admin/services/:id` و `GET /admin/portfolio/:id` وجود ندارند. برای ویرایش با شناسه در لینک مستقیم، باید فهرست کامل را صفحه‌به‌صفحه گرفت یا وضعیت را در حافظه نگه داشت.

---

## ۶. نمونه‌های Request/Response

### ۶.۱ نمونه‌های واقعی (اجراشده)

`GET /api/v1/csrf`:

```http
HTTP/1.1 200 OK
Set-Cookie: clinic_csrf=<token>; Max-Age=28800; Path=/; SameSite=Strict
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "توکن CSRF دریافت شد",
  "data": { "csrfToken": "<64-char-hex>" }
}
```

`GET /api/v1/does-not-exist`:

```json
{ "success": false, "message": "مسیر مورد نظر پیدا نشد", "errors": [] }
```

`GET /api/v1/health` بدون MySQL:

```json
{ "success": false, "message": "connect ECONNREFUSED 127.0.0.1:3306", "errors": [] }
```

پاسخ واقعی `POST /api/v1/consultation-requests` با بدنه ناقص در تست:

```json
{
  "success": false,
  "message": "داده‌های ورودی نامعتبر است",
  "errors": [
    { "path": ["firstName"], "message": "String must contain at least 2 character(s)" },
    { "path": ["lastName"], "message": "Required" },
    { "path": ["phone"], "message": "Required" },
    { "path": ["serviceIds"], "message": "Required" }
  ]
}
```

### ۶.۲ نمونه‌های استخراج‌شده از کد (بدون اجرای واقعی)

`GET /services?page=1&limit=20`:

```json
{
  "success": true,
  "message": "فهرست خدمات",
  "data": [
    {
      "id": 1,
      "title": "عنوان خدمت",
      "name": "نام خدمت",
      "slug": "service-slug",
      "category_id": 1,
      "category_title": "عنوان دسته",
      "short_description": "توضیح کوتاه",
      "description": "توضیح کامل",
      "image_main": "/uploads/uuid.webp",
      "image_secondary": null,
      "price": "1500000.00",
      "show_price": 1,
      "price_text": null,
      "duration_minutes": 60,
      "complications": null,
      "pre_care": null,
      "after_care": null,
      "sort_order": 0,
      "published_at": "2026-10-23 10:00:00"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

`GET /services/:slug` علاوه بر فیلدهای بالا `s.*` (شامل `is_published`, `created_at`, `updated_at`, `deleted_at`) و این‌ها را دارد:

```json
{
  "careItems": [
    { "id": 1, "item_type": "pre", "title": "عنوان", "content": "متن", "sort_order": 0 }
  ],
  "faqs": [
    { "id": 1, "question": "سؤال", "answer": "پاسخ", "sort_order": 0 }
  ]
}
```

`POST /admin/auth/login`:

```json
{
  "success": true,
  "message": "کد یک‌بارمصرف ارسال شد",
  "data": { "challengeId": "9f1c2f7e-...-...", "expiresIn": 300 }
}
```

`POST /admin/auth/verify-otp`:

```http
HTTP/1.1 200 OK
Set-Cookie: clinic_session=<jwt>; Max-Age=28800; Path=/; HttpOnly; SameSite=Strict
```

```json
{
  "success": true,
  "message": "ورود موفق بود",
  "data": { "admin": { "id": 1, "email": "admin@example.com" } }
}
```

`POST /consultation-requests` موفق:

```json
{
  "success": true,
  "message": "درخواست مشاوره ثبت شد",
  "data": { "id": 12 }
}
```

`GET /admin/consultation-requests/:id`:

```json
{
  "success": true,
  "data": {
    "id": 12,
    "first_name": "سارا",
    "last_name": "احمدی",
    "phone": "09120000000",
    "preferred_date": "2026-11-01",
    "preferred_time_range": "16:00-18:00",
    "notes": "تماس عصر",
    "status": "new",
    "internal_note": null,
    "follow_up_result": null,
    "created_at": "2026-10-23 10:00:00",
    "updated_at": "2026-10-23 10:00:00",
    "services": [{ "id": 1, "title": "عنوان خدمت", "slug": "service-slug" }]
  }
}
```

`PATCH /admin/consultation-requests/:id`:

```json
{ "status": "contacting", "internalNote": "تماس فردا", "followUpResult": null }
```

پاسخ: `200 { "data": { "id": 12, "status": "contacting", "internalNote": "تماس فردا", "followUpResult": null } }`

---

## ۷. قوانین اعتبارسنجی ورودی مدیر

### خدمات

| فیلد | قانون |
|---|---|
| `title` | ۲ تا ۱۹۰ کاراکتر، trim |
| `name` | اختیاری، حداکثر ۱۹۰؛ پیش‌فرض در سرور برابر `title` |
| `slug` | اجباری، فقط `a-z0-9` و خط تیره: `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `categoryId` | عدد صحیح مثبت و دسته فعال |
| `shortDescription` | حداکثر ۱۰۰۰ |
| `description` | حداکثر ۱۰۰۰۰ |
| `imageMain`, `imageSecondary` | مسیر `/uploads/<uuid>.webp` یا null |
| `price` | عدد غیرمنفی یا null |
| `showPrice` | Boolean، پیش‌فرض false؛ رشته `"true"`/`"false"` هم پذیرفته می‌شود |
| `priceText` | حداکثر ۱۹۰ |
| `durationMinutes` | عدد صحیح مثبت یا null |
| `complications`, `preCare`, `afterCare` | هرکدام حداکثر ۵۰۰۰ |
| `sortOrder` | عدد صحیح >= 0، پیش‌فرض 0 |
| `isPublished` | Boolean، پیش‌فرض false |

`PATCH` واقعاً partial است. تغییر `isPublished` به true مقدار `published_at` را در صورت خالی بودن پر می‌کند و false آن را null می‌کند.

### دسته‌بندی خدمات / نمونه‌کار

| فیلد | قانون |
|---|---|
| `title` | ۲ تا ۱۹۰ |
| `name` | فقط دسته خدمات؛ اختیاری، حداکثر ۱۹۰ |
| `slug` | مثل خدمات |
| `description` | حداکثر ۳۰۰۰ |
| `sortOrder` | >= 0 |
| `isActive` | Boolean، پیش‌فرض true |

فیلد `image` در دیتابیس و پاسخ عمومی وجود دارد، ولی هیچ‌کدام از بدنه‌های create/update آن را نمی‌پذیرند. امکان تنظیم تصویر دسته از طریق API وجود ندارد.

### مراقبت‌ها و FAQ

`PUT /admin/services/:id/care-items` آرایه کامل را جایگزین می‌کند:

```json
[
  { "itemType": "pre", "title": "عنوان", "content": "متن", "sortOrder": 0 },
  { "itemType": "complication", "title": "عنوان", "content": "متن", "sortOrder": 0 }
]
```

- `itemType`: یکی از `complication`, `pre`, `after`.
- `title`: ۱ تا ۱۹۰؛ `content`: ۱ تا ۵۰۰۰.

`PUT /admin/services/:id/faqs`:

```json
[
  { "question": "سؤال", "answer": "پاسخ", "sortOrder": 0 }
]
```

- `question`: ۱ تا ۵۰۰؛ `answer`: ۱ تا ۱۰۰۰۰.

هر دو آرایه کامل را جایگزین می‌کنند؛ آرایه خالی همه را حذف می‌کند.

### نمونه‌کار

- `POST` با `multipart/form-data`.
- فیلدهای متنی: `title` (۲-۱۹۰)، `slug`، `categoryId`، `serviceId` اختیاری، `description` (حداکثر ۵۰۰۰)، `sortOrder`، `isPublished` (رشته `"true"`/`"false"`).
- فایل‌ها: `beforeImage` و `afterImage` هر دو اجباری در ایجاد.
- `PATCH` partial است؛ می‌توان فقط متن یا فقط یکی از تصاویر را فرستاد. اگر هیچ فیلد مؤثری نباشد `422`.
- تصویر جدید جایگزین قبلی می‌شود و فایل قبلی حذف می‌گردد.

### شعب

| فیلد | قانون |
|---|---|
| `name` | ۲ تا ۱۹۰ |
| `address` | حداکثر ۵۰۰ |
| `phone` | حداکثر ۴۰ |
| `latitude` | ‎-90 تا 90 |
| `longitude` | ‎-180 تا 180 |
| `googleMapsUrl` | URL معتبر |
| `badge` | حداکثر ۱۹۰ |
| `isActive` | Boolean، پیش‌فرض true |
| `sortOrder` | >= 0 |

حذف شعبه وجود ندارد؛ می‌توان `isActive=false` کرد.

### ساعات کاری و تعطیلی‌ها

`PUT /admin/working-hours`:

```json
{
  "branchId": 1,
  "hours": [
    { "weekday": 0, "isClosed": false, "startTime": "09:00", "endTime": "13:00", "sortOrder": 0 },
    { "weekday": 0, "isClosed": false, "startTime": "16:00", "endTime": "20:00", "sortOrder": 1 }
  ]
}
```

- `weekday`: ۰ تا ۶. معنای عدد (۰=یکشنبه یا دوشنبه؟) در API مشخص نشده است.
- `startTime`/`endTime`: فقط `HH:MM` و `start < end`.
- روز تعطیل نباید بازه داشته باشد.
- بازه‌های یک روز نباید هم‌پوشانی داشته باشند.
- این Endpoint همه ساعات کاری آن شعبه را حذف و دوباره درج می‌کند؛ باید کل هفته را بفرستید.
- خروجی `TIME` ممکن است `"09:00:00"` باشد؛ اگر همان را دوباره بفرستید، اعتبارسنجی `HH:MM` رد می‌کند. فرانت باید به `HH:MM` نرمال کند.

`PUT /admin/closures`:

```json
{
  "branchId": 1,
  "closures": [
    { "closureDate": "2026-11-01", "reason": "تعطیل رسمی" }
  ]
}
```

- `closureDate`: `YYYY-MM-DD`.
- `reason`: حداکثر ۵۰۰.
- همه تعطیلی‌های آن شعبه جایگزین می‌شوند؛ آرایه خالی پاک می‌کند.

### تنظیمات کلینیک

`PATCH /admin/clinic` فقط این کلیدها را می‌پذیرد:

`name`, `intro`, `about`, `team`, `phone`, `email`, `address`, `socials`, `logo`, `footer`, `heroText`, `aboutText`

- مقدار همه رشته و حداکثر ۱۰۰۰۰ کاراکتر است.
- ساختار `team`, `socials`, `footer` تعریف نشده و متن آزاد است. اگر JSON ذخیره شود، API آن را parse نمی‌کند و به‌صورت رشته برمی‌گرداند.
- `logo` هم فقط رشته است؛ اعتبارسنجی مسیر تصویر ندارد.

### درخواست مشاوره (مدیر)

`PATCH /admin/consultation-requests/:id` فقط این فیلدها را می‌پذیرد و `.strict()` است؛ فیلد اضافه `422` می‌دهد:

- `status`: `new` | `contacting` | `contacted` | `completed` | `cancelled`
- `internalNote`: حداکثر ۵۰۰۰ یا null
- `followUpResult`: حداکثر ۵۰۰۰ یا null

حذف درخواست وجود ندارد. فهرست، `internal_note` و `follow_up_result` را هم برمی‌گرداند.

---

## ۸. تصاویر و فایل‌ها

- آپلود عمومی مدیر: `POST /admin/uploads/images` با `multipart/form-data` و فیلد `file`. نیازمند نشست و CSRF.
- فرمت‌های مجاز: JPEG، PNG، WebP (بر اساس محتوای واقعی، نه فقط MIME).
- حجم حداکثر ۵ مگابایت، ابعاد حداکثر ۵۰۰۰×۵۰۰۰.
- خروجی همیشه WebP با UUID است: `/uploads/<uuid>.webp`.
- پاسخ آپلود: `201 { "data": { "path": "/uploads/<uuid>.webp", "filename": "<uuid>.webp" } }`.
- فایل‌ها از ریشه `PUBLIC_BASE_URL` سرو می‌شوند: `http://localhost:4000/uploads/...`، نه زیر `/api/v1`.
- پاسخ‌های API فقط مسیر نسبی می‌دهند؛ فرانت باید Base آپلود را از `PUBLIC_BASE_URL` بسازد.
- برای خدمات، ابتدا تصویر را آپلود کنید و سپس مسیر را در `imageMain`/`imageSecondary` بفرستید. ایجاد خدمت JSON است و multipart نیست.
- برای نمونه‌کار، تصاویر در همان درخواست multipart با نام‌های `beforeImage` و `afterImage` ارسال می‌شوند.
- محدودیت Multer: حداکثر ۲ فایل و ۳۰ فیلد برای درخواست‌های نمونه‌کار.
- تصویر دسته‌بندی قابل مدیریت نیست.
- اگر فایل آپلودشده بعداً ناموجود باشد، `GET /uploads/...` در حال حاضر `500` می‌دهد (نه `404`).

---

## ۹. زمان، تاریخ شمسی و ساعات کاری

- تاریخ‌ها در ورودی/خروجی میلادی و `YYYY-MM-DD` هستند؛ نمایش شمسی وظیفه فرانت است.
- `preferredDate` تاریخ تنهاست و منطقه زمانی ندارد.
- `preferredTimeRange` متن آزاد است، نه اسلات ساخت‌یافته.
- `created_at` و `updated_at` به‌صورت رشته بدون suffix منطقه زمانی برمی‌گردند.
- بخشی از زمان‌ها با `UTC_TIMESTAMP()` نوشته می‌شوند (`expires_at`, `published_at`, `used_at`) و بخشی با `CURRENT_TIMESTAMP` پیش‌فرض جدول (`created_at`, `updated_at`). وابستگی `created_at` به timezone سرور MySQL تعریف نشده است. این موضوع روی فیلترهای `dateFrom`/`dateTo` و تبدیل شمسی اثر دارد.
- API هیچ فیلد timezone یا تنظیمات منطقه زمانی کلینیک ندارد. ساعات کاری به‌صورت زمان محلی و بدون timezone ذخیره می‌شوند.
- `weekday` عدد ۰ تا ۶ است اما نگاشت آن به روزهای هفته در قرارداد مشخص نشده است.

---

## ۱۰. سئو

- هیچ فیلد `metaTitle`، `metaDescription`، `ogImage` یا canonical در دیتابیس و API وجود ندارد.
- تنها منابع قابل استفاده: `title`, `short_description`, `description`, `image_main`, `before_image`, `after_image`, `clinic.settings`.
- بنابراین سئوی پایه با fallback قابل ساخت است، اما الزام «title و meta از API» با قرارداد فعلی به‌طور کامل برآورده نمی‌شود.
- `sitemap` را می‌توان از `GET /services`، `GET /portfolio` و slugها ساخت.

---

## ۱۱. مشکلات و ناهماهنگی‌ها

### Blocker

| # | مورد | اثر | پیشنهاد |
|---|---|---|---|
| B1 | MySQL در دسترس نیست (`3306` بسته، سرویس‌های WAMP Stop) | هیچ Endpoint داده‌ای واقعی اجرا نشد؛ E2E و اعتبارسنجی قرارداد با داده واقعی ممکن نیست | با تأیید شما سرویس MySQL را بالا بیاوریم و `schema.sql` را روی دیتابیس تستی اجرا کنیم. دیتابیس تولیدی فعلی را دست نمی‌زنیم. |
| B2 | SMTP خالی است (`SMTP_HOST`, `MAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`) | `login` موفق می‌شود ولی OTP ارسال نمی‌شود؛ ورود واقعی مدیر و تست E2E ورود دومرحله‌ای غیرممکن است | یا SMTP تستی تنظیم شود، یا با تأیید صریح شما یک مکانیزم فقط-توسعه برای مشاهده OTP اضافه شود. تا آن زمان ورود واقعی مدیر را «تکمیل‌شده» اعلام نمی‌کنیم. |
| B3 | فیلدهای SEO در API نیست | الزام «meta title/description از API» قابل تحقق نیست | یا با تأیید شما migration و فیلدهای SEO به بک‌اند اضافه شود، یا شما صریحاً fallback از `title`/`description` را بپذیرید. |

### مهم

| # | مورد | اثر |
|---|---|---|
| I1 | Honeypot در بک‌اند پیاده نشده و فیلد ناشناخته حذف می‌شود | فیلد مخفی فرانت هیچ اثری ندارد. برای تحقق الزام، بک‌اند باید فیلد مشخص (مثلاً `website`) را بشناسد و در صورت پر بودن، بی‌صدا رد کند یا `422` بدهد. |
| I2 | `GET /admin/services/:id` و `GET /admin/portfolio/:id` وجود ندارد | برای ویرایش با لینک مستقیم باید همه صفحات فهرست را گرفت؛ تجربه پنل و deep-link ضعیف می‌شود. |
| I3 | زمان‌های خروجی `HH:MM:SS` و ورودی `HH:MM` | ذخیره مجدد ساعات کاری بدون نرمال‌سازی `422` می‌دهد. |
| I4 | معنای `weekday` (۰=یکشنبه یا دوشنبه) مشخص نیست | نمایش روزهای هفته ممکن است یک روز جابه‌جا شود. باید در قرارداد قطعی شود. |
| I5 | منطقه زمانی مبهم و ترکیب `CURRENT_TIMESTAMP` با `UTC_TIMESTAMP()` | تبدیل شمسی و فیلتر تاریخ می‌تواند اشتباه شود. |
| I6 | `OTP_RESEND_SECONDS` در پاسخ login/resend نیست | شمارنده ارسال مجدد باید حدس زده شود؛ امکان نمایش دقیق وجود ندارد. باید `resendAfter` یا `resendAvailableAt` اضافه شود. |
| I7 | `team`, `socials`, `footer`, `logo` متن آزاد بدون schema | صفحه «کادر درمان» و شبکه‌های اجتماعی قابل رندر مطمئن نیستند. باید ساختار JSON مشخص شود. |
| I8 | محتوای مراقبت هم در ستون‌های `services` و هم در `service_care_items` وجود دارد | منبع حقیقت مشخص نیست؛ نمایش تکراری یا ناسازگار ممکن است. |
| I9 | تصویر دسته‌بندی‌ها نه در create و نه در update پذیرفته نمی‌شود | کاربر نمی‌تواند تصویر دسته را از پنل تنظیم کند، هرچند API عمومی آن را برمی‌گرداند. |
| I10 | `slug` فقط ASCII است | برای عنوان فارسی باید فرانت transliterate کند یا کاربر دستی slug انگلیسی وارد کند؛ تجربه فرم ضعیف می‌شود. |
| I11 | پیام‌های خطای Zod انگلیسی‌اند | نگاشت خطا به فارسی و به فیلد باید در فرانت انجام شود. |
| I12 | Endpoint فهرست دسته‌ها `image` دارد ولی آپلود دسته وجود ندارد | بخش تصویر در فرم دسته باید غیرفعال یا با پیام واضح باشد. |

### جزئی

| # | مورد | اثر |
|---|---|---|
| M1 | فایل آپلود ناموجود `500` می‌دهد و در development مسیر مطلق را افشا می‌کند | مدیریت broken image و امنیت اطلاعات محیط توسعه. |
| M2 | rate limit فرم عمومی ۵ در ۱۵ دقیقه بر اساس IP | تست‌های E2E تکراری ممکن است `429` بگیرند؛ برای تست باید IP/زمان کنترل شود. |
| M3 | `dateFrom`/`dateTo` و `status` در فهرست مدیر اعتبارسنجی Zod ندارند | ورودی بدشکل ممکن است نتیجه خالی یا خطای دیتابیس بدهد. |
| M4 | `isPublished` در query هر مقداری جز `true`/`1` را `0` می‌کند | مقدار نامعتبر به‌جای خطا، فیلتر «منتشرنشده» می‌دهد. |
| M5 | Type برنمی‌گرداند: Booleanها ۰/۱ و DECIMALها رشته‌اند | نیاز به نرمال‌سازی در لایه API فرانت. |
| M6 | هیچ Endpoint آمار داشبورد وجود ندارد | اگر داشبورد لازم باشد، فرانت باید از فهرست‌ها محاسبه کند. |
| M7 | تعویض تصویر خدمت فایل قدیمی را حذف نمی‌کند | فایل orphan در `uploads` جمع می‌شود. |
| M8 | `trust proxy` تنظیم نشده | در استقرار پشت reverse proxy، rate limit و IP audit ممکن است IP پروکسی را ببیند. |
| M9 | `GET /health` به DB وابسته است | برای liveness فرانت مناسب نیست؛ failure آن `500` است. |

---

## ۱۲. تصمیم‌های لازم قبل از فاز ۲/۳

1. **MySQL:** آیا اجازه می‌دهید سرویس WAMP MySQL را بالا بیاورم و یک دیتابیس تستی بسازم/اسکیما را اجرا کنم؟ بدون آن، تست E2E و تأیید داده واقعی انجام نمی‌شود.
2. **SMTP:** آیا SMTP تستی در اختیار دارید، یا با یک راهکار فقط-توسعه (مثلاً لاگ OTP یا Endpoint تست) موافق هستید؟ بک‌اند بدون تأیید شما تغییر نمی‌کند.
3. **SEO:** افزودن فیلدهای SEO به بک‌اند (با تأیید) یا پذیرش fallback از `title`/`description`؟
4. **Honeypot:** افزودن فیلد مشخص به قرارداد و بک‌اند (با تأیید) یا حذف این الزام از دامنه فرانت؟
5. **ساختار محتوای ساخت‌یافته:** `team` و `socials` به چه قالبی (JSON array/object) ذخیره شوند؟ این باید در قرارداد قطعی شود.
6. **منبع حقیقت مراقبت‌ها:** ستون‌های `complications`/`pre_care`/`after_care` یا جدول `service_care_items` یا هر دو؟

---

## ۱۳. ورودی‌های فاز ۲

این مقادیر در پیام شما به‌صورت placeholder مانده‌اند و باید قبل از طراحی مشخص شوند:

- فریم‌ورک/ابزار فرانت (Next.js یا React + Vite یا HTML/CSS/JS)
- سبک بصری: پالت رنگ، فونت فارسی، حس برند و سایت‌های مرجع
- لوگو و تصاویر: موجود است یا نه
- مسیر پروژه فرانت (مسیر بک‌اند کشف شد: `C:\Users\User\Desktop\clinic-api`)
- آدرس پایه API (کشف شد: `http://localhost:4000/api/v1`)

---

## ۱۴. محدودیت صریح این گزارش

- هیچ درخواست وابسته به MySQL در این فاز با داده واقعی اجرا نشد.
- هیچ ایمیل OTP یا اعلان مشاوره ارسال نشد.
- هیچ تغییر کد یا داده‌ای انجام نشد؛ تنها فایل این گزارش ایجاد شده است.
- نمونه‌های «استخراج‌شده از کد» ممکن است در جزئیات نوع داده (مثل رشته بودن DECIMAL) در زمان اجرا با MySQL واقعی نیاز به تأیید داشته باشند.
