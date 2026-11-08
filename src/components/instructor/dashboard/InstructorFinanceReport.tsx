import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import RevenueChart, { type ChartPayload } from './RevenueChart';
import { btn, Empty, Initials, Loading, PageHead, Panel, PanelHead, SearchBox } from '../shell/kit';

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
    /** Takvim yılı bazlı grafik verisi (Ocak solda) — RevenueChart kullanır */
    chart: ChartPayload;
    byCourse: CourseRow[];
    sales: SaleRow[];
}

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
        const q = query.trim().toLocaleLowerCase('tr-TR');
        if (!q) return data.sales;
        return data.sales.filter(s =>
            s.course_title?.toLocaleLowerCase('tr-TR').includes(q) ||
            s.student_name?.toLocaleLowerCase('tr-TR').includes(q) ||
            s.reference?.toLocaleLowerCase('tr-TR').includes(q)
        );
    }, [data, query]);

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

    if (loading) return <Loading label="Raporun hazırlanıyor" />;

    if (!data) {
        return (
            <>
                <PageHead title="Gelir raporu" />
                <Empty title="Rapor yüklenemedi" text="Bağlantıda bir sorun oldu." action={{ label: 'Sayfayı yenile', onClick: () => window.location.reload() }} />
            </>
        );
    }

    const { summary, rates } = data;
    const taxPct = Math.round(rates.taxRate * 100);
    const instrPct = Math.round(rates.instructorRate * 100);

    return (
        <>
            <PageHead
                title="Gelir raporu"
                sub={`Brüt satıştan %${taxPct} vergi düşülür, kalanın %${instrPct}'i senin.`}
                actions={data.sales.length > 0 && (
                    <button type="button" onClick={exportCsv} className={cn(btn.outline, btn.md)}>
                        <Download className="w-4 h-4" /> Excel için indir (CSV)
                    </button>
                )}
            />

            {/* Paranın yolu: brüt → vergi → senin payın → ödenecek */}
            <section className="rounded-2xl bg-[#00201d] text-white overflow-hidden mb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4">
                    <Flow label="Toplam satış" value={formatPrice(summary.gross)} note={`${summary.count.toLocaleString('tr-TR')} satış`} />
                    <Flow label={`Vergi (%${taxPct})`} value={`−${formatPrice(summary.tax)}`} note="Brütten düşülen" dim />
                    <Flow label="Net kazancın" value={formatPrice(summary.instructor)} note={`Vergi sonrası payın %${instrPct}`} strong />
                    <Flow
                        label="Ödenecek bakiye"
                        value={formatPrice(summary.balance)}
                        note={`${formatPrice(summary.paidOut)} ödendi`}
                        action={<Link to="/instructor/finance/payout" className="text-[12.5px] font-bold text-[#9cf2e8] underline underline-offset-4 decoration-[#9cf2e8]/40 hover:decoration-[#9cf2e8]">Ödeme bilgilerin</Link>}
                    />
                </div>
            </section>

            <Panel as="section" className="mb-6">
                <PanelHead title="Net kazancın" sub="Vergi ve platform payı düştükten sonra sana kalan, aylara göre" />
                <div className="p-5 sm:p-6">
                    <RevenueChart chart={data.chart} variant="bars" height={280} />
                </div>
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <Panel as="section">
                    <PanelHead title="Kurslara göre" />
                    {data.byCourse.length === 0 ? (
                        <p className="text-[14px] text-[#4a6360] px-6 py-10 text-center">Henüz satış yok.</p>
                    ) : (
                        <ul className="divide-y divide-[#eef5f3]">
                            {data.byCourse.slice(0, 8).map(c => (
                                <li key={c.course_id} className="flex items-center gap-3 px-5 py-3">
                                    <img
                                        src={c.image}
                                        alt=""
                                        loading="lazy"
                                        onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                                        className="w-14 h-9 rounded-lg object-cover bg-[#e3f6f2] shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13.5px] font-bold text-[#00201d] truncate">{c.title}</p>
                                        <p className="text-[12.5px] text-[#5f7774]">{c.sales} satış</p>
                                    </div>
                                    <span className="text-[14px] font-bold tabular-nums text-[#005c55] whitespace-nowrap">{formatPrice(c.instructor)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel as="section" className="lg:col-span-2 overflow-hidden">
                    <PanelHead
                        title="Satışlar"
                        actions={data.sales.length > 0 && (
                            <SearchBox value={query} onChange={setQuery} placeholder="Kurs veya öğrenci" className="w-48 sm:w-60" />
                        )}
                    />
                    {filteredSales.length === 0 ? (
                        <p className="text-[14px] text-[#4a6360] px-6 py-12 text-center">
                            {data.sales.length === 0 ? 'Henüz satış yok. İlk satışın burada görünecek.' : 'Bu aramayla eşleşen satış yok.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="text-left text-[12.5px] text-[#4a6360] border-b border-[#e8f2f0]">
                                        <th scope="col" className="font-bold px-5 sm:px-6 py-3">Tarih</th>
                                        <th scope="col" className="font-bold px-3 py-3">Kurs</th>
                                        <th scope="col" className="font-bold px-3 py-3">Öğrenci</th>
                                        <th scope="col" className="font-bold px-3 py-3 text-right">Brüt</th>
                                        <th scope="col" className="font-bold px-5 sm:px-6 py-3 text-right">Kazancın</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eef5f3] text-[13.5px]">
                                    {filteredSales.slice(0, 100).map(s => (
                                        <tr key={s.id} className="hover:bg-[#f4fcfa]">
                                            <td className="px-5 sm:px-6 py-3 text-[#4a6360] whitespace-nowrap tabular-nums">
                                                {new Date(s.date).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-3 py-3 max-w-[220px]">
                                                <span className="block truncate font-semibold text-[#00201d]">{s.course_title}</span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="flex items-center gap-2">
                                                    <Initials name={s.student_name} src={s.student_image} size={26} />
                                                    <span className="text-[#1d3a37] truncate max-w-[140px]">{s.student_name}</span>
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right text-[#4a6360] whitespace-nowrap tabular-nums">{formatPrice(s.gross)}</td>
                                            <td className="px-5 sm:px-6 py-3 text-right font-bold text-[#005c55] whitespace-nowrap tabular-nums">
                                                {formatPrice(s.instructor)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredSales.length > 100 && (
                                <p className="text-[12.5px] text-[#5f7774] text-center py-3 border-t border-[#eef5f3]">
                                    Son 100 satış gösteriliyor. Tamamı indirilen dosyada.
                                </p>
                            )}
                        </div>
                    )}
                </Panel>
            </div>
        </>
    );
};

const Flow: React.FC<{
    label: string; value: string; note: string; dim?: boolean; strong?: boolean; action?: React.ReactNode;
}> = ({ label, value, note, dim, strong, action }) => (
    <div className="px-5 sm:px-6 py-5 border-white/[0.08] [&:not(:last-child)]:border-r max-lg:[&:nth-child(2)]:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b">
        <p className="text-[12.5px] text-[#a9cfc9]">{label}</p>
        <p className={cn(
            'mt-1.5 text-[24px] sm:text-[26px] leading-none font-extrabold tracking-[-0.02em] tabular-nums',
            strong ? 'text-[#9cf2e8]' : dim ? 'text-[#a9cfc9]' : 'text-white'
        )}>
            {value}
        </p>
        <p className="mt-2 text-[12.5px] text-[#a9cfc9]">{note}</p>
        {action && <div className="mt-2">{action}</div>}
    </div>
);

export default InstructorFinanceReport;
