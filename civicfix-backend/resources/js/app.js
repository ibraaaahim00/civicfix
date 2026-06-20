const state = {
    token: localStorage.getItem('civicfix_token'),
    user: null,
    technicians: [],
};

const labels = {
    roles: { admin: 'أدمن', technician: 'فني', citizen: 'مواطن' },
    statuses: {
        new: 'جديد',
        review: 'قيد المراجعة',
        assigned: 'مسند',
        progress: 'قيد التنفيذ',
        resolved: 'تم الحل',
        rejected: 'مرفوض',
    },
    priorities: { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' },
    categories: {
        roads: 'طرق',
        lighting: 'إنارة',
        water: 'مياه',
        sanitation: 'صرف صحي',
        cleaning: 'نظافة',
        parks: 'حدائق',
        public_safety: 'سلامة عامة',
    },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function headers(json = true) {
    const base = { Accept: 'application/json' };
    if (json) base['Content-Type'] = 'application/json';
    if (state.token) base.Authorization = `Bearer ${state.token}`;
    return base;
}

async function api(path, options = {}) {
    const response = await fetch(`/api${path}`, {
        ...options,
        headers: {
            ...headers(!(options.body instanceof FormData)),
            ...(options.headers || {}),
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
        throw new Error(firstError || data.message || 'حدث خطأ غير متوقع');
    }

    return data;
}

function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3200);
}

function formDataObject(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function setView(name) {
    $$('[data-view]').forEach((view) => view.classList.toggle('hidden', view.dataset.view !== name));
}

function fillSelect(select, items, includeAll = false) {
    select.innerHTML = '';
    if (includeAll) select.add(new Option('الكل', ''));
    Object.entries(items).forEach(([value, label]) => select.add(new Option(label, value)));
}

function setupSelects() {
    fillSelect($('#statusFilter'), labels.statuses, true);
    fillSelect($('#categoryFilter'), labels.categories, true);
    fillSelect($('#priorityFilter'), labels.priorities, true);
    fillSelect($('select[name="category"]'), labels.categories);
    fillSelect($('select[name="priority"]'), labels.priorities);
}

async function boot() {
    setupSelects();
    bindEvents();

    if (!state.token) {
        setView('auth');
        return;
    }

    try {
        const data = await api('/auth/me');
        state.user = data.user;
        await loadDashboard();
    } catch {
        localStorage.removeItem('civicfix_token');
        state.token = null;
        setView('auth');
    }
}

function bindEvents() {
    $$('[data-auth-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            $$('[data-auth-tab]').forEach((tab) => tab.classList.remove('active'));
            button.classList.add('active');
            $('#loginForm').classList.toggle('hidden', button.dataset.authTab !== 'login');
            $('#registerForm').classList.toggle('hidden', button.dataset.authTab !== 'register');
        });
    });

    $('#loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify(formDataObject(event.currentTarget)),
        });
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('civicfix_token', state.token);
        await loadDashboard();
    });

    $('#registerForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = await api('/auth/register', {
            method: 'POST',
            body: JSON.stringify(formDataObject(event.currentTarget)),
        });
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('civicfix_token', state.token);
        toast('تم إنشاء حساب المواطن');
        await loadDashboard();
    });

    $('#logoutBtn').addEventListener('click', async () => {
        try { await api('/auth/logout', { method: 'POST' }); } catch {}
        state.token = null;
        state.user = null;
        localStorage.removeItem('civicfix_token');
        setView('auth');
    });

    $('#refreshBtn').addEventListener('click', loadDashboard);
    $('#applyFilters').addEventListener('click', loadReports);
    $('#newReportBtn').addEventListener('click', () => $('#reportDialog').showModal());
    $('[data-close-dialog]').addEventListener('click', () => $('#reportDialog').close());

    $('#reportForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const body = new FormData(event.currentTarget);
        await api('/reports', { method: 'POST', body });
        event.currentTarget.reset();
        $('#reportDialog').close();
        toast('تم إرسال البلاغ');
        await loadDashboard();
    });

    $('#technicianForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await api('/users/technicians', {
            method: 'POST',
            body: JSON.stringify(formDataObject(event.currentTarget)),
        });
        event.currentTarget.reset();
        toast('تمت إضافة الفني');
        await loadTechnicians();
    });
}

async function loadDashboard() {
    setView('dashboard');
    $('#userName').textContent = state.user.name;
    $('#roleBadge').textContent = labels.roles[state.user.role] || state.user.role;
    $('#newReportBtn').classList.toggle('hidden', !['citizen', 'admin'].includes(state.user.role));
    $('#adminPanel').classList.toggle('hidden', state.user.role !== 'admin');

    if (state.user.role === 'admin') {
        await loadTechnicians();
    }

    await Promise.all([loadStats(), loadReports()]);
}

async function loadStats() {
    const stats = await api('/stats/overview');
    $('#metrics').innerHTML = [
        ['إجمالي البلاغات', stats.total],
        ['بلاغات نشطة', stats.active],
        ['تم حلها', stats.resolved],
        ['عاجلة', stats.urgent],
    ].map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join('');
}

function queryString() {
    const params = new URLSearchParams();
    const fields = [
        ['search', $('#searchInput').value.trim()],
        ['status', $('#statusFilter').value],
        ['category', $('#categoryFilter').value],
        ['priority', $('#priorityFilter').value],
    ];
    fields.forEach(([key, value]) => {
        if (value) params.set(key, value);
    });
    return params.toString() ? `?${params}` : '';
}

async function loadReports() {
    const response = await api(`/reports${queryString()}`);
    const reports = response.data.data || [];

    $('#reportsList').innerHTML = reports.length
        ? reports.map(renderReport).join('')
        : '<p class="empty">لا توجد بلاغات مطابقة.</p>';

    $$('.status-change').forEach((select) => {
        select.addEventListener('change', async () => {
            await api(`/reports/${select.dataset.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: select.value }),
            });
            toast('تم تحديث الحالة');
            await loadDashboard();
        });
    });

    $$('.assign-tech').forEach((select) => {
        select.addEventListener('change', async () => {
            if (!select.value) return;
            await api(`/reports/${select.dataset.id}/assign`, {
                method: 'PATCH',
                body: JSON.stringify({ assigned_to: select.value }),
            });
            toast('تم إسناد البلاغ');
            await loadDashboard();
        });
    });
}

function renderReport(report) {
    const canChangeStatus = state.user.role === 'admin' || state.user.role === 'technician';
    const canAssign = state.user.role === 'admin';
    const technicianOptions = [
        '<option value="">اختر فني</option>',
        ...state.technicians.map((tech) => `<option value="${tech.id}" ${report.assigned_to === tech.id ? 'selected' : ''}>${escapeHtml(tech.name)}</option>`),
    ].join('');

    return `
        <article class="report">
            <div class="report-head">
                <div>
                    <h3>${escapeHtml(report.title)}</h3>
                    <p>${escapeHtml(report.description)}</p>
                </div>
                <span class="pill">${labels.statuses[report.status] || report.status}</span>
            </div>
            <div class="meta">
                <span class="pill">${labels.categories[report.category] || report.category}</span>
                <span class="pill">${labels.priorities[report.priority] || report.priority}</span>
                <span class="pill">${escapeHtml(report.location)}</span>
                <span class="pill">المواطن: ${escapeHtml(report.user?.name || '-')}</span>
                <span class="pill">الفني: ${escapeHtml(report.technician?.name || 'لم يسند')}</span>
            </div>
            ${(canChangeStatus || canAssign) ? `
                <div class="report-actions">
                    ${canChangeStatus ? `<select class="status-change" data-id="${report.id}">${statusOptions(report.status)}</select>` : ''}
                    ${canAssign ? `<select class="assign-tech" data-id="${report.id}">${technicianOptions}</select>` : ''}
                </div>
            ` : ''}
        </article>
    `;
}

function statusOptions(current) {
    return Object.entries(labels.statuses)
        .map(([value, label]) => `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`)
        .join('');
}

async function loadTechnicians() {
    const response = await api('/users/technicians');
    state.technicians = response.data || [];
    $('#techniciansList').innerHTML = state.technicians.map((tech) => `
        <article class="technician">
            <strong>${escapeHtml(tech.name)}</strong>
            <span>${escapeHtml(tech.email)}</span>
            <small>${tech.assigned_reports_count || 0} بلاغ مسند</small>
        </article>
    `).join('');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

boot().catch((error) => toast(error.message));
