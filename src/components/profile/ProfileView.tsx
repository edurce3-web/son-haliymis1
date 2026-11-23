import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/components/ui/user-avatar';
import { ShelfCourseCard } from '@/components/home/ShelfCourseCard';
import { useOwnedCourses } from '@/hooks/useOwnedCourses';
import { cn } from '@/lib/utils';

/*
 * Herkese açık profil — eğitmen ve öğrenci aynı sayfayı kullanıyor.
 *
 * /user/<slug> ve eski /instructors/<id> bağlantıları buraya geliyor.
 * Eğitmende: kimlik, ölçüler, hakkında, öne çıkan kurs, diğer kurslar,
 * uzmanlık ve bağlantılar, altta aynı alandan başka kurslar.
 * Öğrencide: kimlik, öğrenme ölçüleri, aldığı eğitimler ve ilerlemesi.
 *
 * E-posta hiçbir koşulda gösterilmiyor.
 */

export interface ProfileCourse {
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

export interface LearningCourse {
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

export interface ProfileData {
    user: {
        id: number;
        slug?: string;
        name: string;
        firstName?: string;
        bio: string | null;
        website: string | null;
        image: string | null;
        joinedAt?: string | null;
    };
    role: 'instructor' | 'student';
    title: string | null;
    expertise: string[];
    links?: Record<string, string>;
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
    seo?: any;
}

const num = (n: number) => (Number(n) || 0).toLocaleString('tr-TR');

const joinedLabel = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
};

const LINK_LABELS: Record<string, string> = {
    website: 'Web sitesi',
    youtube: 'YouTube',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    twitter: 'X (Twitter)',
    tiktok: 'TikTok',
    facebook: 'Facebook',
};

const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

/** Profil kursunu ana sayfa kartının beklediği biçime çevirir. */
const toCard = (c: ProfileCourse, instructorName: string) => ({
    id: c.course_id ?? c.id,
    title: c.title,
    slug: c.slug,
    price: c.price,
    rating: c.rating,
    review_count: c.reviewCount,
    student_count: c.studentCount,
    duration_seconds: Math.round((c.hours || 0) * 3600),
    image: c.image,
    instructor_name: instructorName,
});

export const ProfileView: React.FC<{ data: ProfileData }> = ({ data }) => {
    const { user: currentUser } = useAuth();
    const { ownedIds, progressById } = useOwnedCourses();
    const [bioOpen, setBioOpen] = useState(false);

    const { user, role, instructor, courses, learning, title, expertise = [], categories = [], suggested = [] } = data;
    const isInstructor = role === 'instructor';
    const isOwn = Boolean(currentUser && Number(currentUser.user_id) === Number(user.id));
    const joined = joinedLabel(user.joinedAt);

    const links: Array<[string, string]> = Object.entries({
        ...(data.links || {}),
        ...(user.website ? { website: user.website } : {}),
    }).filter(([, v]) => Boolean(v)) as Array<[string, string]>;

    const longBio = String(user.bio || '').length > 520;

    // Öne çıkan kurs: en çok öğrencili olan. Tek kurs varsa ızgarada kalsın.
    const sorted = [...courses].sort((a, b) => b.studentCount - a.studentCount || b.rating - a.rating);
    const featured = sorted.length >= 2 ? sorted[0] : null;
    const rest = featured ? sorted.slice(1) : sorted;

    const otherSuggestions = suggested.filter((c: any) => !ownedIds.has(Number(c.course_id ?? c.id)));

    const inProgress = learning.courses.filter(c => c.progress > 0 && c.progress < 100).length;

    const stats: Array<{ value: string; label: string; accent?: boolean }> = isInstructor && instructor
        ? [
            ...(instructor.averageRating > 0 ? [{ value: instructor.averageRating.toFixed(1).replace('.', ','), label: 'Eğitmen puanı', accent: true }] : []),
            { value: num(instructor.totalReviews), label: 'Değerlendirme' },
            { value: num(instructor.totalStudents), label: 'Öğrenci' },
            { value: num(instructor.courseCount), label: 'Kurs' },
        ]
        : [
            { value: num(learning.enrolledCount), label: 'Kayıtlı kurs' },
            { value: num(inProgress), label: 'Devam eden' },
            { value: num(learning.completedCount), label: 'Tamamlanan', accent: learning.completedCount > 0 },
        ];

    const copyLink = async () => {
        const url = user.slug ? `${window.location.origin}/user/${user.slug}` : window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Profil bağlantısı kopyalandı');
        } catch {
            toast.error('Bağlantı kopyalanamadı');
        }
    };

    return (
        <div className="min-h-screen bg-white text-[#111827] font-jakarta">
            {/* ── Kimlik ───────────────────────────────────────────────── */}
            <div>
                <header className="relative overflow-hidden  bg-[#B2F0C8] text-[#0A2A1A]">
                    {/* Renk lekeleri: çizgi yok, yalnızca ton */}
                    <div aria-hidden className="absolute -left-32 -top-40 w-[520px] h-[520px] rounded-full bg-[#C9F5D8]" />
                    <div aria-hidden className="absolute right-[-120px] bottom-[-200px] w-[560px] h-[560px] rounded-full bg-[#9BE8B6]" />

                    <div className="relative max-w-[1240px] mx-auto px-5 sm:px-10 pt-8 sm:pt-12 pb-6 sm:pb-8">
                        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-8 lg:gap-14 items-center">
                            <div className="min-w-0">
                                <div className="flex items-center gap-4">
                                    <ProfilePhoto src={user.image} name={user.name} />
                                    <div className="min-w-0">
                                        <span className="inline-flex h-7 px-3 items-center rounded-full bg-[#0A2A1A] text-[#B2F0C8] text-[12px] font-extrabold tracking-[0.04em]">
                                            {isInstructor ? 'Edurce eğitmeni' : 'Edurce öğrencisi'}
                                        </span>
                                        {joined && (
                                            <p className="mt-2 text-[13px] font-semibold text-[#134D30]">{`${joined} tarihinden beri burada`}</p>
                                        )}
                                    </div>
                                </div>

                                <h1 className="mt-6 text-[38px] sm:text-[56px] font-extrabold tracking-[-0.045em] leading-[0.98] break-words">
                                    {user.name}
                                </h1>
                                {title && (
                                    <p className="mt-3 text-[17px] sm:text-[19px] font-semibold leading-[1.4] text-[#134D30] max-w-[44ch]">{title}</p>
                                )}
                                {expertise.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {expertise.slice(0, 6).map(e => (
                                            <span key={e} className="h-8 px-3 inline-flex items-center rounded-full bg-white/70 text-[13px] font-bold">{e}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-6 flex flex-wrap items-center gap-2">
                                    {isInstructor && courses.length > 0 && (
                                        <a href="#kurslar" className="h-12 px-5 inline-flex items-center  bg-[#0A2A1A] hover:bg-[#134D30] text-white text-[14.5px] font-bold transition-colors">
                                            {`Kurslarını gör (${courses.length})`}
                                        </a>
                                    )}
                                    {isOwn && (
                                        <Link to="/home/settings/profile" className="h-12 px-5 inline-flex items-center  bg-white hover:bg-[#EEFBF3] text-[14.5px] font-bold transition-colors">
                                            Profili düzenle
                                        </Link>
                                    )}
                                    <button type="button" onClick={copyLink} className="h-12 px-5 inline-flex items-center  bg-white/60 hover:bg-white text-[14.5px] font-bold transition-colors">
                                        Bağlantıyı kopyala
                                    </button>
                                </div>
                            </div>

                            {/* Kolaj: kendi kurslarının kapakları */}
                            <Collage images={(isInstructor ? sorted.map(c => c.image) : learning.courses.map(c => c.image)).slice(0, 3)} name={user.name} />
                        </div>

                        {/* Ölçüler */}
                        <dl className={cn('mt-8 sm:mt-10 grid gap-2 sm:gap-3', stats.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3')}>
                            {stats.map(s => (
                                <div key={s.label} className={cn(' px-5 py-4 sm:py-5', s.accent ? 'bg-[#0A2A1A] text-white' : 'bg-white/75')}>
                                    <dd className="text-[28px] sm:text-[36px] font-extrabold tracking-[-0.03em] tabular-nums leading-none">{s.value}</dd>
                                    <dt className={cn('mt-2 text-[13px] font-bold', s.accent ? 'text-[#B2F0C8]' : 'text-[#134D30]')}>{s.label}</dt>
                                </div>
                            ))}
                        </dl>
                    </div>
                </header>
            </div>

            {/* ── Gövde ────────────────────────────────────────────────── */}
            <div className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-10 pb-16 grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10 lg:gap-12">
                <main className="min-w-0 space-y-12">
                    {user.bio ? (
                        <section>
                            <SectionTitle>Hakkında</SectionTitle>
                            <div className={cn(
                                'relative text-[15.5px] leading-[1.8] text-[#374151] whitespace-pre-wrap break-words max-w-[70ch]',
                                longBio && !bioOpen && 'max-h-[220px] overflow-hidden'
                            )}>
                                {user.bio}
                                {longBio && !bioOpen && <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />}
                            </div>
                            {longBio && (
                                <button onClick={() => setBioOpen(v => !v)} className="mt-3 text-[14px] font-bold text-[#1B7A43] hover:text-[#16613A]">
                                    {bioOpen ? 'Daha az göster' : 'Devamını oku'}
                                </button>
                            )}
                        </section>
                    ) : isOwn ? (
                        <section className=" bg-[#EEFBF3] p-6">
                            <h2 className="text-[17px] font-extrabold">Kendini tanıt</h2>
                            <p className="mt-1 text-[14px] text-[#4B5563] max-w-[56ch]">
                                {isInstructor
                                    ? 'Kısa bir tanıtım yazısı, öğrencilerin kursuna güvenmesini kolaylaştırır.'
                                    : 'Profiline birkaç cümle ekle; ilgi alanların görünsün.'}
                            </p>
                            <Link to="/home/settings/profile" className="mt-4 h-10 px-4 inline-flex items-center  bg-[#1B7A43] hover:bg-[#16613A] text-white text-[13.5px] font-bold">
                                Tanıtım yazısı ekle
                            </Link>
                        </section>
                    ) : null}

                    {/* Eğitmen: kurslar */}
                    {isInstructor && courses.length > 0 && (
                        <section id="kurslar" className="scroll-mt-24 space-y-5">
                            {featured && (
                                <>
                                    <SectionTitle>En çok tercih edilen kursu</SectionTitle>
                                    <FeaturedCourse course={featured} owned={ownedIds.has(featured.course_id ?? featured.id)} />
                                </>
                            )}
                            <div className={featured ? 'pt-6' : ''}>
                                <SectionTitle count={rest.length}>{featured ? 'Diğer kursları' : 'Kursları'}</SectionTitle>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-5 sm:gap-x-4">
                                    {rest.map(c => {
                                        const id = c.course_id ?? c.id;
                                        return (
                                            <ShelfCourseCard
                                                key={id}
                                                course={{ ...toCard(c, user.name), progress: progressById.get(id) ?? 0 }}
                                                owned={ownedIds.has(id)}
                                                compact
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Öğrenci: aldığı eğitimler */}
                    {!isInstructor && (
                        <section>
                            <SectionTitle count={learning.courses.length}>{isOwn ? 'Eğitimlerim' : 'Aldığı eğitimler'}</SectionTitle>
                            {learning.courses.length > 0 ? (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {learning.courses.map(c => <LearningRow key={c.id} course={c} />)}
                                </div>
                            ) : (
                                <div className=" bg-[#F5F6F8] p-6">
                                    <p className="text-[15px] font-bold">{isOwn ? 'Henüz bir eğitime başlamadın.' : 'Henüz bir eğitime kayıtlı değil.'}</p>
                                    {isOwn && (
                                        <Link to="/courses" className="mt-3 h-10 px-4 inline-flex items-center  bg-[#1B7A43] hover:bg-[#16613A] text-white text-[13.5px] font-bold">
                                            Kurslara göz at
                                        </Link>
                                    )}
                                </div>
                            )}
                        </section>
                    )}
                </main>

                {/* ── Yan sütun ────────────────────────────────────────── */}
                <aside className="lg:pt-1">
                    <div className="lg:sticky lg:top-24 space-y-3">
                        {categories.length > 0 && (
                            <SideCard title="Ders verdiği alanlar">
                                <div className="flex flex-wrap gap-1.5">
                                    {categories.map(c => c.slug ? (
                                        <Link key={c.name} to={`/courses/${c.slug}`} className="h-8 px-3 inline-flex items-center rounded-full bg-white text-[13px] font-semibold hover:bg-[#B2F0C8] transition-colors">
                                            {c.name}
                                        </Link>
                                    ) : (
                                        <span key={c.name} className="h-8 px-3 inline-flex items-center rounded-full bg-white text-[13px] font-semibold">{c.name}</span>
                                    ))}
                                </div>
                            </SideCard>
                        )}

                        {isInstructor && instructor && instructor.totalHours > 0 && (
                            <SideCard title="İçerik">
                                <p className="text-[14px] text-[#374151]">
                                    <span className="font-extrabold text-[#111827]">{`${num(instructor.totalHours)} saat`}</span>
                                    {` video ders, ${num(instructor.courseCount)} kursta`}
                                </p>
                            </SideCard>
                        )}

                        {links.length > 0 && (
                            <SideCard title="Bağlantılar">
                                <ul className="space-y-1">
                                    {links.map(([key, url]) => (
                                        <li key={key}>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer nofollow"
                                                className="flex items-center justify-between gap-3 h-10 px-3  bg-white hover:bg-[#EEFBF3] transition-colors"
                                            >
                                                <span className="text-[13.5px] font-bold">{LINK_LABELS[key] || key}</span>
                                                <span className="min-w-0 truncate text-[12.5px] text-[#6B7280]">{host(url)}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </SideCard>
                        )}

                        {!isInstructor && learning.courses.length > 0 && (
                            <SideCard title="İlgilendiği alanlar">
                                <div className="flex flex-wrap gap-1.5">
                                    {[...new Set(learning.courses.map(c => c.categoryName).filter(Boolean) as string[])].slice(0, 8).map(n => (
                                        <span key={n} className="h-8 px-3 inline-flex items-center rounded-full bg-white text-[13px] font-semibold">{n}</span>
                                    ))}
                                </div>
                            </SideCard>
                        )}
                    </div>
                </aside>
            </div>

            {/* ── Aynı alandan başka kurslar ───────────────────────────── */}
            {isInstructor && otherSuggestions.length > 0 && (
                <div>
                    <section className=" bg-[#F5F6F8]">
                        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-9">
                            <SectionTitle>Bu alanda başka kurslar</SectionTitle>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5 sm:gap-x-4">
                                {otherSuggestions.slice(0, 8).map((c: any) => (
                                    <ShelfCourseCard
                                        key={c.course_id ?? c.id}
                                        course={{ ...c, id: c.course_id ?? c.id, duration_seconds: Math.round((Number(c.duration_hours) || 0) * 3600) }}
                                        compact
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

/* ── Parçalar ─────────────────────────────────────────────────────────── */

/** Profil fotoğrafı; yoksa ya da yüklenemezse baş harfler. */
const ProfilePhoto: React.FC<{ src: string | null; name: string }> = ({ src, name }) => {
    const [failed, setFailed] = useState(false);
    const box = 'w-[76px] h-[76px] sm:w-[92px] sm:h-[92px] shrink-0  shadow-[0_18px_40px_-18px_rgba(10,42,26,0.55)]';
    return src && !failed ? (
        <img src={src} alt={name} onError={() => setFailed(true)} className={cn(box, 'object-cover bg-[#D7F5E2]')} />
    ) : (
        <span aria-hidden className={cn(box, 'flex items-center justify-center bg-white text-[#0A2A1A] text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em]')}>
            {getInitials(name)}
        </span>
    );
};


/** Kurs kapaklarından eğik kolaj; kapak yoksa baş harflerden büyük bir kart. */
const Collage: React.FC<{ images: string[]; name: string }> = ({ images, name }) => {
    const pics = images.filter(Boolean);
    if (pics.length === 0) {
        return (
            <div aria-hidden className="hidden lg:flex h-[300px] items-center justify-center  bg-white/50 text-[140px] font-extrabold tracking-[-0.06em] text-[#0A2A1A]/90">
                {getInitials(name)}
            </div>
        );
    }
    const spots = [
        'left-[4%] top-[14%] w-[62%] -rotate-[7deg] z-10',
        'right-[2%] top-[0%] w-[58%] rotate-[5deg] z-20',
        'left-[22%] bottom-[0%] w-[64%] -rotate-[1deg] z-30',
    ];
    return (
        <div aria-hidden className="relative h-[190px] sm:h-[260px] lg:h-[320px]">
            {pics.map((src, i) => (
                <div
                    key={i}
                    className={cn(
                        'absolute aspect-video  overflow-hidden bg-[#D7F5E2] shadow-[0_30px_60px_-24px_rgba(10,42,26,0.55)]',
                        pics.length === 1 ? 'left-[8%] top-[10%] w-[84%] -rotate-[3deg]' : spots[i]
                    )}
                >
                    <img
                        src={src}
                        alt=""
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}
        </div>
    );
};

const SectionTitle: React.FC<{ children: React.ReactNode; count?: number }> = ({ children, count }) => (
    <h2 className="mb-4 text-[20px] sm:text-[22px] font-extrabold tracking-[-0.02em] text-[#0A2A1A]">
        {children}
        {typeof count === 'number' && count > 0 && <span className="ml-2 text-[#9CA3AF] font-bold tabular-nums">{count}</span>}
    </h2>
);

const SideCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className=" bg-[#F5F6F8] p-5">
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">{title}</h3>
        {children}
    </div>
);

const FeaturedCourse: React.FC<{ course: ProfileCourse; owned: boolean }> = ({ course, owned }) => {
    const id = course.course_id ?? course.id;
    const url = owned ? `/learning/${id}` : `/course/${course.slug || id}`;
    const meta = [
        course.rating > 0 ? `${course.rating.toFixed(1).replace('.', ',')} puan` : null,
        course.studentCount > 0 ? `${num(course.studentCount)} öğrenci` : null,
        course.hours > 0 ? `${course.hours.toLocaleString('tr-TR')} saat` : null,
        course.level || null,
    ].filter(Boolean).join('  ·  ');

    return (
        <Link to={url} className="group grid sm:grid-cols-[minmax(0,48%)_1fr]  bg-[#1B7A43] text-white overflow-hidden hover:bg-[#16613A] transition-colors">
            <div className="relative aspect-video sm:aspect-auto sm:min-h-[260px] m-2 sm:m-3  bg-[#D7F5E2] overflow-hidden">
                <img
                    src={course.image}
                    alt={course.title}
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
            </div>
            <div className="p-5 sm:p-7 flex flex-col">
                {course.categoryName && (
                    <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#B2F0C8]">{course.categoryName}</span>
                )}
                <h3 className="mt-2 text-[21px] sm:text-[26px] font-extrabold leading-[1.15] tracking-[-0.025em] line-clamp-2">{course.title}</h3>
                {course.summary && <p className="mt-2.5 text-[14.5px] leading-[1.6] text-white/80 line-clamp-3">{course.summary}</p>}
                {meta && <p className="mt-3 text-[13px] font-semibold text-[#B2F0C8]">{meta}</p>}
                <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                    {!owned ? (
                        <span className="text-[26px] font-extrabold tabular-nums">
                            {course.price > 0 ? `₺${course.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Ücretsiz'}
                        </span>
                    ) : <span className="text-[13.5px] font-bold text-[#B2F0C8]">Bu kursa sahipsin</span>}
                    <span className="h-11 px-5 inline-flex items-center  bg-[#B2F0C8] text-[#0A2A1A] text-[14px] font-extrabold">
                        {owned ? 'Derse git' : 'Kursu incele'}
                    </span>
                </div>
            </div>
        </Link>
    );
};

const LearningRow: React.FC<{ course: LearningCourse }> = ({ course }) => (
    <div className="flex gap-3  bg-[#F5F6F8] p-2.5 pr-4">
        <Link to={`/course/${course.slug || course.id}`} className="w-[112px] shrink-0 aspect-video  overflow-hidden bg-[#D7F5E2]">
            <img
                src={course.image}
                alt=""
                loading="lazy"
                onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                className="w-full h-full object-cover"
            />
        </Link>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
            <Link to={`/course/${course.slug || course.id}`} className="text-[14px] font-bold leading-snug line-clamp-2 hover:text-[#1B7A43]">
                {course.title}
            </Link>
            {course.instructorName && (
                course.instructorSlug
                    ? <Link to={`/user/${course.instructorSlug}`} className="mt-0.5 text-[12.5px] text-[#6B7280] truncate hover:text-[#1B7A43]">{course.instructorName}</Link>
                    : <span className="mt-0.5 text-[12.5px] text-[#6B7280] truncate">{course.instructorName}</span>
            )}
            <div className="mt-2 flex items-center gap-2.5">
                <div className="flex-1 h-1.5 rounded-full bg-white overflow-hidden">
                    <div className={cn('h-full rounded-full', course.progress >= 100 ? 'bg-[#0A2A1A]' : 'bg-[#1B7A43]')} style={{ width: `${course.progress}%` }} />
                </div>
                <span className="text-[11.5px] font-bold tabular-nums text-[#374151]">
                    {course.progress >= 100 ? 'Bitti' : `%${course.progress}`}
                </span>
            </div>
        </div>
    </div>
);

export default ProfileView;
