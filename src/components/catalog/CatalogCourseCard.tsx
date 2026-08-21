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
 * için dolu yıldız maskeleniyor.
 */
const Stars: React.FC<{ rating: number }> = ({ rating }) => (
    <span className="inline-flex items-center gap-[1px]" aria-label={`${rating.toFixed(1)} / 5`}>
        {[0, 1, 2, 3, 4].map(i => {
            const fill = Math.max(0, Math.min(1, rating - i));
            return (
                <span key={i} className="relative w-3.5 h-3.5 shrink-0">
                    <Star className="absolute inset-0 w-3.5 h-3.5 text-slate-200 fill-slate-200" />
                    {fill > 0 && (
                        <span
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${fill * 100}%` }}
                        >
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
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

    // Kurs bağlantıları yeni sekmede açılıyor: kullanıcı liste içindeki yerini
    // kaybetmeden birkaç kursa bakabilsin.
    const linkProps = { to: href, target: '_blank' as const, rel: 'noopener' };

    return (
        <article className="group relative bg-white border border-slate-200 rounded-lg overflow-hidden flex transition-colors hover:border-brand-300">
            {/* Görsel — dar ve solda, kart yüksekliğini şişirmiyor */}
            <Link {...linkProps} className="relative w-[132px] sm:w-[168px] shrink-0 bg-slate-100 overflow-hidden">
                {course.image && !imgFailed ? (
                    <img
                        src={course.image}
                        alt={course.title}
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center p-3">
                        <span className="text-slate-400 text-[11px] font-medium text-center line-clamp-3">
                            {course.title}
                        </span>
                    </div>
                )}

                {owned && (
                    <span className="absolute top-2 left-2 bg-brand-700 text-white text-[10px] font-semibold rounded px-1.5 py-0.5">
                        Kayıtlı
                    </span>
                )}

                {owned && progress > 0 && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
                        <span
                            className="block h-full bg-brand-500"
                            style={{ width: `${Math.min(100, progress)}%` }}
                        />
                    </span>
                )}
            </Link>

            <div className="flex-1 min-w-0 p-4 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {(course.subcategory_name || course.category_name) && (
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 truncate">
                                {course.subcategory_name || course.category_name}
                            </p>
                        )}
                        <h3 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1">
                            <Link {...linkProps} className="hover:text-brand-800 transition-colors">
                                <Highlighted text={course.title} term={highlight} />
                            </Link>
                        </h3>
                    </div>

                    <button
                        onClick={toggleFavorite}
                        aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                        className={cn(
                            'shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all',
                            favorited
                                ? 'opacity-100 text-rose-500'
                                : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-rose-500'
                        )}
                    >
                        <Heart className={cn('w-4 h-4', favorited && 'fill-rose-500')} />
                    </button>
                </div>

                {course.instructor_name && (
                    <p className="text-[13px] text-slate-500 truncate mt-1">{course.instructor_name}</p>
                )}

                {/* Puan yıldızlarla; yüzde göstermiyoruz */}
                <div className="flex items-center gap-2 mt-2 min-h-[18px]">
                    {reviewCount > 0 ? (
                        <>
                            <span className="text-[13px] font-bold text-amber-600 tabular-nums">
                                {rating.toFixed(1)}
                            </span>
                            <Stars rating={rating} />
                            <span className="text-[12px] text-slate-400">({compactCount(reviewCount)})</span>
                        </>
                    ) : (
                        <span className="text-[12px] text-slate-400">Henüz değerlendirilmemiş</span>
                    )}
                </div>

                <p className="text-[12px] text-slate-500 mt-1.5">
                    {[
                        Number(course.student_count) > 0 && `${compactCount(course.student_count)} öğrenci`,
                        Number(course.duration_hours) > 0 && `${Math.round(Number(course.duration_hours))} saat`,
                        course.level,
                    ].filter(Boolean).join(' · ')}
                </p>

                <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                    {owned ? (
                        <>
                            <span className="text-[13px] text-slate-500">
                                {progress >= 100
                                    ? 'Tamamlandı'
                                    : progress > 0 ? `%${progress} tamamlandı` : 'Kitaplığında'}
                            </span>
                            <Link
                                to={`/learning/${courseId}`}
                                className="h-9 px-4 leading-9 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-[13px] font-semibold transition-colors shrink-0"
                            >
                                {progress > 0 ? 'Devam et' : 'Eğitime git'}
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className="text-[18px] font-bold text-slate-900 leading-none">
                                {isFree ? 'Ücretsiz' : formatPrice(price)}
                            </span>
                            <button
                                onClick={addToCart}
                                disabled={adding}
                                className={cn(
                                    'h-9 px-4 rounded-md text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0',
                                    inCart
                                        ? 'bg-white border border-brand-600 text-brand-800 hover:bg-brand-50'
                                        : 'bg-brand-700 hover:bg-brand-800 text-white',
                                    adding && 'opacity-70 cursor-wait'
                                )}
                            >
                                {adding ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Ekleniyor</>
                                ) : inCart ? 'Sepete git' : isFree ? 'Kaydol' : 'Sepete ekle'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
};

export default CatalogCourseCard;
