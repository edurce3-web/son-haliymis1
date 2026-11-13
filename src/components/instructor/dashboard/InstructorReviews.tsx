import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { Empty, Initials, Loading, PageHead, Panel, SearchBox, Segments } from '../shell/kit';
import { relativeTime } from '../shell/useInstructorWorkspace';

const Stars: React.FC<{ value: number; size?: string }> = ({ value, size = 'w-3.5 h-3.5' }) => (
    <span className="inline-flex gap-0.5" aria-label={`5 üzerinden ${value}`}>
        {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} aria-hidden className={cn(size, i < value ? 'text-[#fea619] fill-[#fea619]' : 'text-[#dadfdd] fill-[#dadfdd]')} />
        ))}
    </span>
);

type StarFilter = 'all' | '5' | '4' | '3' | '2' | '1';

export function InstructorReviews() {
    const [search, setSearch] = useState('');
    const [star, setStar] = useState<StarFilter>('all');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['instructor-reviews'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const r = await fetch(`${API_BASE_URL}/instructor/reviews`, { headers: { Authorization: `Bearer ${token}` } });
            if (!r.ok) throw new Error('Değerlendirmeler yüklenemedi');
            return r.json();
        },
    });

    const allReviews: any[] = data?.reviews || [];
    const stats = data?.stats || {};
    const total = Number(stats.total_reviews) || 0;
    const avg = Number(stats.avg_rating) || 0;
    const countOf = (s: number) => Number(stats[`star${s}`]) || 0;

    const q = search.trim().toLocaleLowerCase('tr-TR');
    const has = (s?: string) => !!s && s.toLocaleLowerCase('tr-TR').includes(q);
    const reviews = allReviews.filter(r => {
        if (star !== 'all' && Number(r.rating) !== Number(star)) return false;
        return !q || has(`${r.first_name} ${r.last_name}`) || has(r.comment) || has(r.course_title);
    });

    if (isLoading) return <Loading label="Yorumlar yükleniyor" />;

    return (
        <>
            <PageHead title="Yorumlar" sub="Öğrencilerinin kurslarına verdiği puanlar ve yazdıkları" />

            {isError ? (
                <Empty title="Yorumlar yüklenemedi" text="Bağlantıda bir sorun oldu." action={{ label: 'Tekrar dene', onClick: () => refetch() }} />
            ) : total === 0 ? (
                <Empty title="Henüz yorum yok" text="Öğrencilerin kursunu puanladığında yorumlar burada toplanacak." />
            ) : (
                <>
                    {/* Puan özeti: koyu mürekkep üstünde nane, panelin imzası */}
                    <section className="rounded-2xl bg-[#00201d] text-white px-6 sm:px-8 py-6 grid sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-center mb-6">
                        <div>
                            <p className="text-[56px] leading-none font-extrabold tracking-[-0.03em] text-[#9cf2e8] tabular-nums">
                                {avg.toFixed(1).replace('.', ',')}
                            </p>
                            <div className="mt-2.5"><Stars value={Math.round(avg)} size="w-4 h-4" /></div>
                            <p className="mt-1.5 text-[13px] text-[#a9cfc9]">{total.toLocaleString('tr-TR')} değerlendirme</p>
                        </div>
                        <ul className="space-y-1.5">
                            {[5, 4, 3, 2, 1].map(s => {
                                const n = countOf(s);
                                const pct = total ? Math.round((n / total) * 100) : 0;
                                return (
                                    <li key={s}>
                                        <button
                                            type="button"
                                            onClick={() => setStar(star === String(s) ? 'all' : (String(s) as StarFilter))}
                                            className={cn(
                                                'w-full grid grid-cols-[52px_1fr_44px] items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors',
                                                star === String(s) ? 'bg-white/10' : 'hover:bg-white/[0.06]'
                                            )}
                                        >
                                            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#cfe7e3]">
                                                {s} <Star className="w-3.5 h-3.5 fill-[#fea619] text-[#fea619]" />
                                            </span>
                                            <span className="h-2 rounded-full bg-white/10 overflow-hidden">
                                                <span className="block h-full rounded-full bg-[#9cf2e8]" style={{ width: `${pct}%` }} />
                                            </span>
                                            <span className="text-[12.5px] text-[#a9cfc9] tabular-nums text-right">%{pct}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
                        <Segments
                            value={star}
                            onChange={v => setStar(v as StarFilter)}
                            items={[
                                { value: 'all', label: 'Tümü', count: total },
                                ...[5, 4, 3, 2, 1].map(s => ({ value: String(s) as StarFilter, label: `${s} yıldız`, count: countOf(s) })),
                            ]}
                        />
                        <SearchBox value={search} onChange={setSearch} placeholder="Yorum, kurs veya öğrenci ara" className="lg:ml-auto lg:w-72" />
                    </div>

                    {reviews.length === 0 ? (
                        <Empty title="Bu filtreye uyan yorum yok" text="Başka bir puan seç ya da aramayı temizle." />
                    ) : (
                        <Panel as="section" className="divide-y divide-[#eceeed]">
                            {reviews.map(r => {
                                const name = `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Öğrenci';
                                return (
                                    <article key={r.review_id} className="flex items-start gap-3.5 px-5 sm:px-6 py-5">
                                        <Initials name={name} src={r.profile_image || r.profile_image_path} size={40} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="text-[14px] font-bold text-[#00201d]">{name}</span>
                                                <Stars value={Number(r.rating) || 0} />
                                                <span className="text-[12.5px] text-[#5f7774]" title={new Date(r.created_at).toLocaleDateString('tr-TR')}>
                                                    {relativeTime(r.created_at)}
                                                </span>
                                            </div>
                                            {r.course_title && <p className="text-[12.5px] text-[#005c55] font-semibold mt-0.5">{r.course_title}</p>}
                                            {r.comment
                                                ? <p className="text-[14.5px] text-[#1d3a37] leading-relaxed mt-2 whitespace-pre-wrap">{r.comment}</p>
                                                : <p className="text-[13.5px] text-[#5f7774] mt-2">Yalnızca puan verdi, yorum yazmadı.</p>}
                                        </div>
                                    </article>
                                );
                            })}
                        </Panel>
                    )}
                </>
            )}
        </>
    );
}
