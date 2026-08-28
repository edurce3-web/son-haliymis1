import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CatalogCourseCard, { StarRating } from '@/components/catalog/CatalogCourseCard';
import { useOwnedCourses } from '@/hooks/useOwnedCourses';
import { Loader2, UserX } from 'lucide-react';

interface ProfileCourse {
    id: number;
    course_id?: number;
    title: string;
    slug?: string;
    summary: string | null;
    price: number;
    level: string | null;
    rating: number;
    reviewCount: number;
    studentCount: number;
    hours: number;
    categoryName: string | null;
    categorySlug: string | null;
    image: string;
}

interface LearningCourse {
    id: number;
    title: string;
    slug?: string;
    level: string | null;
    progress: number;
    instructorName: string | null;
    instructorSlug: string | null;
    categoryName: string | null;
    image: string;
}

interface ProfileData {
    user: {
        id: number;
        slug: string;
        name: string;
        firstName: string;
        bio: string | null;
        website: string | null;
        image: string | null;
        joinedAt: string;
    };
    role: 'instructor' | 'student';
    title: string | null;
    expertise: string[];
    categories: Array<{ name: string; slug: string | null }>;
    suggested: any[];
    instructor: {
        courseCount: number;
        totalStudents: number;
        totalReviews: number;
        averageRating: number;
        totalHours: number;
    } | null;
    courses: ProfileCourse[];
    learning: {
        enrolledCount: number;
        completedCount: number;
        courses: LearningCourse[];
    };
    seo: any;
}

const compact = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
    return (n || 0).toLocaleString('tr-TR');
};

const joinedLabel = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
};

/** Bölüm başlığı — altında markanın kısa çizgisi. */
const Heading: React.FC<{ children: React.ReactNode; count?: number }> = ({ children, count }) => (
    <div className="mb-6">
        <h2 className="font-montserrat text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">
            {children}
            {typeof count === 'number' && (
                <span className="text-slate-400 font-bold"> ({count})</span>
            )}
        </h2>
        <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-2.5" />
    </div>
);

/** Etiket hapı — uzmanlık ve kategoriler için. */
const Pill: React.FC<{ children: React.ReactNode; to?: string }> = ({ children, to }) => {
    const className =
        'inline-block text-[12.5px] font-medium text-brand-900 bg-brand-50 border border-brand-200 rounded-full px-3 py-1 transition-colors hover:bg-brand-100';
    return to
        ? <Link to={to} className={className}>{children}</Link>
        : <span className={className}>{children}</span>;
};

const UserProfile: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { user: currentUser } = useAuth();
    const { ownedIds, cartIds, progressById } = useOwnedCourses();
    const [bioExpanded, setBioExpanded] = useState(false);

    const { data, isLoading, isError } = useQuery<ProfileData>({
        queryKey: ['user-profile', slug],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/users/profile/${slug}`);
            if (res.status === 404) throw new Error('notfound');
            if (!res.ok) throw new Error('Profil alınamadı');
            return res.json();
        },
        enabled: !!slug,
        retry: false,
    });

    useSeo(data?.seo, [data?.seo?.canonical]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <UserX className="w-8 h-8 text-slate-300" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Kullanıcı bulunamadı</h1>
                    <p className="text-sm text-slate-500 mb-6">
                        Bu profil kaldırılmış ya da adresi değişmiş olabilir.
                    </p>
                    <Link to="/courses">
                        <Button className="rounded-xl bg-brand-700 hover:bg-brand-800">
                            Kurslara göz at
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const { user, role, instructor, courses, learning, title, expertise, categories, suggested } = data;
    const isInstructor = role === 'instructor';
    const isOwnProfile = currentUser?.user_id === user.id;
    const joined = joinedLabel(user.joinedAt);
    const isLongBio = String(user.bio || '').length > 420;

    /** Üstteki büyük ölçüler — role göre değişiyor. */
    const stats = isInstructor && instructor
        ? [
            { value: compact(instructor.totalStudents), label: 'Öğrenci' },
        ]
        : [
            { value: String(learning.enrolledCount), label: 'Kayıtlı kurs' },
            { value: String(learning.completedCount), label: 'Tamamlanan' },
        ];

    const notOwnedSuggestions = (suggested || []).filter(
        (c: any) => !ownedIds.has(Number(c.course_id ?? c.id))
    );

    /**
     * Eğitmenin kursları katalog kartının beklediği biçime çevriliyor.
     *
     * Profil ucu alan adlarını camelCase veriyor, kart ise katalog ucunun
     * snake_case biçimini bekliyor. Ayrı bir kart yazmak yerine çeviriyoruz;
     * kart tek yerde durunca kategori sayfasıyla görünüm farkı oluşmuyor.
     */
    const asCatalogCourse = (c: ProfileCourse) => ({
        id: c.id,
        course_id: c.course_id ?? c.id,
        title: c.title,
        slug: c.slug,
        short_description: c.summary || undefined,
        price: c.price,
        level: c.level || undefined,
        rating: c.rating,
        review_count: c.reviewCount,
        student_count: c.studentCount,
        duration_hours: c.hours,
        image: c.image,
        category_name: c.categoryName || undefined,
        instructor_name: user.name,
    });

    return (
        <div className="min-h-screen bg-white">
            {/*
                Kimlik bloğu.

                Fotoğraf ve künye tek satırda: solda büyük yuvarlak fotoğraf,
                sağda rol etiketi, ad, unvan ve ölçüler. Ölçüler ayrı bir
                şeride bölünmüyordu — "0 Toplam öğrenci" gibi tek haneli
                değerler kocaman rakamlarla boşlukta duruyordu. Burada
                değerler satır hâlinde, puan yıldızla.
            */}
            <div className="relative bg-gradient-to-br from-brand-50 via-brand-100/60 to-white border-b border-brand-100">
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

                <div className="container relative mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-10 lg:py-14">
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-9 items-start">
                        <UserAvatar
                            src={user.image || undefined}
                            name={user.name}
                            className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 ring-4 ring-white shadow-[0_16px_40px_-18px_rgba(15,23,42,0.4)]"
                        />

                        <div className="min-w-0 flex-1">
                            <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
                                {isInstructor ? 'Eğitmen' : 'Öğrenci'}
                            </p>
                            <h1 className="font-montserrat text-[30px] sm:text-[40px] font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.05] mt-1.5 break-words">
                                {user.name}
                            </h1>
                            <p className="text-[15px] sm:text-[16px] text-slate-600 mt-2">
                                {title || (isInstructor ? 'Eğitmen' : 'Öğrenci')}
                                {joined && (
                                    <span className="text-slate-400"> · {joined} tarihinde katıldı</span>
                                )}
                            </p>

                            {/* Ölçüler — puan yıldızla, diğerleri sayı olarak */}
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-5">
                                {isInstructor && instructor && instructor.averageRating > 0 && (
                                    <span className="flex items-center gap-2.5">
                                        <span className="font-montserrat text-[24px] font-extrabold text-amber-600 tabular-nums leading-none">
                                            {instructor.averageRating.toFixed(1).replace('.', ',')}
                                        </span>
                                        <span>
                                            <StarRating rating={instructor.averageRating} size={17} />
                                            <span className="block text-[12.5px] text-slate-500 mt-1">
                                                {compact(instructor.totalReviews)} değerlendirme
                                            </span>
                                        </span>
                                    </span>
                                )}

                                {stats.map(stat => (
                                    <span key={stat.label}>
                                        <span className="block font-montserrat text-[24px] font-extrabold text-slate-900 tabular-nums leading-none">
                                            {stat.value}
                                        </span>
                                        <span className="block text-[12.5px] text-slate-500 mt-1">
                                            {stat.label}
                                        </span>
                                    </span>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-5">
                                {user.website && (
                                    <a
                                        href={user.website}
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        className="text-[13.5px] font-semibold text-brand-700 hover:text-brand-900 hover:underline break-all"
                                    >
                                        {user.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                                {isOwnProfile && (
                                    <Link
                                        to="/home/settings/profile"
                                        className="text-[13.5px] font-semibold text-brand-800 hover:text-brand-900 hover:underline"
                                    >
                                        Profili düzenle
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px]">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 pt-10 pb-16">

                    {/* ── Sol: hakkında ve kurslar ────────────────────────── */}
                    <div className="lg:col-span-8 min-w-0">

                        {user.bio && (
                            <section className="mt-9">
                                <Heading>Hakkında</Heading>
                                <div
                                    className={cn(
                                        'relative text-[15.5px] text-slate-700 leading-[1.85] whitespace-pre-wrap break-words max-w-3xl',
                                        !bioExpanded && isLongBio && 'max-h-[230px] overflow-hidden'
                                    )}
                                >
                                    {user.bio}
                                    {!bioExpanded && isLongBio && (
                                        <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                    )}
                                </div>
                                {isLongBio && (
                                    <button
                                        onClick={() => setBioExpanded(v => !v)}
                                        className="text-[14px] font-semibold text-brand-700 hover:text-brand-900 hover:underline mt-3"
                                    >
                                        {bioExpanded ? 'Daha az göster' : 'Daha fazla göster'}
                                    </button>
                                )}
                            </section>
                        )}

                        {isInstructor && courses.length > 0 && (
                            <section className="mt-10 pt-9 border-t border-slate-200">
                                <Heading count={courses.length}>
                                    {isOwnProfile ? 'Kurslarım' : 'Kurslar'}
                                </Heading>
                                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-3 gap-2.5">
                                    {courses.map(course => (
                                        <CatalogCourseCard
                                            key={course.id}
                                            course={asCatalogCourse(course)}
                                            owned={ownedIds.has(Number(course.course_id ?? course.id))}
                                            inCart={cartIds.has(Number(course.course_id ?? course.id))}
                                            progress={progressById.get(Number(course.course_id ?? course.id)) ?? 0}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {!isInstructor && (
                            <section className="mt-10 pt-9 border-t border-slate-200">
                                <Heading count={learning.courses.length}>
                                    {isOwnProfile ? 'Eğitimlerim' : 'Aldığı eğitimler'}
                                </Heading>

                                {learning.courses.length > 0 ? (
                                    <div className="space-y-2">
                                        {learning.courses.map(c => (
                                            <Link
                                                key={c.id}
                                                to={`/course/${c.slug || c.id}`}
                                                target="_blank"
                                                rel="noopener"
                                                className="group flex items-center gap-3 rounded-lg border border-slate-200 p-2.5 transition-colors hover:border-brand-400"
                                            >
                                                <span className="w-16 h-11 shrink-0 rounded bg-slate-100 overflow-hidden">
                                                    <img
                                                        src={c.image}
                                                        alt={c.title}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[14px] font-semibold text-slate-900 leading-snug line-clamp-1 group-hover:text-brand-800 transition-colors">
                                                        {c.title}
                                                    </span>
                                                    <span className="block text-[12.5px] text-slate-400 mt-0.5 truncate">
                                                        {c.instructorName}
                                                    </span>
                                                </span>
                                                <span className="shrink-0 text-[12.5px] font-semibold text-brand-800 tabular-nums">
                                                    %{c.progress}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[15px] text-slate-500">
                                        Henüz bir eğitime kayıtlı değil.
                                    </p>
                                )}
                            </section>
                        )}
                    </div>

                    {/* ── Sağ ray: alanlar, kategoriler, özet ─────────────── */}
                    <aside className="lg:col-span-4">
                        <div className="lg:sticky lg:top-20 space-y-8 lg:pt-6">
                            {expertise?.length > 0 && (
                                <div>
                                    <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-3">
                                        Uzmanlık alanları
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {expertise.map(item => <Pill key={item}>{item}</Pill>)}
                                    </div>
                                </div>
                            )}

                            {categories?.length > 0 && (
                                <div>
                                    <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-3">
                                        Ders verdiği kategoriler
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {categories.map(cat => (
                                            <Pill
                                                key={cat.name}
                                                to={cat.slug ? `/courses/${cat.slug}` : undefined}
                                            >
                                                {cat.name}
                                            </Pill>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </aside>
                </div>
            </div>

            {/* ── İlgini çekebilecek kurslar ─────────────────────────────── */}
            {notOwnedSuggestions.length > 0 && (
                <section className="border-t border-slate-200 bg-slate-50/70">
                    <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-12">
                        <Heading>İlgini çekebilecek kurslar</Heading>
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {notOwnedSuggestions.slice(0, 8).map((c: any) => (
                                <CatalogCourseCard
                                    key={c.course_id ?? c.id}
                                    course={c}
                                    inCart={cartIds.has(Number(c.course_id ?? c.id))}
                                    progress={progressById.get(Number(c.course_id ?? c.id)) ?? 0}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default UserProfile;
