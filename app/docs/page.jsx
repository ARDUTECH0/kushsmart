import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import DocsToc from '@/components/DocsToc';
import { asset } from '@/lib/site';

export const metadata = {
  title: 'دليل كوش سمارت | KUSH SMART Docs',
  description:
    'دليل كوش سمارت خطوة بخطوة — الإعداد، وإضافة الأجهزة، والإعدادات، والمجموعات، والمؤقّتات، والأتمتة، والحسّاسات.',
};

const NAV = [
  { href: '/#features', label: 'المميزات' },
  { href: '/#how', label: 'كيف يعمل' },
  { href: '/docs', label: 'الدليل', active: true },
  { href: '/downloads', label: 'التحميل', btn: true },
];

const TOC = [
  {
    title: 'البداية',
    items: [
      { href: '#install', label: 'تثبيت التطبيق والحساب' },
      { href: '#add', label: 'إضافة أول جهاز' },
      { href: '#config', label: 'الإعدادات العامة' },
    ],
  },
  {
    title: 'الاستخدام اليومي',
    items: [
      { href: '#control', label: 'التحكّم في الأجهزة' },
      { href: '#rename', label: 'تسمية الأجهزة' },
      { href: '#groups', label: 'المجموعات' },
      { href: '#timers', label: 'المؤقّتات والإطفاء التلقائي' },
      { href: '#schedule', label: 'الجدولة الزمنية' },
    ],
  },
  {
    title: 'المتقدّم',
    items: [
      { href: '#automations', label: 'الأتمتة' },
      { href: '#sensors', label: 'الحسّاسات والإشعارات' },
      { href: '#remote', label: 'التحكّم 433MHz / IR' },
      { href: '#hidden', label: 'المفاتيح المخفيّة' },
    ],
  },
  { title: 'مساعدة', items: [{ href: '#faq', label: 'حلّ المشكلات' }] },
];

export default function DocsPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <div className="wrap docs">
        <DocsToc groups={TOC} />

        <main className="doc-main">
          <h1>دليل كوش سمارت</h1>
          <p className="sub">كل ما تحتاج معرفته لإعداد منزلك الذكي — خطوة بخطوة، ودون أي تعقيد.</p>

          <section id="install">
            <h2><span className="n">1</span> تثبيت التطبيق وإنشاء حساب</h2>
            <div className="card">
              <ol className="steps">
                <li>حمّل تطبيق <b>كوش سمارت</b> من Google Play (أندرويد) أو App Store (آيفون).</li>
                <li>افتح التطبيق واضغط <b>إنشاء حساب</b>.</li>
                <li>أدخل بريدك الإلكتروني واختر كلمة مرور، وأكّد الحساب عبر البريد.</li>
                <li>سجّل الدخول — وبذلك يصبح حسابك جاهزًا.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">🔒</span>
              <div>ترتبط جميع أجهزتك بحسابك وحده. لا يمكن لأحد غيرك رؤيتها أو التحكّم فيها.</div>
            </div>
          </section>

          <section id="add">
            <h2><span className="n">2</span> إضافة أول جهاز (التوصيل بالواي فاي)</h2>
            <p>تُنشئ الوحدة في أول مرة شبكة واي فاي خاصة بها للإعداد، ويرشدك التطبيق خطوة بخطوة.</p>
            <div className="card">
              <ol className="steps">
                <li>تأكّد من أن الوحدة تعمل، ومن توفّر كلمة مرور واي فاي المنزل لديك.</li>
                <li>من الشاشة الرئيسية اضغط <b>➕ إضافة جهاز</b>.</li>
                <li>سيعثر التطبيق على الوحدة الجديدة — اخترها.</li>
                <li>اختر <b>شبكة الواي فاي</b> (2.4 جيجا) وأدخل كلمة المرور.</li>
                <li>اضغط <b>حفظ / اتصال</b> — وستُعيد الوحدة التشغيل وتتّصل.</li>
                <li>خلال ثوانٍ ستظهر الوحدة وجميع مفاتيحها في قائمة أجهزتك. ✅</li>
              </ol>
            </div>
            <div className="callout info">
              <span className="em">📶</span>
              <div>تعمل الأجهزة الذكية على واي فاي <b>2.4 جيجا</b> (وليس 5 جيجا). إذا كان راوترك يدمج الشبكتين، يُفضَّل فصلهما أثناء الإعداد.</div>
            </div>
          </section>

          <section id="config">
            <h2><span className="n">3</span> الإعدادات العامة</h2>
            <p>من صفحة <b>الإعدادات / Configuration</b> الخاصة بالوحدة، يمكنك ضبط طريقة عمل المفاتيح وفقًا لتركيبتك الكهربائية. افتح تفاصيل الوحدة ← <b>الإعدادات العامة</b>.</p>
            <table>
              <tbody>
                <tr><th>الإعداد</th><th>الوظيفة</th></tr>
                <tr><td>وضع المفتاح</td><td>عادي / مفتاح ثلاثي (Three-way) / ضغط (Push)</td></tr>
                <tr><td>توصيل المفتاح</td><td>Pull-up أو Pull-down حسب التوصيلة</td></tr>
                <tr><td>الريليه</td><td>Active-High أو Active-Low</td></tr>
                <tr><td>اسم نقطة الواي فاي (AP)</td><td>اسم الشبكة التي تُنشئها الوحدة أثناء الإعداد</td></tr>
                <tr><td>زر الإعداد</td><td>توصيل زر الإعداد على الوحدة</td></tr>
              </tbody>
            </table>
            <div className="callout warn">
              <span className="em">⚠️</span>
              <div>إذا كانت المفاتيح الخارجية لا تعمل بشكل صحيح، جرّب تغيير <b>وضع المفتاح</b> أو <b>نوع التوصيل (Pull-up/Pull-down)</b>. وإذا كان الريليه يعمل بشكل معكوس، غيّر <b>Active-High/Low</b>.</div>
            </div>
            <div className="callout tip">
              <span className="em">💾</span>
              <div>يُحفظ أي إعداد تغيّره على الوحدة نفسها، فيظلّ محفوظًا حتى بعد فصل الكهرباء.</div>
            </div>
            <div className="cta-band">
              <div><b>شرح مفصّل لصفحة إعداد البوردة</b> — القوالب الجاهزة، القنوات، منافذ GPIO، وكل خيار خطوة بخطوة.</div>
              <Link className="btn" href="/docs/configuration">دليل إعداد البوردة</Link>
            </div>
          </section>

          <section id="control">
            <h2><span className="n">4</span> التحكّم في الأجهزة</h2>
            <div className="shot"><img src={asset('/assets/screens/home.png')} alt="الشاشة الرئيسية للتحكّم" /></div>
            <p className="shot-cap">الشاشة الرئيسية — جميع أجهزتك وحالتها وأزرار التحكّم.</p>
            <table>
              <tbody>
                <tr><th>الإجراء</th><th>الطريقة</th></tr>
                <tr><td>تشغيل / إطفاء</td><td>اضغط على زر الجهاز</td></tr>
                <tr><td>خفوت الإضاءة (Dimmer)</td><td>حرّك الشريط لأعلى/لأسفل</td></tr>
                <tr><td>سرعة المروحة</td><td>حرّك شريط السرعة</td></tr>
                <tr><td>الألوان (RGB)</td><td>اختر اللون من دائرة الألوان</td></tr>
                <tr><td>الستائر / الشتر</td><td>أزرار فتح / غلق / إيقاف</td></tr>
                <tr><td>التفاصيل الكاملة</td><td>اضغط مطوّلًا على الجهاز</td></tr>
              </tbody>
            </table>
          </section>

          <section id="rename">
            <h2><span className="n">5</span> تسمية الأجهزة</h2>
            <div className="card">
              <ol className="steps">
                <li>اضغط مطوّلًا على الجهاز ← <b>إعادة تسمية</b>.</li>
                <li>أدخل اسمًا واضحًا مثل «إضاءة الصالة».</li>
                <li>احفظ.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">💡</span>
              <div>يُحفظ الاسم على الجهاز نفسه، فيظهر بالاسم ذاته في كل مكان داخل التطبيق.</div>
            </div>
          </section>

          <section id="groups">
            <h2><span className="n">6</span> المجموعات</h2>
            <p>اجمع عدّة أجهزة في مجموعة وتحكّم فيها جميعًا بضغطة واحدة (مثلًا «إضاءة الطابق الأول»).</p>
            <div className="shots-grid">
              <figure>
                <div className="shot"><img src={asset('/assets/screens/groups.png')} alt="صفحة المجموعات" /></div>
                <p className="shot-cap">صفحة المجموعات</p>
              </figure>
              <figure>
                <div className="shot"><img src={asset('/assets/screens/group_edit.png')} alt="إنشاء/تعديل مجموعة" /></div>
                <p className="shot-cap">إنشاء وتعديل مجموعة</p>
              </figure>
            </div>
            <div className="card">
              <ol className="steps">
                <li>افتح صفحة <b>المجموعات</b> ← <b>➕ مجموعة جديدة</b>.</li>
                <li>أدخل اسم المجموعة واختر الأجهزة التي تتضمّنها.</li>
                <li>احفظ — والآن يمكنك تشغيل/إطفاء المجموعة بأكملها مرة واحدة.</li>
              </ol>
            </div>
          </section>

          <section id="timers">
            <h2><span className="n">7</span> المؤقّتات والإطفاء التلقائي</h2>
            <h3>عدّاد تنازلي (مرة واحدة)</h3>
            <div className="card">
              <ol className="steps">
                <li>افتح تفاصيل الجهاز ← <b>مؤقّت</b>.</li>
                <li>اختر المدة (مثلًا يُطفأ بعد 30 دقيقة).</li>
                <li>أكّد — ويظهر المؤقّت الفعّال داخل صفحة الجهاز.</li>
              </ol>
            </div>
            <h3>إطفاء تلقائي دائم</h3>
            <p>«في كل مرة يعمل، يُطفأ بعد عدد من الثواني» — مفيدة لسخّان المياه أو إضاءة الحمّام.</p>
            <div className="card">
              <ol className="steps">
                <li>افتح تفاصيل الجهاز ← <b>إطفاء تلقائي</b>.</li>
                <li>حدّد المدة بالثواني واحفظ — وسيعمل في كل مرة يُشغَّل فيها الجهاز.</li>
              </ol>
            </div>
          </section>

          <section id="schedule">
            <h2><span className="n">8</span> الجدولة الزمنية</h2>
            <p>اجعل الأجهزة تعمل/تتوقّف في مواعيد ثابتة (مثلًا تُضاء الإضاءة 6 مساءً وتُطفأ 11).</p>
            <div className="card">
              <ol className="steps">
                <li>افتح صفحة <b>الجدولة</b> ← <b>➕ موعد جديد</b>.</li>
                <li>اختر الجهاز والوقت والأيام.</li>
                <li>اختر الإجراء (تشغيل / إطفاء) واحفظ.</li>
              </ol>
            </div>
          </section>

          <section id="automations">
            <h2><span className="n">9</span> الأتمتة (عند حدوث شيء، نفّذ إجراءً)</h2>
            <p>اربط الحسّاسات بالإجراءات تلقائيًا — دون لمس هاتفك.</p>
            <div className="card">
              <ol className="steps">
                <li>افتح صفحة <b>الأتمتة</b> ← <b>➕ أتمتة جديدة</b>.</li>
                <li>اختر <b>الشرط</b> (مثلًا: الحرارة أكبر من 30، أو فتح حسّاس الباب).</li>
                <li>اختر <b>النتيجة</b>: تشغيل/إطفاء جهاز، و/أو إرسال إشعار.</li>
                <li>احفظ — وتعمل الأتمتة تلقائيًا.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">🤖</span>
              <div>أمثلة: «إذا ارتفعت الحرارة شغّل المروحة»، «إذا فُتح الباب أرسل لي إشعارًا وشغّل الإضاءة».</div>
            </div>
          </section>

          <section id="sensors">
            <h2><span className="n">10</span> الحسّاسات والإشعارات</h2>
            <p>يدعم كوش سمارت حسّاسات الحرارة والرطوبة (DHT)، والأبواب/الحركة، والحسّاسات اللاسلكية 433MHz.</p>
            <div className="card">
              <ol className="steps">
                <li>يظهر الحسّاس تلقائيًا مع قراءته في التطبيق.</li>
                <li>لتصلك الإشعارات: افتح الحسّاس ← فعّل <b>«إرسال إشعار عند وقوع حدث»</b> (أو من صفحة الأتمتة).</li>
                <li>تأكّد من تفعيل إشعارات التطبيق من إعدادات الهاتف.</li>
              </ol>
            </div>
            <div className="callout info">
              <span className="em">🔔</span>
              <div>تصلك الإشعارات حتى والتطبيق مغلق.</div>
            </div>
          </section>

          <section id="remote">
            <h2><span className="n">11</span> التحكّم اللاسلكي 433MHz و IR (الأشعّة)</h2>
            <div className="card">
              <ol className="steps">
                <li>افتح صفحة <b>أجهزة التحكّم</b>.</li>
                <li>اضغط <b>«تعلّم زرًّا جديدًا»</b>، واختر الجهاز الذي سيتحكّم فيه الزر (والإجراء: تشغيل/إطفاء/تبديل، أو إشعار للحسّاسات).</li>
                <li>اضغط الزر على جهاز التحكّم — وستتعلّم الوحدة الرمز.</li>
                <li>وبذلك يتحكّم الزر في الجهاز الذي اخترته.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">📡</span>
              <div>يمكنك أيضًا ربط حسّاسات 433MHz لاسلكية بإشعارات أو أتمتة بدلًا من التحكّم في مفتاح.</div>
            </div>
          </section>

          <section id="hidden">
            <h2><span className="n">12</span> المفاتيح المخفيّة</h2>
            <p>مفاتيح محميّة بكلمة سرّ — لا تظهر إلا بعد إدخال الرمز، لمزيد من الخصوصية والأمان.</p>
            <div className="card">
              <ol className="steps">
                <li>افتح صفحة <b>المفاتيح المخفيّة</b> وحدّد كلمة سرّ.</li>
                <li>اختر المفاتيح التي تريد إخفاءها.</li>
                <li>والآن لن تظهر إلا عند إدخال الرمز.</li>
              </ol>
            </div>
          </section>

          <section id="faq">
            <h2><span className="n">?</span> حلّ المشكلات</h2>
            <div className="card">
              <h3>يظهر الجهاز «غير متّصل»؟</h3>
              <p>تأكّد من وصول الكهرباء وعمل الواي فاي، ومن جودة الإشارة في مكان الجهاز. جرّب إيقاف الراوتر وتشغيله والانتظار دقيقة.</p>
              <h3>جهاز جديد لا يظهر؟</h3>
              <p>تأكّد من إتمام خطوات الإضافة ومن اتصال الوحدة بالواي فاي. أغلق التطبيق وأعد فتحه.</p>
              <h3>المفاتيح الخارجية لا تعمل بشكل صحيح؟</h3>
              <p>من <a href="#config">الإعدادات العامة</a> غيّر وضع المفتاح أو نوع التوصيل (Pull-up/Pull-down)، وإذا كان الريليه معكوسًا غيّر Active-High/Low.</p>
              <h3>الجهاز يستجيب ببطء؟</h3>
              <p>داخل المنزل يكون التحكّم محليًا وفوريًا. إذا كان بطيئًا، تأكّد من أن هاتفك على شبكة الواي فاي نفسها الخاصة بالأجهزة.</p>
              <h3>نسيت كلمة المرور؟</h3>
              <p>من شاشة الدخول اضغط «نسيت كلمة المرور» واتبع الخطوات الواردة في بريدك.</p>
            </div>
            <div className="cta-band">
              <div><b>تحتاج مزيدًا من المساعدة؟</b> تواصل مع الدعم الفني ومعك اسم/سيريال الوحدة (من صفحة تفاصيل الجهاز).</div>
              <Link className="btn" href="/downloads">تحميل التطبيق</Link>
            </div>
          </section>
        </main>
      </div>

      <SlimFooter />
    </>
  );
}
