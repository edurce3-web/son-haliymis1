import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cartAPI, favoritesAPI, getCourseImageUrl } from '@/lib/api';
import { CourseHoverPanel, useCourseHoverPanel } from '@/components/home/CourseHoverPanel';

/*
 * Katalog sayfalarının küçük kurs kartı.
 *
 * İki görünüm:
 *   grid  — dar dikey kart; bilgisayarda bir satıra altı tane sığıyor
 *   row   — yatay satır; küçük kapak, başlık, eğitmen, ölçüler, fiyat
 *
 * Köşeler kare, çizgi yok; alanlar zemin tonuyla ayrılıyor. Üzerine gelince
 * ana sayfadaki gibi yanda ayrıntı paneli açılıyor.
 */

const lira = (n: number) =>
    n > 0 ? `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Ücretsiz';

const hoursOf = (s?: number | null) => {
    const v = Number(s) || 0;
    if (v < 60) return null;
    return v >= 3600 ? `${Math.floor(v / 3600)} sa` : `${Math.round(v / 60)} dk`;
};

export const MiniCourseCard: React.FC<{
    course: any;
    owned?: boolean;
    progress?: number;
    view?: 'grid' | 'row';
}> = ({ course, owned, progress = 0, view = 'grid' }) => {
    const qc = useQueryClient();
    const id = Number(course.course_id ?? course.id);
    const url = owned ? `/learning/${id}` : `/course/${course.slug || id}`;
    const img = getCourseImageUrl(id, course.image_url || course.image || course.thumbnail || course.image_path);
    const price = Number(course.price) || 0;
    const list = Number(course.original_price) || 0;
    const rating = Number(course.rating) || 0;
    const reviews = Number(course.review_count) || 0;
    const students = Number(course.student_count) || 0;
    const hours = hoursOf(course.duration_seconds);
    const lessons = Number(course.lesson_count) || 0;

    const [inCart, setInCart] = useState(false);
    const [fav, setFav] = useState(Boolean(course.is_favorited));

    const cart = useMutation({
        mutationFn: cartAPI.addToCart,
        onSuccess: () => {
            setInCart(true);
            qc.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Sepete eklendi', { action: { label: 'Sepete git', onClick: () => { window.location.href = '/cart'; } } });
        },
        onError: () => toast.error('Sepete eklenemedi'),
    });
    const favM = useMutation({
        mutationFn: favoritesAPI.toggleFavorite,
        onSuccess: (d: any) => { setFav(d.favorited); qc.invalidateQueries({ queryKey: ['favorites'] }); },
        onError: () => toast.error('İşlem tamamlanamadı'),
    });

    const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
    const addToCart = (e: React.MouseEvent) => { stop(e); if (!inCart) cart.mutate(id); };
    const toggleFav = (e: React.MouseEvent) => { stop(e); favM.mutate(id); };
    const hover = useCourseHoverPanel(id, !owned && view === 'grid');

    const badge = students >= 500 ? 'Çok satan' : students >= 100 ? 'Popüler' : rating >= 4.7 && students > 0 ? 'Öne çıkan' : null;

    const ratingLine = rating > 0 ? (
        <span className="inline-flex items-center gap-1 text-[11.5px] tabular-nums">
            <span className="font-extrabold text-[#9A5B00]">{rating.toFixed(1)}</span>
            <Star className="w-3 h-3 fill-[#F5A524] text-[#F5A524]" />
            {reviews > 0 && <span className="text-[#9CA3AF]">{`(${reviews.toLocaleString('tr-TR')})`}</span>}
        </span>
    ) : <span className="text-[11.5px] font-semibold text-[#1B7A43]">Yeni</span>;

    const cartButton = !owned && (
        <button
            type="button"
            aria-label={inCart ? 'Sepette' : 'Sepete ekle'}
            onClick={addToCart}
            disabled={inCart || cart.isPending}
            className={cn(
                'shrink-0 w-8 h-8 flex items-center justify-center transition-colors',
                inCart ? 'bg-[#1B7A43] text-white' : 'bg-[#F1F3F5] text-[#374151] hover:bg-[#1B7A43] hover:text-white'
            )}
        >
            {cart.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : inCart ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
        </button>
    );

    if (view === 'row') {
        return (
            <article className="group flex gap-3 bg-[#F5F6F8] hover:bg-[#EEFBF3] p-2 transition-colors">
                <Link to={url} className="relative w-[112px] sm:w-[132px] shrink-0 aspect-video overflow-hidden bg-[#D7F5E2]">
                    <img src={img} alt="" loading="lazy" onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }} className="w-full h-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1 flex flex-col">
                    <Link to={url} className="text-[13.5px] leading-[18px] font-bold text-[#111827] line-clamp-2 group-hover:text-[#1B7A43]">{course.title}</Link>
                    <p className="mt-0.5 text-[11.5px] text-[#6B7280] truncate">
                        {[course.instructor_name, course.level, hours, lessons ? `${lessons} ders` : null].filter(Boolean).join(' · ')}
                    </p>
                    <div className="mt-auto pt-1 flex items-center justify-between gap-2">
                        {ratingLine}
                        {owned ? (
                            <span className="text-[12px] font-bold text-[#1B7A43] tabular-nums">{`%${Math.round(progress)} tamamlandı`}</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                {list > price && price > 0 && <span className="text-[11px] text-[#9CA3AF] line-through tabular-nums">{lira(list)}</span>}
                                <span className="text-[14px] font-extrabold tabular-nums">{lira(price)}</span>
                                {cartButton}
                            </span>
                        )}
                    </div>
                </div>
            </article>
        );
    }

    return (
        <>
            <div ref={hover.anchorRef} onMouseEnter={hover.onEnter} onMouseLeave={hover.onLeave} className="h-full">
                <article className="group h-full flex flex-col">
                    <Link to={url} className="relative block aspect-video overflow-hidden bg-[#D7F5E2]">
                        <img
                            src={img}
                            alt=""
                            loading="lazy"
                            onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        {badge && (
                            <span className="absolute left-0 top-0 px-1.5 py-[3px] bg-[#B2F0C8] text-[#0A2A1A] text-[9.5px] font-extrabold uppercase tracking-[0.06em]">{badge}</span>
                        )}
                        {owned && (
                            <span className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
                                <span className="block h-full bg-[#B2F0C8]" style={{ width: `${Math.round(progress)}%` }} />
                            </span>
                        )}
                    </Link>
                    <div className="flex-1 flex flex-col pt-2">
                        <Link to={url} className="text-[12.5px] leading-[17px] font-bold text-[#111827] line-clamp-2 group-hover:text-[#1B7A43]">{course.title}</Link>
                        {course.instructor_name && <p className="mt-0.5 text-[11px] text-[#6B7280] truncate">{course.instructor_name}</p>}
                        <div className="mt-1">{ratingLine}</div>
                        <div className="mt-auto pt-1.5 flex items-center justify-between gap-1.5">
                            {owned ? (
                                <span className="text-[12px] font-bold text-[#1B7A43]">{progress > 0 ? 'Devam et' : 'Başla'}</span>
                            ) : (
                                <span className="min-w-0 flex items-baseline gap-1.5">
                                    <span className="text-[13.5px] font-extrabold tabular-nums">{lira(price)}</span>
                                    {list > price && price > 0 && <span className="text-[10.5px] text-[#9CA3AF] line-through tabular-nums truncate">{lira(list)}</span>}
                                </span>
                            )}
                            {cartButton}
                        </div>
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
                    adding={cart.isPending}
                    favorited={fav}
                />
            )}
        </>
    );
};

export default MiniCourseCard;
