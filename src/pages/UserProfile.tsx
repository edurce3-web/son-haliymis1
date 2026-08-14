import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Loader2, Star, Users, BookOpen, Clock, Globe, UserX } from 'lucide-react';

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

/** Eğitmenin verdiği kurs kartı. */
const CourseTile: React.FC<{ course: ProfileCourse }> = ({ course }) => (
    <Link
        to={`/course/${course.slug || course.id}`}
        className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all"
    >
        <div className="aspect-video bg-slate-100 overflow-hidden">
            <img
                src={course.image}
                alt={course.title}
                loading="lazy"
                onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
        </div>
        <div className="p-4 flex flex-col flex-1">
            {course.categoryName && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    {course.categoryName}
                </span>
            )}
            <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
                {course.title}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                {course.reviewCount > 0 && (
                    <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {course.rating.toFixed(1)}
                    </span>
                )}
                <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {compact(course.studentCount)}
                </span>
                {course.hours > 0 && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.hours} sa
                    </span>
                )}
            </div>

            <p className="mt-auto pt-3 font-bold text-slate-900">
                {course.price === 0 ? 'Ücretsiz' : formatPrice(course.price)}
            </p>
        </div>
    </Link>
);

const UserProfile: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { user: currentUser } = useAuth();

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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
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

    const { user, role, instructor, courses, learning } = data;
    const isInstructor = role === 'instructor';
    const isOwnProfile = currentUser?.user_id === user.id;
    const joined = joinedLabel(user.joinedAt);

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── Başlık ──────────────────────────────────────────────────── */}
            <section className="bg-brand-900 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -top-32 -left-20 w-[440px] h-[440px] bg-brand-500/25 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-40 right-0 w-[440px] h-[440px] bg-brand-400/15 rounded-full blur-[120px]" />
                </div>

                <div className="relative container px-4 py-12 lg:py-16">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                        <UserAvatar src={user.image} name={user.name} size={112} className="ring-4 ring-white/15 shrink-0" />

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">{user.name}</h1>
                                <span className={cn(
                                    'text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full',
                                    isInstructor
                                        ? 'bg-brand-300 text-brand-900'
                                        : 'bg-white/15 text-brand-100'
                                )}>
                                    {isInstructor ? 'Eğitmen' : 'Öğrenci'}
                                </span>
                            </div>

                            {user.bio && (
                                <p className="text-brand-100/80 mt-3 leading-relaxed max-w-2xl">{user.bio}</p>
                            )}

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 mt-4 text-sm text-brand-200/70">
                                {joined && <span>{joined} tarihinde katıldı</span>}
                                {user.website && (
                                    <a
                                        href={user.website}
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                                    >
                                        <Globe className="w-3.5 h-3.5" />
                                        Web sitesi
                                    </a>
                                )}
                                {isOwnProfile && (
                                    <Link
                                        to="/home/settings/profile"
                                        className="inline-flex items-center gap-1.5 text-brand-200 hover:text-white underline underline-offset-2"
                                    >
                                        Profilini düzenle
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Eğitmen özeti */}
                    {isInstructor && instructor && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-10 bg-white/10 rounded-xl overflow-hidden">
                            {[
                                { value: String(instructor.courseCount), label: 'kurs' },
                                { value: compact(instructor.totalStudents), label: 'öğrenci' },
                                {
                                    value: instructor.totalReviews > 0 ? instructor.averageRating.toFixed(1) : '—',
                                    label: instructor.totalReviews > 0
                                        ? `${compact(instructor.totalReviews)} değerlendirme`
                                        : 'değerlendirme yok',
                                },
                                { value: String(instructor.totalHours), label: 'saat içerik' },
                            ].map(s => (
                                <div key={s.label} className="bg-brand-900/90 px-5 py-5">
                                    <p className="text-2xl font-bold text-white leading-none">{s.value}</p>
                                    <p className="text-xs text-brand-200/70 mt-1.5 truncate">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <div className="container px-4 py-12 space-y-14">

                {/* ── Eğitmenin kursları ──────────────────────────────────── */}
                {isInstructor && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-5">
                            {user.firstName} tarafından verilen kurslar
                            <span className="text-slate-400 font-normal"> ({courses.length})</span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {courses.map(c => <CourseTile key={c.id} course={c} />)}
                        </div>
                    </section>
                )}

                {/* ── Öğrenim geçmişi ─────────────────────────────────────── */}
                {learning.courses.length > 0 && (
                    <section>
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-5">
                            <h2 className="text-xl font-bold text-slate-900">
                                {isInstructor ? 'Aldığı eğitimler' : 'Eğitimleri'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {learning.enrolledCount} kurs
                                {learning.completedCount > 0 && ` · ${learning.completedCount} tamamlandı`}
                            </p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                            {learning.courses.map(c => (
                                <Link
                                    key={c.id}
                                    to={`/course/${c.slug || c.id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <img
                                        src={c.image}
                                        alt={c.title}
                                        loading="lazy"
                                        onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                                        className="w-24 h-16 rounded-lg object-cover bg-slate-100 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-medium text-slate-900 line-clamp-1">{c.title}</h3>
                                        {c.instructorName && (
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {c.instructorSlug ? (
                                                    <Link
                                                        to={`/user/${c.instructorSlug}`}
                                                        onClick={e => e.stopPropagation()}
                                                        className="hover:text-brand-700 hover:underline"
                                                    >
                                                        {c.instructorName}
                                                    </Link>
                                                ) : c.instructorName}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1.5 flex-1 max-w-[180px] bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        'h-full rounded-full',
                                                        c.progress >= 100 ? 'bg-emerald-500' : 'bg-brand-500'
                                                    )}
                                                    style={{ width: `${c.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                                                {c.progress >= 100 ? 'Tamamlandı' : `%${c.progress}`}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Hiç içerik yoksa ────────────────────────────────────── */}
                {!isInstructor && learning.courses.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-7 h-7 text-slate-300" />
                        </div>
                        <h2 className="text-base font-semibold text-slate-700 mb-1">
                            Henüz paylaşılan bir eğitim yok
                        </h2>
                        <p className="text-sm text-slate-400">
                            {isOwnProfile
                                ? 'Bir kursa kaydolduğunda burada görünecek.'
                                : `${user.firstName} henüz bir kursa kaydolmamış.`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
