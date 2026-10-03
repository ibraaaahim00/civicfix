const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

export function validateLogin(values) {
  const errors = {};
  const email = normalizeEmail(values.email);

  if (!email) errors.email = "اكتب البريد الإلكتروني";
  else if (!emailPattern.test(email)) errors.email = "اكتب بريدًا إلكترونيًا صحيحًا";
  if (!values.password) errors.password = "اكتب كلمة المرور";

  return errors;
}

export function validateRegistration(values) {
  const errors = {};
  const name = values.name?.trim() || "";
  const email = normalizeEmail(values.email);

  if (name.length < 3) errors.name = "الاسم يجب أن يكون 3 أحرف على الأقل";
  if (!email) errors.email = "اكتب البريد الإلكتروني";
  else if (!emailPattern.test(email)) errors.email = "اكتب بريدًا إلكترونيًا صحيحًا";
  if (!values.password || values.password.length < 8) {
    errors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  }
  if (values.password !== values.password_confirmation) {
    errors.password_confirmation = "كلمتا المرور غير متطابقتين";
  }

  return errors;
}

export function validateReport(values) {
  const errors = {};
  const title = values.title?.trim() || "";
  const location = values.location?.trim() || "";
  const description = values.description?.trim() || "";
  const image = values.image;

  if (title.length < 5) errors.title = "العنوان يجب أن يكون 5 أحرف على الأقل";
  if (!values.category) errors.category = "اختر تصنيف البلاغ";
  if (!values.priority) errors.priority = "اختر أولوية البلاغ";
  if (location.length < 3) errors.location = "اكتب موقعًا واضحًا للبلاغ";
  if (description.length < 20) errors.description = "الوصف يجب أن يكون 20 حرفًا على الأقل";
  if (image?.size > 4 * 1024 * 1024) errors.image = "حجم الصورة يجب ألا يتجاوز 4 ميجابايت";
  if (image?.type && !image.type.startsWith("image/")) errors.image = "الملف يجب أن يكون صورة";

  return errors;
}

export function validateTechnician(values) {
  const errors = {};
  const name = values.name?.trim() || "";
  const email = normalizeEmail(values.email);

  if (name.length < 3) errors.name = "اسم الفني يجب أن يكون 3 أحرف على الأقل";
  if (!email) errors.email = "اكتب البريد الإلكتروني";
  else if (!emailPattern.test(email)) errors.email = "اكتب بريدًا إلكترونيًا صحيحًا";
  if (!values.password || values.password.length < 8) {
    errors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  }

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
