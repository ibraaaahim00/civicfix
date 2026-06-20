import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { authApi, reportsApi, statsApi, usersApi } from "./services/api";

const statusLabels = {
  new: "جديد",
  review: "قيد المراجعة",
  assigned: "تم الإسناد",
  progress: "قيد التنفيذ",
  resolved: "تم الحل",
  rejected: "مرفوض",
};

const priorityLabels = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const categoryLabels = {
  roads: "طرق",
  lighting: "إنارة",
  water: "مياه",
  sanitation: "صرف صحي",
  cleaning: "نظافة",
  parks: "حدائق",
  public_safety: "سلامة عامة",
};

const roleLabels = {
  citizen: "مواطن",
  admin: "مدير",
  technician: "فني",
};

function errorMessage(error, fallback = "حدث خطأ، حاول مرة أخرى") {
  const data = error?.response?.data;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(" ");
  }
  return data?.message || fallback;
}

function StatusBadge({ value }) {
  return <span className={`badge status-${value}`}>{statusLabels[value] || value}</span>;
}

function PriorityBadge({ value }) {
  return <span className={`badge priority-${value}`}>{priorityLabels[value] || value}</span>;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, urgent: 0, by_category: {} });
  const [technicians, setTechnicians] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setAuthChecked(true);
      return;
    }

    authApi
      .me()
      .then((res) => afterAuth(res.data.user))
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    refreshWorkspace();
  }, [currentUser]);

  function afterAuth(user) {
    setCurrentUser(user);
    setPage(user.role === "admin" ? "admin" : user.role === "technician" ? "technician" : "dashboard");
  }

  async function refreshWorkspace() {
    await Promise.all([loadReports(), loadStats(), currentUser?.role === "admin" ? loadTechnicians() : Promise.resolve()]);
  }

  async function loadReports(params = {}) {
    setLoading(true);
    try {
      const res = await reportsApi.list(params);
      setReports(res.data.data.data || []);
    } catch (error) {
      setErrorMsg(errorMessage(error, "فشل تحميل البلاغات"));
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await statsApi.overview();
      setStats(res.data);
    } catch {
      setStats({ total: 0, active: 0, resolved: 0, urgent: 0, by_category: {} });
    }
  }

  async function loadTechnicians() {
    try {
      const res = await usersApi.technicians();
      setTechnicians(res.data.data || []);
    } catch {
      setTechnicians([]);
    }
  }

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) || null,
    [reports, selectedReportId]
  );

  async function login(payload) {
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await authApi.login(payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      afterAuth(res.data.user);
    } catch (error) {
      setErrorMsg(errorMessage(error, "بيانات الدخول غير صحيحة"));
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await authApi.register(payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      afterAuth(res.data.user);
    } catch (error) {
      setErrorMsg(errorMessage(error, "فشل إنشاء الحساب"));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Local logout still clears the session if the token is already expired.
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setReports([]);
    setTechnicians([]);
    setPage("dashboard");
  }

  async function createReport(event) {
    event.preventDefault();
    setErrorMsg("");
    setNotice("");
    const form = event.currentTarget;
    setLoading(true);
    try {
      const res = await reportsApi.create(new FormData(form));
      setReports((items) => [res.data.data, ...items]);
      setSelectedReportId(res.data.data.id);
      setPage("details");
      setNotice("تم إرسال البلاغ واستلامه في النظام.");
      form.reset();
      loadStats();
    } catch (error) {
      setErrorMsg(errorMessage(error, "فشل إنشاء البلاغ، تأكد من البيانات"));
    } finally {
      setLoading(false);
    }
  }

  async function createTechnician(event) {
    event.preventDefault();
    setErrorMsg("");
    setNotice("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.password_confirmation = payload.password;

    setLoading(true);
    try {
      const res = await usersApi.createTechnician(payload);
      setTechnicians((items) => [...items, res.data.data].sort((a, b) => a.name.localeCompare(b.name, "ar")));
      setNotice("تم إضافة الفني ويمكنه تسجيل الدخول الآن.");
      form.reset();
    } catch (error) {
      setErrorMsg(errorMessage(error, "فشل إضافة الفني"));
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(report, status) {
    setErrorMsg("");
    try {
      const res = await reportsApi.updateStatus(report.id, { status });
      applyReportUpdate(res.data.data);
      loadStats();
    } catch (error) {
      setErrorMsg(errorMessage(error, "فشل تحديث حالة البلاغ"));
    }
  }

  async function assignTechnician(report, technicianId) {
    if (!technicianId) return;
    setErrorMsg("");
    try {
      const res = await reportsApi.assign(report.id, { assigned_to: technicianId });
      applyReportUpdate(res.data.data);
      loadStats();
    } catch (error) {
      setErrorMsg(errorMessage(error, "فشل إسناد الفني"));
    }
  }

  function applyReportUpdate(updated) {
    setReports((items) => items.map((item) => (item.id === updated.id ? updated : item)));
  }

  function openReport(id) {
    setSelectedReportId(id);
    setPage("details");
    reportsApi.getById(id).then((res) => applyReportUpdate(res.data.data)).catch(() => {});
  }

  if (!authChecked) {
    return <Splash text="جاري التحقق من الجلسة..." />;
  }

  if (!currentUser) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onLogin={login}
        onRegister={register}
        loading={loading}
        errorMsg={errorMsg}
      />
    );
  }

  return (
    <div className="app" dir="rtl">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">CF</div>
          <div>
            <h1>CivicFix</h1>
            <p>منصة تشغيل البلاغات البلدية</p>
          </div>
        </div>
        <nav>
          <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>الرئيسية</button>
          {currentUser.role === "citizen" && <button onClick={() => setPage("new")}>بلاغ جديد</button>}
          {currentUser.role === "citizen" && <button onClick={() => setPage("my")}>بلاغاتي</button>}
          {currentUser.role === "admin" && <button onClick={() => setPage("admin")}>لوحة المدير</button>}
          {currentUser.role === "admin" && <button onClick={() => setPage("all")}>إدارة البلاغات</button>}
          {currentUser.role === "admin" && <button onClick={() => setPage("technicians")}>الفنيون</button>}
          {currentUser.role === "technician" && <button onClick={() => setPage("technician")}>مهامي</button>}
          <button onClick={() => setPage("statistics")}>التقارير</button>
          <button onClick={logout}>تسجيل الخروج</button>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">مرحبا، {currentUser.name}</p>
            <h2>{pageTitle(page)}</h2>
          </div>
          <div className="role">{roleLabels[currentUser.role] || currentUser.role}</div>
        </header>

        {errorMsg && <div className="alert danger">{errorMsg}</div>}
        {notice && <div className="alert success">{notice}</div>}
        {loading && <p className="eyebrow">جاري التحميل...</p>}

        {page === "dashboard" && <Dashboard stats={stats} reports={reports} openReport={openReport} />}
        {page === "new" && <CreateReport onSubmit={createReport} loading={loading} />}
        {page === "my" && <ReportsList reports={reports} openReport={openReport} search={search} setSearch={setSearch} />}
        {page === "details" && selectedReport && (
          <ReportDetails
            report={selectedReport}
            currentUser={currentUser}
            technicians={technicians}
            onChangeStatus={changeStatus}
            onAssign={assignTechnician}
          />
        )}
        {page === "admin" && <AdminDashboard stats={stats} reports={reports} technicians={technicians} openReport={openReport} />}
        {page === "all" && (
          <AllReports reports={reports} technicians={technicians} onChangeStatus={changeStatus} onAssign={assignTechnician} openReport={openReport} />
        )}
        {page === "technicians" && <TechniciansPanel technicians={technicians} onSubmit={createTechnician} loading={loading} />}
        {page === "technician" && <TechnicianDashboard reports={reports} onChangeStatus={changeStatus} openReport={openReport} />}
        {page === "statistics" && <Statistics reports={reports} stats={stats} />}
      </main>
    </div>
  );
}

function Splash({ text }) {
  return <div className="authShell" dir="rtl"><section className="panel authPanel"><p>{text}</p></section></div>;
}

function pageTitle(page) {
  return {
    dashboard: "الرئيسية",
    new: "إنشاء بلاغ جديد",
    my: "بلاغاتي",
    details: "تفاصيل البلاغ",
    admin: "لوحة تحكم المدير",
    all: "إدارة كل البلاغات",
    technicians: "إدارة الفنيين",
    technician: "مهام الفني",
    statistics: "التقارير والإحصائيات",
  }[page] || "CivicFix";
}

function AuthScreen({ mode, setMode, onLogin, onRegister, loading, errorMsg }) {
  const isRegister = mode === "register";

  function handleSubmit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (isRegister) {
      onRegister({ ...data, password_confirmation: data.password });
    } else {
      onLogin(data);
    }
  }

  return (
    <div className="authShell" dir="rtl">
      <section className="panel authPanel">
        <div className="brand authBrand">
          <div className="brandMark">CF</div>
          <div>
            <h1>CivicFix</h1>
            <p>إدارة البلاغات من المواطن حتى فرق التنفيذ</p>
          </div>
        </div>
        <div className="segmented">
          <button className={!isRegister ? "selected" : ""} onClick={() => setMode("login")}>دخول</button>
          <button className={isRegister ? "selected" : ""} onClick={() => setMode("register")}>حساب مواطن</button>
        </div>
        {errorMsg && <div className="alert danger">{errorMsg}</div>}
        <form className="form authForm" onSubmit={handleSubmit}>
          {isRegister && <label className="full">الاسم الكامل<input name="name" required placeholder="مثال: أحمد محمد" /></label>}
          <label className="full">البريد الإلكتروني<input type="email" name="email" required placeholder="name@example.com" /></label>
          <label className="full">كلمة المرور<input type="password" name="password" required minLength="8" placeholder="ثمانية أحرف على الأقل" /></label>
          <button className="primary full" disabled={loading}>{loading ? "جاري التنفيذ..." : isRegister ? "إنشاء حساب" : "دخول"}</button>
        </form>
        <p className="hint">حساب المدير الافتراضي بعد تشغيل الـ Seeder: admin@civicfix.local / Admin@12345</p>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return <div className={`stat ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Dashboard({ stats, reports, openReport }) {
  return (
    <>
      <StatsGrid stats={stats} />
      <section className="panel">
        <h3>أحدث البلاغات</h3>
        <ReportsTable reports={reports.slice(0, 6)} openReport={openReport} />
      </section>
    </>
  );
}

function StatsGrid({ stats }) {
  return (
    <div className="statsGrid">
      <StatCard label="كل البلاغات" value={stats.total} tone="blue" />
      <StatCard label="نشطة" value={stats.active} tone="green" />
      <StatCard label="عاجلة" value={stats.urgent} tone="red" />
      <StatCard label="تم الحل" value={stats.resolved} tone="gray" />
    </div>
  );
}

function CreateReport({ onSubmit, loading }) {
  return (
    <form className="panel form" onSubmit={onSubmit}>
      <label>عنوان البلاغ<input name="title" required placeholder="مثال: كشاف إنارة لا يعمل" /></label>
      <label>التصنيف<select name="category" required>{Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>الأولوية<select name="priority" defaultValue="medium"><option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option><option value="urgent">عاجلة</option></select></label>
      <label>الموقع<input name="location" required placeholder="الحي، الشارع، علامة مميزة" /></label>
      <label>صورة البلاغ<input name="image" type="file" accept="image/*" /></label>
      <label className="full">الوصف<textarea name="description" required minLength="20" rows="5" placeholder="اكتب التفاصيل التي تساعد فريق التشغيل على التعامل مع البلاغ" /></label>
      <button className="primary" disabled={loading}>{loading ? "جاري الإرسال..." : "إرسال البلاغ"}</button>
    </form>
  );
}

function ReportsList({ reports, openReport, search, setSearch }) {
  const visible = reports.filter((report) => `${report.title} ${report.location} ${report.id}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <section className="panel">
      <div className="tools">
        <h3>قائمة البلاغات</h3>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث عن بلاغ" />
      </div>
      <ReportsTable reports={visible} openReport={openReport} />
    </section>
  );
}

function ReportsTable({ reports, openReport }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>رقم</th>
            <th>العنوان</th>
            <th>التصنيف</th>
            <th>الأولوية</th>
            <th>الحالة</th>
            <th>الموقع</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.id}</td>
              <td>{report.title}</td>
              <td>{categoryLabels[report.category] || report.category}</td>
              <td><PriorityBadge value={report.priority} /></td>
              <td><StatusBadge value={report.status} /></td>
              <td>{report.location}</td>
              <td><button className="linkBtn" onClick={() => openReport(report.id)}>عرض</button></td>
            </tr>
          ))}
          {reports.length === 0 && <tr><td colSpan="7">لا توجد بلاغات</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ReportDetails({ report, currentUser, technicians, onChangeStatus, onAssign }) {
  const canChangeStatus = currentUser.role === "admin" || currentUser.role === "technician";
  const canAssign = currentUser.role === "admin";

  return (
    <section className="panel details">
      <div className="detailsHeader">
        <div>
          <p className="eyebrow">بلاغ رقم {report.id}</p>
          <h3>{report.title}</h3>
        </div>
        <StatusBadge value={report.status} />
      </div>
      <p>{report.description}</p>
      {report.image_url && <img className="reportImage" src={report.image_url} alt="صورة البلاغ" />}
      <div className="infoGrid">
        <span>التصنيف: {categoryLabels[report.category] || report.category}</span>
        <span>الأولوية: <PriorityBadge value={report.priority} /></span>
        <span>الموقع: {report.location}</span>
        <span>المواطن: {report.user?.name || "غير متاح"}</span>
        <span>الفني: {report.technician?.name || "لم يتم الإسناد"}</span>
      </div>
      {(canChangeStatus || canAssign) && (
        <div className="actions">
          {canChangeStatus && (
            <select value={report.status} onChange={(event) => onChangeStatus(report, event.target.value)}>
              {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          )}
          {canAssign && (
            <select value={report.assigned_to || ""} onChange={(event) => onAssign(report, event.target.value)}>
              <option value="">اختر الفني</option>
              {technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
            </select>
          )}
        </div>
      )}
      <h4>سجل المتابعة</h4>
      <div className="timeline">
        {(report.histories || []).map((item) => (
          <div key={item.id}>
            <strong>{item.note}</strong>
            <span>{item.user?.name || "النظام"} - {item.created_at ? new Date(item.created_at).toLocaleString("ar-EG") : ""}</span>
          </div>
        ))}
        {(!report.histories || report.histories.length === 0) && <p>لا يوجد سجل متابعة بعد</p>}
      </div>
    </section>
  );
}

function AdminDashboard({ stats, reports, technicians, openReport }) {
  const resolvedRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;
  return (
    <>
      <div className="statsGrid">
        <StatCard label="إجمالي البلاغات" value={stats.total} tone="blue" />
        <StatCard label="بلاغات مفتوحة" value={stats.active} tone="green" />
        <StatCard label="عدد الفنيين" value={technicians.length} tone="gray" />
        <StatCard label="نسبة الحل" value={`${resolvedRate}%`} tone="red" />
      </div>
      <section className="panel">
        <h3>أحدث البلاغات الواردة</h3>
        <ReportsTable reports={reports.slice(0, 6)} openReport={openReport} />
      </section>
    </>
  );
}

function AllReports({ reports, technicians, onChangeStatus, onAssign, openReport }) {
  return (
    <section className="panel">
      <h3>إدارة كل البلاغات</h3>
      <div className="cardsGrid">
        {reports.map((report) => (
          <article className="reportCard" key={report.id}>
            <div>
              <strong>{report.title}</strong>
              <span>{categoryLabels[report.category] || report.category} - {report.location}</span>
            </div>
            <div className="badges"><StatusBadge value={report.status} /><PriorityBadge value={report.priority} /></div>
            <select value={report.status} onChange={(event) => onChangeStatus(report, event.target.value)}>
              {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <select value={report.assigned_to || ""} onChange={(event) => onAssign(report, event.target.value)}>
              <option value="">اختر الفني</option>
              {technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
            </select>
            <button className="linkBtn" onClick={() => openReport(report.id)}>فتح التفاصيل</button>
          </article>
        ))}
        {reports.length === 0 && <p>لا توجد بلاغات بعد</p>}
      </div>
    </section>
  );
}

function TechniciansPanel({ technicians, onSubmit, loading }) {
  return (
    <div className="splitGrid">
      <form className="panel form compactForm" onSubmit={onSubmit}>
        <h3 className="full">إضافة فني جديد</h3>
        <label className="full">اسم الفني<input name="name" required placeholder="مثال: محمد علي - صيانة مياه" /></label>
        <label className="full">البريد الإلكتروني<input type="email" name="email" required placeholder="tech@example.com" /></label>
        <label className="full">كلمة المرور<input type="password" name="password" required minLength="8" placeholder="ثمانية أحرف على الأقل" /></label>
        <button className="primary full" disabled={loading}>{loading ? "جاري الإضافة..." : "إضافة الفني"}</button>
      </form>
      <section className="panel">
        <h3>الفنيون الحاليون</h3>
        <div className="cardsGrid single">
          {technicians.map((tech) => (
            <article className="reportCard" key={tech.id}>
              <strong>{tech.name}</strong>
              <span>{tech.email}</span>
              <span>بلاغات مسندة: {tech.assigned_reports_count ?? 0}</span>
            </article>
          ))}
          {technicians.length === 0 && <p>لا يوجد فنيون بعد</p>}
        </div>
      </section>
    </div>
  );
}

function TechnicianDashboard({ reports, onChangeStatus, openReport }) {
  return (
    <section className="panel">
      <h3>البلاغات المسندة إليك</h3>
      <div className="cardsGrid">
        {reports.map((report) => (
          <article className="reportCard" key={report.id}>
            <strong>{report.title}</strong>
            <span>{report.location}</span>
            <div className="badges"><StatusBadge value={report.status} /><PriorityBadge value={report.priority} /></div>
            <button className="primary" onClick={() => onChangeStatus(report, "progress")}>بدء التنفيذ</button>
            <button className="secondary" onClick={() => onChangeStatus(report, "resolved")}>تم الحل</button>
            <button className="linkBtn" onClick={() => openReport(report.id)}>عرض التفاصيل</button>
          </article>
        ))}
        {reports.length === 0 && <p>لا توجد بلاغات مسندة إليك حاليا</p>}
      </div>
    </section>
  );
}

function Statistics({ reports, stats }) {
  const categoryCounts = Object.entries(categoryLabels).map(([key, label]) => ({
    key,
    label,
    count: stats.by_category?.[key] ?? reports.filter((report) => report.category === key).length,
  }));
  const max = Math.max(1, ...categoryCounts.map((item) => item.count));

  return (
    <>
      <StatsGrid stats={stats} />
      <section className="panel">
        <h3>البلاغات حسب التصنيف</h3>
        <div className="bars">
          {categoryCounts.map((item) => (
            <div className="barRow" key={item.key}>
              <span>{item.label}</span>
              <div><b style={{ width: `${Math.max((item.count / max) * 100, item.count ? 8 : 0)}%` }} /></div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
