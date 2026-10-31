import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getCourseImageUrl, favoritesAPI, cartAPI } from '@/lib/api';
import { AddedToCartModal } from '@/components/cart/AddedToCartModal';
import { CourseHoverPanel, useCourseHoverPanel } from './CourseHoverPanel';

export type ShelfBadge = { text: string; tone: 'brand' | 'amber' | 'mint' | 'sky' } | null;

/*
 * Renkler tasarımın kendi paletinden birebir alındı (Stitch çıktısındaki
 * secondary-container, tertiary-fixed, primary-fixed ve primary). Yaklaşık
 * Tailwind tonlarıyla gidince etiketler tasarımdakinden soluk duruyordu.
 */
const BADGE_TONES: Record<NonNullable<ShelfBadge>['tone'], string> = {
    amber: 'bg-[#fea619] text-[#684000]',
    sky: 'bg-[#cce5ff] text-[#004b73]',
    mint: 'bg-[#9cf2e8] text-[#00504a]',
    brand: 'bg-[#005c55] text-white',
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
    if (students >= 100) return { text: 'Popüler', tone: 'brand' };
    if (rating >= 4.7 && students > 0) return { text: 'Öne çıkan', tone: 'mint' };
    return null;
}

const formatHours = (seconds?: number | null) => {
    const s = Number(seconds) || 0;
    if (s < 60) return null;
    const h = Math.floor(s / 3600);
    if (h >= 1) return `${h} saat`;
    return `${Math.round(s / 60)} dk`;
};

const formatLira = (value: number) =>
    value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Tasarımdaki ikonlar — Material Symbols.
 *
 * index.html yalnızca kartta geçen beş ikonu indiriyor; buraya yeni bir ad
 * eklenirse oradaki icon_names listesine de eklenmeli, yoksa ikon yerine
 * adı düz metin olarak görünür.
 */
const Symbol: React.FC<{ name: string; className?: string; filled?: boolean }> = ({ name, className, filled }) => (
    <span
        aria-hidden
        className={cn('material-symbols-outlined leading-none select-none', className)}
        style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
        {name}
    </span>
);

/**
 * Kurs kartı — ana sayfadaki bütün şeritlerde kullanılıyor.
 *
 * Misafir ve üye sayfası aynı kartı paylaşıyor: iki ayrı kart tutmak,
 * birinde yapılan düzeltmenin diğerine geçmemesi demekti.
 *
 * Görünüm Stitch tasarımından birebir: yazıtipi Plus Jakarta Sans, ikonlar
 * Material Symbols, renkler tasarımın paletinden.
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
     * öğrenci sayısına da girmiyor.
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

    // Üzerine gelince yanda açılan özet. Sahip olunan kursta sepet ve
    // istek listesi anlamsız, panel de açılmıyor.
    const hover = useCourseHoverPanel(course.id, !owned);
    const addToCart = (e: React.MouseEvent) => { stop(e); if (!inCart) cartMutation.mutate(course.id); };
    const toggleFav = (e: React.MouseEvent) => { stop(e); favMutation.mutate(course.id); };

    return (
        <>
            <div
                ref={hover.anchorRef}
                className="h-full"
                onMouseEnter={hover.onEnter}
                onMouseLeave={hover.onLeave}
            >
            <article className="group relative h-full flex flex-col font-jakarta bg-white rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(19,27,46,0.08)] hover:shadow-[0_20px_40px_-12px_rgba(19,27,46,0.22)] transition-all duration-300">

                <Link to={url} className="relative block aspect-video overflow-hidden bg-[#eaedff] shrink-0">
                    <img
                        src={img}
                        alt={course.title}
                        loading="lazy"
                        onLoad={() => setLoaded(true)}
                        onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                        className={cn(
                            'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
                            loaded ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                    {!loaded && <div className="absolute inset-0 bg-[#e2e7ff] animate-pulse" />}

                    {shown && (
                        <span
                            className={cn(
                                'absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[11px] leading-[14px] font-extrabold uppercase tracking-wider shadow-sm',
                                BADGE_TONES[shown.tone]
                            )}
                        >
                            {shown.text}
                        </span>
                    )}

                    {!owned && (
                        <button
                            type="button"
                            aria-label={favorited ? 'İstek listesinden çıkar' : 'İstek listesine ekle'}
                            onClick={e => { stop(e); favMutation.mutate(course.id); }}
                            className={cn(
                                'absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-sm transition-opacity',
                                favorited
                                    ? 'opacity-100 text-[#ba1a1a]'
                                    : 'opacity-0 group-hover:opacity-100 text-[#3e4947] hover:text-[#ba1a1a]'
                            )}
                        >
                            <Symbol name="favorite" filled={favorited} className="text-[18px]" />
                        </button>
                    )}
                </Link>

                <div className="flex flex-col flex-1 p-3">
                    <h3
                        className={cn(
                            'font-bold text-[#005c55] line-clamp-2 group-hover:text-[#00443f] transition-colors',
                            compact ? 'text-[13.5px] leading-[19px]' : 'text-[15px] leading-[22px]'
                        )}
                    >
                        <Link to={url}>{course.title}</Link>
                    </h3>

                    {instructor && (
                        <p className="text-[12px] leading-[18px] text-[#3e4947] mt-1 truncate">
                            {instructor}
                        </p>
                    )}

                    {rating > 0 ? (
                        <p className="flex items-center gap-1 mt-1">
                            <span className="text-[12px] leading-4 font-bold text-[#855300] tabular-nums">
                                {rating.toFixed(1)}
                            </span>
                            <Symbol name="star" filled className="text-[15px] text-[#fea619]" />
                            {reviews > 0 && (
                                <span className="text-[12px] leading-[18px] text-[#6e7977] tabular-nums">
                                    ({reviews.toLocaleString('tr-TR')})
                                </span>
                            )}
                        </p>
                    ) : (
                        <p className="text-[12px] leading-[18px] text-[#6e7977] mt-1">Yeni yayınlandı</p>
                    )}

                    {(hours || lessons > 0) && (
                        <p className="mt-1 text-[11.5px] leading-[16px] text-[#6e7977]">
                            {[hours, lessons > 0 ? `${lessons} ders` : null].filter(Boolean).join(' • ')}
                        </p>
                    )}

                    {/* Alt satır kartın dibine yapışıyor: farklı uzunluktaki
                        başlıklar yan yana dizilince fiyatlar aynı hizada kalsın. */}
                    {owned ? (
                        <div className="mt-auto pt-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex-1 h-1.5 bg-[#e2e7ff] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#005c55] rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-[11px] font-bold text-[#3e4947] tabular-nums shrink-0">
                                    %{progress}
                                </span>
                            </div>

                            <Link
                                to={url}
                                className="mt-3 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#eaedff] text-[#005c55] text-[13px] font-bold hover:bg-[#005c55] hover:text-white transition-colors"
                            >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                {progress > 0 ? 'Devam et' : 'Başla'}
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                            <span className="flex items-baseline gap-2 min-w-0">
                                <span className="text-[16px] leading-6 font-extrabold text-[#131b2e] tabular-nums">
                                    {price > 0 ? `₺${formatLira(price)}` : 'Ücretsiz'}
                                </span>
                                {hasDiscount && (
                                    <span className="text-[12px] leading-[18px] text-[#6e7977] line-through tabular-nums">
                                        ₺{formatLira(listPrice)}
                                    </span>
                                )}
                            </span>

                            <button
                                type="button"
                                aria-label={inCart ? 'Sepette' : 'Sepete ekle'}
                                disabled={inCart || cartMutation.isPending}
                                onClick={e => { stop(e); cartMutation.mutate(course.id); }}
                                className={cn(
                                    'shrink-0 p-1 rounded-md flex items-center justify-center transition-colors',
                                    inCart
                                        ? 'text-[#005c55] cursor-default'
                                        : 'text-[#6e7977] hover:text-[#005c55]'
                                )}
                            >
                                {cartMutation.isPending
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <Symbol name="add_shopping_cart" className="text-[20px]" />}
                            </button>
                        </div>
                    )}
                </div>
            </article>
            </div>

            {!owned && (
                <CourseHoverPanel
                    course={course}
                    url={url}
                    pos={hover.pos}
                    onEnter={hover.keepOpen}
                    onLeave={hover.onLeave}
                    onAddToCart={addToCart}
                    onToggleFav={toggleFav}
                    inCart={inCart}
                    adding={cartMutation.isPending}
                    favorited={favorited}
                />
            )}

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
