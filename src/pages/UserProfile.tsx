import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { formatPrice, cn } from '@/lib/utils';
import CatalogCourseCard, { StarRating } from '@/components/catalog/CatalogCourseCard';
import { useOwnedCourses } from '@/hooks/useOwnedCourses';
import { Loader2, UserX } from 'lucide-react';

interface ProfileCourse {
    id: number;
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
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace('.', ',')}B`;
    return String(n);
};

const joinedLabel = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
};

/** Sağ raydaki bölüm başlığı. */
const RailHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-3">
        {children}
    </p>
);

/** Etiket hapı — uzmanlık ve kategoriler için. */
const Pill: React.FC<{ children: React.ReactNode; to?: string }> = ({ children, to }) => {
    const className =
        'inline-block text-[12px] font-medium text-slate-700 border border-slate-300 rounded-full px-3 py-1 transition-colors hover:border-brand-400 hover:text-brand-800';
    return to
        ? <Link to={to} className={className}>{children}</Link>
        : <span className={className}>{children}</span>;
};

/**
 * Eğitmenin kendi kurslarında kullanılan liste satırı.
 *
 * Kapak solda, başlık ve ölçüler sağda. Kart yerine satır: aynı eğitmenin
 * kursları arasında görsel değil başlık karşılaştırılıyor.
 */
const CourseRow: React.FC<{ course: ProfileCourse }> = ({ course }) => (
    <Link
        to={`/course/${course.slug || course.id}`}
        target="_blank"
        rel="noopener"
        className="group flex flex-col sm:flex-row gap-4 py-5 border-b border-slate-100 last:border-0"
    >
        <span className="w-full sm:w-[200px] shrink-0 aspect-video rounded-lg bg-slate-100 overflow-hidden">
            <img
                src={course.image}
                alt={course.title}
                loading="lazy"
                onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                className="w-full h-full object-cover"
            />
        </span>

        <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-bold text-slate-900 leading-snug group-hover:text-brand-800 transition-colors">
                {course.title}
            </span>
            {course.summary && (
                <span className="block text-[14px] text-slate-500 leading-[1.6] line-clamp-2 mt-1.5">
                    {course.summary}
                </span>
            )}

            <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[13px] text-slate-500">
                {course.reviewCount > 0 && (
                    <span className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-600 tabular-nums">
                            {course.rating.toFixed(1)}
                        </span>
                        <StarRating rating={course.rating} size={13} />
                        <span>({compact(course.reviewCount)})</span>
                    </span>
                )}
                <span>{compact(course.studentCount)} öğrenci</span>
                {course.hours > 0 && <span>{course.hours} saat</span>}
                {course.level && <span>{course.level}</span>}
            </span>

            <span className="block text-[16px] font-bold text-slate-900 mt-2.5">
                {course.price > 0 ? formatPrice(course.price) : 'Ücretsiz'}
            </span>
        </span>
    </Link>
);

const UserProfile: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { user: currentUser } = useAuth();
    const { ownedIds, cartIds, progressById } = useOwnedCourses();

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

    /**
     * Ad altındaki tanım satırı.
     *
     * Konum bilgisi tutmuyoruz; onun yerine unvan, rol ve katılım tarihi
     * yazılıyor — profilde gerçekten bildiğimiz şeyler.
     */
    const subtitle = [
        title,
        isInstructor ? 'Eğitmen' : 'Öğrenci',
        joined && `${joined} tarihinde katıldı`,
    ].filter(Boolean).join(' · ');

    // Kullanıcının henüz sahip olmadığı öneriler
    const notOwnedSuggestions = (suggested || []).filter(
        (c: any) => !ownedIds.has(Number(c.course_id ?? c.id))
    );

    const stats = isInstructor && instructor
        ? [
            instructor.averageRating > 0 && {
                node: (
                    <span className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-600 tabular-nums">
                            {instructor.averageRating.toFixed(1)}
                        </span>
                        <StarRating rating={instructor.averageRating} size={14} />
                        <span className="text-slate-500">({compact(instructor.totalReviews)})</span>
                    </span>
                ),
                key: 'rating',
            },
            { node: <span>{compact(instructor.totalStudents)} öğrenci</span>, key: 'students' },
            { node: <span>{instructor.courseCount} kurs</span>, key: 'courses' },
            instructor.totalHours > 0 && {
                node: <span>{instructor.totalHours} saat içerik</span>,
                key: 'hours',
            },
        ].filter(Boolean) as Array<{ node: React.ReactNode; key: string }>
        : [
            { node: <span>{learning.enrolledCount} kayıtlı kurs</span>, key: 'enrolled' },
            { node: <span>{learning.completedCount} tamamlanan</span>, key: 'completed' },
        ];

    return (
        <div className="min-h-screen bg-white">
            {/* Üst band — markanın yeşili, tek renk */}
            <div className="bg-brand-900 h-28 sm:h-32" />

            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 -mt-16 sm:-mt-20 pb-16">

                    {/* ── Sol: kimlik, biyografi, kurslar ─────────────────── */}
                    <div className="lg:col-span-8 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
                            <UserAvatar
                                src={user.image || undefined}
                                name={user.name}
                                className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-white shadow-md shrink-0"
                            />
                            <div className="min-w-0 pb-1">
                                <h1 className="font-montserrat text-[28px] sm:text-[34px] font-extrabold text-slate-900 tracking-[-0.025em] leading-tight break-words">
                                    {user.name}
                                </h1>
                                {subtitle && (
                                    <p className="text-[14.5px] text-slate-500 mt-1">{subtitle}</p>
                                )}
                            </div>
                        </div>

                        {/* Ölçüler tek satırda */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-[14px] text-slate-600">
                            {stats.map((stat, i) => (
                                <React.Fragment key={stat.key}>
                                    {i > 0 && <span className="text-slate-300">·</span>}
                                    {stat.node}
                                </React.Fragment>
                            ))}
                        </div>

                        {isOwnProfile && (
                            <Link
                                to="/home/settings/profile"
                                className="inline-block text-[13.5px] font-semibold text-brand-700 hover:text-brand-900 hover:underline mt-4"
                            >
                                Profili düzenle
                            </Link>
                        )}

                        {/* Biyografi */}
                        {user.bio && (
                            <div className="mt-7 text-[15.5px] text-slate-700 leading-[1.8] whitespace-pre-wrap break-words max-w-2xl">
                                {user.bio}
                            </div>
                        )}

                        {/* Eğitmenin kursları */}
                        {isInstructor && courses.length > 0 && (
                            <section className="mt-10 pt-8 border-t border-slate-200">
                                <h2 className="font-montserrat text-[20px] font-extrabold text-slate-900 tracking-[-0.02em]">
                                    {isOwnProfile ? 'Kurslarım' : `${user.firstName} eğitmenin kursları`}
                                </h2>
                                <span className="block w-8 h-[3px] rounded-full bg-brand-700 mt-2 mb-2" />

                                <div>
                                    {courses.map(course => (
                                        <CourseRow key={course.id} course={course} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Öğrencinin eğitimleri */}
                        {!isInstructor && (
                            <section className="mt-10 pt-8 border-t border-slate-200">
                                <h2 className="font-montserrat text-[20px] font-extrabold text-slate-900 tracking-[-0.02em]">
                                    {isOwnProfile ? 'Eğitimlerim' : 'Aldığı eğitimler'}
                                </h2>
                                <span className="block w-8 h-[3px] rounded-full bg-brand-700 mt-2 mb-5" />

                                {learning.courses.length > 0 ? (
                                    <div className="space-y-2">
                                        {learning.courses.map(c => (
                                            <Link
                                                key={c.id}
                                                to={`/course/${c.slug || c.id}`}
                                                target="_blank"
                                                rel="noopener"
                                                className="group flex items-center gap-3 rounded-lg border border-slate-200 p-2.5 transition-colors hover:border-brand-300"
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
                                                <span className="shrink-0 text-[12.5px] text-slate-500 tabular-nums">
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

                    {/* ── Sağ ray: alanlar, kategoriler, bağlantılar ──────── */}
                    <aside className="lg:col-span-4 lg:pt-24">
                        <div className="lg:sticky lg:top-20 space-y-8">
                            {isInstructor && (
                                <p className="font-montserrat text-[19px] font-extrabold text-slate-900 tracking-[-0.02em]">
                                    Eğitmen
                                </p>
                            )}

                            {expertise?.length > 0 && (
                                <div>
                                    <RailHeading>Alanlar</RailHeading>
                                    <div className="flex flex-wrap gap-1.5">
                                        {expertise.map(item => <Pill key={item}>{item}</Pill>)}
                                    </div>
                                </div>
                            )}

                            {categories?.length > 0 && (
                                <div>
                                    <RailHeading>Kategoriler</RailHeading>
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

                            {user.website && (
                                <div>
                                    <RailHeading>Bağlantı</RailHeading>
                                    <a
                                        href={user.website}
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        className="text-[14px] text-brand-700 hover:text-brand-900 hover:underline break-all"
                                    >
                                        {user.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* ── İlgini çekebilecek kurslar ─────────────────────────────── */}
            {notOwnedSuggestions.length > 0 && (
                <section className="border-t border-slate-200 bg-slate-50">
                    <div className="container mx-auto px-4 max-w-6xl py-12">
                        <h2 className="font-montserrat text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">
                            İlgini çekebilecek kurslar
                        </h2>
                        <span className="block w-8 h-[3px] rounded-full bg-brand-700 mt-2 mb-1" />
                        <p className="text-[14px] text-slate-500 mb-6">
                            {user.firstName} eğitmenin alanındaki diğer kurslar
                        </p>

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
