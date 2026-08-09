import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ThumbsUp, ShoppingCart, Loader2, Check, Heart } from 'lucide-react';
import { cartAPI, favoritesAPI } from '@/lib/api';
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
    if (v >= 1000) return v.toLocaleString('tr-TR');
    return String(v);
};

interface Props {
    course: CatalogCourse;
    /** Aranan kelime — başlıkta vurgulanır */
    highlight?: string;
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

export const CatalogCourseCard: React.FC<Props> = ({ course, highlight }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [adding, setAdding] = useState(false);
    const [inCart, setInCart] = useState(false);
    const [favorited, setFavorited] = useState(Boolean(course.is_favorited));
    const [imgFailed, setImgFailed] = useState(false);

    const href = `/course/${course.slug || course.id}`;
    const price = Number(course.price) || 0;
    const isFree = price === 0;

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
            await cartAPI.addToCart(course.course_id ?? course.id);
            setInCart(true);
            toast.success('Sepete eklendi', { description: course.title });
        } catch (err: any) {
            // Zaten sepetteyse kullanıcıya hata gibi göstermenin anlamı yok
            if (String(err?.message || '').toLowerCase().includes('zaten')) {
                setInCart(true);
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
            if (next) await favoritesAPI.addToFavorites(course.course_id ?? course.id);
            else await favoritesAPI.removeFromFavorites(course.course_id ?? course.id);
        } catch {
            setFavorited(!next);
            toast.error('İşlem tamamlanamadı');
        }
    };

    const summary = course.short_description || course.description || '';

    return (
        <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:shadow-lg hover:border-slate-300 transition-all duration-200">
            <Link to={href} className="block relative aspect-[16/10] bg-slate-100 overflow-hidden">
                {course.image && !imgFailed ? (
                    <img
                        src={course.image}
                        alt={course.title}
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-xs font-medium px-4 text-center line-clamp-2">
                            {course.title}
                        </span>
                    </div>
                )}

                <button
                    onClick={toggleFavorite}
                    aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-white"
                >
                    <Heart className={cn('w-4 h-4', favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600')} />
                </button>
            </Link>

            <div className="p-4 flex flex-col flex-1">
                {/* Kategori rozetleri */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {course.category_name && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 border border-slate-300 rounded-full px-2 py-0.5">
                            {course.category_name}
                        </span>
                    )}
                    {course.subcategory_name && course.subcategory_name !== course.category_name && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 border border-indigo-200 rounded-full px-2 py-0.5">
                            {course.subcategory_name}
                        </span>
                    )}
                </div>

                <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
                    <Link to={href} className="hover:text-indigo-700 transition-colors">
                        <Highlighted text={course.title} term={highlight} />
                    </Link>
                </h3>

                {course.instructor_name && (
                    <p className="text-sm text-slate-700 mb-2">
                        Eğitmen: <span className="font-medium">{course.instructor_name}</span>
                    </p>
                )}

                {summary && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{summary}</p>
                )}

                {/* Öğrenci sayısı ve memnuniyet */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {compactCount(course.student_count)}
                    </span>
                    {Number(course.review_count) > 0 && (
                        <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            %{ratingPercent(course.rating)} ({course.review_count})
                        </span>
                    )}
                    {course.level && (
                        <span className="ml-auto text-slate-400">{course.level}</span>
                    )}
                </div>

                {/* Fiyat ve satın alma — kartın en altına yapışsın */}
                <div className="mt-auto pt-1">
                    <p className="text-lg font-bold text-slate-900 mb-2.5">
                        {isFree ? 'Ücretsiz' : formatPrice(price)}
                    </p>

                    <button
                        onClick={addToCart}
                        disabled={adding}
                        className={cn(
                            'w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors',
                            inCart
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-teal-700 hover:bg-teal-800 text-white',
                            adding && 'opacity-70 cursor-wait'
                        )}
                    >
                        {adding ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Ekleniyor</>
                        ) : inCart ? (
                            <><Check className="w-4 h-4" /> Sepete git</>
                        ) : (
                            <><ShoppingCart className="w-4 h-4" /> {isFree ? 'Kursa başla' : `Satın al ${formatPrice(price)}`}</>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
};

export default CatalogCourseCard;
