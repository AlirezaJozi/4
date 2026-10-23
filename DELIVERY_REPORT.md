# گزارش تحویل نهایی Backend

## دامنه تحویل

این بسته شامل Backend مستقل `clinic-api` برای سایت عمومی و پنل مدیریت کلینیک زیبایی است. پروژه‌های قبلی workspace تغییر داده نشده‌اند.

## اجزای موجود

- Express + Node.js ES Modules
- MySQL با `mysql2/promise`
- Schema نرمال MySQL در `database/schema.sql`
- احراز هویت مدیر با bcrypt، OTP ایمیلی، نشست JWT دیتابیسی و CSRF
- CRUD خدمات، دسته‌بندی‌ها، مراقبت‌ها و FAQ
- CRUD نمونه‌کارهای قبل/بعد و دسته‌بندی آن‌ها
- تنظیمات کلینیک، شعب، ساعات کاری و تعطیلی‌ها
- فرم مشاوره با تراکنش و جدول واسط خدمات
- مدیریت درخواست‌های مشاوره و audit log
- آپلود امن تصویر با Sharp، بررسی محتوای واقعی و پاک‌سازی orphan file
- README فارسی، `.env.example` و اسکریپت `create-admin`

## بررسی‌های اجراشده

- تست‌های Jest: ۸ تست از ۸ تست موفق
- `node --check` برای همه فایل‌های JavaScript: موفق
- `npm run check`: موفق
- نصب وابستگی‌های package.json: موفق
- بررسی نبود `.env` و راز واقعی در سورس: موفق

## محدودیت صریح

در محیط اجرای این بسته، MySQL و SMTP واقعی با اطلاعات آزمایشی در دسترس نبودند. بنابراین این موارد باید پس از تنظیم `.env` جداگانه اجرا و تأیید شوند:

- اجرای `database/schema.sql` روی MySQL تستی
- ورود واقعی مدیر و دریافت OTP از SMTP
- تست E2E تراکنش ثبت مشاوره
- تست CRUD با داده واقعی
- تست ارسال اعلان ایمیل

هیچ رمز، ایمیل، کلید یا مقدار محرمانه‌ای داخل بسته قرار نگرفته است.

## راه‌اندازی

```bash
cd clinic-api
npm install
cp .env.example .env
# .env را با مقادیر واقعی/تستی تکمیل کنید
mysql -u root -p < database/schema.sql
npm run create-admin
npm test
npm run dev
```

Base URL پیش‌فرض:

```text
http://localhost:4000/api/v1
```
