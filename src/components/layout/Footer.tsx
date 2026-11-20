import React from 'react';
import { Link } from 'react-router-dom';
import { LanguagePicker } from '@/i18n/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useCategoryNav } from '@/hooks/useCategoryNav';

/*
 * Sitenin alt bilgisi.
 *
 * Açık, nötr gri zemin; logo nane renginde. Bağlantılar ziyaretçinin
 * durumuna göre değişiyor: eğitmen olmayan biri panel ya da kurs oluşturma
 * sayfasına yönlendirilmiyor, giriş yapmamış biri hesap sayfalarına
 * gönderilmiyor. Dil seçimi yalnızca burada.
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
                    { label: 'Eğitmen soruları', to: '/help#egitmen' },
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
        <footer className="px-3 sm:px-4 pb-3 sm:pb-4 bg-white">
            <div className="rounded-[28px] sm:rounded-[36px] bg-[#F5F6F8] text-[#4B5563]">
                {/* Kategori haritası */}
                {categories.length > 0 && (
                    <div className="mx-auto max-w-7xl px-6 sm:px-10 pt-14">
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1B7A43] mb-7">
                            Edurce kursları
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                            {categories.map(cat => (
                                <nav key={cat.slug} aria-labelledby={`footer-cat-${cat.slug}`}>
                                    <h3 id={`footer-cat-${cat.slug}`} className="mb-3">
                                        <Link
                                            to={`/courses/${cat.slug}`}
                                            className="text-[14.5px] font-bold text-[#111827] hover:text-[#1B7A43] transition-colors"
                                        >
                                            {cat.name}
                                        </Link>
                                    </h3>
                                    <ul className="space-y-2">
                                        {cat.subcategories.map(sub => (
                                            <li key={sub.slug}>
                                                <Link
                                                    to={`/courses/${cat.slug}/${sub.slug}`}
                                                    className="text-[13.5px] leading-snug text-[#6B7280] hover:text-[#111827] transition-colors"
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
                <div className="mx-auto max-w-7xl px-6 sm:px-10 py-14">
                    <div className="rounded-[24px] bg-white px-6 sm:px-8 py-9 grid grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)] gap-x-8 gap-y-10">
                        <div className="col-span-2 lg:col-span-1">
                            <Link to="/" className="inline-flex" aria-label="Edurce ana sayfa">
                                <img src="/logo-mint.png" alt="Edurce" className="h-10 w-auto" />
                            </Link>
                            <p className="mt-4 text-[14px] leading-relaxed text-[#6B7280] max-w-xs">
                                Yazılımdan tasarıma, mühendislikten iş dünyasına; alanında uzman
                                eğitmenlerden Türkçe online kurslar.
                            </p>
                        </div>

                        {columns.map(col => (
                            <nav key={col.title} aria-labelledby={`footer-col-${col.title}`}>
                                <h3
                                    id={`footer-col-${col.title}`}
                                    className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF] mb-4"
                                >
                                    {col.title}
                                </h3>
                                <ul className="space-y-2.5">
                                    {col.links.map(link => (
                                        <li key={link.to + link.label}>
                                            <Link to={link.to} className="text-[14px] font-medium text-[#374151] hover:text-[#1B7A43] transition-colors">
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
                <div className="mx-auto max-w-7xl px-6 sm:px-10 pb-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-5">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-[13px]">
                        <p className="text-[#6B7280]">{`© ${currentYear} Edurce. Tüm hakları saklıdır.`}</p>
                        <div className="flex items-center gap-5">
                            <Link to="/terms" className="text-[#6B7280] hover:text-[#111827] transition-colors">Kullanım şartları</Link>
                            <Link to="/privacy" className="text-[#6B7280] hover:text-[#111827] transition-colors">Gizlilik</Link>
                        </div>
                    </div>
                    <LanguagePicker />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
