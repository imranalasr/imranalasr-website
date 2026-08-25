# موقع شركة عمران العصر الحديثة للمقاولات
### Imran Alasr Alhaditha Contracting — corporate website

موقع مؤسسي ثنائي اللغة (العربية RTL أساسًا + الإنجليزية LTR) مبني بـ **Next.js 15 + TypeScript + Tailwind 4 + GSAP + Lenis**، مع قاعدة بيانات، نماذج، ولوحة إدارة محمية.

- كل الأرقام والبيانات النظامية في الموقع منقولة حرفيًا من الوثائق الرسمية في مجلد `Documents/`.
- المشاريع الخمسة هي مجلدات الصور الحقيقية المرفقة؛ لم تُنسب لأي مشروع بيانات (عميل/قيمة/مدة) غير موجودة في الوثائق.
- صور كل مشروع تُستخدم داخل مشروعها فقط (يتحقق من ذلك اختبار آلي).

---

## 1) التشغيل محليًا

المتطلب الوحيد: **Node.js ≥ 22.5** (قاعدة البيانات الافتراضية SQLite مدمجة في Node — لا تحتاج تثبيت أي شيء آخر).

```bash
cd site
npm install
cp .env.example .env.local
# ولّد سر الجلسات وضعه في AUTH_SECRET داخل .env.local:
openssl rand -base64 48
npm run db:init          # ينشئ قاعدة البيانات والجداول
npm run admin:create -- admin@imranalasr.sa 'كلمة-مرور-طويلة-12+حرف'
npm run build
npm start                # http://localhost:3000
```

- الموقع: `http://localhost:3000/ar` (و `/en`)
- لوحة الإدارة: `http://localhost:3000/admin`

للتطوير: `npm run dev`.

## 2) متغيرات البيئة

انظر [.env.example](.env.example) — كل متغير موثق هناك. الأساسية:

| المتغير | الوظيفة |
|---|---|
| `AUTH_SECRET` | توقيع جلسات الإدارة — **إلزامي**، ولا يُشارك |
| `NEXT_PUBLIC_SITE_URL` | عنوان النشر الرسمي؛ يجب أن يكون `https://imranalasr.sa` في الإنتاج |
| `GOOGLE_SITE_VERIFICATION` | رمز تحقق Google Search Console الاختياري؛ اتركه فارغًا حتى يصدر من Google |
| `DB_DRIVER` | `sqlite` (افتراضي) أو `supabase` |
| `RESEND_API_KEY` | مفتاح Resend للبريد — اختياري؛ بدونه تُحفظ الطلبات وتظهر في اللوحة ويُسجَّل الإشعار في سجل الخادم بدل إرساله |
| `MAIL_TO` | صندوق استقبال الإشعارات (الافتراضي requests@imranalasr.sa) |

## 3) قاعدة البيانات

**SQLite (الافتراضي):** ملف واحد في `data/imran.db`. مناسب لخادم واحد (VPS). النسخ الاحتياطي = نسخ الملف.

**Supabase (اختياري):**
1. أنشئ مشروع Supabase وشغّل [supabase/schema.sql](supabase/schema.sql) في SQL Editor. المخطط يفعّل RLS بلا أي سياسات — أي أن مفاتيح المتصفح لا تصل لأي بيانات؛ الخادم فقط (service-role) يتعامل معها.
2. في `.env.local`:
   ```
   DB_DRIVER=supabase
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...   # سري — للخادم فقط
   ```
3. أعد إنشاء حساب المدير: `npm run admin:create -- <email> '<password>'`

## 4) البريد وواتساب

- الإشعارات عبر **Resend** (HTTP API — بلا مكتبات). أضف `RESEND_API_KEY` ووثّق نطاق الإرسال في لوحة Resend ليصل البريد من `noreply@imranalasr.sa`.
- زر واتساب بعد إرسال طلب عرض السعر يفتح محادثة مع `0556630202` برسالة مجهزة تتضمن الرقم المرجعي.

## 5) لوحة الإدارة `/admin`

- **الحساب:** يُنشأ فقط من الخادم بـ `npm run admin:create` (لا يوجد تسجيل ذاتي). إعادة تشغيل الأمر بنفس البريد = إعادة تعيين كلمة المرور.
- **الطلبات** (عرض سعر / ملف تأهيل / رسائل): بحث، تصفية بالحالة، تغيير الحالة، ملاحظات داخلية، صفحة تفاصيل، تصدير CSV (بترميز يفتح صحيحًا في Excel).
- **المحتوى:** نشر/إخفاء وترتيب المشاريع والخدمات والشهادات، تحرير النصوص العربية والإنجليزية، اختيار الغلاف وإخفاء صور، وبيانات التواصل. البيانات النظامية (أرقام السجل/الضريبة/الشهادات) مقفلة في الشيفرة عمدًا لأنها منقولة من وثائق رسمية.
- ملف التأهيل **لا يُرسل تلقائيًا** لأحد: الطلب يصل للوحة، وبعد التحقق يُرسل يدويًا من البريد الرسمي.

### أين يُعدَّل المحتوى الثابت؟
| المحتوى | الملف |
|---|---|
| بيانات الشركة النظامية | `src/content/company.ts` |
| الخدمات والأنشطة (19 نشاطًا) | `src/content/services.ts` |
| المشاريع ونصوصها وصورها | `src/content/projects.ts` + `src/content/media.json` |
| الشهادات والاعتمادات | `src/content/certifications.ts` |
| نصوص الواجهة بالعربية والإنجليزية | `src/i18n/dictionaries.ts` |
| البسملة وآية سورة هود | `src/i18n/dictionaries.ts` (`home.basmala` و`home.verse*`) + `src/components/home/VerseBand.tsx` |
| هندسة الشعار المتتبَّعة من ملف الشعار | `src/components/brand/MarkGeometry.tsx` — لا تُحرَّر يدويًا |

تعديلات لوحة الإدارة تُخزَّن كـ overrides في قاعدة البيانات فوق هذه الملفات.

## 6) صفحة «قدراتنا» (مخفية)

البنية جاهزة في `src/app/(site)/[locale]/capabilities/` وتُرجع 404 حاليًا. عند توفر بيانات موثقة للمعدات والكوادر، أضف في جدول `content_overrides` المفتاح `page:capabilities` بالقيمة:

```json
{ "published": true,
  "equipment": { "ar": ["..."], "en": ["..."] },
  "staffing":  { "ar": ["..."], "en": ["..."] } }
```

## 7) الاختبارات والفحوص

```bash
npm run typecheck   # TypeScript
npx eslint src      # ESLint
npm test            # 19 اختبارًا: سلامة المحتوى مقابل الوثائق + منطق التحقق/الجلسات/CSV
npm run build       # البناء الإنتاجي (36 صفحة)
```

اختبارات المحتوى تضمن أن: كل نشاط رسمي يظهر مرة واحدة فقط، لا أنشطة مخترعة، الأرقام النظامية مطابقة للوثائق، لا حقول عميل/قيمة/مدة في المشاريع، لا ادعاء عضوية غير موثقة، وكل صورة تنتمي لمشروعها (خمسة مشاريع).

## 8) النشر

أي مضيف Node يعمل (VPS + PM2/systemd خلف Nginx، أو Railway/Render/Fly). ملاحظات:

- Vercel: نظام الملفات فيها غير دائم — استخدم `DB_DRIVER=supabase`.
- اضبط `NEXT_PUBLIC_SITE_URL=https://imranalasr.sa` قبل البناء.
- **النطاق `imranalasr.sa` غير مربوط ولم يُلمس** — ربطه وإعداد DNS قرار المالك وحده.

## 9) بنية المجلد

```
site/
├─ src/app/(site)/[locale]/   الصفحات العامة (ar/en)
├─ src/app/(admin)/admin/     لوحة الإدارة
├─ src/app/api/               نقاط النماذج + تصدير CSV
├─ src/components/            الواجهة والحركة (GSAP/Lenis)
├─ src/content/               طبقة الحقائق الموثقة
├─ src/i18n/                  القواميس والإعدادات اللغوية
├─ src/lib/                   قاعدة البيانات، المصادقة، التحقق، البريد، SEO
├─ scripts/                   db:init / admin:create
├─ supabase/schema.sql        مخطط Postgres + RLS
├─ tests/                     node:test
└─ public/projects|brand      الصور المحسّنة (WebP) والشعارات
```
