import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';
import HomeHero from '@/components/home/HomeHero';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import CourseRail from '@/components/home/CourseRail';

interface HomeData {
    featured_courses: any[];
    top_selling: any[];
    new_courses: any[];
    free_courses: any[];
    testimonials?: any[];
    stats?: { courses: number; students: number; instructors: number; hours: number; reviews: number };
}

/**
 * Misafir ana sayfası.
 *
 * Amaç ziyaretçiyi bir kursa götürmek. Üye sayfasıyla aynı iskelet —
 * kahraman bölümü, kurs rafları, kategori bloğu — üzerine ikna katmanı:
 * sayılar, nasıl çalışır, öğrenci yorumları ve eğitmen çağrısı. Bu bölümler
 * üye sayfasında yok; zaten üye olmuş birine platformu anlatmanın anlamı yok.
 */
const GuestHome: React.FC = () => {
    const { data, isLoading } = useQuery<HomeData>({
        queryKey: ['home-guest'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/home`);
            if (!res.ok) throw new Error('Ana sayfa yüklenemedi');
            return res.json();
        },
    });

    useSeo({
        title: 'Edurce — Türkçe Online Kurs Platformu',
        description: 'Yazılımdan tasarıma, mühendislikten müziğe; alanında uzman eğitmenlerden Türkçe kurslar. Bir kez öde, süresiz eriş.',
        canonical: 'https://edurce.com/',
    }, []);

    const stats = data?.stats;
    const testimonials = data?.testimonials || [];

    return (
        <div className="min-h-screen bg-white">

            <HomeHero />

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

            <CategoryExplorer />

            {/* ── Nasıl çalışır ───────────────────────────────────────────── */}
            <section className="bg-slate-50/70 border-y border-slate-200 mt-10">
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
