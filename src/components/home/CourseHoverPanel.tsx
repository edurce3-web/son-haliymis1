import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Heart, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

const PANEL_WIDTH = 320;
const GAP = 12;
const OPEN_DELAY = 300;
const CLOSE_DELAY = 160;

async function fetchHoverData(courseId: number) {
    const res = await fetch(`${API_BASE_URL}/courses/${courseId}/hover`);
    if (!res.ok) throw new Error('Kurs özeti alınamadı');
    return res.json();
}

const formatDate = (d?: string | null) => {
    if (!d) return null;
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.toLocaleString('tr-TR', { month: 'long' })} ${date.getFullYear()}`;
};

const formatHours = (seconds?: number | null) => {
    const s = Number(seconds) || 0;
    if (s < 60) return null;
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    if (h === 0) return `${m} dk`;
    return m > 0 ? `${h} sa ${m} dk` : `${h} saat`;
};

/**
 * Kartın üzerine gelince yanında açılan kurs özeti.
 *
 * Panel body'ye çiziliyor (portal): kartlar yatay kayan raflarda duruyor ve
 * o kapsayıcıda overflow tanımlı; içine konan panel kırpılırdı. Konumu
 * kartın ekrandaki yerine göre hesaplanıyor, sağda yer yoksa sola açılıyor.
 *
 * Açılış kısa bir gecikmeyle: imleç raf boyunca geçerken her kartta panel
 * patlamasın. Kapanış da gecikmeli ve imleç panele girince iptal oluyor —
 * yoksa panel karta DOM olarak bağlı olmadığı için, imleç kart ile panel
 * arasındaki boşluğu geçerken kapanıyor ve düğmelere hiç ulaşılamıyordu.
 *
 * Yalnızca geniş ekranda. Dokunmatik ekranda "üzerine gelmek" yok; kart
 * zaten kurs sayfasına götürüyor.
 */
export function useCourseHoverPanel(courseId: number, enabled: boolean) {
    const anchorRef = useRef<HTMLDivElement>(null);
    const openTimer = useRef<ReturnType<typeof setTimeout>>();
    const closeTimer = useRef<ReturnType<typeof setTimeout>>();
    const [pos, setPos] = useState<{ top: number; left: number; side: 'right' | 'left' } | null>(null);

    const close = useCallback(() => setPos(null), []);

    const onEnter = useCallback(() => {
        if (!enabled || window.innerWidth < 1024) return;
        clearTimeout(closeTimer.current);
        openTimer.current = setTimeout(() => {
            const rect = anchorRef.current?.getBoundingClientRect();
            if (!rect) return;
            const fitsRight = window.innerWidth - rect.right >= PANEL_WIDTH + GAP + 8;
            const side: 'right' | 'left' = fitsRight ? 'right' : 'left';
            const left = side === 'right' ? rect.right + GAP : rect.left - PANEL_WIDTH - GAP;
            const maxTop = window.innerHeight - 24;
            setPos({
                top: Math.min(rect.top, Math.max(12, maxTop - 430)),
                left: Math.max(12, left),
                side,
            });
        }, OPEN_DELAY);
    }, [enabled]);

    const onLeave = useCallback(() => {
        clearTimeout(openTimer.current);
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(close, CLOSE_DELAY);
    }, [close]);

    const keepOpen = useCallback(() => clearTimeout(closeTimer.current), []);

    useEffect(() => () => {
        clearTimeout(openTimer.current);
        clearTimeout(closeTimer.current);
    }, []);

    // Sayfa ya da raf kayarsa panel kartın yanından ayrılır; kapatmak doğru.
    useEffect(() => {
        if (!pos) return;
        window.addEventListener('scroll', close, { passive: true, capture: true });
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [pos, close]);

    return { anchorRef, pos, onEnter, onLeave, keepOpen, courseId };
}

export const CourseHoverPanel: React.FC<{
    course: any;
    url: string;
    pos: { top: number; left: number; side: 'right' | 'left' } | null;
    onEnter: () => void;
    onLeave: () => void;
    onAddToCart: (e: React.MouseEvent) => void;
    onToggleFav: (e: React.MouseEvent) => void;
    inCart: boolean;
    adding: boolean;
    favorited: boolean;
}> = ({ course, url, pos, onEnter, onLeave, onAddToCart, onToggleFav, inCart, adding, favorited }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['course-hover', course.id],
        queryFn: () => fetchHoverData(course.id),
        enabled: Boolean(pos),
        staleTime: 5 * 60 * 1000,
    });

    if (!pos) return null;

    const duration = formatHours(data?.duration_seconds ?? course.duration_seconds);
    const lessons = Number(data?.lesson_count ?? course.lesson_count) || 0;
    const updated = formatDate(data?.updated_at);
    const level = data?.level || course.level;
    const summary = data?.short_description || data?.description || course.short_description;
    const goals: string[] = Array.isArray(data?.learning_goals) ? data.learning_goals : [];

    return createPortal(
        <div
            className="hidden lg:block fixed z-[60] font-jakarta"
            style={{ top: pos.top, left: pos.left, width: PANEL_WIDTH }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            {/* Kart ile panel arasındaki boşluğu köprüleyen görünmez şerit */}
            <span
                aria-hidden
                className="absolute top-0 bottom-0 w-4"
                style={pos.side === 'right' ? { left: -16 } : { right: -16 }}
            />

            <div className="relative bg-white rounded-xl border border-[#e2e7ff] shadow-[0_24px_60px_-15px_rgba(19,27,46,0.32)] animate-in fade-in zoom-in-95 duration-150">
                <span
                    aria-hidden
                    className={cn(
                        'absolute top-8 w-3 h-3 bg-white border-[#e2e7ff] rotate-45',
                        pos.side === 'right' ? '-left-[7px] border-l border-b' : '-right-[7px] border-r border-t'
                    )}
                />

                <div className="p-5">
                    <Link to={url}>
                        <h4 className="text-[16px] leading-[22px] font-extrabold text-[#131b2e] hover:text-[#005c55] line-clamp-2 transition-colors">
                            {course.title}
                        </h4>
                    </Link>

                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {updated && (
                            <span className="text-[11px] font-bold text-[#005c55] bg-[#9cf2e8]/50 rounded-full px-2.5 py-1">
                                {updated} güncellendi
                            </span>
                        )}
                        {level && (
                            <span className="text-[11px] font-semibold text-[#3e4947] bg-[#eaedff] rounded-full px-2.5 py-1">
                                {level}
                            </span>
                        )}
                    </div>

                    {(duration || lessons > 0) && (
                        <p className="text-[12px] text-[#6e7977] mt-3">
                            {[duration ? `Toplam ${duration}` : null, lessons > 0 ? `${lessons} ders` : null]
                                .filter(Boolean).join(' • ')}
                        </p>
                    )}

                    {isLoading ? (
                        <div className="space-y-2 mt-4 animate-pulse">
                            <div className="h-2.5 bg-[#eaedff] rounded w-full" />
                            <div className="h-2.5 bg-[#eaedff] rounded w-4/5" />
                            <div className="h-2.5 bg-[#eaedff] rounded w-2/3" />
                        </div>
                    ) : (
                        <>
                            {summary && (
                                <p className="text-[13px] leading-[19px] text-[#3e4947] mt-3 line-clamp-3">
                                    {summary}
                                </p>
                            )}

                            {goals.length > 0 && (
                                <ul className="mt-4 space-y-2">
                                    {goals.slice(0, 4).map((g, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[12.5px] leading-[17px] text-[#131b2e]">
                                            <Check className="w-3.5 h-3.5 text-[#005c55] shrink-0 mt-0.5" strokeWidth={3} />
                                            <span className="line-clamp-2">{g}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}

                    <div className="flex items-center gap-2 mt-5">
                        <button
                            type="button"
                            onClick={onAddToCart}
                            disabled={inCart || adding}
                            className={cn(
                                'flex-1 h-11 rounded-lg text-[14px] font-bold transition-colors',
                                inCart
                                    ? 'bg-[#eaedff] text-[#6e7977] cursor-default'
                                    : 'bg-[#005c55] hover:bg-[#0f766e] text-white'
                            )}
                        >
                            {adding ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : inCart ? 'Sepette' : 'Sepete ekle'}
                        </button>
                        <button
                            type="button"
                            onClick={onToggleFav}
                            aria-label={favorited ? 'İstek listesinden çıkar' : 'İstek listesine ekle'}
                            className={cn(
                                'w-11 h-11 shrink-0 rounded-lg flex items-center justify-center transition-colors',
                                favorited ? 'bg-rose-50 text-rose-500' : 'bg-[#eaedff] text-[#3e4947] hover:text-rose-500'
                            )}
                        >
                            <Heart className={cn('w-[18px] h-[18px]', favorited && 'fill-rose-500')} />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CourseHoverPanel;
