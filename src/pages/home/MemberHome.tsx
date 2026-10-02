import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, Award, BookMarked, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import HomeHero from '@/components/home/HomeHero';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import CourseRail from '@/components/home/CourseRail';

interface MemberHomeData {
    continueWatching: any | null;
    inProgress: any[];
    fromSearches: { term: string | null; items: any[] };
    fromCategories: { category: string | null; items: any[] };
    popular: any[];
}

interface CatalogData {
    featured_courses: any[];
    top_selling: any[];
    new_courses: any[];
    free_courses: any[];
}

/**
 * Giriş yapmış kullanıcının ana sayfası.
 *
 * Misafir sayfasının düzenini birebir koruyor — aynı kahraman bölümü, aynı
 * kurs rafları, aynı kategori bloğu. Üzerine kişisel katman biniyor:
 * kaldığın yer şeridi, eğitimlerin ve gerekçesi yazan öneri şeritleri.
 *
 * Bilinen düzeni bozup yerine panel koymak, kullanıcıyı her girişte yeniden
 * yön bulmaya zorluyordu. Kişiselleştirme sayfanın yerine değil, üstüne.
 */
const MemberHome: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: mine, isLoading: mineLoading } = useQuery<MemberHomeData>({
        queryKey: ['home-member'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/home/member`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Kişisel içerik yüklenemedi');
            return res.json();
        },
    });

    // Katalog vitrini üye sayfasında da duruyor: kullanıcı yalnızca kendi
    // kurslarını değil, platformun tamamını görebilmeli.
    const { data: catalog, isLoading: catalogLoading } = useQuery<CatalogData>({
        queryKey: ['home-guest'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/home`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Ana sayfa yüklenemedi');
            return res.json();
        },
    });

    useSeo({
        title: 'Edurce — Ana sayfa',
        description: 'Kaldığın yerden devam et, sana önerilen kursları keşfet.',
        robots: 'noindex, follow',
    }, []);

    const firstName = (user?.first_name || '').trim();
    const cont = mine?.continueWatching;

    return (
        <div className="min-h-screen bg-white">

            <HomeHero greeting={firstName ? `Tekrar hoş geldin, ${firstName}` : undefined} />

            {/* ── Kaldığın yer ────────────────────────────────────────────
                Kahraman bölümünün hemen altında, kendi şeridinde. Sayfanın
                geri kalanı herkes için aynı; burası yalnızca bu kullanıcıya
                ait ve ilk görülmesi gereken şey. */}
            {!mineLoading && cont && (
                <section className="relative border-b border-brand-100 bg-gradient-to-br from-brand-50 via-brand-100/40 to-white">
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
                    <div className="container relative px-4 py-6">
                        <ContinueCard course={cont} onOpen={() => navigate(`/learning/${cont.id}`)} />
                    </div>
                </section>
            )}

            {/* ── Hızlı bağlantılar ───────────────────────────────────────── */}
            <div className="border-b border-slate-200 bg-slate-50/60">
                <div className="container px-4 py-3 flex flex-wrap gap-2">
                    <QuickLink to="/home/learning" icon={<BookMarked className="w-4 h-4" />} label="Eğitimlerim" />
                    <QuickLink to="/home/certificates" icon={<Award className="w-4 h-4" />} label="Sertifikalarım" />
                    <QuickLink to="/home/gamification" icon={<Sparkles className="w-4 h-4" />} label="Edurce Kredi" />
                </div>
            </div>

            {/* ── Raflar ──────────────────────────────────────────────────
                Önce kişisel olanlar, sonra katalog vitrini. */}
            <div className="container px-4 pt-6">

                {(mineLoading || (mine?.inProgress?.length ?? 0) > 0) && (
                    <CourseRail
                        title="Eğitimlerim"
                        courses={mine?.inProgress || []}
                        href="/home/learning"
                        loading={mineLoading}
                        isAuthenticated
                    />
                )}

                {mine?.fromSearches?.items?.length ? (
                    <CourseRail
                        title={`"${mine.fromSearches.term}" aramandan`}
                        reason="Son aramalarına göre seçildi"
                        courses={mine.fromSearches.items}
                        href={`/search?q=${encodeURIComponent(mine.fromSearches.term || '')}`}
                        isAuthenticated
                    />
                ) : null}

                {mine?.fromCategories?.items?.length ? (
                    <CourseRail
                        title="İzlediklerine benzer"
                        reason={
                            mine.fromCategories.category
                                ? `${mine.fromCategories.category} alanındaki kurslar`
                                : 'Kayıtlı olduğun kursların alanlarından'
                        }
                        courses={mine.fromCategories.items}
                        isAuthenticated
                    />
                ) : null}

                {mine?.popular?.length ? (
                    <CourseRail
                        title="Sizin için önerilenler"
                        reason="Henüz almadığın, en çok tercih edilen kurslar"
                        courses={mine.popular}
                        href="/courses"
                        isAuthenticated
                    />
                ) : null}

                <CourseRail
                    title="En çok tercih edilenler"
                    courses={catalog?.top_selling || []}
                    href="/courses?sort=popular"
                    loading={catalogLoading}
                    isAuthenticated
                />
                <CourseRail
                    title="Öne çıkanlar"
                    courses={catalog?.featured_courses || []}
                    href="/courses?sort=rating"
                    loading={catalogLoading}
                    isAuthenticated
                />
                <CourseRail
                    title="Yeni eklenenler"
                    courses={catalog?.new_courses || []}
                    href="/courses?sort=newest"
                    loading={catalogLoading}
                    isAuthenticated
                />
                <CourseRail
                    title="Ücretsiz başla"
                    courses={catalog?.free_courses || []}
                    href="/courses?free=1"
                    isAuthenticated
                />
            </div>

            <div className="pb-14">
                <CategoryExplorer />
            </div>
        </div>
    );
};

/** Kaldığın yer kartı — kapak, son izlenen ders ve ilerleme. */
const ContinueCard: React.FC<{ course: any; onOpen: () => void }> = ({ course, onOpen }) => {
    const progress = Math.round(Number(course.progress) || 0);

    return (
        <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col sm:flex-row">
                <button
                    onClick={onOpen}
                    className="relative sm:w-[210px] shrink-0 aspect-video sm:aspect-auto overflow-hidden group"
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

                <div className="flex-1 min-w-0 p-5 flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="flex-1 min-w-0">
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

                        <div className="flex items-center gap-3 mt-3.5 max-w-md">
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
                    </div>

                    <button
                        onClick={onOpen}
                        className="shrink-0 h-11 px-6 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[14.5px] font-semibold transition-colors"
                    >
                        Devam et
                    </button>
                </div>
            </div>
        </div>
    );
};

const QuickLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
    <Link
        to={to}
        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-slate-200 bg-white text-[13.5px] font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-800 transition-colors"
    >
        {icon}
        {label}
    </Link>
);

export default MemberHome;
