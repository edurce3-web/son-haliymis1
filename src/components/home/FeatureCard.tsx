import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, BadgeCheck, User, ArrowRight } from 'lucide-react';
import { getCourseImageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

/** Veritabanı Türkçe etiket tutuyor; eski İngilizce kayıtlar için karşılık. */
const LEVEL_LABELS: Record<string, string> = {
    beginner: 'Başlangıç',
    intermediate: 'Orta',
    advanced: 'İleri',
    all: 'Her seviye',
};

const formatDuration = (seconds?: number | null) => {
    const s = Number(seconds) || 0;
    if (s < 60) return null;
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    if (h === 0) return `${m} dk`;
    return m > 0 ? `${h} sa ${m} dk` : `${h} saat`;
};

export type FeatureBadge = { text: string; tone: 'brand' | 'mint' | 'amber' | 'dark' } | null;

const BADGE_TONES: Record<NonNullable<FeatureBadge>['tone'], string> = {
    brand: 'bg-brand-700 text-white',
    mint: 'bg-emerald-400 text-emerald-950',
    amber: 'bg-amber-500 text-white',
    dark: 'bg-slate-900 text-white',
};

/**
 * Vitrin kartı — misafir ana sayfasının ızgara bölümleri için.
 *
 * Raflardaki `CourseCard`'dan ayrı duruyor çünkü işi farklı: raf kartı dar ve
 * taranmak için, bu kart geniş ve ikna etmek için. Bu yüzden kapak üzerinde
 * süre ve etiket, gövdede kategori · seviye, eğitmen, puan, sertifika ve
 * indirim oranı var — hepsi karar vermek için bakılan şeyler.
 *
 * Birincil düğme sepet değil "kursu incele": misafir sepete ekleyemiyor
 * (sepet oturum istiyor), onu giriş ekranına atmak satın almaya değil geri
 * dönmemeye yol açıyordu. Kurs sayfası müfredatı ve tanıtım derslerini
 * gösterdiği için gerçek bir sonraki adım.
 */
export const FeatureCard: React.FC<{
    course: any;
    badge?: FeatureBadge;
}> = ({ course, badge }) => {
    const [loaded, setLoaded] = useState(false);

    const url = `/course/${course.slug || course.id}`;
    const img = getCourseImageUrl(
        course.id ?? course.course_id,
        course.image_url || course.image || course.thumbnail || course.image_path
    );

    const price = Number(course.price) || 0;
    const listPrice = Number(course.original_price || course.originalPrice) || 0;
    const hasDiscount = listPrice > price && price > 0;
    const discount = hasDiscount ? Math.round((1 - price / listPrice) * 100) : 0;

    const rating = Number(course.rating) || 0;
    const reviews = Number(course.reviews ?? course.review_count) || 0;
    const students = Number(course.studentCount ?? course.student_count) || 0;
    const instructor = course.instructor_name || course.instructor;
    const level = course.level ? (LEVEL_LABELS[course.level] || course.level) : null;
    const duration = formatDuration(course.duration_seconds);

    return (
        <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.25)] transition-all duration-300 hover:-translate-y-1">

            <Link to={url} className="relative block aspect-[16/9] overflow-hidden bg-brand-900 shrink-0">
                <img
                    src={img}
                    alt={course.title}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                    className={cn(
                        'w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.06]',
                        loaded ? 'opacity-100' : 'opacity-0'
                    )}
                />
                {!loaded && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}

                <span className="absolute inset-0 bg-gradient-to-t from-brand-950/75 via-brand-950/5 to-transparent" />

                {badge && (
                    <span
                        className={cn(
                            'absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide shadow-md',
                            BADGE_TONES[badge.tone]
                        )}
                    >
                        {badge.text}
                    </span>
                )}

                {duration && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/55 backdrop-blur-md text-white text-[11.5px] font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {duration}
                    </span>
                )}
            </Link>

            <div className="p-5 flex flex-col flex-1">
                {(course.category_name || level) && (
                    <div className="flex items-center gap-2 mb-2 min-w-0">
                        {course.category_name && (
                            <span className="text-[11.5px] font-bold text-brand-700 truncate">
                                {course.category_name}
                            </span>
                        )}
                        {course.category_name && level && <span className="text-slate-300">•</span>}
                        {level && (
                            <span className="text-[11.5px] text-slate-500 shrink-0">{level}</span>
                        )}
                    </div>
                )}

                <h3 className="text-[16px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
                    <Link to={url}>{course.title}</Link>
                </h3>

                {instructor && (
                    <p className="flex items-center gap-1.5 text-[12.5px] text-slate-500 mt-2 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{instructor}</span>
                    </p>
                )}

                <div className="mt-auto pt-4 space-y-3.5">
                    <div className="flex items-center justify-between gap-2 pt-3.5 border-t border-slate-100">
                        {rating > 0 ? (
                            <span className="flex items-center gap-1.5 min-w-0">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                                <span className="text-[13.5px] font-bold text-slate-900">
                                    {rating.toFixed(1)}
                                </span>
                                <span className="text-[12px] text-slate-400 truncate">
                                    ({reviews.toLocaleString('tr-TR')})
                                </span>
                            </span>
                        ) : students > 0 ? (
                            <span className="text-[12.5px] text-slate-500">
                                {students.toLocaleString('tr-TR')} öğrenci
                            </span>
                        ) : (
                            <span className="text-[12.5px] text-slate-400">Yeni yayınlandı</span>
                        )}

                        <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-bold text-brand-800 bg-brand-50 border border-brand-100 rounded-md px-2 py-0.5">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Sertifikalı
                        </span>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                                <span className="font-montserrat text-[20px] font-extrabold text-slate-900 tabular-nums">
                                    {price > 0 ? `₺${price.toLocaleString('tr-TR')}` : 'Ücretsiz'}
                                </span>
                                {hasDiscount && (
                                    <span className="text-[12px] text-slate-400 line-through tabular-nums">
                                        ₺{listPrice.toLocaleString('tr-TR')}
                                    </span>
                                )}
                            </div>
                            {hasDiscount && (
                                <span className="text-[11px] font-bold text-emerald-700">
                                    %{discount} indirim
                                </span>
                            )}
                        </div>

                        <Link
                            to={url}
                            className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-[13px] font-bold transition-colors"
                        >
                            Kursu incele
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default FeatureCard;
