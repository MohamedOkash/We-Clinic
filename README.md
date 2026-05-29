# 🏥 عيادتنا 3D — نظام إدارة عيادة متكامل

نظام إدارة عيادة طبية بالكامل بـ React + Tailwind CSS مع 6 أدوار مختلفة وذكاء اصطناعي حقيقي.

---

## ✨ التحسينات في هذه النسخة

| # | التحسين | التفاصيل |
|---|---------|-----------|
| 1 | **AI حقيقي (Claude API)** | الطبيب والمريض يتحدثون مع Claude فعلاً |
| 2 | **Search يعمل** | بحث حي في المرضى والمخزون والروشتات |
| 3 | **Toast بدل alert()** | إشعارات أنيقة تظهر وتختفي |
| 4 | **localStorage** | البيانات لا تُفقد عند Refresh |
| 5 | **طباعة الروشتة** | زر Print يفتح روشتة رسمية جاهزة للطباعة |
| 6 | **جرعة وتكرار الدواء** | كل دواء فيه Dosage + Frequency + Duration |
| 7 | **فحص تفاعلات الأدوية** | Claude يفحص Drug-Drug Interactions |
| 8 | **Manager Dashboard** | إحصائيات حقيقية من الـ state |
| 9 | **اختيار المريض للأشعة** | الأشعة ترتبط بمريض معين |
| 10 | **Context API** | بدل prop drilling — كود منظم ومقسّم |

---

## 🚀 تشغيل المشروع

### الخطوة 1 — تثبيت المتطلبات

```bash
cd 3d-clinic
npm install
```

### الخطوة 2 — إعداد مفتاح الـ AI (اختياري)

```bash
# انسخ ملف الإعداد
cp .env.example .env
```

افتح ملف `.env` وضع مفتاح Claude API بتاعك:
```
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxx
```

احصل على المفتاح من: https://console.anthropic.com/

> **ملاحظة:** التطبيق يشتغل بدون مفتاح، لكن الـ AI سيُظهر رسالة تنبيه بدل الردود الحقيقية.

### الخطوة 3 — تشغيل التطبيق

```bash
npm run dev
```

افتح المتصفح على: **http://localhost:3000**

---

## 👥 الأدوار وكيفية الدخول

ادخل أي بيانات في الـ Login — مفيش تحقق حقيقي، فقط اختار الدور والتخصص:

| الدور | الوصف |
|-------|-------|
| 🏥 استقبال | تسجيل مرضى، بحث، إضافة للطابور |
| 👨‍⚕️ طبيب | فحص، AI، روشتة مع فحص تفاعلات، إشعارات صيدلية |
| 💊 صيدلية | صرف روشتات، مخزون، إرسال استفسارات |
| 🔬 أشعة | رفع نتائج وربطها بمريض |
| 👤 مريض | AI chat، حجز مواعيد، منبه أدوية |
| 📊 مدير | إحصائيات شاملة، تنبيهات المخزون |

---

## 🗂️ هيكل الملفات

```
src/
├── constants/          # ترجمات، بيانات ابتدائية، دالة callClaude
├── contexts/           # ClinicContext — الـ state المشترك
├── hooks/              # useToast — نظام الإشعارات
├── components/shared/  # Input, Card, Avatar, GlassModal, printPrescription
├── modules/            # وحدات الأطباء المتخصصة
│   ├── CardiologyModule.jsx
│   ├── OrthopedicsModule.jsx
│   ├── PediatricsModule.jsx
│   └── OBGYNModule.jsx
├── views/              # الـ views الرئيسية
│   ├── AuthView.jsx
│   ├── ReceptionistView.jsx
│   ├── DoctorWorkspace.jsx
│   ├── PharmacyView.jsx
│   ├── RadiologyView.jsx
│   ├── PatientPortal.jsx
│   └── ManagerView.jsx
└── App.jsx             # الـ router والـ layout
```

---

## 🛠️ للـ Build

```bash
npm run build
```

الناتج في مجلد `dist/` — ارفعه على أي hosting.

---

## 📦 المكتبات المستخدمة

- **React 18** — واجهة المستخدم
- **Tailwind CSS** — التصميم
- **Lucide React** — الأيقونات
- **Vite** — أداة البناء السريعة
