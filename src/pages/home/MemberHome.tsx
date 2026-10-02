import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, ArrowRight, Award, BookMarked, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import CourseRail from '@/components/home/CourseRail';

interface MemberHomeData {
    continueWatching: any | null;
    inProgress: any[];
    fromSearches: { term: string | null; items: any[] };
    fromCategories: { category: string | null; items: any[] };
    popular: any[];
    searchTerms: string[];
}

/**
 * Giriş yapmış kullanıcının ana sayfası.
 *
 * Misafir vitrininden amaç olarak ayrışıyor: burada iş, kullanıcıyı bıraktığı
 * derse döndürmek. Bu yüzden ilk ekranda tanıtım değil "kaldığın yer" var;
 * satış bölümleri (nasıl çalışır, eğitmen çağrısı, yorumlar) hiç yok —
 * zaten üye olmuş birine platformu anlatmanın anlamı yok.
 *
 * Öneriler tek bir karışık liste değil, gerekçesi yazan ayrı şeritler:
 * aradıklarına göre, izlediklerine göre, genel popüler. Kullanıcı bir kursun
 * neden karşısına çıktığını görebilmeli.
 */
const MemberHome: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: categoryNav } = useCategoryNav();

    const { data, isLoading } = useQuery<MemberHomeData>({
        queryKey: ['home-member'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/home/member`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Ana sayfa yüklenemedi');
            return res.json();
        },
    });

    useSeo({
        title: 'Edurce — Eğitimlerim',
        description: 'Kaldığın yerden devam et, sana önerilen kursları keşfet.',
        robots: 'noindex, follow',
    }, []);

    const firstName = (user?.first_name || '').trim();
    const greeting = firstName ? `Merhaba ${firstName}` : 'Merhaba';
    const cont = data?.continueWatching;

    return (
        <div className="min-h-screen bg-white">

            {/* ── Kaldığın yer ────────────────────────────────────────────
                Sayfanın en üstü, aramadan bile önce. Giriş yapmış kullanıcının
                ana sayfaya gelme sebebi büyük ihtimalle bu. */}
            <section className="relative overflow-hidden border-b border-brand-100 bg-gradient-to-br from-brand-50 via-brand-100/50 to-white">
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(23,93,93,0.06) 1px, transparent 1px),'
                            + 'linear-gradient(to bottom, rgba(23,93,93,0.06) 1px, transparent 1px)',
                        backgroundSize: '34px 34px',
                    }}
                />

                <div className="container relative mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-8 lg:py-10">
                    <p className="font-montserrat text-[22px] sm:text-[26px] font-extrabold text-slate-900 tracking-[-0.02em]">
                        {greeting}
                    </p>

                    {isLoading ? (
                        <div className="mt-5 h-[132px] rounded-2xl bg-white/70 border border-brand-100 animate-pulse" />
                    ) : cont ? (
                        <ContinueCard course={cont} onOpen={() => navigate(`/learning/${cont.id}`)} />
                    ) : (
                        <EmptyStart />
                    )}

                    <div className="flex flex-wrap gap-2 mt-5">
                        <QuickLink to="/home/learning" icon={<BookMarked className="w-4 h-4" />} label="Eğitimlerim" />
                        <QuickLink to="/home/certificates" icon={<Award className="w-4 h-4" />} label="Sertifikalarım" />
                        <QuickLink to="/home/gamification" icon={<Sparkles className="w-4 h-4" />} label="Edurce Kredi" />
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-7">

                <CourseRail
                    title="Eğitimlerim"
                    courses={data?.inProgress || []}
                    href="/home/learning"
                    loading={isLoading}
                    isAuthenticated
                    emptyText="Henüz bir kursa kayıtlı değilsin. Aşağıdaki önerilerden başlayabilirsin."
                />

                {data?.fromSearches?.items?.length ? (
                    <CourseRail
                        title={`"${data.fromSearches.term}" aramandan`}
                        reason="Son aramalarına göre seçildi"
                        courses={data.fromSearches.items}
                        href={`/search?q=${encodeURIComponent(data.fromSearches.term || '')}`}
                        isAuthenticated
                    />
                ) : null}

                {data?.fromCategories?.items?.length ? (
                    <CourseRail
                        title="İzlediklerine benzer"
                        reason={
                            data.fromCategories.category
                                ? `${data.fromCategories.category} alanındaki kurslar`
                                : 'Kayıtlı olduğun kursların alanlarından'
                        }
                        courses={data.fromCategories.items}
                        isAuthenticated
                    />
                ) : null}

                <CourseRail
                    title="Sizin için önerilenler"
                    reason="Platformda en çok tercih edilen kurslar"
                    courses={data?.popular || []}
                    href="/courses"
                    loading={isLoading}
                    isAuthenticated
                />

                {/* Kategoriler en altta: üye için keşif ikincil, devam etmek
                    birincil. Misafir sayfasında bu sıra tersine dönüyor. */}
                {categoryNav?.categories?.length ? (
                    <section className="pt-6 mt-4 border-t border-slate-200">
                        <div className="flex items-end justify-between gap-4 mb-4">
                            <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
                                Kategorileri keşfet
                            </h2>
                            <Link
                                to="/courses"
                                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:gap-2 transition-all"
                            >
                                Tüm kurslar <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {categoryNav.categories.slice(0, 8).map(cat => (
                                <Link
                                    key={cat.slug}
                                    to={`/courses/${cat.slug}`}
                                    className="group rounded-xl border border-slate-200 bg-white px-4 py-3.5 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                                >
                                    <span className="block text-[14px] font-semibold text-slate-800 group-hover:text-brand-800 transition-colors truncate">
                                        {cat.name}
                                    </span>
                                    <span className="block text-[12px] text-slate-500 mt-0.5">
                                        {cat.subcategories?.length || 0} alt dal
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </div>
    );
};

/** Kaldığın yer kartı — ilerleme çubuğu ve son izlenen ders adıyla. */
const ContinueCard: React.FC<{ course: any; onOpen: () => void }> = ({ course, onOpen }) => {
    const progress = Math.round(Number(course.progress) || 0);

    return (
        <div className="mt-5 rounded-2xl border border-brand-100 bg-white overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col sm:flex-row">
                <button
                    onClick={onOpen}
                    className="relative sm:w-[220px] shrink-0 aspect-video sm:aspect-auto overflow-hidden group"
                    aria-label={`${course.title} dersine devam et`}
                >
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute inset-0 bg-slate-900/25 flex items-center justify-center">
                        <span className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center">
                            <PlayCircle className="w-6 h-6 text-brand-800" />
                        </span>
                    </span>
                </button>

                <div className="flex-1 min-w-0 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
                        Kaldığın yerden devam et
                    </p>

                    <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-900 leading-snug mt-1.5 truncate">
                        {course.title}
                    </h2>

                    {course.last_lesson_title && (
                        <p className="text-[13.5px] text-slate-500 mt-1 truncate">
                            Son ders: {course.last_lesson_title}
                        </p>
                    )}

                    <div className="flex items-center gap-3 mt-4">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-brand-600 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-[13px] font-bold text-brand-800 tabular-nums shrink-0">
                            %{progress}
                        </span>
                    </div>

                    <button
                        onClick={onOpen}
                        className="mt-4 h-10 px-5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[14px] font-semibold transition-colors"
                    >
                        Devam et
                    </button>
                </div>
            </div>
        </div>
    );
};

/** Hiç izlenmiş ders yokken kaldığın yer kartının yerine geçen blok. */
const EmptyStart: React.FC = () => (
    <div className="mt-5 rounded-2xl border border-brand-100 bg-white px-5 py-6">
        <p className="text-[15.5px] text-slate-700 leading-relaxed max-w-xl">
            Henüz bir derse başlamadın. Bir kurs seç, ilerlemen buradan takip edilsin.
        </p>
        <Link
            to="/courses"
            className="inline-block mt-4 h-10 px-5 leading-10 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[14px] font-semibold transition-colors"
        >
            Kursları keşfet
        </Link>
    </div>
);

const QuickLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
    <Link
        to={to}
        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-slate-200 bg-white/80 text-[13.5px] font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-800 transition-colors"
    >
        {icon}
        {label}
    </Link>
);

export default MemberHome;
