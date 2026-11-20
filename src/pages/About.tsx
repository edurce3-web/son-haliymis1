import React from 'react';
import { Link } from 'react-router-dom';
import { ContactBand } from '@/components/content/PageLayout';
import { CATEGORY_TREE } from '@/data/categoryTree';
import { useSeo } from '@/hooks/useSeo';

/*
 * Hakkımızda.
 *
 * Doğrulanamayan sayı yok ("10.000+ öğrenci" gibi), komisyon oranı yok.
 * Platformun ne yaptığı, nasıl çalıştığı ve hangi ilkelere bağlı olduğu
 * anlatılıyor. İkon kullanılmıyor; hiyerarşi tipografi, numara ve zemin
 * tonuyla kuruluyor.
 */

const PROMISES = [
    { t: 'Tek seferlik ödeme', d: 'Abonelik yok. Kursu bir kez satın alırsın, o kadar.' },
    { t: 'Süresiz erişim', d: 'Satın aldığın kurs senindir; güncellemeler de dahil.' },
    { t: 'Bitirince sertifika', d: 'Tamamladığın her kurs için doğrulanabilir sertifika.' },
];

const STUDENT = [
    'Kurslara kategori sayfalarından ya da aramadan ulaşırsın.',
    'Satın aldığın kurslar Eğitimlerim sayfasında toplanır.',
    'İlerlemen otomatik kaydedilir, kaldığın yerden devam edersin.',
    'Ders sırasında eğitmene soru sorar, mesaj gönderirsin.',
];
const TEACHER = [
    'Eğitmen hesabı birkaç dakikada açılır, kurs açmak ücretsizdir.',
    'Yüklenen videolar farklı kalitelere arka planda hazırlanır.',
    'Fiyatı eğitmen belirler; kendi kuponlarıyla kampanya yapar.',
    'Satıştan yüksek komisyon alır, kazancını panelden izler.',
];

const PRINCIPLES = [
    { t: 'Şeffaf fiyat', d: 'Gösterilen tutar ödenen tutardır. Ödeme adımında sürpriz kalem çıkmaz.' },
    { t: 'Kalıcı erişim', d: 'Satın alınan kurs süreli değildir. Eğitmen kursu güncellerse ek ücret ödemeden erişirsin.' },
    { t: 'İçerik eğitmene aittir', d: 'Eğitmen içeriğinin haklarını korur; platform içeriği yalnızca yayınlamak ve tanıtmak için kullanır.' },
    { t: 'Ölçülü iletişim', d: 'Pazarlama e-postası göndermiyoruz. Satın alma, doğrulama, mesaj ve duyuru dışında yazmayız.' },
    { t: 'Veri en azı', d: 'Yalnızca hizmeti sunmak için gereken veriyi topluyoruz. Ayrıntılar gizlilik politikasında.' },
    { t: 'Kalite incelemesi', d: 'Her kurs yayına girmeden önce incelenir; eksik ya da yanıltıcı içerik katalogda yer almaz.' },
];

const TRUST = [
    { t: 'Korunan içerik', d: 'Ders videoları ve dosyalar herkese kapalı depolamada tutulur; yalnızca erişim hakkı olanlar süreli bağlantılarla ulaşır.' },
    { t: 'Akıcı izleme', d: 'Videolar içerik dağıtım ağı üzerinden gelir; görüntü kalitesi bağlantı hızına göre kendini ayarlar.' },
    { t: 'Güvenli ödeme', d: 'Ödemeler 3D Secure destekli altyapıdan alınır; kart bilgileri sistemimizde saklanmaz.' },
];

const SHOWN = ['yazilim-teknoloji', 'muhendislik-donanim', 'tasarim-gorsel-sanatlar', 'is-dunyasi-yonetim-finans'];

const About: React.FC = () => {
    useSeo({
        title: 'Hakkımızda | Edurce',
        description: 'Edurce nedir, nasıl çalışır, öğrenciler ve eğitmenler için ne sunar? Platformun işleyişi ve ilkeleri.',
        canonical: 'https://edurce.com/about',
        robots: 'index, follow',
    }, []);

    return (
        <div className="bg-white text-[#111827]">
            {/* Başlık */}
            <div className="px-3 sm:px-4 pt-3 sm:pt-4">
                <header className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#F5F6F8]">
                    <div aria-hidden className="absolute -right-28 -bottom-40 w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] rounded-[38%] bg-[#B2F0C8] -rotate-12" />
                    <div className="relative mx-auto max-w-[1140px] px-5 sm:px-10 pt-10 pb-14 lg:pt-14 lg:pb-24">
                        <nav className="text-[13px] font-medium mb-10">
                            <Link to="/" className="text-[#6B7280] hover:text-[#111827] transition-colors">Ana sayfa</Link>
                            <span className="mx-2 text-[#9CA3AF]">/</span>
                            <span>Hakkımızda</span>
                        </nav>
                        <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#1B7A43]">Hakkımızda</p>
                        <h1 className="mt-3 font-montserrat text-[38px] sm:text-[54px] lg:text-[68px] font-extrabold tracking-[-0.04em] leading-[1.0] max-w-[14ch]">
                            Bilgi, paylaştıkça değer kazanır.
                        </h1>
                        <p className="mt-6 text-[17px] lg:text-[19px] text-[#4B5563] leading-[1.65] max-w-[48ch]">
                            Edurce; alanında çalışan eğitmenlerle öğrenmek isteyenleri aynı yerde buluşturan
                            Türkçe online kurs platformu.
                        </p>
                    </div>
                </header>
            </div>

            {/* Neden varız + üç söz */}
            <section className="mx-auto max-w-[1140px] px-5 sm:px-10 py-16 lg:py-24 grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-12 lg:gap-20">
                <div>
                    <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#1B7A43]">Neden varız</p>
                    <p className="mt-4 text-[24px] sm:text-[30px] leading-[1.35] font-semibold tracking-[-0.015em] text-balance">
                        İyi bir öğretmen bulmak çoğu zaman şansa kalıyor. Biz, işini bilen insanların
                        bildiklerini düzenli, ulaşılabilir ve Türkçe kurslara dönüştürebileceği bir yer kurduk.
                    </p>
                    <p className="mt-6 text-[16.5px] leading-[1.8] text-[#4B5563] max-w-[60ch]">
                        Kurslar videolu derslerden oluşur. Canlı ders ya da sabit takvim yoktur: istediğin zaman
                        başlar, bırakır ve kaldığın yerden devam edersin. Eğitmen bölüm ve ders yapısını kendisi
                        kurar; sen kendi hızında ilerlersin.
                    </p>
                </div>
                <ol className="space-y-3 self-start">
                    {PROMISES.map((p, i) => (
                        <li key={p.t} className="flex gap-5 rounded-[22px] bg-[#F5F6F8] p-6">
                            <span className="font-montserrat text-[34px] font-extrabold leading-none text-[#1B7A43] tabular-nums w-12 shrink-0">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <span>
                                <span className="block text-[17px] font-bold">{p.t}</span>
                                <span className="block mt-1 text-[14.5px] leading-[1.6] text-[#6B7280]">{p.d}</span>
                            </span>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Nasıl çalışıyor */}
            <section className="mx-auto max-w-[1140px] px-5 sm:px-10 pb-16 lg:pb-24">
                <h2 className="font-montserrat text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">Nasıl çalışıyor?</h2>
                <div className="mt-8 grid md:grid-cols-2 gap-4">
                    <Side title="Öğrenciler için" items={STUDENT} link={{ to: '/courses', label: 'Kursları keşfet' }} tone="mint" />
                    <Side title="Eğitmenler için" items={TEACHER} link={{ to: '/become-instructor', label: 'Eğitmen ol' }} tone="gray" />
                </div>
            </section>

            {/* İlkeler */}
            <section className="bg-[#F5F6F8]">
                <div className="mx-auto max-w-[1140px] px-5 sm:px-10 py-16 lg:py-24">
                    <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10 lg:gap-16">
                        <div>
                            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#1B7A43]">İlkelerimiz</p>
                            <h2 className="mt-3 font-montserrat text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight text-balance">
                                Söz verdiğimiz ve tuttuğumuz şeyler.
                            </h2>
                            <p className="mt-4 text-[16px] leading-[1.75] text-[#4B5563] max-w-[42ch]">
                                Bir platformu güvenilir yapan büyük vaatler değil, her gün tutulan küçük sözlerdir.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {PRINCIPLES.map((p, i) => (
                                <div key={p.t} className="rounded-[22px] bg-white p-6">
                                    <span className="font-montserrat text-[13px] font-extrabold text-[#1B7A43] tabular-nums">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <h3 className="mt-2 text-[17px] font-bold">{p.t}</h3>
                                    <p className="mt-1.5 text-[14.5px] leading-[1.65] text-[#6B7280]">{p.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Güven */}
            <section className="mx-auto max-w-[1140px] px-5 sm:px-10 py-16 lg:py-24">
                <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#1B7A43]">Altyapı</p>
                <h2 className="mt-3 font-montserrat text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight max-w-[22ch]">
                    Arka planda sessizce çalışan güven.
                </h2>
                <div className="mt-10 grid md:grid-cols-3 gap-x-10 gap-y-8">
                    {TRUST.map(t => (
                        <div key={t.t}>
                            <span aria-hidden className="block w-10 h-1.5 rounded-full bg-[#B2F0C8]" />
                            <h3 className="mt-4 text-[18px] font-bold">{t.t}</h3>
                            <p className="mt-2 text-[15px] leading-[1.75] text-[#4B5563]">{t.d}</p>
                        </div>
                    ))}
                </div>
                <p className="mt-10 text-[14.5px] text-[#6B7280]">
                    Bir güvenlik açığı fark ettiysen{' '}
                    <Link to="/contact" className="font-semibold text-[#1B7A43] hover:underline underline-offset-4">bize yaz</Link>;
                    bildirimleri öncelikli ele alıyoruz.
                </p>
            </section>

            {/* Konular */}
            <section className="mx-auto max-w-[1140px] px-5 sm:px-10 pb-16 lg:pb-24">
                <div className="rounded-[28px] bg-[#F5F6F8] p-7 sm:p-10">
                    <h2 className="font-montserrat text-[24px] sm:text-[30px] font-extrabold tracking-[-0.025em]">Neler öğrenebilirsin?</h2>
                    <div className="mt-6 grid sm:grid-cols-2 gap-x-10 gap-y-7">
                        {CATEGORY_TREE.filter(c => SHOWN.includes(c.slug)).map(c => (
                            <div key={c.slug}>
                                <Link to={`/courses/${c.slug}`} className="text-[17px] font-bold hover:text-[#1B7A43] transition-colors">{c.name}</Link>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {c.children.slice(0, 5).map(s => (
                                        <Link
                                            key={s.slug}
                                            to={`/courses/${c.slug}/${s.slug}`}
                                            className="h-8 px-3 inline-flex items-center rounded-full bg-white text-[13px] font-medium text-[#374151] hover:bg-[#EEFBF3] hover:text-[#1B7A43] transition-colors"
                                        >
                                            {s.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/courses" className="mt-8 inline-flex items-center h-11 px-6 rounded-2xl bg-[#1B7A43] hover:bg-[#16613A] text-white text-[14.5px] font-bold transition-colors">
                        Tüm kurslar
                    </Link>
                </div>
            </section>

            <ContactBand />
        </div>
    );
};

const Side: React.FC<{ title: string; items: string[]; link: { to: string; label: string }; tone: 'mint' | 'gray' }> = ({
    title, items, link, tone,
}) => (
    <div className={tone === 'mint' ? 'rounded-[28px] bg-[#B2F0C8] p-7 sm:p-9' : 'rounded-[28px] bg-[#F5F6F8] p-7 sm:p-9'}>
        <h3 className="font-montserrat text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em]">{title}</h3>
        <ul className="mt-6 space-y-3.5">
            {items.map(t => (
                <li key={t} className="pl-6 relative text-[15.5px] leading-[1.65] text-[#1F2937]">
                    <span aria-hidden className="absolute left-0 top-[11px] w-3 h-[2px] rounded-full bg-[#111827]/50" />
                    {t}
                </li>
            ))}
        </ul>
        <Link
            to={link.to}
            className={tone === 'mint'
                ? 'mt-8 inline-flex items-center h-11 px-6 rounded-2xl bg-[#1B7A43] hover:bg-[#16613A] text-white text-[14.5px] font-bold transition-colors'
                : 'mt-8 inline-flex items-center h-11 px-6 rounded-2xl bg-white hover:bg-[#EEFBF3] text-[#111827] text-[14.5px] font-bold transition-colors'}
        >
            {link.label}
        </Link>
    </div>
);

export default About;
