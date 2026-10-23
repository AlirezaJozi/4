# قرارداد API

Base URL: `/api/v1`

پاسخ موفق:

```json
{ "success": true, "message": "...", "data": {}, "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 } }
```

پاسخ خطا:

```json
{ "success": false, "message": "...", "errors": [] }
```

## عمومی

- `GET /health`
- `GET /csrf`
- `GET /services` و `GET /services/:slug`
- `GET /service-categories`
- `GET /portfolio-categories`, `GET /portfolio`, `GET /portfolio/:slug`
- `GET /clinic` و `GET /settings/public`
- `GET /branches`, `GET /working-hours`, `GET /closures`
- `POST /consultation-requests`

`POST /consultation-requests` با `firstName`, `lastName`, `phone`, آرایه‌ی یکتای `serviceIds` و فیلدهای اختیاری `preferredDate`, `preferredTimeRange`, `notes` انجام می‌شود. فقط خدمات منتشرشده پذیرفته می‌شوند و درج درخواست و جدول واسط در یک تراکنش انجام می‌شود.

## مدیر و نشست

- `POST /admin/auth/login` با `email`, `password`
- `POST /admin/auth/verify-otp` با `challengeId`, `otp`
- `POST /admin/auth/resend-otp` با `challengeId`
- `GET /admin/auth/me`
- `POST /admin/auth/logout`

OTP در پاسخ API برگردانده نمی‌شود. OTP در دیتابیس هش می‌شود، انقضا و تعداد تلاش دارد و verify/resend در برابر استفاده‌ی هم‌زمان update شرطی دارند. نشست در کوکی HttpOnly با `SESSION_SECRET` امضا و در `admin_sessions` ذخیره می‌شود.

## مدیر: محتوا

تمام مسیرهای مدیریتی نیازمند نشست معتبر هستند؛ درخواست‌های تغییردهنده علاوه بر آن به هدر `x-csrf-token` و کوکی CSRF نیاز دارند.

- `POST /admin/uploads/images` — multipart field: `file`; فقط JPEG/PNG/WebP معتبر، محدودیت حجم/ابعاد و تبدیل WebP
- خدمات: `GET/POST /admin/services`, `PATCH/DELETE /admin/services/:id`
- مراقبت: `GET/PUT /admin/services/:id/care-items`
- FAQ: `GET/PUT /admin/services/:id/faqs`
- دسته‌بندی خدمات: `GET/POST /admin/service-categories`, `PATCH/DELETE /admin/service-categories/:id`
- نمونه‌کار: `GET/POST /admin/portfolio`, `PATCH/DELETE /admin/portfolio/:id`
- دسته‌بندی نمونه‌کار: `GET/POST/PATCH/DELETE /admin/portfolio-categories...`
- کلینیک: `GET/PATCH /admin/clinic`
- شعب: `GET/POST /admin/branches`, `PATCH /admin/branches/:id`
- ساعات کاری: `GET/PUT /admin/working-hours`
- تعطیلی‌ها: `GET/PUT /admin/closures`
- مشاوره: `GET /admin/consultation-requests`, `GET /admin/consultation-requests/:id`, `PATCH /admin/consultation-requests/:id`
- audit: `GET /admin/audit-logs`

`PATCH /admin/portfolio/:id` واقعاً partial است و می‌تواند فقط metadata یا یکی از تصاویر را تغییر دهد. حذف خدمت، دسته‌بندی و نمونه‌کار soft-delete است و حذف دسته‌ی دارای وابستگی با `409` رد می‌شود.

## کدهای HTTP

- `200`: خواندن/ویرایش موفق
- `201`: ایجاد موفق
- `401`: نشست مفقود/نامعتبر
- `403`: CSRF نامعتبر
- `404`: منبع پیدا نشد
- `409`: تعارض یکتا یا وابستگی
- `422`: ورودی، تصویر یا وابستگی نامعتبر
- `429`: عبور از Rate Limit یا تلاش OTP
- `500`: خطای داخلی

تست‌های فعلی در `tests/` بدون سرویس خارجی اجرا می‌شوند. تست E2E دیتابیس، SMTP، تراکنش‌های MySQL و OTP واقعی نیازمند `.env` جداگانه با DB تستی و SMTP تستی است.
