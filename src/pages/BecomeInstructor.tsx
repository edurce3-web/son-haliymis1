import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import HeroVisual from '@/components/instructor/HeroVisual';
import { useSeo } from '@/hooks/useSeo';

/**
 * Eğitmen ol.
 *
 * Sayfa bilinçli olarak sayı vermiyor: önceki hâlinde "10.000+ aktif öğrenci",
 * "₺2M+ ödenen gelir" gibi doğrulanamayan rakamlar vardı. Onların yerine
 * platformun gerçekten sunduğu şeyler ve kazanç modelinin tam dökümü var.
 * İkon kullanılmıyor; hiyerarşi tipografi ve boşlukla kuruluyor.
 */

/** Bölüm başlığı — altında markanın kısa çizgisi. */
const SectionTitle: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <div className="mb-8">
    <h2 className="font-montserrat text-[24px] sm:text-[28px] font-extrabold text-slate-900 tracking-[-0.02em]">
      {children}
    </h2>
    <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-2.5" />
    {hint && <p className="text-[15.5px] text-slate-500 mt-3 max-w-2xl">{hint}</p>}
  </div>
);

const BENEFITS = [
  {
    title: 'Kurs açmak ücretsiz',
    body: 'Aylık ücret, listeleme bedeli ya da yükleme kotası yok. Platform yalnızca satış gerçekleştiğinde pay alır.',
  },
  {
    title: 'Fiyatı siz belirlersiniz',
    body: 'Kursunuzun fiyatını kendiniz seçer, dilediğiniz zaman değiştirir, kupon tanımlayarak indirim yaparsınız.',
  },
  {
    title: 'Videolar sizin için hazırlanır',
    body: 'Yüklediğiniz video arka planda farklı kalitelerde işlenir ve dağıtım ağına aktarılır. Siz sadece dosyayı bırakırsınız.',
  },
  {
    title: 'İçerik size ait kalır',
    body: 'Kursunuzun hakları sizde. Platform içeriği yalnızca yayınlamak ve tanıtmak için kullanır.',
  },
  {
    title: 'Ödeme gününü siz seçersiniz',
    body: 'Hakedişinizi eğitmen panelinden takip eder, ödeme gününü kendiniz belirlersiniz.',
  },
  {
    title: 'Öğrenciyle doğrudan iletişim',
    body: 'Soru-cevap ve mesajlaşma üzerinden öğrencilerinize ulaşır, kursa duyuru yaparsınız.',
  },
];

const STEPS = [
  {
    title: 'Başvurun',
    body: 'Kısa bir form doldurup uzmanlık alanınızı ve deneyiminizi paylaşırsınız. Başvurunuz incelenip sonuçlandırılır.',
  },
  {
    title: 'Kursu kurun',
    body: 'Bölümleri ve dersleri oluşturur, videoları yükler, kaynak dosyalarını eklersiniz. Dilediğiniz dersi ücretsiz önizlemeye açabilirsiniz.',
  },
  {
    title: 'Fiyatlayın',
    body: 'Kursun fiyatını seçer, isterseniz kupon tanımlarsınız. Yayın öncesi kontrol ekranı eksikleri tek tek gösterir.',
  },
  {
    title: 'Yayınlayın',
    body: 'Kurs katalogda görünmeye başlar. Satışları, kazancınızı ve öğrenci ilerlemesini panelden izlersiniz.',
  },
];

const BecomeInstructor: React.FC = () => {
  useSeo({
    title: 'Eğitmen Ol | Edurce',
    description: 'Edurce\'de kurs açmak ücretsiz. Kazanç modeli, süreç ve eğitmenlik koşulları.',
    canonical: 'https://edurce.com/become-instructor',
    robots: 'index, follow',
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Kahraman bölümü — görsel sağ yarıyı kaplayıp zemine karışıyor */}
      <section className="relative overflow-hidden bg-brand-50/70 border-b border-brand-100">
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[58%] pointer-events-none">
          <HeroVisual />
        </div>

        <div className="relative container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-16 lg:py-24">
          <div className="max-w-xl">
            <h1 className="font-montserrat text-[34px] sm:text-[44px] lg:text-[52px] font-extrabold text-slate-900 leading-[1.08] tracking-[-0.03em]">
              Bildiğinizi
              <span className="block text-brand-700">öğretin</span>
            </h1>

            <p className="text-[17px] text-slate-600 leading-[1.7] mt-5 max-w-md">
              Kurs açmak ücretsiz. Videolarınızı yükleyin, fiyatını siz belirleyin,
              her satıştan pay alın.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to="/instructor-application"
                className="h-12 px-8 leading-[48px] rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[15px] font-semibold transition-colors"
              >
                Eğitmen başvurusu yap
              </Link>
              <a
                href="#kazanc"
                className="h-12 px-8 leading-[46px] rounded-lg border border-slate-300 bg-white hover:border-brand-400 hover:text-brand-800 text-slate-800 text-[15px] font-semibold transition-colors"
              >
                Ne kazanırım?
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px]">

        {/* ── Neden Edurce ──────────────────────────────────────────── */}
        <section className="py-14 lg:py-16">
          <SectionTitle hint="Eğitmenlik tarafında platformun taahhüt ettiği şeyler.">
            Neden Edurce
          </SectionTitle>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
            {BENEFITS.map(item => (
              <div key={item.title}>
                <h3 className="text-[16px] font-bold text-slate-900">{item.title}</h3>
                <span className="block w-6 h-[2px] rounded-full bg-brand-600 mt-2 mb-2.5" />
                <p className="text-[14.5px] text-slate-600 leading-[1.75]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Kazanç modeli ─────────────────────────────────────────── */}
        <section id="kazanc" className="scroll-mt-24 py-14 lg:py-16 border-t border-slate-200">
          <SectionTitle hint="Pay kursun niteliğine göre değişir; kendi kuponunuzla gelen satışın tamamı sizindir.">
            Ne kazanırsınız
          </SectionTitle>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-[14.5px] min-w-[320px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    {['Kursun durumu', 'Payınız'].map(h => (
                      <th
                        key={h}
                        className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 px-5 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-brand-50">
                    <td className="px-5 py-3.5 font-semibold text-brand-900">
                      Kendi kupon kodunuzla gelen satış
                    </td>
                    <td className="px-5 py-3.5 font-montserrat text-[18px] font-extrabold text-brand-900">
                      %100
                    </td>
                  </tr>
                  {[
                    ['Yalnızca Edurce\'de, özgün içerik', '%70'],
                    ['Başka platformlarda da yayında', '%55'],
                  ].map(row => (
                    <tr key={row[0]}>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{row[0]}</td>
                      <td className="px-5 py-3.5 font-montserrat text-[18px] font-extrabold text-slate-700">
                        {row[1]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-5">
              <p className="text-[17px] font-semibold text-slate-900 leading-[1.6]">
                Bildiğinizi anlatın, kazancın büyük kısmı sizde kalsın.
              </p>
              <p className="text-[15.5px] text-slate-600 leading-[1.8]">
                Kursunuzu yalnızca Edurce'de yayınlarsanız her satışın %70'i sizindir.
                Kendi kupon kodunuzu paylaşıp öğrenci getirdiğinizde ise platform hiç
                pay almaz — o satışın tamamı size kalır.
              </p>
              <p className="text-[15.5px] text-slate-600 leading-[1.8]">
                Başlamak için ne bir ücret ne de bir taahhüt gerekiyor. Kurs açmak,
                video yüklemek ve yayınlamak baştan sona ücretsiz; kazanmaya ilk
                satışınızla başlarsınız.
              </p>
              <Link
                to="/instructor-application"
                className="inline-block h-11 px-6 leading-[44px] rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[15px] font-semibold transition-colors"
              >
                Hemen başvur
              </Link>
            </div>
          </div>
        </section>

        {/* ── Süreç ─────────────────────────────────────────────────── */}
        <section className="py-14 lg:py-16 border-t border-slate-200">
          <SectionTitle hint="Başvurudan yayına dört adım.">Nasıl çalışır</SectionTitle>

          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-9">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t-2 border-brand-600 pt-4">
                <span className="font-montserrat text-[12px] font-extrabold text-brand-700 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-[16px] font-bold text-slate-900 mt-1.5">{step.title}</h3>
                <p className="text-[14.5px] text-slate-600 leading-[1.75] mt-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Gereken şeyler ────────────────────────────────────────── */}
        <section className="py-14 lg:py-16 border-t border-slate-200">
          <SectionTitle>Başlamadan önce</SectionTitle>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 mb-3">Neye ihtiyacınız var</h3>
              <ul className="space-y-2.5">
                {[
                  'Anlatacağınız konuda gerçek bir deneyim',
                  'Sesi anlaşılır, görüntüsü net kayıtlar',
                  'Bölümlere ayrılmış bir ders planı',
                  'Ödeme için IBAN ve kimlik bilgileri',
                ].map(item => (
                  <li key={item} className="text-[14.5px] text-slate-600 leading-[1.75] pl-5 relative">
                    <span className="absolute left-0 top-[11px] w-2.5 h-px bg-brand-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[16px] font-bold text-slate-900 mb-3">Neye ihtiyacınız yok</h3>
              <ul className="space-y-2.5">
                {[
                  'Profesyonel stüdyo ya da pahalı ekipman',
                  'Video düzenleme bilgisi — dosyayı yüklemeniz yeterli',
                  'Belirli sayıda takipçi ya da izleyici kitlesi',
                  'Başlangıç ücreti; kurs açmak tamamen ücretsiz',
                ].map(item => (
                  <li key={item} className="text-[14.5px] text-slate-600 leading-[1.75] pl-5 relative">
                    <span className="absolute left-0 top-[11px] w-2.5 h-px bg-slate-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* ── Kapanış ───────────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-14 lg:py-16">
          <div className="max-w-2xl">
            <h2 className="font-montserrat text-[24px] sm:text-[28px] font-extrabold text-slate-900 tracking-[-0.02em]">
              Başvurmaya hazır mısınız?
            </h2>
            <p className="text-[15.5px] text-slate-600 leading-[1.75] mt-3">
              Başvuru formu birkaç dakika sürer. Onaylandığında eğitmen paneline
              erişiminiz açılır ve ilk kursunuzu oluşturmaya başlayabilirsiniz.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                to="/instructor-application"
                className="h-12 px-8 leading-[48px] rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[15px] font-semibold transition-colors"
              >
                Eğitmen başvurusu yap
              </Link>
              <Link
                to="/help"
                className="h-12 px-8 leading-[46px] rounded-lg border border-slate-300 bg-white hover:border-brand-400 hover:text-brand-800 text-slate-800 text-[15px] font-semibold transition-colors"
              >
                Sorularınız için
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BecomeInstructor;
