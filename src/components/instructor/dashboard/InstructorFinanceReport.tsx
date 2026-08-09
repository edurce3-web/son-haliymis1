import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Loader2,
    TrendingUp,
    Receipt,
    Wallet,
    ShoppingBag,
    Download,
    Search,
    BarChart3,
} from 'lucide-react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer,
} from 'recharts';

/** Y ekseni ve çubuk etiketi: 12500 -> ₺12,5B */
const compactMoney = (v: number) => {
    const n = Number(v) || 0;
    if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (n >= 1000) return `₺${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace('.', ',')}B`;
    return `₺${Math.round(n)}`;
};

interface MonthBucket {
    month: string;
    label: string;
    gross: number;
    tax: number;
    netAfterTax: number;
    instructor: number;
    platform: number;
    count: number;
}

interface SaleRow {
    id: number;
    date: string;
    course_id: number;
    course_title: string;
    student_name: string;
    student_image: string | null;
    reference: string | null;
    gross: number;
    tax: number;
    instructor: number;
    platform: number;
}

interface CourseRow {
    course_id: number;
    title: string;
    image: string;
    sales: number;
    gross: number;
    instructor: number;
}

interface ReportData {
    rates: { taxRate: number; instructorRate: number; platformRate: number };
    summary: {
        gross: number; tax: number; netAfterTax: number; instructor: number;
        platform: number; count: number; paidOut: number; balance: number;
        currentMonth: MonthBucket | null;
    };
    monthly: MonthBucket[];
    byCourse: CourseRow[];
    sales: SaleRow[];
}

/** Baş harfler — fotoğrafı olmayan öğrenciler için */
const initials = (name: string) =>
    (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';

const InstructorFinanceReport: React.FC = () => {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/instructor/finance/report`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Rapor alınamadı');
                setData(await res.json());
            } catch (e: any) {
                toast.error('Rapor yüklenemedi', { description: e.message });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredSales = useMemo(() => {
        if (!data) return [];
        const q = query.trim().toLowerCase();
        if (!q) return data.sales;
        return data.sales.filter(s =>
            s.course_title?.toLowerCase().includes(q) ||
            s.student_name?.toLowerCase().includes(q) ||
            s.reference?.toLowerCase().includes(q)
        );
    }, [data, query]);

    // Grafik verisi. Backend veri olmayan ayları da 0 olarak döndürüyor, bu yüzden
    // 12 sütun her zaman çizilir; boş aylar da eksende görünür.
    const chartData = useMemo(() => data?.monthly ?? [], [data]);

    // Hiç kazanç yoksa grafik yerine açıklayıcı boş durum gösteriyoruz
    const maxMonthly = useMemo(
        () => (chartData.length ? Math.max(...chartData.map(m => m.instructor), 0) : 0),
        [chartData]
    );

    const exportCsv = () => {
        if (!data) return;
        const header = ['Tarih', 'Kurs', 'Öğrenci', 'Brüt', 'Vergi', 'Net Kazanç', 'Referans'];
        const rows = data.sales.map(s => [
            new Date(s.date).toLocaleDateString('tr-TR'),
            `"${(s.course_title || '').replace(/"/g, '""')}"`,
            `"${(s.student_name || '').replace(/"/g, '""')}"`,
            s.gross, s.tax, s.instructor, s.reference || '',
        ]);
        const csv = [header, ...rows].map(r => r.join(';')).join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `satis-raporu-${new Date().toISOString().slice(0, 10)}.csv`;
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

    if (!data) {
        return <div className="py-32 text-center text-slate-400">Rapor verisi alınamadı.</div>;
    }

    const { summary, rates } = data;
    const taxPct = Math.round(rates.taxRate * 100);
    const instrPct = Math.round(rates.instructorRate * 100);

    const cards = [
        { label: 'Toplam satış', value: formatPrice(summary.gross), sub: `${summary.count} işlem`, icon: ShoppingBag, tone: 'text-slate-900' },
        { label: `Vergi (%${taxPct})`, value: formatPrice(summary.tax), sub: 'brütten kesilen', icon: Receipt, tone: 'text-slate-500' },
        { label: 'Net kazancın', value: formatPrice(summary.instructor), sub: `vergi sonrası %${instrPct}`, icon: TrendingUp, tone: 'text-emerald-600' },
        { label: 'Ödenecek bakiye', value: formatPrice(summary.balance), sub: `${formatPrice(summary.paidOut)} ödendi`, icon: Wallet, tone: 'text-indigo-600' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Satış / Gelir Raporu</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Brüt satıştan %{taxPct} vergi düşülür, kalanın %{instrPct}'i sana aittir.
                    </p>
                </div>
                {data.sales.length > 0 && (
                    <Button variant="outline" onClick={exportCsv} className="h-10 rounded-xl gap-2">
                        <Download className="w-4 h-4" /> CSV indir
                    </Button>
                )}
            </div>

            {/* Özet kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {cards.map(card => (
                    <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-slate-500">{card.label}</span>
                            <card.icon className="w-4 h-4 text-slate-300" />
                        </div>
                        <p className={`text-2xl font-bold ${card.tone}`}>{card.value}</p>
                        <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Aylık kazanç — x ekseninde ay adı, çubuk yüksekliği o ayın net kazancı */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-baseline justify-between mb-1">
                    <h2 className="text-sm font-semibold text-slate-900">Aylık net kazanç</h2>
                    <span className="text-xs text-slate-400">son 12 ay</span>
                </div>
                <p className="text-xs text-slate-400 mb-5">
                    Vergi ve platform payı düşüldükten sonra sana kalan tutar.
                </p>

                {maxMonthly === 0 ? (
                    <div className="py-14 text-center">
                        <BarChart3 className="w-9 h-9 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-600">Henüz satış yok</p>
                        <p className="text-xs text-slate-400 mt-1">
                            İlk satışından sonra aylık kazancın burada görünecek.
                        </p>
                    </div>
                ) : (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    interval={0}
                                    dy={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    tickFormatter={compactMoney}
                                    width={58}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload, label }: any) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-[13px] min-w-[180px]">
                                                <p className="font-semibold text-slate-900 mb-2">{label}</p>
                                                <div className="flex justify-between gap-6">
                                                    <span className="text-slate-500">Brüt satış</span>
                                                    <span className="text-slate-800">{formatPrice(d.gross)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6">
                                                    <span className="text-slate-500">Vergi</span>
                                                    <span className="text-slate-800">−{formatPrice(d.tax)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 mt-1.5 pt-1.5 border-t border-slate-100">
                                                    <span className="text-slate-600 font-medium">Net kazancın</span>
                                                    <span className="text-emerald-600 font-semibold">{formatPrice(d.instructor)}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1.5">{d.count} satış</p>
                                            </div>
                                        );
                                    }}
                                />
                                {/* Tutar çubuğun üstünde sabit dursun — üzerine gelmeden de okunsun */}
                                <Bar dataKey="instructor" radius={[6, 6, 0, 0]} maxBarSize={46}>
                                    <LabelList
                                        dataKey="instructor"
                                        position="top"
                                        formatter={(v: number) => (v > 0 ? compactMoney(v) : '')}
                                        style={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                                    />
                                    {chartData.map((m, i) => (
                                        <Cell key={m.month} fill={i === chartData.length - 1 ? '#4f46e5' : '#a5b4fc'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kurs bazlı */}
                <section className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-slate-900 mb-4">Kurs bazlı</h2>
                    {data.byCourse.length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">Veri yok</p>
                    ) : (
                        <div className="space-y-3">
                            {data.byCourse.slice(0, 8).map(c => (
                                <div key={c.course_id} className="flex items-center gap-3">
                                    <img
                                        src={c.image}
                                        alt={c.title}
                                        loading="lazy"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                                        className="w-12 h-8 rounded-md object-cover bg-slate-100 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                                        <p className="text-xs text-slate-400">{c.sales} satış</p>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                                        {formatPrice(c.instructor)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Satış listesi */}
                <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="p-6 pb-4 flex items-center justify-between gap-4">
                        <h2 className="text-sm font-semibold text-slate-900">Satışlar</h2>
                        <div className="relative max-w-[220px] w-full">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Kurs veya öğrenci"
                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    {filteredSales.length === 0 ? (
                        <p className="text-sm text-slate-400 py-12 text-center">
                            {data.sales.length === 0 ? 'Henüz satış yok.' : 'Eşleşen kayıt yok.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-slate-400 border-y border-slate-100">
                                        <th className="font-medium px-6 py-2">Tarih</th>
                                        <th className="font-medium px-3 py-2">Kurs</th>
                                        <th className="font-medium px-3 py-2">Öğrenci</th>
                                        <th className="font-medium px-3 py-2 text-right">Brüt</th>
                                        <th className="font-medium px-6 py-2 text-right">Kazancın</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredSales.slice(0, 100).map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/60">
                                            <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                                                {new Date(s.date).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-3 py-3 max-w-[200px]">
                                                <span className="block truncate text-slate-800">{s.course_title}</span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    {s.student_image ? (
                                                        <img
                                                            src={s.student_image}
                                                            alt={s.student_name}
                                                            loading="lazy"
                                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                            className="w-6 h-6 rounded-full object-cover bg-slate-100"
                                                        />
                                                    ) : (
                                                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold flex items-center justify-center">
                                                            {initials(s.student_name)}
                                                        </span>
                                                    )}
                                                    <span className="text-slate-600 truncate max-w-[120px]">{s.student_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right text-slate-500 whitespace-nowrap">{formatPrice(s.gross)}</td>
                                            <td className="px-6 py-3 text-right font-semibold text-emerald-600 whitespace-nowrap">
                                                {formatPrice(s.instructor)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredSales.length > 100 && (
                                <p className="text-xs text-slate-400 text-center py-3">
                                    İlk 100 kayıt gösteriliyor · tamamı için CSV indir
                                </p>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default InstructorFinanceReport;
