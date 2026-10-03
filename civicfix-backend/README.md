# CivicFix Backend

Laravel API الخاص بمنصة البلاغات البلدية.

## التشغيل

تأكد من تشغيل MySQL وإنشاء قاعدة `civicfix_db`، ثم شغّل:

```bash
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8001
```

تم اختيار المنفذ `8001` لأن المنفذ `8000` قد يكون مستخدمًا بواسطة مشروع Laravel آخر.

## بيانات تجريبية

- المدير: `admin@civicfix.local` / `Admin@12345`
- الفنيون: أي حساب فني من بيانات الـ Seeder، وكلمة المرور `Tech@12345`
- المواطنون: أي حساب مواطن من بيانات الـ Seeder، وكلمة المرور `Citizen@12345`

## التحقق

```bash
php artisan test
php artisan route:list --path=api
```
