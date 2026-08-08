import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Download, Loader2, ShoppingBag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface Purchase {
    id: number;
    course_id: number;
    title: string;
    image: string;
    instructor: string;
    date: string;
    amount: number;
    reference: string | null;
}

const PurchaseHistorySettings: React.FC = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/account/purchases`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Geçmiş alınamadı');
                const data = await res.json();
                setPurchases(data.purchases || []);
            } catch (e: any) {
                toast.error('Satın alma geçmişi yüklenemedi', { description: e.message });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return purchases;
        return purchases.filter(p =>
            p.title?.toLowerCase().includes(q) || p.instructor?.toLowerCase().includes(q)
        );
    }, [purchases, query]);

    const total = purchases.reduce((sum, p) => sum + p.amount, 0);

    const exportCsv = () => {
        const header = ['Tarih', 'Kurs', 'Eğitmen', 'Tutar', 'Referans'];
        const rows = purchases.map(p => [
            new Date(p.date).toLocaleDateString('tr-TR'),
            `"${(p.title || '').replace(/"/g, '""')}"`,
            `"${(p.instructor || '').replace(/"/g, '""')}"`,
            p.amount,
            p.reference || '',
        ]);
        const csv = [header, ...rows].map(r => r.join(';')).join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `satin-alma-gecmisi-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-6 h-6 text-slate-400" />
                        Satın Alma Geçmişi
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        {purchases.length > 0
                            ? `${purchases.length} kurs · toplam ${formatPrice(total)}`
                            : 'Satın aldığın kurslar burada listelenir.'}
                    </p>
                </div>
                {purchases.length > 0 && (
                    <Button variant="outline" onClick={exportCsv} className="h-10 rounded-xl gap-2">
                        <Download className="w-4 h-4" /> CSV indir
                    </Button>
                )}
            </div>

            {purchases.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Henüz bir satın alma yapmadın.</p>
                    <Link to="/courses">
                        <Button className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                            Kursları keşfet
                        </Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="relative max-w-xs">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Kurs veya eğitmen ara"
                            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                        {filtered.map(p => (
                            <div key={p.id} className="flex items-center gap-4 p-4">
                                <Link to={`/course/${p.course_id}`} className="shrink-0">
                                    <img
                                        src={p.image}
                                        alt={p.title}
                                        loading="lazy"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                                        className="w-24 h-16 rounded-lg object-cover bg-slate-100"
                                    />
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <Link
                                        to={`/course/${p.course_id}`}
                                        className="font-medium text-slate-900 hover:text-indigo-600 line-clamp-1"
                                    >
                                        {p.title}
                                    </Link>
                                    <p className="text-xs text-slate-500 mt-0.5">{p.instructor}</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {new Date(p.date).toLocaleDateString('tr-TR', {
                                            day: 'numeric', month: 'long', year: 'numeric',
                                        })}
                                        {p.reference ? ` · ${p.reference}` : ''}
                                    </p>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="font-semibold text-slate-900 whitespace-nowrap">{formatPrice(p.amount)}</p>
                                    <Link
                                        to={`/learning`}
                                        className="text-xs text-indigo-600 hover:underline"
                                    >
                                        Kursa git
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {filtered.length === 0 && (
                            <p className="py-10 text-center text-sm text-slate-400">Eşleşen kayıt yok.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default PurchaseHistorySettings;
