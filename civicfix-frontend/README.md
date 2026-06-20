# CivicFix Frontend

واجهة عربية RTL لمنصة إدارة البلاغات داخل مدينة أو كومباوند.

## التشغيل

```bash
pnpm install
pnpm dev
```

## بيانات الدخول التجريبية

- مدير: `admin@civicfix.com` / `123456`
- فني: `mahmoud@civicfix.com` / `123456`
- مقيم: `ahmed@civicfix.com` / `123456`

## الربط مع الباك إند

ملف الربط موجود في:

`src/services/api.js`

غير قيمة `VITE_API_URL` لاحقا إلى رابط الباك إند الحقيقي، أو اتركها على:

`http://localhost:5000/api`
