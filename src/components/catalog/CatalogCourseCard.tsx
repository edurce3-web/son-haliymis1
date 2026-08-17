import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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

/** Puanı Domestika'daki gibi yüzdeye çevirir: 4.5/5 -> %90 */
const ratingPercent = (rating?: number) => Math.round(((Number(rating) || 0) / 5) * 100);

const compactCount = (n?: number) => {
    const v = Number(n) || 0;
    return v.toLocaleString('tr-TR');
};

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
            // Ücretsiz kursu sepetten geçirmenin anlamı yok; doğrudan kaydet
            // ve derse gönder.
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
            // Zaten sepetteyse kullanıcıya hata gibi göstermenin anlamı yok
            const message = String(err?.message || '').toLowerCase();
            if (isFree) {
                // Zaten kayıtlıysa hata göstermek yerine derse götür
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

    const summary = course.short_description || course.description || '';

    // Alt satırdaki bilgiler nokta ile ayrılıyor; ikon kullanılmıyor.
    const meta = [
        Number(course.student_count) > 0 && `${compactCount(course.student_count)} öğrenci`,
        Number(course.review_count) > 0 && `%${ratingPercent(course.rating)} memnuniyet`,
        Number(course.duration_hours) > 0 && `${Math.round(Number(course.duration_hours))} saat`,
    ].filter(Boolean) as string[];

    return (
        <article className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:border-brand-300 hover:shadow-[0_12px_28px_-14px_rgba(23,93,93,0.35)]">
            <Link to={href} className="block relative aspect-[16/10] bg-slate-100 overflow-hidden">
                {course.image && !imgFailed ? (
                    <img
                        src={course.image}
                        alt={course.title}
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-xs font-medium px-4 text-center line-clamp-2">
                            {course.title}
                        </span>
                    </div>
                )}

                {/* Sahip olunan kurs görselin üstünde işaretleniyor */}
                {owned && (
                    <span className="absolute top-2.5 left-2.5 bg-brand-700 text-white text-[11px] font-semibold rounded-md px-2 py-1">
                        Kayıtlısınız
                    </span>
                )}
                {!owned && course.level && (
                    <span className="absolute bottom-2.5 left-2.5 bg-white/95 text-slate-700 text-[11px] font-semibold rounded-md px-2 py-1">
                        {course.level}
                    </span>
                )}

                <button
                    onClick={toggleFavorite}
                    aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    className={cn(
                        'absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center transition-opacity hover:bg-white',
                        favorited ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                    )}
                >
                    <Heart className={cn('w-4 h-4', favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600')} />
                </button>

                {/* Sahip olunan kursta ilerleme çubuğu görselin altına yapışıyor */}
                {owned && progress > 0 && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-black/15">
                        <span
                            className="block h-full bg-brand-500"
                            style={{ width: `${Math.min(100, progress)}%` }}
                        />
                    </span>
                )}
            </Link>

            <div className="p-4 flex flex-col flex-1">
                {/* Kategori — tek satır, sade */}
                {(course.subcategory_name || course.category_name) && (
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 mb-2">
                        {course.subcategory_name || course.category_name}
                    </p>
                )}

                <h3 className="font-bold text-[15px] text-slate-900 leading-snug line-clamp-2 mb-1.5">
                    <Link to={href} className="hover:text-brand-800 transition-colors">
                        <Highlighted text={course.title} term={highlight} />
                    </Link>
                </h3>

                {course.instructor_name && (
                    <p className="text-[13px] text-slate-500 mb-2">{course.instructor_name}</p>
                )}

                {summary && (
                    <p className="text-[13.5px] text-slate-600 leading-relaxed line-clamp-2 mb-3">
                        {summary}
                    </p>
                )}

                {meta.length > 0 && (
                    <p className="text-xs text-slate-500 mb-3">
                        {meta.join(' · ')}
                    </p>
                )}

                {/* Fiyat ve eylem — kartın en altına yapışsın */}
                <div className="mt-auto pt-3 border-t border-slate-100">
                    {owned ? (
                        <>
                            <p className="text-[13px] text-slate-600 mb-2.5">
                                {progress >= 100
                                    ? 'Bu kursu tamamladınız'
                                    : progress > 0
                                        ? `%${progress} tamamlandı`
                                        : 'Bu kurs kitaplığınızda'}
                            </p>
                            <Link
                                to={`/learning/${courseId}`}
                                className="w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center bg-brand-700 hover:bg-brand-800 text-white transition-colors"
                            >
                                {progress >= 100 ? 'Kursu tekrar izle' : progress > 0 ? 'Devam et' : 'Eğitime git'}
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-[17px] font-bold text-slate-900 mb-2.5">
                                {isFree ? 'Ücretsiz' : formatPrice(price)}
                            </p>
                            <button
                                onClick={addToCart}
                                disabled={adding}
                                className={cn(
                                    'w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors',
                                    inCart
                                        ? 'bg-white border border-brand-600 text-brand-800 hover:bg-brand-50'
                                        : 'bg-brand-700 hover:bg-brand-800 text-white',
                                    adding && 'opacity-70 cursor-wait'
                                )}
                            >
                                {adding ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Ekleniyor</>
                                ) : inCart ? (
                                    'Sepete git'
                                ) : isFree ? (
                                    'Ücretsiz kaydol'
                                ) : (
                                    'Sepete ekle'
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
};

export default CatalogCourseCard;
