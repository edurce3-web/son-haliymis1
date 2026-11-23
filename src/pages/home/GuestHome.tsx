import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Stars, Flame, Quote } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useSeo } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';
import GuestHero, { HeroStats } from '@/components/home/GuestHero';
import CourseShowcase from '@/components/home/CourseShowcase';
import SpotlightCarousel from '@/components/home/SpotlightCarousel';
import BundleDeck, { Bundle } from '@/components/home/BundleDeck';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import ShelfSection from '@/components/home/ShelfSection';
import InstructorCall from '@/components/home/InstructorCall';

interface HomeData {
    featured_courses: any[];
    top_selling: any[];
    new_courses: any[];
    free_courses: any[];
    testimonials?: any[];
    instructors?: Array<{ id: number; name: string; image: string }>;
    stats?: HeroStats;
    /** Panelden seçilen kayan vitrin; seçim boşsa sunucu öne çıkanları gönderiyor. */
    spotlight_courses?: any[];
    bundles?: Bundle[];
}

/**
 * Misafir ana sayfası.
 *
 * Amacı tek: ziyaretçiyi bir kurs sayfasına götürmek. Bu yüzden sayfa bir
 * panel değil vitrin — sırayla vaat, kanıt (sayılar), kurs ızgaraları, alan
 * keşfi, gerçek yorumlar ve eğitmen çağrısı.
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

            {/* ── Kayan vitrin (koyu blok) ─────────────────────────────────
                Eskiden burada kategori kartları vardı; kategoriler zaten
                aşağıdaki "Tüm kategoriler" bloğunda. Yerine panelden seçilen
                kurslar, kendiliğinden yavaşça sağa kayarak. */}
            <SpotlightCarousel courses={data?.spotlight_courses || []} />

            {/* ── Yeni ve ücretsiz kurslar ─────────────────────────────────
                Üstteki ızgaralarla aynı kartı kullanıyor; tek fark yatay
                kaydırma. Aynı kursun sayfanın iki yerinde farklı kartla
                çıkması, hangisinin doğru olduğunu belirsizleştiriyordu. */}
            <div className="container px-4 pt-12 space-y-10">
                <ShelfSection
                    title="Yeni eklenenler"
                    subtitle="Platforma en son katılan, en taze içerikler"
                    badgeFor={() => ({ text: 'Yeni', tone: 'brand' })}
                    courses={data?.new_courses || []}
                    href="/courses?sort=newest"
                    loading={isLoading}
                    columns={6}
                    compactCards
                />
            </div>

            {/* ── Kurs paketleri ─────────────────────────────────────────── */}
            <div className="mt-12">
                <BundleDeck bundles={data?.bundles || []} />
            </div>

            <div className="container px-4 pt-12 space-y-10">
                <ShelfSection
                    title="Ücretsiz başla"
                    subtitle="Ödeme yapmadan izleyebileceğin kurslar"
                    courses={data?.free_courses || []}
                    href="/courses?free=1"
                    columns={6}
                    compactCards
                />
            </div>

            <CategoryExplorer title="Tüm kategoriler" />

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
                                className="relative  bg-[#F5F6F8] p-6 flex flex-col hover:shadow-[0_20px_44px_-28px_rgba(15,23,42,0.25)] transition-all"
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

                                <figcaption className="flex items-center gap-3 mt-5 pt-5">
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
            <InstructorCall />
        </div>
    );
};

export default GuestHome;
