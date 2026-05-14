import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, BookOpen, Loader2, Search, Filter, TrendingUp, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

function StarBar({ rating, total, count }: { rating: number; total: number; count: number }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("w-3 h-3", i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                ))}
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-400 font-bold w-8 text-right">{count}</span>
        </div>
    );
}

export function InstructorReviews() {
    const [search, setSearch] = useState('');
    const [filterStar, setFilterStar] = useState<number | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['instructor-reviews'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const r = await fetch(`${API_BASE_URL}/instructor/reviews`, { headers: { Authorization: `Bearer ${token}` } });
            if (!r.ok) throw new Error('Değerlendirmeler yüklenemedi');
            return r.json();
        }
    });

    const allReviews = data?.reviews || [];
    const stats = data?.stats || {};
    const total = Number(stats.total_reviews) || 0;
    const avgRating = Number(stats.avg_rating) || 0;

    const reviews = allReviews.filter((r: any) => {
        if (filterStar && r.rating !== filterStar) return false;
        if (search) {
            const t = search.toLowerCase();
            return (r.first_name + ' ' + r.last_name).toLowerCase().includes(t) ||
                r.comment?.toLowerCase().includes(t) ||
                r.course_title?.toLowerCase().includes(t);
        }
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Öğrenci Yorumları</h1>
                <p className="text-sm text-slate-400 mt-1">Kurslarınıza yapılan tüm değerlendirmeler</p>
            </div>

            {/* Stats */}
            {!isLoading && total > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Avg Rating */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-5xl font-black text-slate-900">{avgRating.toFixed(1)}</div>
                            <div className="flex justify-center gap-0.5 mt-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={cn("w-4 h-4", i < Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{total} değerlendirme</p>
                        </div>
                        <div className="flex-1 space-y-2">
                            {[5, 4, 3, 2, 1].map(star => (
                                <StarBar key={star} rating={star} total={total} count={Number(stats[`star${star}`]) || 0} />
                            ))}
                        </div>
                    </div>
                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Toplam Yorum', value: total, icon: MessageSquare, color: 'indigo' },
                            { label: 'Ortalama Puan', value: avgRating.toFixed(1) + ' / 5', icon: Star, color: 'amber' },
                            { label: '5 Yıldız', value: `${total > 0 ? Math.round((Number(stats.star5) / total) * 100) : 0}%`, icon: TrendingUp, color: 'emerald' },
                            { label: '1-2 Yıldız', value: `${total > 0 ? Math.round(((Number(stats.star1) + Number(stats.star2)) / total) * 100) : 0}%`, icon: Filter, color: 'rose' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-2">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                                    s.color === 'indigo' ? 'bg-indigo-50' :
                                        s.color === 'amber' ? 'bg-amber-50' :
                                            s.color === 'emerald' ? 'bg-emerald-50' : 'bg-rose-50'
                                )}>
                                    <s.icon className={cn("w-4 h-4",
                                        s.color === 'indigo' ? 'text-indigo-500' :
                                            s.color === 'amber' ? 'text-amber-500' :
                                                s.color === 'emerald' ? 'text-emerald-500' : 'text-rose-500'
                                    )} />
                                </div>
                                <div>
                                    <div className="text-lg font-black text-slate-900">{s.value}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Yorum veya öğrenci ara..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-11 h-11 rounded-xl bg-white border-slate-200 text-sm font-medium" />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setFilterStar(null)} className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                        !filterStar ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-500"
                    )}>Tümü</button>
                    {[5, 4, 3, 2, 1].map(s => (
                        <button key={s} onClick={() => setFilterStar(filterStar === s ? null : s)}
                            className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1",
                                filterStar === s ? "bg-amber-500 text-white border-amber-500" : "bg-white border-slate-200 text-slate-500"
                            )}>
                            <Star className="w-3 h-3 fill-current" /> {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                        <span className="text-sm text-slate-400 font-medium">Yorumlar yükleniyor...</span>
                    </div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Star className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">
                        {search || filterStar ? 'Sonuç bulunamadı' : 'Henüz yorum yok'}
                    </h3>
                    <p className="text-sm text-slate-400">Öğrenciler kurslarınıza yorum yaptığında burada görünecek</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((r: any) => (
                        <div key={r.review_id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shrink-0">
                                    <AvatarImage src={r.profile_image_path} />
                                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl">
                                        {(r.first_name || '?')[0]}{(r.last_name || '?')[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <span className="font-bold text-slate-900 text-sm">{r.first_name} {r.last_name}</span>
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={cn("w-3.5 h-3.5", i < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                                            ))}
                                        </div>
                                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">
                                            <BookOpen className="w-3 h-3 mr-1" />{r.course_title}
                                        </Badge>
                                        <span className="text-[10px] text-slate-400 ml-auto">
                                            {new Date(r.created_at).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    {r.comment ? (
                                        <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Yorum yazılmamış</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
