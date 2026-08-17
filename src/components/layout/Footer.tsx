import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCategoryNav } from '@/hooks/useCategoryNav';

/** Footer'ın alt bloğundaki bağlantı sütunları. */
const LINK_COLUMNS: Array<{ title: string; links: Array<{ label: string; to: string }> }> = [
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
    {
        title: 'Eğitmenler için',
        links: [
            { label: 'Eğitmen ol', to: '/become-instructor' },
            { label: 'Eğitmen paneli', to: '/instructor/dashboard' },
            { label: 'Kurs oluştur', to: '/instructor/courses/create' },
            { label: 'Kazanç modeli', to: '/pricing' },
        ],
    },
    {
        title: 'Kurumsal',
        links: [
            { label: 'Hakkımızda', to: '/about' },
            { label: 'İletişim', to: '/contact' },
            { label: 'Fiyatlandırma', to: '/pricing' },
        ],
    },
    {
        title: 'Destek',
        links: [
            { label: 'Yardım merkezi', to: '/help' },
            { label: 'İade koşulları', to: '/pricing#iade' },
            { label: 'Kullanım şartları', to: '/terms' },
            { label: 'Gizlilik politikası', to: '/privacy' },
        ],
    },
];

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const { isAuthenticated } = useAuth();
    const { data } = useCategoryNav();
    const categories = data.categories;

    return (
        <footer className="bg-slate-50 border-t border-slate-200 text-slate-600">

            {/* ── Kategori haritası ───────────────────────────────────────────
                Her ana kategori bir sütun, altında alt dalları. Arama motoru
                için de değerli: her kategori sayfasına siteden bağlantı olur. */}
            {categories.length > 0 && (
                <div className="border-b border-slate-200">
                    <div className="container mx-auto max-w-7xl px-4 py-12">
                        <h2 className="text-xl font-bold text-slate-900 mb-8">
                            Edurce kursları
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10">
                            {categories.map(cat => (
                                <nav key={cat.slug} aria-labelledby={`footer-cat-${cat.slug}`}>
                                    <h3 id={`footer-cat-${cat.slug}`} className="mb-3">
                                        <Link
                                            to={`/courses/${cat.slug}`}
                                            className="text-[13px] font-bold uppercase tracking-wide text-slate-900 hover:text-brand-700 transition-colors"
                                        >
                                            {cat.name}
                                        </Link>
                                    </h3>
                                    <ul className="space-y-2">
                                        {cat.subcategories.map(sub => (
                                            <li key={sub.slug}>
                                                <Link
                                                    to={`/courses/${cat.slug}/${sub.slug}`}
                                                    className="text-[13.5px] leading-snug text-slate-600 hover:text-brand-700 hover:underline transition-colors"
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
                </div>
            )}

            {/* ── Platform bağlantıları ───────────────────────────────────── */}
            <div className="container mx-auto max-w-7xl px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_repeat(4,1fr)] gap-10">

                    <div>
                        {/* Logo görselinin çevresi büyük oranda boş; bu yüzden
                            doğrudan yükseklik vermek yazıyı küçültüyor.
                            Header'daki yöntemin aynısı: görsel büyütülüp dar bir
                            kutuda kırpılıyor, böylece yazı gerçek boyutunda
                            oturuyor. */}
                        <Link to="/" className="flex items-center overflow-hidden h-14 -ml-1 mb-3 w-max">
                            <img
                                src="/logo.png"
                                alt="Edurce"
                                className="h-44 w-auto object-contain"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-600 max-w-xs">
                            Yazılımdan tasarıma, mühendislikten müziğe; alanında uzman
                            eğitmenlerden Türkçe online kurslar.
                        </p>

                        {!isAuthenticated && (
                            <div className="flex items-center gap-3 mt-6">
                                <Link
                                    to="/register"
                                    className="h-10 px-5 inline-flex items-center rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors"
                                >
                                    Ücretsiz kaydol
                                </Link>
                                <Link
                                    to="/login"
                                    className="h-10 px-5 inline-flex items-center rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-semibold transition-colors"
                                >
                                    Giriş yap
                                </Link>
                            </div>
                        )}
                    </div>

                    {LINK_COLUMNS.map(col => (
                        <nav key={col.title} aria-labelledby={`footer-col-${col.title}`}>
                            <h3
                                id={`footer-col-${col.title}`}
                                className="text-[13px] font-bold uppercase tracking-wide text-slate-900 mb-3"
                            >
                                {col.title}
                            </h3>
                            <ul className="space-y-2.5">
                                {col.links.map(link => (
                                    <li key={link.to + link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-slate-600 hover:text-brand-700 transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>
            </div>

            {/* ── Alt şerit ───────────────────────────────────────────────── */}
            <div className="border-t border-slate-200">
                <div className="container mx-auto max-w-7xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                        © {currentYear} Edurce. Tüm hakları saklıdır.
                    </p>
                    <div className="flex items-center gap-5 text-xs">
                        <Link to="/terms" className="text-slate-500 hover:text-brand-700 transition-colors">
                            Kullanım şartları
                        </Link>
                        <Link to="/privacy" className="text-slate-500 hover:text-brand-700 transition-colors">
                            Gizlilik
                        </Link>
                        <span className="text-slate-400">Türkçe (TR)</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
