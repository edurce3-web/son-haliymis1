import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Clock, Video, Heart, ShoppingCart, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getCourseImageUrl, favoritesAPI, cartAPI } from '@/lib/api';
import { AddedToCartModal } from '@/components/cart/AddedToCartModal';

export type ShelfBadge = { text: string; tone: 'brand' | 'amber' | 'mint' | 'sky' } | null;

const BADGE_TONES: Record<NonNullable<ShelfBadge>['tone'], string> = {
    brand: 'bg-brand-700 text-white',
    amber: 'bg-amber-500 text-white',
    mint: 'bg-brand-100 text-brand-900',
    sky: 'bg-sky-100 text-sky-900',
};

/**
 * Kursun kendi verisinden etiket türetir.
 *
 * Etiket elle verilmediğinde kullanılıyor. Hepsi gerçek sayılara bakıyor —
 * "çok satan" yazan ama kimsenin almadığı bir kart, etiketlerin tamamını
 * değersizleştirir.
 */
export function shelfBadge(course: any): ShelfBadge {
    const students = Number(course.student_count ?? course.studentCount) || 0;
    const rating = Number(course.rating) || 0;

    if (students >= 500) return { text: 'En çok satan', tone: 'amber' };
    if (students >= 100) return { text: 'Popüler', tone: 'mint' };
    if (rating >= 4.7 && students > 0) return { text: 'Yüksek puan', tone: 'brand' };
    return null;
}

const formatHours = (seconds?: number | null) => {
    const s = Number(seconds) || 0;
    if (s < 60) return null;
    const h = Math.floor(s / 3600);
    if (h >= 1) return `${h} saat`;
    return `${Math.round(s / 60)} dk`;
};

/**
 * Raf kartı — üye ana sayfasının ızgaralarında kullanılıyor.
 *
 * Yatay raflardaki `CourseCard`'dan ayrı: oradaki kart dar ve yanında
 * açılan bir detay paneli var, bu kart ızgarada duruyor ve bilgisini
 * kendi üstünde taşıyor. İki kartı tek bileşende toplamak, raf için
 * yapılan her değişikliğin ızgarayı bozması demekti.
 *
 * `compact` kipinde süre ve ders sayısı satırı düşüyor; beşli ızgarada
 * kart dar kalıyor ve o satır sıkışıp okunmaz hâle geliyor.
 */
export const ShelfCourseCard: React.FC<{
    course: any;
    badge?: ShelfBadge;
    compact?: boolean;
    /** Kullanıcının zaten sahip olduğu kurs: fiyat yerine ilerleme gösterilir. */
    owned?: boolean;
}> = ({ course, badge, compact, owned }) => {
    const queryClient = useQueryClient();

    const [loaded, setLoaded] = useState(false);
    const [favorited, setFavorited] = useState(Boolean(course.is_favorited));
    const [inCart, setInCart] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [addedCourse, setAddedCourse] = useState<any>(null);

    const url = owned ? `/learning/${course.id}` : `/course/${course.slug || course.id}`;
    const img = getCourseImageUrl(
        course.id ?? course.course_id,
        course.image_url || course.image || course.thumbnail || course.image_path
    );

    const price = Number(course.price) || 0;
    const listPrice = Number(course.original_price || course.originalPrice) || 0;
    const hasDiscount = listPrice > price && price > 0;

    const rating = Number(course.rating) || 0;
    const reviews = Number(course.review_count ?? course.reviews) || 0;
    const lessons = Number(course.lesson_count) || 0;
    const hours = formatHours(course.duration_seconds);
    const instructor = course.instructor_name || course.instructor;

    const progress = Math.min(100, Math.max(0, Math.round(Number(course.progress) || 0)));

    /*
     * Panelden hesaba tanımlanan kurs ayrı görünmeli: satın alınmamış,
     * öğrenci sayısına da girmiyor. Kullanıcı kartına bakınca bunun
     * farklı bir erişim olduğunu anlasın.
     */
    const shown = course.is_staff_grant
        ? ({ text: 'Size özel', tone: 'amber' } as ShelfBadge)
        : badge !== undefined ? badge : shelfBadge(course);

    const favMutation = useMutation({
        mutationFn: favoritesAPI.toggleFavorite,
        onSuccess: (data: any) => {
            setFavorited(data.favorited);
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
        onError: () => toast.error('İşlem tamamlanamadı'),
    });

    const cartMutation = useMutation({
        mutationFn: cartAPI.addToCart,
        onSuccess: (data: any) => {
            setInCart(true);
            setAddedCourse(data.course || course);
            setModalOpen(true);
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
        onError: () => toast.error('Sepete eklenemedi'),
    });

    const stop = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <>
            <article className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_44px_-24px_rgba(15,23,42,0.3)] hover:border-brand-200 transition-all duration-300">

                <Link to={url} className="relative block aspect-video overflow-hidden bg-slate-100 shrink-0">
                    <img
                        src={img}
                        alt={course.title}
                        loading="lazy"
                        onLoad={() => setLoaded(true)}
                        onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                        className={cn(
                            'w-full h-full object-cover transition-all duration-500 group-hover:scale-105',
                            loaded ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                    {!loaded && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}

                    {shown && (
                        <span
                            className={cn(
                                'absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10.5px] font-extrabold uppercase tracking-wider shadow-sm',
                                BADGE_TONES[shown.tone]
                            )}
                        >
                            {shown.text}
                        </span>
                    )}

                    {/* Zaten sahip olunan kurs favorilenmiyor */}
                    {!owned && (
                        <button
                            type="button"
                            aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                            onClick={e => { stop(e); favMutation.mutate(course.id); }}
                            className={cn(
                                'absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center shadow-sm transition-opacity',
                                favorited
                                    ? 'opacity-100 text-rose-500'
                                    : 'opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-500'
                            )}
                        >
                            <Heart className={cn('w-[17px] h-[17px]', favorited && 'fill-rose-500')} />
                        </button>
                    )}
                </Link>

                <div className="flex flex-col flex-1 justify-between p-4">
                    <div className="min-w-0">
                        <h3 className="text-[14.5px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
                            <Link to={url}>{course.title}</Link>
                        </h3>

                        {instructor && (
                            <p className="text-[12px] text-slate-500 mt-1.5 truncate">{instructor}</p>
                        )}

                        {rating > 0 ? (
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[12.5px] font-bold text-amber-600 tabular-nums">
                                    {rating.toFixed(1)}
                                </span>
                                <span className="flex">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                'w-3 h-3',
                                                i <= Math.round(rating)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'fill-slate-200 text-slate-200'
                                            )}
                                        />
                                    ))}
                                </span>
                                {reviews > 0 && (
                                    <span className="text-[11.5px] text-slate-400 tabular-nums">
                                        ({reviews.toLocaleString('tr-TR')})
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-[12px] text-slate-400 mt-2">Yeni yayınlandı</p>
                        )}

                        {!compact && (hours || lessons > 0) && (
                            <div className="flex items-center gap-2 mt-2 text-[12px] text-slate-500">
                                {hours && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        {hours}
                                    </span>
                                )}
                                {hours && lessons > 0 && <span className="text-slate-300">•</span>}
                                {lessons > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Video className="w-3.5 h-3.5 text-slate-400" />
                                        {lessons} ders
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sahip olunan kursta fiyat ve sepet anlamsız; yerine
                        nerede kalındığı ve devam düğmesi duruyor. */}
                    {owned ? (
                        <div className="pt-4 mt-2">
                            <div className="flex items-center gap-2.5">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-600 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-[11.5px] font-bold text-slate-600 tabular-nums shrink-0">
                                    %{progress}
                                </span>
                            </div>

                            <Link
                                to={url}
                                className="mt-3 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-brand-50 text-brand-800 text-[13px] font-bold hover:bg-brand-700 hover:text-white transition-colors"
                            >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                {progress > 0 ? 'Devam et' : 'Başla'}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-end justify-between gap-2 pt-4 mt-2">
                            <span className="flex items-baseline gap-1.5 min-w-0">
                                <span className="font-montserrat text-[17px] font-extrabold text-slate-900 tabular-nums">
                                    {price > 0 ? `₺${price.toLocaleString('tr-TR')}` : 'Ücretsiz'}
                                </span>
                                {hasDiscount && (
                                    <span className="text-[11.5px] text-slate-400 line-through tabular-nums">
                                        ₺{listPrice.toLocaleString('tr-TR')}
                                    </span>
                                )}
                            </span>

                            <button
                                type="button"
                                aria-label={inCart ? 'Sepette' : 'Sepete ekle'}
                                disabled={inCart || cartMutation.isPending}
                                onClick={e => { stop(e); cartMutation.mutate(course.id); }}
                                className={cn(
                                    'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                                    inCart
                                        ? 'bg-brand-50 text-brand-700 cursor-default'
                                        : 'bg-slate-100 text-slate-600 hover:bg-brand-700 hover:text-white'
                                )}
                            >
                                {cartMutation.isPending
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <ShoppingCart className="w-[18px] h-[18px]" />}
                            </button>
                        </div>
                    )}
                </div>
            </article>

            {addedCourse && (
                <AddedToCartModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    course={addedCourse}
                />
            )}
        </>
    );
};

export default ShelfCourseCard;
