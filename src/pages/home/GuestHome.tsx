import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Star, Stars, Flame, Quote, Compass, PlayCircle, Award, ArrowRight,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';
import GuestHero, { HeroStats } from '@/components/home/GuestHero';
import CourseShowcase from '@/components/home/CourseShowcase';
import SkillSpotlight from '@/components/home/SkillSpotlight';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import ShelfSection from '@/components/home/ShelfSection';

interface HomeData {
    featured_courses: any[];
    top_selling: any[];
    new_courses: any[];
    free_courses: any[];
    testimonials?: any[];
    instructors?: Array<{ id: number; name: string; image: string }>;
    stats?: HeroStats;
}

const STEPS = [
    {
        icon: Compass,
        n: '01',
        t: 'Kursunu seç',
        d: 'Kategorilerden ya da aramadan ilgini çeken kursu bul. Tanıtım derslerini satın almadan izle, müfredatı baştan sona gör.',
    },
    {
        icon: PlayCircle,
        n: '02',
        t: 'Kendi hızında izle',
        d: 'İstediğin zaman başla, bırak, kaldığın yerden devam et. İlerlemen otomatik kaydedilir, notlarını ders ders tutabilirsin.',
    },
    {
        icon: Award,
        n: '03',
        t: 'Sertifikanı al',
        d: 'Kursu tamamladığında adına düzenlenmiş, doğrulanabilir sertifikanı indir ve özgeçmişinde paylaş.',
    },
];

/**
 * Misafir ana sayfası.
 *
 * Amacı tek: ziyaretçiyi bir kurs sayfasına götürmek. Bu yüzden sayfa bir
 * panel değil vitrin — sırayla vaat, kanıt (sayılar), kurs ızgaraları, alan
 * keşfi, işleyiş, gerçek yorumlar ve eğitmen çağrısı.
 *
 * Kurslar üstte dörtlü ızgaralarda duruyor, aşağıda yatay raflara dönüyor:
 * ilk bakışta kart tam görünsün, aşağı indikçe daha çok kurs sığsın. Üye
 * sayfası bu bölümlerin hiçbirini taşımıyor; zaten üye olmuş birine platformu
 * anlatmanın anlamı yok.
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

            <GuestHero stats={stats} instructors={data?.instructors} />

            {/* ── Öne çıkan kurslar ──────────────────────────────────────── */}
            <CourseShowcase
                eyebrow="Öne çıkanlar"
                eyebrowIcon={<Stars className="w-3.5 h-3.5" />}
                title="Puanı en yüksek kurslar"
                subtitle="Öğrencilerin en çok beğendiği, değerlendirme ortalaması en yüksek kurslar."
                href="/courses?sort=rating"
                courses={data?.featured_courses || []}
                loading={isLoading}
            />

            {/* ── En çok tercih edilenler ────────────────────────────────── */}
            <CourseShowcase
                tone="tint"
                eyebrow="En çok tercih edilen"
                eyebrowIcon={<Flame className="w-3.5 h-3.5" />}
                title="Şu an en çok kayıt alan kurslar"
                subtitle="Platformdaki en kalabalık sınıflar. Çok kişinin aynı kursu seçmesi, içeriğin işe yaradığına dair en pratik işaret."
                note={
                    stats?.hours
                        ? `Toplam ${stats.hours.toLocaleString('tr-TR')} saat içerik`
                        : undefined
                }
                href="/courses?sort=popular"
                courses={data?.top_selling || []}
                loading={isLoading}
            />

            {/* ── Alan keşfi (koyu blok) ─────────────────────────────────── */}
            <SkillSpotlight />

            {/* ── Yeni ve ücretsiz kurslar ─────────────────────────────────
                Üstteki ızgaralarla aynı kartı kullanıyor; tek fark yatay
                kaydırma. Aynı kursun sayfanın iki yerinde farklı kartla
                çıkması, hangisinin doğru olduğunu belirsizleştiriyordu. */}
            <div className="container px-4 pt-12 space-y-10">
                <ShelfSection
                    title="Yeni eklenenler"
                    subtitle="Son yayınlanan kurslar"
                    courses={data?.new_courses || []}
                    href="/courses?sort=newest"
                    loading={isLoading}
                    columns={5}
                    compactCards
                />
                <ShelfSection
                    title="Ücretsiz başla"
                    subtitle="Ödeme yapmadan izleyebileceğin kurslar"
                    courses={data?.free_courses || []}
                    href="/courses?free=1"
                    columns={5}
                    compactCards
                />
            </div>

            <CategoryExplorer title="Tüm kategoriler" />

            {/* ── Nasıl çalışır ──────────────────────────────────────────── */}
            <section className="bg-slate-50 border-y border-slate-200 mt-12">
                <div className="container px-4 py-16">
                    <div className="text-center max-w-2xl mx-auto">
                        <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-700 bg-brand-100/80 rounded-full px-3 py-1">
                            Nasıl çalışır
                        </span>
                        <h2 className="font-montserrat text-[26px] sm:text-[30px] font-extrabold text-slate-900 tracking-tight mt-4">
                            Üç adım, abonelik yok
                        </h2>
                        <p className="text-[15px] text-slate-600 mt-3 leading-relaxed">
                            Takvime bağlı değilsin, aylık ödeme yok. Kursu bir kez alırsın,
                            hesabında süresiz kalır.
                        </p>
                    </div>

                    <ol className="grid sm:grid-cols-3 gap-5 mt-12 max-w-5xl mx-auto">
                        {STEPS.map(step => (
                            <li
                                key={step.n}
                                className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-300 hover:shadow-[0_20px_44px_-28px_rgba(15,23,42,0.28)] transition-all"
                            >
                                <span className="absolute top-5 right-5 font-montserrat text-[30px] font-extrabold text-brand-100 leading-none select-none">
                                    {step.n}
                                </span>

                                <span className="inline-flex w-12 h-12 rounded-2xl bg-brand-700 items-center justify-center shadow-lg shadow-brand-700/20">
                                    <step.icon className="w-6 h-6 text-white" />
                                </span>

                                <h3 className="text-[17px] font-bold text-slate-900 mt-5">{step.t}</h3>
                                <p className="text-[14px] text-slate-600 leading-[1.75] mt-2.5">{step.d}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ── Öğrenci yorumları ──────────────────────────────────────
                Gerçek yorumlar; yoksa bölüm hiç çizilmiyor. Uydurma referans
                metni koymaktansa bölümün olmaması yeğ. */}
            {testimonials.length > 0 && (
                <section className="container px-4 py-16">
                    <div className="text-center max-w-2xl mx-auto">
                        <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-700 bg-brand-100/80 rounded-full px-3 py-1">
                            Öğrenci yorumları
                        </span>
                        <h2 className="font-montserrat text-[26px] sm:text-[30px] font-extrabold text-slate-900 tracking-tight mt-4">
                            Kursu bitirenler ne yazdı?
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-11">
                        {testimonials.slice(0, 6).map(t => (
                            <figure
                                key={t.id}
                                className="relative rounded-2xl border border-slate-200 bg-white p-6 flex flex-col hover:border-brand-200 hover:shadow-[0_20px_44px_-28px_rgba(15,23,42,0.25)] transition-all"
                            >
                                <Quote
                                    className="absolute top-5 right-5 w-8 h-8 text-brand-100"
                                    aria-hidden
                                />

                                <div className="flex gap-0.5 mb-3.5" aria-label={`${t.rating} yıldız`}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                'w-4 h-4',
                                                i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                            )}
                                        />
                                    ))}
                                </div>

                                <blockquote className="text-[14.5px] text-slate-700 leading-[1.75] flex-1 line-clamp-5">
                                    {t.comment}
                                </blockquote>

                                <figcaption className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-100">
                                    <img
                                        src={t.image}
                                        alt=""
                                        className="w-9 h-9 rounded-full object-cover bg-slate-100 shrink-0"
                                        onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-[13.5px] font-bold text-slate-900 truncate">
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

            {/* ── Eğitmen çağrısı ────────────────────────────────────────── */}
            <section className="relative bg-brand-900 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -top-36 right-0 w-[480px] h-[480px] bg-brand-500/25 rounded-full blur-[130px]" />
                    <div className="absolute -bottom-40 left-0 w-[420px] h-[420px] bg-emerald-500/10 rounded-full blur-[130px]" />
                </div>

                <div className="container relative px-4 py-16 lg:py-20 text-center">
                    <h2 className="font-montserrat text-[27px] sm:text-[33px] font-extrabold text-white tracking-tight leading-tight">
                        Bildiğini anlat, kazancın büyük kısmı sende kalsın
                    </h2>
                    <p className="text-[16px] text-brand-100/80 mt-5 max-w-2xl mx-auto leading-relaxed">
                        Kurs oluşturmak, video yüklemek ve yayınlamak ücretsiz. Platform
                        yalnızca satış gerçekleştiğinde pay alır — yalnızca Edurce'de olan
                        özgün kurslarda payın %70, kendi kuponunla gelen satışlarda %100.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 mt-9">
                        <Link
                            to="/become-instructor"
                            className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white text-brand-900 text-[15px] font-bold hover:bg-brand-50 transition-colors"
                        >
                            Eğitmen ol
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/pricing"
                            className="inline-flex items-center h-12 px-7 rounded-xl border border-white/25 text-white text-[15px] font-semibold hover:border-white/60 hover:bg-white/5 transition-colors"
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
