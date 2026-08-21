import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2, Star } from 'lucide-react';
import { cartAPI, favoritesAPI, enrollmentAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface CatalogCourse {
    id: number;
    course_id: number;
    title: string;
    slug?: string;
    short_description?: string;
    description?: string;
    price?: number;
    level?: string;
    rating?: number;
    review_count?: number;
    student_count?: number;
    duration_hours?: number;
    image?: string;
    category_name?: string;
    subcategory_name?: string;
    instructor_name?: string;
    is_favorited?: boolean;
}

interface Props {
    course: CatalogCourse;
    /** Aranan kelime — başlıkta vurgulanır */
    highlight?: string;
    /** Kullanıcı bu kursa sahip mi (satın alınmış / kayıtlı) */
    owned?: boolean;
    /** Sahipse tamamlama yüzdesi */
    progress?: number;
    /** Kurs zaten sepette mi */
    inCart?: boolean;
}

/** Aranan kelimeyi başlıkta işaretler. */
const Highlighted: React.FC<{ text: string; term?: string }> = ({ text, term }) => {
    const q = (term || '').trim();
    if (!q || q.length < 2) return <>{text}</>;

    // Regex özel karakterlerini kaçır
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${safe})`, 'gi'));

    return (
        <>
            {parts.map((part, i) =>
                part.toLocaleLowerCase('tr-TR') === q.toLocaleLowerCase('tr-TR') ? (
                    <mark key={i} className="bg-amber-100 text-inherit rounded-sm px-0.5">{part}</mark>
                ) : (
                    <React.Fragment key={i}>{part}</React.Fragment>
                )
            )}
        </>
    );
};

/**
 * Puanı yıldızla gösterir.
 *
 * Önceden memnuniyet yüzdesi ("%80") yazıyordu; 5 üzerinden puanı yüzdeye
 * çevirmek kullanıcıya tanıdık gelmeyen bir sayı üretiyordu. Yarım yıldız
 * dolu yıldızın genişliği kırpılarak elde ediliyor.
 */
export const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
    <span className="inline-flex items-center gap-[1px]" aria-label={`${rating.toFixed(1)} / 5`}>
        {[0, 1, 2, 3, 4].map(i => {
            const fill = Math.max(0, Math.min(1, rating - i));
            return (
                <span key={i} className="relative shrink-0" style={{ width: size, height: size }}>
                    <Star className="absolute inset-0 text-slate-200 fill-slate-200" style={{ width: size, height: size }} />
                    {fill > 0 && (
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                            <Star className="text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
                        </span>
                    )}
                </span>
            );
        })}
    </span>
);

const compactCount = (n?: number) => (Number(n) || 0).toLocaleString('tr-TR');

export const CatalogCourseCard: React.FC<Props> = ({
    course, highlight, owned = false, progress = 0, inCart: inCartProp = false,
}) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [adding, setAdding] = useState(false);
    const [addedLocally, setAddedLocally] = useState(false);
    const [favorited, setFavorited] = useState(Boolean(course.is_favorited));
    const [imgFailed, setImgFailed] = useState(false);

    const courseId = course.course_id ?? course.id;
    const href = `/course/${course.slug || course.id}`;
    const price = Number(course.price) || 0;
    const isFree = price === 0;
    const inCart = inCartProp || addedLocally;
    const rating = Number(course.rating) || 0;
    const reviewCount = Number(course.review_count) || 0;

    const addToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            navigate(`/login?redirect=${encodeURIComponent(href)}`);
            return;
        }
        if (inCart) {
            navigate('/cart');
            return;
        }

        setAdding(true);
        try {
            // Ücretsiz kursu sepetten geçirmenin anlamı yok; doğrudan kaydet.
            if (isFree) {
                await enrollmentAPI.enrollInCourse(courseId);
                queryClient.invalidateQueries({ queryKey: ['enrolled-courses'] });
                navigate(`/learning/${courseId}`);
                return;
            }

            await cartAPI.addToCart(courseId);
            setAddedLocally(true);
            toast.success('Sepete eklendi', { description: course.title });
        } catch (err: any) {
            const message = String(err?.message || '').toLowerCase();
            if (isFree) {
                if (message.includes('zaten')) navigate(`/learning/${courseId}`);
                else toast.error('Kursa kaydolunamadı');
            } else if (message.includes('zaten')) {
                setAddedLocally(true);
                toast.info('Bu kurs zaten sepetinde');
            } else {
                toast.error('Sepete eklenemedi');
            }
        } finally {
            setAdding(false);
        }
    };

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate(`/login?redirect=${encodeURIComponent(href)}`);
            return;
        }
        const next = !favorited;
        setFavorited(next);
        try {
            if (next) await favoritesAPI.addToFavorites(courseId);
            else await favoritesAPI.removeFromFavorites(courseId);
        } catch {
            setFavorited(!next);
            toast.error('İşlem tamamlanamadı');
        }
    };

    // Kurs bağlantıları yeni sekmede: kullanıcı liste içindeki yerini
    // kaybetmeden birkaç kursa bakabilsin.
    const linkProps = { to: href, target: '_blank' as const, rel: 'noopener' };

    const meta = [
        Number(course.student_count) > 0 && `${compactCount(course.student_count)} öğrenci`,
        Number(course.duration_hours) > 0 && `${Math.round(Number(course.duration_hours))} saat`,
        course.level,
    ].filter(Boolean).join(' · ');

    const subtitle = course.short_description || course.description || '';

    return (
        <article className="group bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col transition-colors hover:border-brand-300">
            {/* Kapak — 16:9, kartı fazla uzatmıyor */}
            <Link {...linkProps} className="relative block aspect-[16/9] bg-slate-100 overflow-hidden">
                {course.image && !imgFailed ? (
                    <img
                        src={course.image}
                        alt={course.title}
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-montserrat text-[26px] font-extrabold text-slate-300">
                        {course.title.charAt(0).toLocaleUpperCase('tr-TR')}
                    </span>
                )}

                {owned && (
                    <span className="absolute top-1.5 left-1.5 bg-brand-700 text-white text-[10px] font-semibold rounded px-1.5 py-0.5">
                        Kayıtlı
                    </span>
                )}

                <button
                    onClick={toggleFavorite}
                    aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    className={cn(
                        'absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center transition-opacity',
                        favorited ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                    )}
                >
                    <Heart className={cn('w-3.5 h-3.5', favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600')} />
                </button>

                {owned && progress > 0 && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
                        <span className="block h-full bg-brand-500" style={{ width: `${Math.min(100, progress)}%` }} />
                    </span>
                )}
            </Link>

            <div className="p-3 flex flex-col flex-1">
                {(course.subcategory_name || course.category_name) && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-700 truncate">
                        {course.subcategory_name || course.category_name}
                    </p>
                )}

                <h3 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1">
                    <Link {...linkProps} className="hover:text-brand-800 transition-colors">
                        <Highlighted text={course.title} term={highlight} />
                    </Link>
                </h3>

                {/* Alt başlık — kursun kısa tanıtımı */}
                {subtitle && (
                    <p className="text-[12px] text-slate-500 leading-[1.5] line-clamp-2 mt-1">
                        {subtitle}
                    </p>
                )}

                {course.instructor_name && (
                    <p className="text-[12px] text-slate-400 truncate mt-1.5">{course.instructor_name}</p>
                )}

                <div className="flex items-center gap-1.5 mt-1.5 min-h-[16px]">
                    {reviewCount > 0 ? (
                        <>
                            <span className="text-[12px] font-bold text-amber-600 tabular-nums">
                                {rating.toFixed(1)}
                            </span>
                            <StarRating rating={rating} size={12} />
                            <span className="text-[11px] text-slate-400">({compactCount(reviewCount)})</span>
                        </>
                    ) : (
                        <span className="text-[11px] text-slate-400">Henüz değerlendirilmemiş</span>
                    )}
                </div>

                {meta && <p className="text-[11px] text-slate-400 mt-1">{meta}</p>}

                <div className="mt-auto pt-2.5 flex items-center justify-between gap-2">
                    {owned ? (
                        <>
                            <span className="text-[12px] text-slate-500 truncate">
                                {progress >= 100 ? 'Tamamlandı' : progress > 0 ? `%${progress}` : 'Kitaplığında'}
                            </span>
                            <Link
                                to={`/learning/${courseId}`}
                                className="h-8 px-3 leading-8 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-[12px] font-semibold transition-colors shrink-0"
                            >
                                {progress > 0 ? 'Devam et' : 'Başla'}
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className="text-[16px] font-bold text-slate-900 leading-none">
                                {isFree ? 'Ücretsiz' : formatPrice(price)}
                            </span>
                            <button
                                onClick={addToCart}
                                disabled={adding}
                                className={cn(
                                    'h-8 px-3 rounded-md text-[12px] font-semibold flex items-center justify-center gap-1 transition-colors shrink-0',
                                    inCart
                                        ? 'bg-white border border-brand-600 text-brand-800 hover:bg-brand-50'
                                        : 'bg-brand-700 hover:bg-brand-800 text-white',
                                    adding && 'opacity-70 cursor-wait'
                                )}
                            >
                                {adding ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : inCart ? 'Sepette' : isFree ? 'Kaydol' : 'Sepete ekle'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
};

export default CatalogCourseCard;
