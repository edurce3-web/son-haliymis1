import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import { cn } from '@/lib/utils';
import { CourseCard } from '@/components/course/CourseCard';
import { Button } from '@/components/ui/button';
import {
    Search, ArrowRight, ChevronLeft, ChevronRight, BookOpen,
    Code2, Cpu, Palette, Briefcase, Sparkles, Languages, Music, HeartPulse,
} from 'lucide-react';

interface HomeData {
    featured_courses: any[];
    top_selling: any[];
    new_courses: any[];
    free_courses: any[];
}

/** Kategori ikonları — ağaçtaki icon alanı lucide adını tutuyor. */
const ICONS: Record<string, React.ElementType> = {
    Code2, Cpu, Palette, Briefcase, Sparkles, Languages, Music, HeartPulse,
};
const iconFor = (name: string | null) => (name && ICONS[name]) || BookOpen;

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Yatay kaydırmalı kurs rafı.
 * Kart olarak platformun her yerinde kullanılan CourseCard'ı kullanır.
 */
const CourseRail: React.FC<{
    title: string;
    subtitle?: string;
    courses: any[];
    href?: string;
    loading?: boolean;
    isAuthenticated?: boolean;
}> = ({ title, subtitle, courses, href, loading, isAuthenticated }) => {
    const railRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const update = () => {
        const el = railRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    useEffect(() => {
        update();
        const el = railRef.current;
        if (!el) return;
        el.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            el.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [courses.length]);

    const scroll = (dir: 1 | -1) => {
        const el = railRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * Math.max(320, el.clientWidth * 0.8), behavior: 'smooth' });
    };

    if (!loading && courses.length === 0) return null;

    return (
        <section className="py-7">
            <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">{title}</h2>
                    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {href && (
                        <Link
                            to={href}
                            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:gap-2 transition-all"
                        >
                            Tümünü gör <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                    <div className="hidden md:flex gap-1">
                        <button
                            onClick={() => scroll(-1)}
                            disabled={!canLeft}
                            aria-label="Geri"
                            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-brand-400 hover:text-brand-700 disabled:opacity-30 disabled:hover:border-slate-200 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scroll(1)}
                            disabled={!canRight}
                            aria-label="İleri"
                            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-brand-400 hover:text-brand-700 disabled:opacity-30 disabled:hover:border-slate-200 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Kartlar arası boşluk dar tutuldu; detay paneli kartın yanında
                açıldığı için taşmayı engellemek adına ray kırpılmıyor. */}
            <div
                ref={railRef}
                className="flex gap-2.5 overflow-x-auto overflow-y-visible pb-3 -mx-1 px-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="w-[262px] shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
                            <div className="aspect-video bg-slate-100" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-slate-100 rounded w-4/5" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                                <div className="h-5 bg-slate-100 rounded w-1/3 mt-4" />
                            </div>
                        </div>
                    ))
                    : courses.map(course => (
                        <div key={course.id} className="w-[262px] shrink-0 snap-start">
                            <CourseCard course={course} isAuthenticated={isAuthenticated} />
                        </div>
                    ))}
            </div>
        </section>
    );
};

/* ────────────────────────────────────────────────────────────────────────── */

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [term, setTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const { data, isLoading } = useQuery<HomeData>({
        queryKey: ['home'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/home`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Ana sayfa yüklenemedi');
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
    });

    // Kategoriler ortak ağaçtan gelir; menü ve ana sayfa hiçbir koşulda ayrışmaz.
    const { data: categoryNav } = useCategoryNav();
    const categories = categoryNav.categories;

    const shownCategory = useMemo(
        () => categories.find(c => c.slug === activeCategory) || categories[0] || null,
        [categories, activeCategory]
    );

    useSeo({
        title: 'Edurce — Online Kurslarla Kendini Geliştir',
        description:
            'Yazılım, mühendislik, tasarım, iş dünyası, dil ve daha fazlası. Alanında uzman eğitmenlerden Türkçe online kurslarla kendi hızında öğren.',
        canonical: 'https://edurce.com/',
        robots: 'index, follow',
        image: 'https://edurce.com/logo.png',
    }, []);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = term.trim();
        navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/courses');
    };

    const popularSearches = ['Python', 'Excel', 'React', 'İngilizce', 'Grafik Tasarım', 'Yapay Zeka'];

    return (
        <div className="min-h-screen bg-white">

            {/* ── Kahraman bölümü ─────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-brand-900">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -top-40 -left-24 w-[520px] h-[520px] bg-brand-500/25 rounded-full blur-[130px]" />
                    <div className="absolute -bottom-48 right-0 w-[560px] h-[560px] bg-brand-400/15 rounded-full blur-[140px]" />
                    <div
                        className="absolute inset-0 opacity-[0.05]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
                            backgroundSize: '56px 56px',
                        }}
                    />
                </div>

                <div className="relative container px-4 py-16 lg:py-20">
                    <div className="max-w-3xl">
                        {isAuthenticated && user?.first_name && (
                            <p className="text-brand-200 font-medium mb-3">
                                Tekrar hoş geldin, {user.first_name}
                            </p>
                        )}

                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.12] tracking-tight">
                            Öğrenmeye <span className="text-brand-300">bugün</span> başla
                        </h1>

                        <p className="text-[17px] text-brand-100/80 mt-5 max-w-2xl leading-relaxed">
                            Yazılımdan tasarıma, mühendislikten müziğe. Alanında uzman
                            eğitmenlerden Türkçe kurslarla kendi hızında ilerle.
                        </p>

                        <form onSubmit={submitSearch} className="mt-8 max-w-xl">
                            <div className="relative">
                                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    value={term}
                                    onChange={e => setTerm(e.target.value)}
                                    placeholder="Ne öğrenmek istiyorsun?"
                                    aria-label="Kurs ara"
                                    className="w-full h-14 pl-12 pr-32 rounded-xl bg-white text-[15px] text-slate-900 placeholder:text-slate-400 shadow-2xl shadow-black/25 focus:outline-none focus:ring-4 focus:ring-brand-400/40"
                                />
                                <Button
                                    type="submit"
                                    className="absolute right-2 top-2 h-10 px-6 rounded-lg bg-brand-700 hover:bg-brand-800 font-semibold"
                                >
                                    Ara
                                </Button>
                            </div>
                        </form>

                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            <span className="text-xs text-brand-200/70">Popüler:</span>
                            {popularSearches.map(s => (
                                <Link
                                    key={s}
                                    to={`/search?q=${encodeURIComponent(s)}`}
                                    className="text-xs text-brand-100 hover:text-white border border-white/15 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
                                >
                                    {s}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Kurs rafları ────────────────────────────────────────────── */}
            <div className="container px-4 pt-4">
                <CourseRail
                    title="En çok tercih edilenler"
                    subtitle="Öğrencilerin en çok kaydolduğu kurslar"
                    courses={data?.top_selling || []}
                    href="/courses?sort=popular"
                    loading={isLoading}
                    isAuthenticated={isAuthenticated}
                />
                <CourseRail
                    title="Öne çıkanlar"
                    subtitle="Yüksek puanlı, beğenilen eğitimler"
                    courses={data?.featured_courses || []}
                    href="/courses?sort=rating"
                    loading={isLoading}
                    isAuthenticated={isAuthenticated}
                />
                <CourseRail
                    title="Yeni eklenenler"
                    subtitle="Platforma en son katılan eğitimler"
                    courses={data?.new_courses || []}
                    href="/courses?sort=newest"
                    loading={isLoading}
                    isAuthenticated={isAuthenticated}
                />
                <CourseRail
                    title="Ücretsiz başla"
                    subtitle="Hiçbir ücret ödemeden erişebileceğin kurslar"
                    courses={data?.free_courses || []}
                    href="/courses?free=1"
                    isAuthenticated={isAuthenticated}
                />
            </div>

            {/* ── Kategoriler (sayfanın sonunda) ──────────────────────────── */}
            {categories.length > 0 && (
                <section className="container px-4 py-14">
                    <div className="max-w-2xl mb-7">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Ne öğrenmek istersin?
                        </h2>
                        <p className="text-slate-500 mt-1.5">
                            Sekiz ana alan, doksanı aşkın uzmanlık dalı.
                        </p>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-3 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {categories.map(cat => {
                            const Icon = iconFor(cat.icon);
                            const active = shownCategory?.slug === cat.slug;
                            return (
                                <button
                                    key={cat.slug}
                                    onClick={() => setActiveCategory(cat.slug)}
                                    onMouseEnter={() => setActiveCategory(cat.slug)}
                                    className={cn(
                                        'shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all',
                                        active
                                            ? 'bg-brand-700 text-white border-brand-700'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-800'
                                    )}
                                >
                                    <Icon className={cn('w-4 h-4', active ? 'text-white' : 'text-slate-400')} />
                                    <span className="whitespace-nowrap">{cat.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {shownCategory && (
                        <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-6 lg:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-brand-700 flex items-center justify-center shrink-0">
                                        {React.createElement(iconFor(shownCategory.icon), { className: 'w-5 h-5 text-white' })}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{shownCategory.name}</h3>
                                        <p className="text-xs text-slate-500">
                                            {shownCategory.subcategories.length} uzmanlık dalı · {shownCategory.count} kurs
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to={`/courses/${shownCategory.slug}`}
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:gap-2 transition-all"
                                >
                                    Kategoriye git <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {shownCategory.subcategories.map(sub => (
                                    <Link
                                        key={sub.slug}
                                        to={`/courses/${shownCategory.slug}/${sub.slug}`}
                                        className="group flex items-center justify-between gap-2 bg-white border border-brand-100 rounded-lg px-3.5 py-2.5 hover:border-brand-400 hover:shadow-sm transition-all"
                                    >
                                        <span className="text-sm text-slate-700 group-hover:text-brand-800 truncate">
                                            {sub.name}
                                        </span>
                                        {sub.count > 0 && (
                                            <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                                                {sub.count}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                                {shownCategory.subcategories.length === 0 && (
                                    <p className="text-sm text-slate-400 col-span-full py-2">
                                        Bu kategoride henüz alt dal yok.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default Home;
