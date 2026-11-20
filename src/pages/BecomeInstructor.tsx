import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgePercent, CalendarClock, Check, ChevronDown, Clapperboard, FileVideo,
  MessagesSquare, Megaphone, ShieldCheck, Tags, TrendingUp, Wallet, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';

/*
 * Eğitmen ol.
 *
 * Sayfa doğrulanamayan rakam vermiyor (öğrenci sayısı, ödenen toplam gelir
 * gibi) ve komisyon oranını yazmıyor; kazanç tarafı "yüksek komisyon" ve
 * "kendi kuponunla gelen satışın tamamı senin" diye anlatılıyor.
 *
 * Hesaplayıcı yalnızca brüt satış potansiyelini gösteriyor: öğrenci sayısı ×
 * fiyat. Bunun büyük kısmının eğitmene kaldığı ayrıca söyleniyor.
 *
 * Çağrı düğmeleri ziyaretçinin durumuna göre değişiyor: eğitmen panele,
 * giriş yapmış kullanıcı başvuru formuna, misafir önce girişe gidiyor.
 */

const INK = '#111827';
const MINT = '#b2f0c8';

const lira = (n: number) => `₺${Math.round(n).toLocaleString('tr-TR')}`;

function useCta() {
  const { user, isAuthenticated } = useAuth();
  const instructor = user?.role === 'instructor' || user?.is_instructor === true;
  if (isAuthenticated && instructor) return { to: '/instructor/dashboard', label: 'Eğitmen paneline git' };
  if (isAuthenticated) return { to: '/instructor-application', label: 'Eğitmen hesabını aç' };
  return { to: `/login?redirect=${encodeURIComponent('/instructor-application')}`, label: 'Giriş yap ve başla' };
}

const FACTS = ['Kurs açmak ücretsiz', 'Aylık ücret yok', 'Ödeme gününü sen seçersin'];

const BENEFITS = [
  { icon: BadgePercent, title: 'Yüksek komisyon', body: 'Satıştan aldığın pay yüksek. Kendi kupon kodunla getirdiğin öğrencinin ödemesinin ise tamamı senin.' },
  { icon: Tags, title: 'Fiyat senin elinde', body: 'Kursunun fiyatını sen seçersin, istediğin zaman değiştirir, kendi kuponlarınla kampanya yaparsın.' },
  { icon: FileVideo, title: 'Video işleri bizde', body: 'Yüklediğin video arka planda farklı kalitelere dönüştürülür ve hızlı bir dağıtım ağından izletilir.' },
  { icon: ShieldCheck, title: 'İçerik senin kalır', body: 'Kursunun hakları sende. Edurce içeriği yalnızca yayınlamak ve tanıtmak için kullanır.' },
  { icon: CalendarClock, title: 'Ödeme gününü seç', body: 'Hakedişini panelden takip edersin; ödemenin hangi gün yapılacağını kendin belirlersin.' },
  { icon: MessagesSquare, title: 'Öğrencinle doğrudan', body: 'Soru-cevap, mesajlar ve duyurularla öğrencilerine panelden tek yerden ulaşırsın.' },
];

const TOOLS = [
  { icon: Clapperboard, title: 'Kurs oluşturucu', body: 'Bölümler, dersler, kaynak dosyaları ve ücretsiz önizleme dersleri.' },
  { icon: TrendingUp, title: 'Gelir raporu', body: 'Aylık ve yıllık satışlar, net kazancın ve ödenecek bakiyen.' },
  { icon: Megaphone, title: 'Duyurular', body: 'Yeni ders eklediğinde kursun bütün öğrencilerine haber ver.' },
  { icon: Wallet, title: 'Ödeme bilgileri', body: 'IBAN ve fatura bilgilerini bir kez gir, ödemeler otomatik planlansın.' },
];

const STEPS = [
  { title: 'Eğitmen hesabını aç', body: 'Dört kısa adımda bilgilerini, fotoğrafını ve uzmanlık alanlarını gir. Hesabın anında açılır.' },
  { title: 'Kursunu kur', body: 'Bölümleri ve dersleri oluştur, videolarını yükle, kaynak dosyalarını ekle.' },
  { title: 'Fiyatla', body: 'Fiyatı seç, istersen kupon tanımla. Yayın öncesi kontrol eksikleri tek tek gösterir.' },
  { title: 'İncelemeye gönder, kazan', body: 'Kursun incelemeden geçince katalogda yerini alır. Satışlarını panelden izlersin.' },
];

const NEED = [
  'Anlatacağın konuda gerçek bir deneyim',
  'Sesi anlaşılır, görüntüsü net kayıtlar',
  'Bölümlere ayrılmış bir ders planı',
  'Ödeme için IBAN ve kimlik bilgileri',
];
const NO_NEED = [
  'Profesyonel stüdyo ya da pahalı ekipman',
  'Video kurgu bilgisi; dosyayı yüklemen yeterli',
  'Belirli sayıda takipçi ya da izleyici kitlesi',
  'Başlangıç ücreti; kurs açmak tamamen ücretsiz',
];

const FAQ = [
  { q: 'Eğitmen olmak ücretli mi?', a: 'Hayır. Kurs açmak, video yüklemek ve yayınlamak ücretsiz; aylık ücret de yok. Edurce yalnızca bir satış olduğunda pay alır.' },
  { q: 'Ne kadar kazanırım?', a: 'Her satıştan yüksek komisyon alırsın. Kendi kupon kodunla gelen satışlarda platform pay almaz, ödemenin tamamı senindir. Ayrıntılı kazanç modeli Fiyatlandırma sayfasında.' },
  { q: 'Ödemeler ne zaman yapılır?', a: 'Hakedişin eğitmen panelinde birikir. Ödeme gününü panelden kendin seçersin, tutar kayıtlı IBAN hesabına gönderilir.' },
  { q: 'Kursumun hakları kimde olur?', a: 'Sende. Edurce içeriği yalnızca platformda yayınlamak ve tanıtmak için kullanır.' },
  { q: 'Video düzenlemem ya da özel ekipman almam gerekir mi?', a: 'Hayır. Net görüntü ve anlaşılır ses yeterli. Yüklediğin dosya otomatik olarak farklı kalitelere işlenir.' },
  { q: 'Eğitmen hesabım ne zaman açılır?', a: 'Formu tamamladığın anda. Eğitmen panelin hemen açılır ve kurs oluşturmaya başlarsın. Kursların yayına girmeden önce kalite incelemesinden geçer.' },
];

const Eyebrow: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark }) => (
  <p className={cn('text-[12.5px] font-bold uppercase tracking-[0.18em]', dark ? 'text-white' : 'text-[#1B7A43]')}>{children}</p>
);

const BecomeInstructor: React.FC = () => {
  useSeo({
    title: 'Eğitmen Ol | Edurce',
    description: 'Edurce\'de kurs açmak ücretsiz. Bildiğini öğret, yüksek komisyonla kazan.',
    canonical: 'https://edurce.com/become-instructor',
    robots: 'index, follow',
  }, []);

  const cta = useCta();
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-white text-[#111827]">
      {/* ── Kahraman ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: INK }}>
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-40 w-[640px] h-[640px] rounded-full bg-[#b2f0c8]/10 blur-3xl" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-12 lg:gap-16 items-center">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 h-8 pl-2.5 pr-3.5 rounded-full bg-white/[0.08] text-[13px] font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-[#b2f0c8]" />
              Edurce eğitmenliği
            </p>
            <h1 className="mt-5 text-[40px] sm:text-[54px] lg:text-[62px] leading-[1.03] font-extrabold tracking-[-0.045em] text-white text-balance">
              Bildiğini öğret,{' '}
              <span className="inline-block px-3 -mx-0.5 rounded-2xl bg-[#b2f0c8] text-[#111827] -rotate-[1.5deg]">yüksek komisyonla</span>{' '}
              kazan.
            </h1>
            <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-white/70 max-w-[52ch]">
              Kursunu kur, videolarını yükle, fiyatını belirle. Edurce yalnızca satış olduğunda
              pay alır; kendi kuponunla getirdiğin öğrencinin ödemesinin tamamı senin.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={cta.to}
                className="group inline-flex items-center gap-2 h-[52px] px-7 rounded-2xl bg-[#b2f0c8] text-[#111827] text-[15.5px] font-bold hover:bg-white active:scale-[0.98] transition-[background-color,transform]"
              >
                {cta.label}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#hesapla"
                className="inline-flex items-center h-[52px] px-6 rounded-2xl bg-white/[0.08] text-white text-[15px] font-bold hover:bg-white/[0.14] transition-colors"
              >
                Ne kazanırım?
              </a>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5">
              {FACTS.map(f => (
                <li key={f} className="inline-flex items-center gap-2 text-[14px] font-semibold text-white/85">
                  <span className="w-5 h-5 rounded-full bg-[#b2f0c8] text-[#111827] flex items-center justify-center">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <PanelPreview />
        </div>
      </section>

      {/* ── Hesaplayıcı ────────────────────────────────────────────── */}
      <Calculator ctaTo={cta.to} ctaLabel={cta.label} />

      {/* ── Neden Edurce ───────────────────────────────────────────── */}
      <section className="bg-[#F5F6F8]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Neden Edurce?</Eyebrow>
            <h2 className="mt-3 text-[30px] sm:text-[40px] leading-[1.08] font-extrabold tracking-[-0.035em] text-balance">
              Sen anlat, gerisini birlikte halledelim.
            </h2>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className={cn(
                  'rounded-[24px] p-6 sm:p-7',
                  i === 0 ? 'bg-[#1B7A43] text-white' : 'bg-white'
                )}
              >
                <span className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', i === 0 ? 'bg-[#b2f0c8] text-[#111827]' : 'bg-[#E3F8EB] text-[#1B7A43]')}>
                  <Icon className="w-[22px] h-[22px]" />
                </span>
                <h3 className="mt-5 text-[18px] font-extrabold tracking-[-0.01em]">{title}</h3>
                <p className={cn('mt-2 text-[14.5px] leading-[1.7]', i === 0 ? 'text-white/70' : 'text-[#4B5563]')}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Panel araçları ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-10 lg:gap-16 items-start">
        <div className="lg:sticky lg:top-28">
          <Eyebrow>Eğitmen paneli</Eyebrow>
          <h2 className="mt-3 text-[30px] sm:text-[40px] leading-[1.08] font-extrabold tracking-[-0.035em] text-balance">
            İhtiyacın olan her şey tek panelde.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#4B5563] max-w-[46ch]">
            Kursunu hazırlamaktan kazancını takip etmeye kadar her adım aynı yerde. Taslağına
            istediğin yerden başlar, istediğin zaman devam edersin.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-[24px] bg-[#F5F6F8] p-6">
              <Icon className="w-6 h-6 text-[#1B7A43]" />
              <h3 className="mt-4 text-[17px] font-extrabold tracking-[-0.01em]">{title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-[1.7] text-[#4B5563]">{body}</p>
            </div>
          ))}
          <div className="sm:col-span-2 rounded-[24px] bg-[#b2f0c8] p-6 sm:p-7 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[16px] font-extrabold">İhtiyacın olanlar</h3>
              <ul className="mt-3 space-y-2">
                {NEED.map(t => (
                  <li key={t} className="flex gap-2.5 text-[14.5px] leading-snug">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.6} /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[16px] font-extrabold">İhtiyacın olmayanlar</h3>
              <ul className="mt-3 space-y-2">
                {NO_NEED.map(t => (
                  <li key={t} className="flex gap-2.5 text-[14.5px] leading-snug text-[#111827]/75">
                    <X className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.6} /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dört adım + başvuru kartı ──────────────────────────────── */}
      <section id="basvuru" className="scroll-mt-24 bg-[#F5F6F8]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-[minmax(0,1fr)_420px] gap-10 lg:gap-14 items-start">
          <div>
            <Eyebrow>Nasıl başlarım?</Eyebrow>
            <h2 className="mt-3 text-[30px] sm:text-[40px] leading-[1.08] font-extrabold tracking-[-0.035em]">
              Dört adımda yayında.
            </h2>
            <ol className="mt-9 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-5 rounded-[22px] bg-white p-5 sm:p-6">
                  <span className="shrink-0 w-11 h-11 rounded-2xl bg-[#1B7A43] text-white text-[17px] font-extrabold tabular-nums flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-extrabold tracking-[-0.01em]">{s.title}</h3>
                    <p className="mt-1 text-[14.5px] leading-[1.7] text-[#4B5563]">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="lg:sticky lg:top-28 rounded-[28px] bg-[#1B7A43] text-white p-7 sm:p-8">
            <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Eğitmen hesabı</p>
            <h3 className="mt-3 text-[26px] font-extrabold tracking-[-0.02em] leading-tight">
              Birkaç dakikada eğitmen ol.
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-white/70">
              Dört kısa adım. Bilgilerini tamamladığında eğitmen hesabın anında
              açılır, ilk kursunu oluşturmaya başlarsın.
            </p>
            <ul className="mt-6 space-y-2.5">
              {['Kişisel bilgiler ve ders dili', 'Profil fotoğrafı', 'Kendini tanıtma ve uzmanlık alanları', 'Varsa web siten ve sosyal hesapların'].map(t => (
                <li key={t} className="flex items-center gap-2.5 text-[14.5px] text-white/85">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b2f0c8]" /> {t}
                </li>
              ))}
            </ul>
            <Link
              to={cta.to}
              className="mt-8 flex items-center justify-center gap-2 h-[52px] rounded-2xl bg-[#b2f0c8] text-[#111827] text-[15.5px] font-bold hover:bg-white active:scale-[0.98] transition-[background-color,transform]"
            >
              {cta.label} <ArrowRight className="w-4 h-4" />
            </Link>
            {!isAuthenticated && (
              <p className="mt-4 text-center text-[13.5px] text-white/60">
                Hesabın yok mu?{' '}
                <Link to="/register" className="font-bold text-white hover:underline underline-offset-4">Ücretsiz kaydol</Link>
              </p>
            )}
          </aside>
        </div>
      </section>

      {/* ── Sık sorulanlar ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[880px] px-4 sm:px-6 py-16 lg:py-24">
        <div className="text-center">
          <Eyebrow>Sorular</Eyebrow>
          <h2 className="mt-3 text-[30px] sm:text-[40px] leading-[1.08] font-extrabold tracking-[-0.035em]">Sıkça sorulanlar</h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQ.map(item => <Faq key={item.q} {...item} />)}
        </div>
        <p className="mt-8 text-center text-[14.5px] text-[#4B5563]">
          Başka bir sorun mu var?{' '}
          <Link to="/help" className="font-bold text-[#1B7A43] hover:underline underline-offset-4">Yardım merkezine bak</Link>
        </p>
      </section>

      {/* ── Kapanış ────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-16 lg:pb-24">
        <div className="mx-auto max-w-[1280px] rounded-[32px] bg-[#b2f0c8] px-6 sm:px-12 py-12 sm:py-16 text-center">
          <h2 className="text-[30px] sm:text-[44px] leading-[1.05] font-extrabold tracking-[-0.04em] text-balance">
            İlk kursun, ilk adımın.
          </h2>
          <p className="mt-4 text-[16.5px] text-[#111827]/70 max-w-[46ch] mx-auto">
            Başlamak ücretsiz. Bildiğini anlat, her satıştan yüksek komisyonla kazan.
          </p>
          <Link
            to={cta.to}
            className="mt-8 inline-flex items-center gap-2 h-[52px] px-8 rounded-2xl bg-[#1B7A43] text-white text-[15.5px] font-bold hover:bg-[#16613A] active:scale-[0.98] transition-[background-color,transform]"
          >
            {cta.label} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

/** Kahramanın sağındaki panel görünümü: örnek, gerçek veri değil. */
const PanelPreview: React.FC = () => {
  const bars = [28, 40, 34, 52, 46, 64, 58, 76, 70, 88, 82, 100];
  return (
    <div aria-hidden className="relative hidden sm:block">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] rotate-[1.5deg]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold text-[#4B5563]">Bu ayki kazancın</p>
          <span className="h-6 px-2.5 rounded-full bg-[#E3F8EB] text-[#1B7A43] text-[11.5px] font-bold inline-flex items-center">Örnek görünüm</span>
        </div>
        <p className="mt-1 text-[34px] font-extrabold tracking-[-0.03em] tabular-nums" style={{ color: INK }}>₺12.480</p>
        <div className="mt-5 h-[120px] flex items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-md animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
              style={{ height: `${h}%`, background: i === bars.length - 1 ? INK : MINT, animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[['Satış', '86'], ['Yeni öğrenci', '74'], ['Puan', '4,8']].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-[#F5F6F8] px-3 py-2.5">
              <p className="text-[11.5px] text-[#6B7280]">{k}</p>
              <p className="text-[17px] font-extrabold tabular-nums" style={{ color: INK }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -left-6 -bottom-7 rounded-2xl bg-[#b2f0c8] px-4 py-3 shadow-[0_24px_40px_-24px_rgba(0,0,0,0.6)] -rotate-[2deg] flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-[#1B7A43] text-white flex items-center justify-center">
          <Wallet className="w-[18px] h-[18px]" />
        </span>
        <span>
          <span className="block text-[12px] font-bold text-[#111827]/70">Yeni satış</span>
          <span className="block text-[14.5px] font-extrabold" style={{ color: INK }}>Kuponla geldi, tamamı senin</span>
        </span>
      </div>
    </div>
  );
};

/** Satış potansiyeli: öğrenci sayısı × fiyat. Komisyon oranı gösterilmiyor. */
const Calculator: React.FC<{ ctaTo: string; ctaLabel: string }> = ({ ctaTo, ctaLabel }) => {
  const [students, setStudents] = useState(150);
  const [price, setPrice] = useState(499);
  const monthly = students * price;

  return (
    <section id="hesapla" className="scroll-mt-24 mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-2xl">
        <Eyebrow>Kazanç</Eyebrow>
        <h2 className="mt-3 text-[30px] sm:text-[40px] leading-[1.08] font-extrabold tracking-[-0.035em] text-balance">
          Kursunun satış potansiyelini hesapla.
        </h2>
        <p className="mt-3 text-[16px] text-[#4B5563]">İki değeri kaydır; aylık ve yıllık satış tutarını anında gör.</p>
      </div>

      <div className="mt-10 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-4">
        <div className="rounded-[28px] bg-[#F5F6F8] p-6 sm:p-9 space-y-9">
          <Slider
            id="calc-students" label="Ayda kaç öğrenci kaydolur?" value={students} min={10} max={1000} step={10}
            onChange={setStudents} display={`${students.toLocaleString('tr-TR')} öğrenci`} ends={['10', '1.000']}
          />
          <Slider
            id="calc-price" label="Kursunun fiyatı" value={price} min={99} max={2999} step={50}
            onChange={setPrice} display={lira(price)} ends={['₺99', '₺2.999']}
          />
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            Tahmindir; gerçek satışlar kursun konusuna, kalitesine ve tanıtımına göre değişir.
          </p>
        </div>

        <div className="rounded-[28px] bg-[#1B7A43] text-white p-6 sm:p-9 flex flex-col">
          <p className="text-[14px] font-semibold text-white/60">Aylık satış tutarı</p>
          <p className="mt-1 text-[42px] sm:text-[52px] font-extrabold tracking-[-0.04em] tabular-nums text-white leading-none">{lira(monthly)}</p>
          <div className="mt-6 rounded-2xl bg-white/[0.07] px-5 py-4 flex items-center justify-between gap-4">
            <span className="text-[14px] text-white/70">Yıllık</span>
            <span className="text-[20px] font-extrabold tabular-nums">{lira(monthly * 12)}</span>
          </div>
          <ul className="mt-6 space-y-2.5 text-[14.5px] text-white/80">
            <li className="flex gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0 text-white" strokeWidth={2.6} /> Bunun büyük kısmı senin: yüksek komisyon</li>
            <li className="flex gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0 text-white" strokeWidth={2.6} /> Kendi kuponunla gelen satışın tamamı senin</li>
          </ul>
          <Link
            to={ctaTo}
            className="mt-auto pt-8"
          >
            <span className="flex items-center justify-center gap-2 h-[52px] rounded-2xl bg-[#b2f0c8] text-[#111827] text-[15px] font-bold hover:bg-white transition-colors">
              {ctaLabel} <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

const Slider: React.FC<{
  id: string; label: string; value: number; min: number; max: number; step: number;
  onChange: (n: number) => void; display: string; ends: [string, string];
}> = ({ id, label, value, min, max, step, onChange, display, ends }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[15px] font-bold">{label}</label>
        <span className="text-[20px] font-extrabold tabular-nums tracking-[-0.01em]">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="edu-range mt-4 w-full"
        style={{ background: `linear-gradient(to right, ${INK} ${pct}%, #E5E7EB ${pct}%)` }}
      />
      <div className="mt-2 flex justify-between text-[12.5px] text-[#6B7280] tabular-nums">
        <span>{ends[0]}</span><span>{ends[1]}</span>
      </div>
      <style>{`
        .edu-range { -webkit-appearance: none; appearance: none; height: 8px; border-radius: 999px; outline: none; }
        .edu-range::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; border-radius: 999px; background: ${MINT}; border: 5px solid ${INK}; cursor: grab; }
        .edu-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 999px; background: ${MINT}; border: 5px solid ${INK}; cursor: grab; }
        .edu-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px rgba(18,97,59,0.3); }
      `}</style>
    </div>
  );
};

const Faq: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[20px] bg-[#F5F6F8]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B7A43]/40"
      >
        <span className="text-[16px] font-bold">{q}</span>
        <ChevronDown className={cn('w-5 h-5 shrink-0 text-[#1B7A43] transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <p className="px-6 pb-5 -mt-1 text-[15px] leading-[1.75] text-[#4B5563] animate-in fade-in duration-200">{a}</p>
      )}
    </div>
  );
};

export default BecomeInstructor;
