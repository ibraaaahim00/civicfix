# CivicFix

المشروع الأساسي هو منصة عربية لإدارة البلاغات البلدية، ويتكوّن من:

- `civicfix-backend`: Laravel API.
- `civicfix-frontend`: React/Vite interface.

## التشغيل المحلي

1. شغّل MySQL من XAMPP وأنشئ قاعدة بيانات باسم `civicfix_db`.
2. من مجلد `civicfix-backend` نفّذ:

   ```bash
   php artisan migrate --seed
   php artisan serve --host=127.0.0.1 --port=8001
   ```

3. من مجلد `civicfix-frontend` نفّذ:

   ```bash
   npm install
   npm run dev
   ```

الواجهة تستخدم API على `http://127.0.0.1:8001/api` افتراضيًا. يمكن تغييره من خلال `VITE_API_URL`.

الحساب التجريبي:

`admin@civicfix.local` / `Admin@12345`

## الاختبارات

من مجلد الباك إند:

```bash
php artisan test
```
