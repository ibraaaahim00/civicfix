<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CivicFix</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <main id="app" class="shell">
        <section class="auth-view" data-view="auth">
            <div class="brand-panel">
                <span class="brand-mark">CF</span>
                <h1>CivicFix</h1>
                <p>منصة تشغيل بلاغات المرافق: المواطن يبلغ، الأدمن يراجع ويسند، والفني يغلق البلاغ من الميدان.</p>
                <dl>
                    <div><dt>حساب أدمن</dt><dd>admin@civicfix.local / Admin@12345</dd></div>
                    <div><dt>حساب فني</dt><dd>mahmoud.tech@civicfix.local / Tech@12345</dd></div>
                    <div><dt>حساب مواطن</dt><dd>mona.citizen@example.com / Citizen@12345</dd></div>
                </dl>
            </div>

            <div class="auth-card">
                <div class="tabs">
                    <button class="tab active" data-auth-tab="login">دخول</button>
                    <button class="tab" data-auth-tab="register">حساب مواطن</button>
                </div>

                <form id="loginForm" class="form-stack">
                    <label>البريد الإلكتروني<input name="email" type="email" required value="admin@civicfix.local"></label>
                    <label>كلمة المرور<input name="password" type="password" required value="Admin@12345"></label>
                    <button class="primary" type="submit">تسجيل الدخول</button>
                </form>

                <form id="registerForm" class="form-stack hidden">
                    <label>الاسم<input name="name" required></label>
                    <label>البريد الإلكتروني<input name="email" type="email" required></label>
                    <label>كلمة المرور<input name="password" type="password" minlength="8" required></label>
                    <label>تأكيد كلمة المرور<input name="password_confirmation" type="password" minlength="8" required></label>
                    <button class="primary" type="submit">إنشاء حساب</button>
                </form>
            </div>
        </section>

        <section class="dashboard hidden" data-view="dashboard">
            <header class="topbar">
                <div>
                    <span class="brand-mark small">CF</span>
                    <strong>CivicFix</strong>
                    <span id="roleBadge" class="badge"></span>
                </div>
                <div class="user-actions">
                    <span id="userName"></span>
                    <button id="refreshBtn" class="ghost" type="button">تحديث</button>
                    <button id="logoutBtn" class="danger" type="button">خروج</button>
                </div>
            </header>

            <section class="metrics" id="metrics"></section>

            <section class="workbench">
                <aside class="panel filters">
                    <h2>الفلاتر</h2>
                    <label>بحث<input id="searchInput" placeholder="عنوان، وصف، أو موقع"></label>
                    <label>الحالة<select id="statusFilter"></select></label>
                    <label>النوع<select id="categoryFilter"></select></label>
                    <label>الأولوية<select id="priorityFilter"></select></label>
                    <button id="applyFilters" class="primary" type="button">تطبيق</button>
                </aside>

                <section class="panel reports-panel">
                    <div class="section-head">
                        <h2>البلاغات</h2>
                        <button id="newReportBtn" class="primary hidden" type="button">بلاغ جديد</button>
                    </div>
                    <div id="reportsList" class="reports-list"></div>
                </section>

                <aside id="adminPanel" class="panel admin-panel hidden">
                    <div class="section-head">
                        <h2>الفنيون</h2>
                    </div>
                    <form id="technicianForm" class="form-stack compact">
                        <label>الاسم<input name="name" required></label>
                        <label>البريد<input name="email" type="email" required></label>
                        <label>كلمة المرور<input name="password" type="password" minlength="8" required></label>
                        <label>تأكيد كلمة المرور<input name="password_confirmation" type="password" minlength="8" required></label>
                        <button class="primary" type="submit">إضافة فني</button>
                    </form>
                    <div id="techniciansList" class="technicians-list"></div>
                </aside>
            </section>
        </section>

        <dialog id="reportDialog">
            <form id="reportForm" class="form-stack modal-form">
                <div class="section-head">
                    <h2>بلاغ جديد</h2>
                    <button type="button" class="ghost" data-close-dialog>إغلاق</button>
                </div>
                <label>العنوان<input name="title" required maxlength="255"></label>
                <label>النوع<select name="category" required></select></label>
                <label>الأولوية<select name="priority" required></select></label>
                <label>الموقع<input name="location" required maxlength="255"></label>
                <label>الوصف<textarea name="description" required minlength="20"></textarea></label>
                <label>صورة اختيارية<input name="image" type="file" accept="image/*"></label>
                <button class="primary" type="submit">إرسال البلاغ</button>
            </form>
        </dialog>

        <div id="toast" class="toast hidden"></div>
    </main>
</body>
</html>
