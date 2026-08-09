import React, { useMemo, useState } from 'react';
import {
    BarChart, ComposedChart, Bar, Line, Cell, LabelList,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** pay.js'in ürettiği kova. */
export interface Bucket {
    label: string;        // "Oca" veya "2025"
    fullLabel: string;    // "Ocak" veya "2025"
    gross: number;
    tax: number;
    instructor: number;
    count: number;
    year: number;
    month?: string;
}

export interface ChartPayload {
    years: number[];
    defaultYear: number;
    monthsByYear: Record<string, Bucket[]>;
    yearly: Bucket[];
}

interface Props {
    chart?: ChartPayload | null;
    /** 'composed' = brüt çubuk + net çizgi, 'bars' = net çubuk + üstünde tutar */
    variant?: 'composed' | 'bars';
    height?: number;
    className?: string;
}

export const money = (v: number) =>
    `₺${Number(v || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Y ekseni ve etiket: 12500 -> ₺12,5B */
export const compactMoney = (v: number) => {
    const n = Number(v) || 0;
    if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (n >= 1000) return `₺${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace('.', ',')}B`;
    return `₺${Math.round(n)}`;
};

const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as Bucket;
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-[13px] min-w-[190px]">
            <p className="font-semibold text-slate-900 mb-2">{d.fullLabel}</p>
            <div className="flex justify-between gap-6">
                <span className="text-slate-500">Brüt satış</span>
                <span className="text-slate-800 font-medium">{money(d.gross)}</span>
            </div>
            <div className="flex justify-between gap-6">
                <span className="text-slate-500">Vergi (%20)</span>
                <span className="text-slate-800">−{money(d.tax)}</span>
            </div>
            <div className="flex justify-between gap-6 mt-1.5 pt-1.5 border-t border-slate-100">
                <span className="text-slate-600 font-medium">Net kazancın</span>
                <span className="text-emerald-600 font-semibold">{money(d.instructor)}</span>
            </div>
            <p className="text-slate-400 text-xs mt-1.5">{d.count} satış</p>
        </div>
    );
};

/**
 * Gelir grafiği — aylık ve yıllık görünüm arasında geçiş yapılabilir.
 *
 * Aylık görünümde eksen her zaman Ocak'tan Aralık'a gider; hangi yıla bakıldığı
 * üstteki seçiciyle belirlenir. Bu yüzden etiketlerde yıl yazmıyor ("Eyl 25"
 * yerine "Eyl") — yıl zaten başlıkta.
 */
export const RevenueChart: React.FC<Props> = ({
    chart,
    variant = 'bars',
    height = 300,
    className,
}) => {
    const years = chart?.years?.length ? chart.years : [new Date().getFullYear()];
    const [mode, setMode] = useState<'month' | 'year'>('month');
    const [year, setYear] = useState<number>(() => {
        const preferred = chart?.defaultYear ?? years[years.length - 1];
        return years.includes(preferred) ? preferred : years[years.length - 1];
    });

    const data: Bucket[] = useMemo(() => {
        if (!chart) return [];
        if (mode === 'year') return chart.yearly || [];
        return chart.monthsByYear?.[String(year)] || [];
    }, [chart, mode, year]);

    const totals = useMemo(() => data.reduce(
        (acc, d) => ({
            gross: acc.gross + (d.gross || 0),
            net: acc.net + (d.instructor || 0),
            count: acc.count + (d.count || 0),
        }),
        { gross: 0, net: 0, count: 0 }
    ), [data]);

    const hasData = totals.gross > 0;

    // Yıllık görünümde tek yıl varsa geçmiş yıl kıyaslaması anlamsız kalır,
    // yine de tutarlı olsun diye aynı bileşeni kullanıyoruz.
    const yearIndex = years.indexOf(year);
    const canPrev = mode === 'month' && yearIndex > 0;
    const canNext = mode === 'month' && yearIndex > -1 && yearIndex < years.length - 1;

    // İçinde bulunulan ay / yıl vurgulansın
    const now = new Date();
    const highlightIndex = mode === 'month'
        ? (year === now.getFullYear() ? now.getMonth() : -1)
        : data.findIndex(d => d.year === now.getFullYear());

    return (
        <div className={className}>
            {/* Görünüm kontrolleri */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
                    {([['month', 'Aylık'], ['year', 'Yıllık']] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setMode(key)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                mode === key
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {mode === 'month' && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => canPrev && setYear(years[yearIndex - 1])}
                            disabled={!canPrev}
                            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Önceki yıl"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums w-12 text-center">
                            {year}
                        </span>
                        <button
                            onClick={() => canNext && setYear(years[yearIndex + 1])}
                            disabled={!canNext}
                            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Sonraki yıl"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Seçili aralığın özeti */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 mb-4">
                {[
                    { label: 'Brüt satış', value: money(totals.gross), tone: 'text-slate-900' },
                    { label: 'Net kazanç', value: money(totals.net), tone: 'text-emerald-600' },
                    { label: 'Satış', value: String(totals.count), tone: 'text-slate-900' },
                ].map(s => (
                    <div key={s.label}>
                        <p className="text-[11px] text-slate-400">{s.label}</p>
                        <p className={cn('text-sm font-semibold', s.tone)}>{s.value}</p>
                    </div>
                ))}
            </div>

            {!hasData ? (
                <div style={{ height }} className="flex flex-col items-center justify-center text-center">
                    <BarChart3 className="w-9 h-9 text-slate-200 mb-3" />
                    <p className="text-sm font-medium text-slate-600">
                        {mode === 'month' ? `${year} yılında satış yok` : 'Henüz satış yok'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        {years.length > 1 && mode === 'month'
                            ? 'Diğer yıllara bakmak için oklarla gezinebilirsin.'
                            : 'İlk satışından sonra kazancın burada grafiğe dönüşecek.'}
                    </p>
                </div>
            ) : (
                <div style={{ height }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {variant === 'composed' ? (
                            <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
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
                                <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    height={30}
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 12, color: '#64748b' }}
                                />
                                {/* Çubuk brüt satış, çizgi net kazanç: aradaki fark vergi + platform payı */}
                                <Bar dataKey="gross" name="Brüt satış" radius={[4, 4, 0, 0]} maxBarSize={38}>
                                    {data.map((_, i) => (
                                        <Cell key={i} fill={i === highlightIndex ? '#c7d2fe' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                                <Line
                                    type="monotone"
                                    dataKey="instructor"
                                    name="Net kazancın"
                                    stroke="#059669"
                                    strokeWidth={2.5}
                                    dot={{ r: 3, fill: '#059669', strokeWidth: 0 }}
                                    activeDot={{ r: 5 }}
                                />
                            </ComposedChart>
                        ) : (
                            <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
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
                                <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
                                <Bar dataKey="instructor" radius={[6, 6, 0, 0]} maxBarSize={46}>
                                    {/* Tutar çubuğun üstünde sabit dursun — üzerine gelmeden de okunsun */}
                                    <LabelList
                                        dataKey="instructor"
                                        position="top"
                                        formatter={(v: number) => (v > 0 ? compactMoney(v) : '')}
                                        style={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                                    />
                                    {data.map((_, i) => (
                                        <Cell key={i} fill={i === highlightIndex ? '#4f46e5' : '#a5b4fc'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default RevenueChart;
