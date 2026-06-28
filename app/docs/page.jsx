import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { SlimFooter } from '@/components/SiteFooter';
import DocsToc from '@/components/DocsToc';
import { asset } from '@/lib/site';

export const metadata = {
  title: 'دليل كوش سمارت | KUSH SMART Docs',
  description:
    'دليل كوش سمارت خطوة بخطوة — الإعداد، إضافة الأجهزة، الكونفيجريشن، المجموعات، المؤقتات، الأتمتة، والحسّاسات.',
};

const NAV = [
  { href: '/#features', label: 'المميزات' },
  { href: '/#how', label: 'إزاي بيشتغل' },
  { href: '/docs', label: 'الدليل', active: true },
  { href: '/downloads', label: 'التحميل', btn: true },
];

const TOC = [
  {
    title: 'البداية',
    items: [
      { href: '#install', label: 'تثبيت التطبيق والحساب' },
      { href: '#add', label: 'إضافة أول جهاز' },
      { href: '#config', label: 'الإعدادات العامة (كونفيجريشن)' },
    ],
  },
  {
    title: 'الاستخدام اليومي',
    items: [
      { href: '#control', label: 'التحكم في الأجهزة' },
      { href: '#rename', label: 'تسمية الأجهزة' },
      { href: '#groups', label: 'المجموعات' },
      { href: '#timers', label: 'المؤقتات والإطفاء التلقائي' },
      { href: '#schedule', label: 'الجدولة بالوقت' },
    ],
  },
  {
    title: 'المتقدّم',
    items: [
      { href: '#automations', label: 'الأتمتة' },
      { href: '#sensors', label: 'الحسّاسات والإشعارات' },
      { href: '#remote', label: 'الريموت 433MHz / IR' },
      { href: '#hidden', label: 'المفاتيح المخفية' },
    ],
  },
  { title: 'مساعدة', items: [{ href: '#faq', label: 'حل المشاكل' }] },
];

export default function DocsPage() {
  return (
    <>
      <SiteHeader links={NAV} />

      <div className="wrap docs">
        <DocsToc groups={TOC} />

        <main className="doc-main">
          <h1>دليل كوش سمارت</h1>
          <p className="sub">كل اللي محتاج تعرفه لإعداد بيتك الذكي — خطوة بخطوة، وبدون أي تعقيد.</p>

          <section id="install">
            <h2><span className="n">1</span> تثبيت التطبيق وعمل حساب</h2>
            <div className="card">
              <ol className="steps">
                <li>نزّل تطبيق <b>كوش سمارت</b> من Google Play (أندرويد) أو App Store (آيفون).</li>
                <li>افتح التطبيق واضغط <b>إنشاء حساب</b>.</li>
                <li>اكتب إيميلك واختار باسورد، وأكّد الحساب من الإيميل.</li>
                <li>سجّل دخولك — وخلاص، حسابك جاهز.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">🔒</span>
              <div>كل أجهزتك بترتبط بحسابك وحده. محدش غيرك يقدر يشوفها أو يتحكم فيها.</div>
            </div>
          </section>

          <section id="add">
            <h2><span className="n">2</span> إضافة أول جهاز (التوصيل بالواي فاي)</h2>
            <p>الوحدة أول مرة بتطلع شبكة واي فاي خاصة بيها للإعداد، والتطبيق بيمشّيك خطوة خطوة.</p>
            <div className="card">
              <ol className="steps">
                <li>تأكد إن الوحدة شغّالة وإن باسورد الواي فاي بتاع البيت معاك.</li>
                <li>من الشاشة الرئيسية اضغط <b>➕ إضافة جهاز</b>.</li>
                <li>التطبيق هيلاقي الوحدة الجديدة — اختارها.</li>
                <li>اختار <b>شبكة الواي فاي</b> (2.4 جيجا) واكتب الباسورد.</li>
                <li>اضغط <b>حفظ / توصيل</b> — الوحدة هتعيد التشغيل وتتصل.</li>
                <li>بعد ثواني هتلاقي الوحدة وكل مفاتيحها ظهرت في قائمة أجهزتك. ✅</li>
              </ol>
            </div>
            <div className="callout info">
              <span className="em">📶</span>
              <div>الأجهزة الذكية بتشتغل على واي فاي <b>2.4 جيجا</b> (مش 5 جيجا). لو راوترك بيدمج الشبكتين، يفضّل تفصلهم وقت الإعداد.</div>
            </div>
          </section>

          <section id="config">
            <h2><span className="n">3</span> الإعدادات العامة (الكونفيجريشن)</h2>
            <p>من صفحة <b>الإعدادات / Configuration</b> للوحدة، تقدر تظبط طريقة عمل المفاتيح حسب تركيبتك الكهربائية. افتح تفاصيل الوحدة ← <b>الإعدادات العامة</b>.</p>
            <table>
              <tbody>
                <tr><th>الإعداد</th><th>بيعمل إيه</th></tr>
                <tr><td>وضع المفتاح</td><td>عادي / مفتاح ثلاثي (Three-way) / ضغطة (Push)</td></tr>
                <tr><td>توصيل المفتاح</td><td>Pull-up أو Pull-down حسب التوصيلة</td></tr>
                <tr><td>الريليه</td><td>Active-High أو Active-Low</td></tr>
                <tr><td>اسم نقطة الواي فاي (AP)</td><td>اسم الشبكة اللي الوحدة بتطلعها وقت الإعداد</td></tr>
                <tr><td>زر الكونفيج</td><td>توصيلة زر الإعداد على الوحدة</td></tr>
              </tbody>
            </table>
            <div className="callout warn">
              <span className="em">⚠️</span>
              <div>لو المفاتيح الخارجية مش شغّالة صح، جرّب تغيّر <b>وضع المفتاح</b> أو <b>التوصيل (Pull-up/Pull-down)</b>. ولو الريليه شغّال بالعكس، غيّر <b>Active-High/Low</b>.</div>
            </div>
            <div className="callout tip">
              <span className="em">💾</span>
              <div>أي إعداد بتغيّره بيتسجّل على الوحدة نفسها، فبيفضل محفوظ حتى بعد فصل الكهربا.</div>
            </div>
          </section>

          <section id="control">
            <h2><span className="n">4</span> التحكم في الأجهزة</h2>
            <div className="shot"><img src={asset('/assets/screens/home.png')} alt="الشاشة الرئيسية للتحكم" /></div>
            <p className="shot-cap">الشاشة الرئيسية — كل أجهزتك وحالتها وأزرار التحكم.</p>
            <table>
              <tbody>
                <tr><th>الإجراء</th><th>الطريقة</th></tr>
                <tr><td>تشغيل/إطفاء</td><td>اضغط على زر الجهاز</td></tr>
                <tr><td>خفت الإضاءة (Dimmer)</td><td>حرّك الشريط لأعلى/لأسفل</td></tr>
                <tr><td>سرعة المروحة</td><td>حرّك شريط السرعة</td></tr>
                <tr><td>الألوان (RGB)</td><td>اختار اللون من دائرة الألوان</td></tr>
                <tr><td>الستائر / الشتر</td><td>أزرار فتح / قفل / إيقاف</td></tr>
                <tr><td>التفاصيل الكاملة</td><td>اضغط مطوّلًا على الجهاز</td></tr>
              </tbody>
            </table>
          </section>

          <section id="rename">
            <h2><span className="n">5</span> تسمية الأجهزة</h2>
            <div className="card">
              <ol className="steps">
                <li>اضغط مطوّلًا على الجهاز ← <b>إعادة تسمية</b>.</li>
                <li>اكتب اسم واضح زي «نور الصالة».</li>
                <li>احفظ.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">💡</span>
              <div>الاسم بيتسجّل على الجهاز نفسه، فبيظهر بنفس الاسم في كل مكان في التطبيق.</div>
            </div>
          </section>

          <section id="groups">
            <h2><span className="n">6</span> المجموعات</h2>
            <p>اجمع كذا جهاز في مجموعة وتحكّم فيهم كلهم بضغطة واحدة (مثلًا «إضاءة الدور الأول»).</p>
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
                <li>اكتب اسم المجموعة واختار الأجهزة اللي فيها.</li>
                <li>احفظ — دلوقتي تقدر تشغّل/تطفّي المجموعة كلها مرة واحدة.</li>
              </ol>
            </div>
          </section>

          <section id="timers">
            <h2><span className="n">7</span> المؤقتات والإطفاء التلقائي</h2>
            <h3>عدّاد تنازلي (مرة واحدة)</h3>
            <div className="card">
              <ol className="steps">
                <li>افتح تفاصيل الجهاز ← <b>مؤقّت</b>.</li>
                <li>اختار المدة (مثلًا يطفّي بعد 30 دقيقة).</li>
                <li>تأكيد — والمؤقت الفعّال بيظهر جوه صفحة الجهاز.</li>
              </ol>
            </div>
            <h3>إطفاء تلقائي دائم</h3>
            <p>«كل ما يشتغل، يطفّي بعد كذا ثانية» — مفيدة لسخان المياه أو إضاءة الحمام.</p>
            <div className="card">
              <ol className="steps">
                <li>افتح تفاصيل الجهاز ← <b>إطفاء تلقائي</b>.</li>
                <li>حدّد المدة بالثواني واحفظ — هيشتغل كل مرة الجهاز يتشغّل.</li>
              </ol>
            </div>
          </section>

          <section id="schedule">
            <h2><span className="n">8</span> الجدولة بالوقت</h2>
            <p>خلّي الأجهزة تشتغل/تطفّي في مواعيد ثابتة (مثلًا النور يولّع 6 مساءً ويطفّي 11).</p>
            <div className="card">
              <ol className="steps">
                <li>افتح صفحة <b>الجدولة</b> ← <b>➕ موعد جديد</b>.</li>
                <li>اختار الجهاز، الوقت، والأيام.</li>
                <li>اختار الإجراء (تشغيل / إطفاء) واحفظ.</li>
              </ol>
            </div>
          </section>

          <section id="automations">
            <h2><span className="n">9</span> الأتمتة (لما يحصل كذا اعمل كذا)</h2>
            <p>اربط الحسّاسات بالأفعال تلقائيًا — من غير ما تلمس موبايلك.</p>
            <div className="card">
              <ol className="steps">
                <li>افتح صفحة <b>الأتمتة</b> ← <b>➕ أتمتة جديدة</b>.</li>
                <li>اختار <b>الشرط</b> (مثلًا: الحرارة أكبر من 30، أو حسّاس الباب اتفتح).</li>
                <li>اختار <b>النتيجة</b>: تشغيل/إطفاء جهاز، و/أو إرسال إشعار.</li>
                <li>احفظ — الأتمتة بتشتغل لوحدها.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">🤖</span>
              <div>أمثلة: «لو الحرارة عَلِت شغّل المروحة»، «لو الباب اتفتح ابعتلي إشعار وشغّل النور».</div>
            </div>
          </section>

          <section id="sensors">
            <h2><span className="n">10</span> الحسّاسات والإشعارات</h2>
            <p>كوش سمارت بيدعم حسّاسات الحرارة والرطوبة (DHT)، الأبواب/الحركة، والحسّاسات اللاسلكية 433MHz.</p>
            <div className="card">
              <ol className="steps">
                <li>الحسّاس بيظهر تلقائيًا مع قراءته في التطبيق.</li>
                <li>عشان توصلك إشعارات: افتح الحسّاس ← فعّل <b>إرسال إشعار عند حدث</b> (أو من صفحة الأتمتة).</li>
                <li>تأكد إن إشعارات التطبيق مفعّلة من إعدادات الموبايل.</li>
              </ol>
            </div>
            <div className="callout info">
              <span className="em">🔔</span>
              <div>الإشعارات بتوصلك حتى والتطبيق مقفول.</div>
            </div>
          </section>

          <section id="remote">
            <h2><span className="n">11</span> الريموت 433MHz و IR (أشعة)</h2>
            <div className="card">
              <ol className="steps">
                <li>افتح صفحة <b>الريموتات</b>.</li>
                <li>اضغط <b>تعلّم زر جديد</b>، واختار الجهاز اللي الزر هيتحكم فيه (وإجراء: تشغيل/إطفاء/تبديل، أو إشعار للحسّاسات).</li>
                <li>اضغط الزر على الريموت — الوحدة هتتعلّم الكود.</li>
                <li>خلاص، بقى الزر يتحكم في الجهاز اللي اخترته.</li>
              </ol>
            </div>
            <div className="callout tip">
              <span className="em">📡</span>
              <div>تقدر كمان تربط حسّاسات 433MHz لاسلكية بإشعارات أو أتمتة بدل ما تتحكم في مفتاح.</div>
            </div>
          </section>

          <section id="hidden">
            <h2><span className="n">12</span> المفاتيح المخفية</h2>
            <p>مفاتيح محمية بكلمة سر — متظهرش إلا بعد إدخال الكود، لخصوصية وأمان أكتر.</p>
            <div className="card">
              <ol className="steps">
                <li>افتح صفحة <b>المفاتيح المخفية</b> وحدّد كلمة سر.</li>
                <li>اختار المفاتيح اللي عايز تخفيها.</li>
                <li>دلوقتي مش هتظهر إلا لما تدخل الكود.</li>
              </ol>
            </div>
          </section>

          <section id="faq">
            <h2><span className="n">?</span> حل المشاكل</h2>
            <div className="card">
              <h3>الجهاز ظاهر «غير متصل»؟</h3>
              <p>تأكد إن الكهربا واصلة والواي فاي شغّال، والإشارة كويسة مكان الجهاز. جرّب تطفّي الراوتر وتشغّله واستنّى دقيقة.</p>
              <h3>جهاز جديد مش ظاهر؟</h3>
              <p>تأكد إنك خلّصت خطوات الإضافة وإن الوحدة اتصلت بالواي فاي. اقفل التطبيق وافتحه تاني.</p>
              <h3>المفاتيح الخارجية مش شغّالة صح؟</h3>
              <p>من <a href="#config">الإعدادات العامة</a> غيّر وضع المفتاح أو التوصيل (Pull-up/Pull-down)، ولو الريليه بالعكس غيّر Active-High/Low.</p>
              <h3>الجهاز بيستجيب ببطء؟</h3>
              <p>وانت في البيت التحكم بيبقى محلي وفوري. لو بطيء، تأكد إن موبايلك على نفس شبكة الواي فاي بتاعت الأجهزة.</p>
              <h3>نسيت الباسورد؟</h3>
              <p>من شاشة الدخول اضغط «نسيت كلمة السر» واتبع الخطوات على إيميلك.</p>
            </div>
            <div className="cta-band">
              <div><b>محتاج مساعدة أكتر؟</b> كلّم الدعم الفني ومعاك اسم/سيريال الوحدة (من صفحة تفاصيل الجهاز).</div>
              <Link className="btn" href="/#download">تحميل التطبيق</Link>
            </div>
          </section>
        </main>
      </div>

      <SlimFooter />
    </>
  );
}
