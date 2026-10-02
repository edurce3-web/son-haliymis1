import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight, Star } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import CourseRail from '@/components/home/CourseRail';

interface HomeData {
    featured_courses: any[];
    top_selling: any[];
    new_courses: any[];
    free_courses: any[];
    testimonials?: any[];
    stats?: { courses: number; students: number; instructors: number; hours: number; reviews: number };
}

const POPULAR_SEARCHES = ['Python', 'Excel', 'React', 'İngilizce', 'Grafik Tasarım', 'Yapay Zeka'];

/**
 * Misafir ana sayfası.
 *
 * Amaç tek: ziyaretçiyi bir kursa götürmek. Sıralama bu amaca göre:
 * arama → kategoriler → kurslar → nasıl çalışır → yorumlar → eğitmen çağrısı.
 * Keşif üstte, ikna altta; üye sayfasında bu sıra tersine dönüyor çünkü
 * orada iş kullanıcıyı bıraktığı derse döndürmek.
 */
const GuestHome: React.FC = () => {
    const navigate = useNavigate();
    const [term, setTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const { data, isLoading } = useQuery<HomeData>({
        queryKey: ['home-guest'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/home`);
            if (!res.ok) throw new Error('Ana sayfa yüklenemedi');
            return res.json();
        },
    });

    const { data: categoryNav } = useCategoryNav();
    const categories = categoryNav?.categories || [];

    const shownCategory = useMemo(
        () => categories.find(c => c.slug === activeCategory) || categories[0] || null,
        [categories, activeCategory]
    );

    useSeo({
        title: 'Edurce — Türkçe Online Kurs Platformu',
        description: 'Yazılımdan tasarıma, mühendislikten müziğe; alanında uzman eğitmenlerden Türkçe kurslar. Bir kez öde, süresiz eriş.',
        canonical: 'https://edurce.com/',
    }, []);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = term.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    const stats = data?.stats;
    const testimonials = data?.testimonials || [];

    return (
        <div className="min-h-screen bg-white">

            {/* ── Kahraman bölümü ─────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-brand-900">
                {/*
                  Soldaki fotoğraf bölümün arka planının parçası: sağ kenarı
                  maskeyle eriyip koyu zemine karışıyor, üstüne marka rengi
                  bindiriliyor. Böylece parlak bir fotoğraf koyu bölüme
                  yapıştırılmış gibi durmuyor, sayfanın kendi dokusu oluyor.
                */}
                <div className="hidden lg:block absolute inset-y-0 left-0 w-[52%] pointer-events-none" aria-hidden>
                    <img
                        src="/anasayfa.jpg"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                            // Kişi kadrajın sağında; bu kayma onu görünür alanın
                            // ortasına getiriyor, maskeye denk gelmiyor.
                            objectPosition: '68% center',
                            maskImage: 'linear-gradient(to right, #000 0%, #000 58%, transparent 96%)',
                            WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 58%, transparent 96%)',
                        }}
                    />
                    <div className="absolute inset-0 bg-brand-900/55" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-900/70 via-transparent to-brand-900" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-brand-900/40" />
                </div>

                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -top-40 -left-24 w-[520px] h-[520px] bg-brand-500/20 rounded-full blur-[130px]" />
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

                <div className="relative container px-4 py-16 lg:py-24 lg:min-h-[560px] flex flex-col justify-center">
                    {/* Metin masaüstünde sağ yarıda; solu fotoğrafa bırakıyor */}
                    <div className="max-w-3xl lg:max-w-none lg:ml-[52%] lg:pl-10">
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
                            {POPULAR_SEARCHES.map(s => (
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

            {/* ── Sayılar ─────────────────────────────────────────────────
                Veritabanından geliyor; sıfır olan kalem hiç gösterilmiyor.
                Boş bir "0 öğrenci", rakam vermemekten daha kötü. */}
            {stats && (
                <section className="border-b border-slate-200 bg-slate-50/60">
                    <div className="container px-4 py-5">
                        <dl className="flex flex-wrap justify-center gap-x-10 gap-y-4">
                            {[
                                { k: 'courses', label: 'kurs' },
                                { k: 'students', label: 'öğrenci' },
                                { k: 'instructors', label: 'eğitmen' },
                                { k: 'hours', label: 'saat içerik' },
                            ].map(({ k, label }) => {
                                const value = Number((stats as any)[k]) || 0;
                                if (value === 0) return null;
                                return (
                                    <div key={k} className="text-center">
                                        <dt className="sr-only">{label}</dt>
                                        <dd>
                                            <span className="font-montserrat text-[22px] font-extrabold text-brand-800 tabular-nums">
                                                {value.toLocaleString('tr-TR')}
                                            </span>
                                            <span className="text-[13.5px] text-slate-500 ml-1.5">{label}</span>
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>
                    </div>
                </section>
            )}

            {/* ── Kategoriler ─────────────────────────────────────────────
                Misafirde keşif birincil, bu yüzden raflardan önce. */}
            {categories.length > 0 && (
                <section className="container px-4 pt-10 pb-4">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">
                        Ne öğrenmek istersin?
                    </h2>

                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {categories.map(cat => {
                            const active = shownCategory?.slug === cat.slug;
                            return (
                                <button
                                    key={cat.slug}
                                    onClick={() => setActiveCategory(cat.slug)}
                                    onMouseEnter={() => setActiveCategory(cat.slug)}
                                    className={cn(
                                        'shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all whitespace-nowrap',
                                        active
                                            ? 'bg-brand-700 text-white border-brand-700'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-800'
                                    )}
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>

                    {shownCategory && (
                        <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-6 lg:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{shownCategory.name}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {shownCategory.subcategories.length} uzmanlık dalı · {shownCategory.count} kurs
                                    </p>
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

            {/* ── Kurs rafları ────────────────────────────────────────────── */}
            <div className="container px-4 pt-6">
                <CourseRail
                    title="En çok tercih edilenler"
                    courses={data?.top_selling || []}
                    href="/courses?sort=popular"
                    loading={isLoading}
                />
                <CourseRail
                    title="Öne çıkanlar"
                    courses={data?.featured_courses || []}
                    href="/courses?sort=rating"
                    loading={isLoading}
                />
                <CourseRail
                    title="Yeni eklenenler"
                    courses={data?.new_courses || []}
                    href="/courses?sort=newest"
                    loading={isLoading}
                />
                <CourseRail
                    title="Ücretsiz başla"
                    courses={data?.free_courses || []}
                    href="/courses?free=1"
                />
            </div>

            {/* ── Nasıl çalışır ───────────────────────────────────────────── */}
            <section className="bg-slate-50/70 border-y border-slate-200 mt-8">
                <div className="container px-4 py-14">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center">
                        Nasıl çalışır?
                    </h2>
                    <p className="text-[15px] text-slate-600 text-center mt-2.5 max-w-xl mx-auto leading-relaxed">
                        Abonelik yok, takvim yok. Kursu bir kez alırsın, süresiz erişirsin.
                    </p>

                    <ol className="grid sm:grid-cols-3 gap-5 mt-10 max-w-4xl mx-auto">
                        {[
                            { n: '01', t: 'Kursunu seç', d: 'Kategorilerden ya da aramadan ilgini çeken kursu bul. Tanıtım derslerini satın almadan izle.' },
                            { n: '02', t: 'Kendi hızında izle', d: 'İstediğin zaman başla, bırak, kaldığın yerden devam et. İlerlemen otomatik kaydedilir.' },
                            { n: '03', t: 'Sertifikanı al', d: 'Kursu tamamladığında adına düzenlenmiş sertifikanı indir ve paylaş.' },
                        ].map(step => (
                            <li key={step.n} className="bg-white border border-slate-200 rounded-2xl p-6">
                                <span className="font-montserrat text-[13px] font-extrabold text-brand-700 tracking-[0.1em]">
                                    {step.n}
                                </span>
                                <h3 className="text-[16.5px] font-bold text-slate-900 mt-2.5">{step.t}</h3>
                                <p className="text-[14px] text-slate-600 leading-[1.7] mt-2">{step.d}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ── Öğrenci yorumları ───────────────────────────────────────
                Gerçek yorumlar; yoksa bölüm hiç çizilmiyor. Uydurma referans
                metni koymaktansa bölümün olmaması yeğ. */}
            {testimonials.length > 0 && (
                <section className="container px-4 py-14">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center">
                        Öğrenciler ne diyor?
                    </h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-9">
                        {testimonials.slice(0, 6).map(t => (
                            <figure
                                key={t.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col"
                            >
                                <div className="flex gap-0.5 mb-3" aria-label={`${t.rating} yıldız`}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                'w-3.5 h-3.5',
                                                i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                            )}
                                        />
                                    ))}
                                </div>

                                <blockquote className="text-[14.5px] text-slate-700 leading-[1.7] flex-1 line-clamp-5">
                                    {t.comment}
                                </blockquote>

                                <figcaption className="flex items-center gap-2.5 mt-4 pt-4 border-t border-slate-100">
                                    <img
                                        src={t.image}
                                        alt=""
                                        className="w-8 h-8 rounded-full object-cover bg-slate-100 shrink-0"
                                        onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-[13.5px] font-semibold text-slate-900 truncate">
                                            {t.name || 'Edurce öğrencisi'}
                                        </span>
                                        <Link
                                            to={`/course/${t.course_id}`}
                                            className="block text-[12px] text-slate-500 hover:text-brand-700 truncate transition-colors"
                                        >
                                            {t.course_title}
                                        </Link>
                                    </span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Eğitmen çağrısı ─────────────────────────────────────────── */}
            <section className="bg-brand-900 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -top-32 right-0 w-[460px] h-[460px] bg-brand-500/20 rounded-full blur-[120px]" />
                </div>

                <div className="container relative px-4 py-16 text-center">
                    <h2 className="text-[26px] sm:text-[30px] font-extrabold text-white tracking-tight">
                        Bildiğini anlat, kazancın büyük kısmı sende kalsın
                    </h2>
                    <p className="text-[16px] text-brand-100/80 mt-4 max-w-2xl mx-auto leading-relaxed">
                        Kurs oluşturmak, video yüklemek ve yayınlamak ücretsiz. Platform
                        yalnızca satış gerçekleştiğinde pay alır — yalnızca Edurce'de olan
                        özgün kurslarda payın %70, kendi kuponunla gelen satışlarda %100.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        <Link
                            to="/become-instructor"
                            className="h-12 px-7 leading-[48px] rounded-xl bg-white text-brand-900 text-[15px] font-bold hover:bg-brand-50 transition-colors"
                        >
                            Eğitmen ol
                        </Link>
                        <Link
                            to="/pricing"
                            className="h-12 px-7 leading-[46px] rounded-xl border border-white/25 text-white text-[15px] font-semibold hover:border-white/60 transition-colors"
                        >
                            Kazanç modeli
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GuestHome;
