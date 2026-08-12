import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';

/**
 * Eğitmen ol tanıtım sayfası.
 *
 * İçerikte uydurma rakam yok: eski sürümde "10.000+ öğrenci", "₺2M+ ödenen
 * gelir" gibi doğrulanamayan sayılar duruyordu. Onların yerine gerçekten
 * geçerli olan şeyler yazıldı — gelir paylaşımı oranları ve platformun
 * sunduğu somut özellikler.
 */

const STEPS = [
    {
        no: '01',
        title: 'Başvurunu gönder',
        text: 'Kısa bir form doldurup uzmanlık alanını anlat. Başvurun incelendikten sonra eğitmen paneline erişim açılır.',
    },
    {
        no: '02',
        title: 'Kursunu hazırla',
        text: 'Bölüm bölüm ders ekle, videolarını yükle. Videolar arka planda işlenir; sen siteden çıksan bile işlem sürer ve bittiğinde e-posta alırsın.',
    },
    {
        no: '03',
        title: 'Yayına al',
        text: 'Fiyatını belirle, kapak görselini ve tanıtım videonu ekle, yayınla. Kursun aynı anda kategori sayfalarında ve aramada görünmeye başlar.',
    },
    {
        no: '04',
        title: 'Kazancını takip et',
        text: 'Her satış anında panele düşer. Aylık ve yıllık kazancını grafiklerle izler, ödeme bilgilerini kendin yönetirsin.',
    },
];

const FEATURES = [
    {
        title: 'Video işleme dahil',
        text: 'Yüklediğin video farklı kalitelerde otomatik hazırlanır ve dağıtım ağı üzerinden yayınlanır. Ayrı bir hizmet kullanman gerekmez.',
    },
    {
        title: 'Öğrenciyle doğrudan iletişim',
        text: 'Soru-cevap, mesajlaşma ve duyuru araçları hazır. Duyuru yaptığında kursa kayıtlı herkese bildirim ve e-posta gider.',
    },
    {
        title: 'Şeffaf finans raporu',
        text: 'Satış başına brüt tutar, kesilen vergi ve sana kalan pay ayrı ayrı görünür. Kurs bazlı döküm ve CSV dışa aktarma var.',
    },
    {
        title: 'Ödeme altyapısı kurulu',
        text: 'Tahsilat, iade ve fatura akışıyla uğraşmazsın. IBAN bilgini girersin, ödemeler belirlediğin gün yapılır.',
    },
    {
        title: 'Kendi takvimin',
        text: 'Canlı ders zorunluluğu yok. Kursunu istediğin zaman hazırlar, istediğin zaman güncellersin.',
    },
    {
        title: 'Sertifika ve ilerleme takibi',
        text: 'Öğrencilerin ilerlemesi otomatik takip edilir, kursu bitirenlere sertifika üretilir.',
    },
];

const FAQ = [
    {
        q: 'Eğitmen olmak için ücret ödüyor muyum?',
        a: 'Hayır. Kurs oluşturmak, video yüklemek ve yayınlamak ücretsiz. Platform yalnızca satış gerçekleştiğinde pay alır.',
    },
    {
        q: 'Kursumun fiyatını kim belirliyor?',
        a: 'Sen belirliyorsun. Fiyatı istediğin zaman değiştirebilir, kursu ücretsiz de yayınlayabilirsin.',
    },
    {
        q: 'Ne tür içerik yükleyebilirim?',
        a: 'Video dersler, ders kaynakları ve dokümanlar. Bölüm ve ders yapısını kendin kurarsın; ders sayısında sınır yok.',
    },
    {
        q: 'Ödemem ne zaman yapılır?',
        a: 'Ödeme gününü eğitmen panelindeki ödeme ayarlarından sen seçersin. Biriken bakiyeni ve geçmiş ödemelerini aynı ekrandan görürsün.',
    },
    {
        q: 'Kursumu sonradan güncelleyebilir miyim?',
        a: 'Evet. Ders ekleyebilir, video değiştirebilir, açıklamaları düzenleyebilirsin. Kursu satın alan öğrenciler güncellemelere ücretsiz erişir.',
    },
];

const BecomeInstructor: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const isInstructor = Boolean((user as any)?.is_instructor || (user as any)?.role === 'instructor');

    useSeo({
        title: 'Eğitmen Ol — Bilgini Paylaş, Gelir Elde Et | Edurce',
        description:
            'Edurce\'de kurs yayınla, öğrencilerine ulaş. Satış tutarından vergi düşüldükten sonra kalanın %55\'i senin. Video işleme, ödeme altyapısı ve finans raporu dahil.',
        canonical: 'https://edurce.com/become-instructor',
        robots: 'index, follow',
    }, []);

    const ctaHref = isInstructor
        ? '/instructor/dashboard'
        : isAuthenticated ? '/instructor-application' : '/register';
    const ctaLabel = isInstructor
        ? 'Eğitmen paneline git'
        : isAuthenticated ? 'Başvuruyu başlat' : 'Ücretsiz kaydol';

    return (
        <div className="min-h-screen bg-white">

            {/* ── Giriş ───────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-brand-900">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -top-40 -left-24 w-[520px] h-[520px] bg-brand-500/25 rounded-full blur-[130px]" />
                    <div className="absolute -bottom-48 right-0 w-[560px] h-[560px] bg-brand-400/15 rounded-full blur-[140px]" />
                </div>

                <div className="relative container px-4 py-20 lg:py-24">
                    <div className="max-w-3xl">
                        <p className="text-brand-300 font-semibold text-sm tracking-wide uppercase mb-4">
                            Edurce eğitmenliği
                        </p>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.12] tracking-tight">
                            Bildiğini öğret, <span className="text-brand-300">gelir elde et</span>
                        </h1>
                        <p className="text-[17px] text-brand-100/80 mt-5 leading-relaxed max-w-2xl">
                            Kursunu hazırla, yayınla, öğrencilerine ulaş. Video işleme, ödeme
                            altyapısı ve finans raporlaması bizde — sen yalnızca içeriğe
                            odaklan.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-9">
                            <Link to={ctaHref}>
                                <Button className="h-12 px-7 rounded-xl bg-white text-brand-800 hover:bg-brand-50 font-semibold text-[15px]">
                                    {ctaLabel}
                                </Button>
                            </Link>
                            <a href="#kazanc">
                                <Button
                                    variant="outline"
                                    className="h-12 px-7 rounded-xl bg-transparent border-white/25 text-white hover:bg-white/10 hover:text-white font-semibold text-[15px]"
                                >
                                    Kazanç modeli
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Kazanç modeli ───────────────────────────────────────────── */}
            <section id="kazanc" className="container px-4 py-16 lg:py-20 scroll-mt-20">
                <div className="max-w-2xl mb-10">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Kazanç modeli
                    </h2>
                    <p className="text-slate-600 mt-3 leading-relaxed">
                        Gizli kesinti yok. Brüt satış tutarından önce yasal vergi düşülür,
                        kalan tutarın %55'i sana aittir.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
                    {[
                        { step: 'Brüt satış', value: '1.000 ₺', note: 'Öğrencinin ödediği tutar' },
                        { step: 'Vergi (%20)', value: '−200 ₺', note: 'Yasal kesinti' },
                        { step: 'Sana kalan', value: '440 ₺', note: 'Kalan 800 ₺\'nin %55\'i', highlight: true },
                    ].map(row => (
                        <div
                            key={row.step}
                            className={row.highlight ? 'bg-brand-50 p-7' : 'bg-white p-7'}
                        >
                            <p className="text-sm font-medium text-slate-500">{row.step}</p>
                            <p className={`text-3xl font-bold mt-2 ${row.highlight ? 'text-brand-700' : 'text-slate-900'}`}>
                                {row.value}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">{row.note}</p>
                        </div>
                    ))}
                </div>

                <p className="text-sm text-slate-500 mt-4">
                    Örnek 1.000 ₺'lik bir satış üzerinedir. Her satışın dökümünü eğitmen
                    panelindeki satış raporunda kalem kalem görürsün.
                </p>
            </section>

            {/* ── Nasıl işliyor ───────────────────────────────────────────── */}
            <section className="bg-slate-50 border-y border-slate-200 py-16 lg:py-20">
                <div className="container px-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-10">
                        Nasıl işliyor?
                    </h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STEPS.map(step => (
                            <div key={step.no} className="bg-white border border-slate-200 rounded-2xl p-6">
                                <span className="text-[13px] font-bold text-brand-600 tracking-widest">
                                    {step.no}
                                </span>
                                <h3 className="font-bold text-slate-900 mt-3 mb-2">{step.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Neler hazır ─────────────────────────────────────────────── */}
            <section className="container px-4 py-16 lg:py-20">
                <div className="max-w-2xl mb-10">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Platform sana ne sağlıyor?
                    </h2>
                    <p className="text-slate-600 mt-3 leading-relaxed">
                        Kurs yayınlamak için gereken teknik altyapının tamamı kurulu geliyor.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-9">
                    {FEATURES.map(f => (
                        <div key={f.title} className="border-l-2 border-brand-200 pl-5">
                            <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">{f.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Sık sorulanlar ──────────────────────────────────────────── */}
            <section className="bg-slate-50 border-y border-slate-200 py-16 lg:py-20">
                <div className="container px-4 max-w-3xl">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-8">
                        Sık sorulanlar
                    </h2>

                    <div className="divide-y divide-slate-200 border-y border-slate-200">
                        {FAQ.map(item => (
                            <details key={item.q} className="group py-5">
                                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                                    <h3 className="font-semibold text-slate-900 text-[15px]">{item.q}</h3>
                                    <span className="shrink-0 text-slate-400 text-xl leading-none transition-transform group-open:rotate-45">
                                        +
                                    </span>
                                </summary>
                                <p className="text-sm text-slate-600 leading-relaxed mt-3 pr-8">
                                    {item.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Kapanış çağrısı ─────────────────────────────────────────── */}
            <section className="container px-4 py-16 lg:py-20">
                <div className="relative overflow-hidden rounded-2xl bg-brand-800 px-8 py-12 lg:px-14 lg:py-14">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
                        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-brand-400 blur-3xl" />
                    </div>
                    <div className="relative max-w-2xl">
                        <h2 className="text-2xl lg:text-[28px] font-bold text-white leading-tight">
                            İlk kursunu bugün hazırlamaya başla
                        </h2>
                        <p className="text-brand-100/80 mt-3 leading-relaxed">
                            Başvuru birkaç dakika sürüyor. Onaylandığında eğitmen paneline
                            erişimin açılır ve hemen kurs oluşturmaya başlayabilirsin.
                        </p>
                        <Link to={ctaHref} className="inline-block mt-7">
                            <Button className="h-12 px-7 rounded-xl bg-white text-brand-800 hover:bg-brand-50 font-semibold text-[15px]">
                                {ctaLabel}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BecomeInstructor;
