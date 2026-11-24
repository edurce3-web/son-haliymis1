import React from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { API_BASE_URL, getCourseImageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

/*
 * "Bu alanın listeleri" panosu.
 *
 * Kategori ya da arama sonucunun dört farklı sıralamasını yan yana, numaralı
 * küçük satırlarla gösteriyor: en çok satanlar, en yüksek puanlılar, yeni
 * çıkanlar, uygun fiyatlılar. Ziyaretçi tek bakışta alanın vitrinini görüyor;
 * her sütunun "tümü" bağlantısı listeyi o sıralamayla açıyor.
 *
 * Veriler katalog ucundan geliyor (her sütun için sort + limit=5).
 */

const BOARDS = [
    { sort: 'popular', title: 'En çok satanlar', tone: 'bg-[#0A2A1A] text-white', num: 'text-[#B2F0C8]' },
    { sort: 'rating', title: 'En yüksek puanlılar', tone: 'bg-[#B2F0C8] text-[#0A2A1A]', num: 'text-[#1B7A43]' },
    { sort: 'newest', title: 'Yeni çıkanlar', tone: 'bg-[#F5F6F8] text-[#111827]', num: 'text-[#9CA3AF]' },
    { sort: 'price_asc', title: 'Uygun fiyatlılar', tone: 'bg-[#F5F6F8] text-[#111827]', num: 'text-[#9CA3AF]' },
];

const lira = (n: number) =>
    n > 0 ? `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Ücretsiz';

export const CatalogBoard: React.FC<{
    base: Record<string, string>;
    onSort: (sort: string) => void;
}> = ({ base, onSort }) => {
    const key = JSON.stringify(base);
    const results = useQueries({
        queries: BOARDS.map(b => ({
            queryKey: ['catalog-board', key, b.sort],
            staleTime: 5 * 60 * 1000,
            queryFn: async () => {
                const p = new URLSearchParams({ ...base, sort: b.sort, limit: '5' });
                const r = await fetch(`${API_BASE_URL}/catalog?${p.toString()}`);
                if (!r.ok) return [];
                const d = await r.json();
                return ((d.courses || []) as any[]).slice(0, 5);
            },
        })),
    });

    if (results.every(r => !r.isLoading && (r.data || []).length === 0)) return null;

    return (
        <section aria-label="Bu alanın listeleri" className="-mx-4 sm:mx-0">
            <div className="flex lg:grid lg:grid-cols-4 gap-2 overflow-x-auto snap-x px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {BOARDS.map((b, i) => {
                    const list = results[i].data || [];
                    return (
                        <div key={b.sort} className={cn('snap-start shrink-0 w-[82vw] sm:w-[340px] lg:w-auto flex flex-col', b.tone)}>
                            <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
                                <h3 className="text-[14px] font-extrabold tracking-[-0.01em]">{b.title}</h3>
                                <button
                                    type="button"
                                    onClick={() => onSort(b.sort)}
                                    className="text-[12px] font-bold opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    Tümü
                                </button>
                            </div>
                            <ol className="px-2 pb-2 flex-1">
                                {results[i].isLoading
                                    ? Array.from({ length: 4 }).map((_, k) => (
                                        <li key={k} className="h-[54px] mx-2 my-1 bg-black/5 animate-pulse" />
                                    ))
                                    : list.map((c, k) => {
                                        const id = Number(c.course_id ?? c.id);
                                        const rating = Number(c.rating) || 0;
                                        return (
                                            <li key={id}>
                                                <Link
                                                    to={`/course/${c.slug || id}`}
                                                    className="group flex items-center gap-2.5 px-2 py-1.5 hover:bg-black/5 transition-colors"
                                                >
                                                    <span className={cn('w-5 shrink-0 text-[20px] font-extrabold tabular-nums leading-none text-center', b.num)}>{k + 1}</span>
                                                    <span className="w-[68px] shrink-0 aspect-video overflow-hidden bg-black/10">
                                                        <img
                                                            src={getCourseImageUrl(id, c.image || c.thumbnail || c.image_path)}
                                                            alt=""
                                                            loading="lazy"
                                                            onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-[12.5px] leading-[16px] font-bold line-clamp-2 group-hover:underline underline-offset-2">{c.title}</span>
                                                        <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] opacity-80 tabular-nums">
                                                            <span className="font-extrabold">{lira(Number(c.price) || 0)}</span>
                                                            {rating > 0 && (
                                                                <span className="inline-flex items-center gap-0.5">
                                                                    <Star className="w-3 h-3 fill-[#F5A524] text-[#F5A524]" />
                                                                    {rating.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                            </ol>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default CatalogBoard;
