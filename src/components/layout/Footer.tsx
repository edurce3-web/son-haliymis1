import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useCategoryNav } from '@/hooks/useCategoryNav';

/*
 * Sitenin alt bilgisi.
 *
 * Koyu mürekkep yeşili zemin, nane logo. Bağlantılar ziyaretçinin durumuna
 * göre değişiyor: eğitmen olmayan biri panel ya da kurs oluşturma
 * sayfasına yönlendirilmiyor, giriş yapmamış biri hesap sayfalarına
 * gönderilmiyor. Her bağlantı, tıklayanın gerçekten açabileceği bir yere
 * gidiyor.
 */

/** Alt bilgide gösterilmeyen ana kategoriler (slug). */
const HIDDEN_CATEGORIES = new Set([
    'saglik-tip-yasam',
    'muzik-ses-hobi',
    'dil-akademik-hazirlik',
    'kisisel-gelisim-kariyer',
]);

type FooterLink = { label: string; to: string };
type Column = { title: string; links: FooterLink[] };

/** Eğitmen bilgisi önce oturumdan, yoksa saklanan kullanıcıdan (sayfa yenilenince titremesin). */
function useIsInstructor() {
    const { user } = useAuth();
    if (user?.role === 'instructor' || user?.is_instructor === true) return true;
    if (user) return false;
    try {
        const stored = JSON.parse(localStorage.getItem('user') || 'null');
        return stored?.role === 'instructor' || stored?.is_instructor === true;
    } catch {
        return false;
    }
}

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const { isAuthenticated } = useAuth();
    // Eğitmen ol sayfası zaten bu çağrıyla bitiyor; ikinci kez gösterme
    const showBand = useLocation().pathname !== '/become-instructor';
    const isInstructor = useIsInstructor() && isAuthenticated;
    const { data } = useCategoryNav();
    const categories = (data?.categories || []).filter(c => !HIDDEN_CATEGORIES.has(c.slug));

    const columns: Column[] = [
        {
            title: 'Keşfet',
            links: [
                { label: 'Tüm kurslar', to: '/courses' },
                { label: 'Yeni eklenenler', to: '/courses?sort=newest' },
                { label: 'En popüler', to: '/courses?sort=popular' },
                { label: 'En yüksek puanlı', to: '/courses?sort=rating' },
                { label: 'Ücretsiz kurslar', to: '/courses?free=1' },
            ],
        },
        isAuthenticated
            ? {
                title: 'Hesabım',
                links: [
                    { label: 'Eğitimlerim', to: '/home/learning' },
                    { label: 'Sertifikalarım', to: '/home/certificates' },
                    { label: 'Kitaplarım', to: '/home/books' },
                    { label: 'Sepetim', to: '/cart' },
                    { label: 'Ayarlar', to: '/home/settings/profile' },
                ],
            }
            : {
                title: 'Hesap',
                links: [
                    { label: 'Ücretsiz kaydol', to: '/register' },
                    { label: 'Giriş yap', to: '/login' },
                    { label: 'Şifremi unuttum', to: '/forgot-password' },
                ],
            },
        {
            title: 'Eğitmenler için',
            links: isInstructor
                ? [
                    { label: 'Eğitmen paneli', to: '/instructor/dashboard' },
                    { label: 'Yeni kurs oluştur', to: '/instructor/courses/create' },
                    { label: 'Gelir raporu', to: '/instructor/finance/report' },
                    { label: 'Kazanç modeli', to: '/pricing' },
                ]
                : [
                    { label: 'Eğitmen ol', to: '/become-instructor' },
                    { label: 'Kazanç modeli', to: '/pricing' },
                    { label: 'Eğitmen soruları', to: '/help' },
                ],
        },
        {
            title: 'Edurce',
            links: [
                { label: 'Hakkımızda', to: '/about' },
                { label: 'İletişim', to: '/contact' },
                { label: 'Yardım merkezi', to: '/help' },
                { label: 'İade koşulları', to: '/pricing#iade' },
            ],
        },
    ];

    return (
        <footer className="bg-[#0b2619] text-white/70">
            {/* Eğitmen olmayanlara kısa çağrı; eğitmenlere panel kısayolu */}
            {showBand && <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-14">
                <div className="rounded-3xl bg-[#b2f0c8] text-[#0b2619] px-6 sm:px-10 py-8 sm:py-9 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <p className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] leading-tight">
                            {isInstructor ? 'Yeni kursun seni bekliyor.' : 'Bildiğini öğret, yüksek komisyonla kazan.'}
                        </p>
                        <p className="mt-1.5 text-[14.5px] text-[#0b2619]/70">
                            {isInstructor
                                ? 'Panelinden taslak aç, derslerini yükle, incelemeye gönder.'
                                : 'Kurs açmak ücretsiz. Edurce yalnızca satış olduğunda pay alır.'}
                        </p>
                    </div>
                    <Link
                        to={isInstructor ? '/instructor/dashboard' : '/become-instructor'}
                        className="group shrink-0 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-[#0b2619] text-[#b2f0c8] text-[15px] font-bold hover:bg-[#123a27] transition-colors"
                    >
                        {isInstructor ? 'Eğitmen paneline git' : 'Eğitmen ol'}
                        <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>}

            {/* Kategori haritası: her ana kategori bir sütun, altında alt dalları */}
            {categories.length > 0 && (
                <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-14">
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#b2f0c8]/80 mb-7">
                        Edurce kursları
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                        {categories.map(cat => (
                            <nav key={cat.slug} aria-labelledby={`footer-cat-${cat.slug}`}>
                                <h3 id={`footer-cat-${cat.slug}`} className="mb-3">
                                    <Link
                                        to={`/courses/${cat.slug}`}
                                        className="text-[14.5px] font-bold text-white hover:text-[#b2f0c8] transition-colors"
                                    >
                                        {cat.name}
                                    </Link>
                                </h3>
                                <ul className="space-y-2">
                                    {cat.subcategories.map(sub => (
                                        <li key={sub.slug}>
                                            <Link
                                                to={`/courses/${cat.slug}/${sub.slug}`}
                                                className="text-[13.5px] leading-snug text-white/60 hover:text-white transition-colors"
                                            >
                                                {sub.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ))}
                    </div>
                </div>
            )}

            {/* Platform bağlantıları */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
                <div className="grid grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)] gap-x-8 gap-y-10">
                    <div className="col-span-2 lg:col-span-1">
                        <Link to="/" className="inline-flex" aria-label="Edurce ana sayfa">
                            <img src="/logo-mint.png" alt="Edurce" className="h-9 w-auto" />
                        </Link>
                        <p className="mt-4 text-[14px] leading-relaxed text-white/60 max-w-xs">
                            Yazılımdan tasarıma, mühendislikten iş dünyasına; alanında uzman
                            eğitmenlerden Türkçe online kurslar.
                        </p>
                    </div>

                    {columns.map(col => (
                        <nav key={col.title} aria-labelledby={`footer-col-${col.title}`}>
                            <h3
                                id={`footer-col-${col.title}`}
                                className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#b2f0c8]/80 mb-4"
                            >
                                {col.title}
                            </h3>
                            <ul className="space-y-2.5">
                                {col.links.map(link => (
                                    <li key={link.to + link.label}>
                                        <Link to={link.to} className="text-[14px] text-white/70 hover:text-white transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>
            </div>

            {/* Alt şerit */}
            <div className="bg-black/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[12.5px] text-white/50">© {currentYear} Edurce. Tüm hakları saklıdır.</p>
                    <div className="flex items-center gap-5 text-[12.5px]">
                        <Link to="/terms" className="text-white/55 hover:text-white transition-colors">Kullanım şartları</Link>
                        <Link to="/privacy" className="text-white/55 hover:text-white transition-colors">Gizlilik</Link>
                        <LanguageSwitcher tone="dark" />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
