import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Activity,
    BookOpen,
    DollarSign,
    Users,
    TrendingUp,
    Star,
    Plus,
    BarChart3,
    ArrowRight,
    Loader2
} from 'lucide-react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

/** ₺1.234,56 */
const money = (v: number) =>
    `₺${Number(v || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Y ekseni: 12500 -> ₺12,5B — uzun sayılar ekseni şişirmesin */
const compactMoney = (v: number) => {
    const n = Number(v) || 0;
    if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (n >= 1000) return `₺${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace('.', ',')}B`;
    return `₺${n}`;
};

export const DashboardOverview = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/instructor/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        setData(result);
                    }
                }
            } catch (error) {
                console.error("Dashboard veri çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
            </div>
        );
    }

    if (!data) {
        return <div className="text-zinc-500">Veri yüklenemedi. Yardım için lütfen destek ile iletişime geçin.</div>;
    }

    const { stats } = data;
    const revenueData = (data.revenueData || []) as Array<{
        month: string; revenue: number; gross: number; tax: number; sales: number;
    }>;

    // Yıl özeti — grafiğin üstünde tek bakışta durum
    const yearGross = revenueData.reduce((s, m) => s + (m.gross || 0), 0);
    const yearNet = revenueData.reduce((s, m) => s + (m.revenue || 0), 0);
    const yearSales = revenueData.reduce((s, m) => s + (m.sales || 0), 0);
    const bestMonth = revenueData.reduce(
        (best, m) => (m.revenue > (best?.revenue ?? -1) ? m : best),
        null as null | typeof revenueData[number]
    );
    const hasRevenue = yearGross > 0;
    const lastIndex = revenueData.length - 1;

    return (
        <div className='space-y-10 animate-in fade-in duration-500'>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Genel Bakış</h1>
                    <p className="text-zinc-500 text-sm">Platform performansınız ve öğrenci metrikleriniz.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-zinc-200 text-zinc-700 font-medium h-10 px-4 hover:bg-zinc-50 transition-colors rounded-md" onClick={() => window.location.reload()}>
                        Verileri Yenile
                    </Button>
                    <Button className="bg-zinc-900 text-white font-medium h-10 px-5 hover:bg-zinc-800 transition-colors rounded-md shadow-sm" onClick={() => navigate('/instructor/courses/create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Kurs
                    </Button>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {[
                    { title: 'Toplam Öğrenci', value: stats.totalStudents, icon: Users, desc: `Bu ay ${stats.newStudents} yeni kayıt` },
                    {
                        title: 'Aylık Kazanç',
                        value: `₺${Number(stats.monthlyRevenue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
                        icon: DollarSign,
                        // Vergi sonrası eğitmen payı; parantez içinde bu ayki satış adedi ve değişim
                        desc: [
                            `${stats.monthlySales || 0} satış`,
                            stats.monthlyChange != null ? `${stats.monthlyChange > 0 ? '+' : ''}${stats.monthlyChange}% önceki aya göre` : null,
                            `Toplam: ₺${Number(stats.totalRevenue || 0).toLocaleString('tr-TR')}`,
                        ].filter(Boolean).join(' · '),
                    },
                    { title: 'Öğrenci Puanı', value: `${stats.avgRating} / 5.0`, icon: Star, desc: `${stats.totalReviews} değerlendirme` },
                    { title: 'Aktif Kurslar', value: stats.activeCourses, icon: BookOpen, desc: `Toplam ${stats.totalCourses} kurs` }
                ].map((item, i) => (
                    <Card key={i} className='border border-zinc-200 shadow-sm rounded-xl bg-white'>
                        <CardContent className='p-6 flex flex-col justify-center h-full'>
                            <div className='flex items-center justify-between space-y-0 pb-2 mb-2'>
                                <p className='text-sm font-medium tracking-tight text-zinc-600'>{item.title}</p>
                                <div className="p-2 bg-zinc-50 rounded-md">
                                    <item.icon className='w-4 h-4 text-zinc-700' />
                                </div>
                            </div>
                            <div>
                                <h3 className='text-2xl font-bold text-zinc-900'>{item.value}</h3>
                                <p className='text-xs text-zinc-500 font-medium mt-1'>{item.desc}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className='grid lg:grid-cols-3 gap-6'>
                <Card className='lg:col-span-2 border border-zinc-200 shadow-sm rounded-xl overflow-hidden bg-white'>
                    <CardHeader className="border-b border-zinc-100 pb-4">
                        <div className='flex items-start justify-between gap-4'>
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-zinc-900 tracking-tight">Gelir Trendi</CardTitle>
                                <CardDescription className="text-zinc-500">Son 12 ayın satış ve kazanç dağılımı</CardDescription>
                            </div>
                            <div className='p-2 bg-zinc-50 rounded-md'>
                                <TrendingUp className='w-4 h-4 text-zinc-700' />
                            </div>
                        </div>

                        {/* Grafiğin okunmasını kolaylaştıran yıl özeti */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                            {[
                                { label: 'Brüt satış', value: money(yearGross), tone: 'text-zinc-900' },
                                { label: 'Net kazanç', value: money(yearNet), tone: 'text-emerald-600' },
                                { label: 'Satış adedi', value: String(yearSales), tone: 'text-zinc-900' },
                                {
                                    label: 'En iyi ay',
                                    value: bestMonth && bestMonth.revenue > 0 ? bestMonth.month : '—',
                                    tone: 'text-zinc-900',
                                },
                            ].map(s => (
                                <div key={s.label}>
                                    <p className="text-[11px] text-zinc-500">{s.label}</p>
                                    <p className={cn('text-sm font-semibold mt-0.5', s.tone)}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {!hasRevenue ? (
                            <div className="h-[300px] flex flex-col items-center justify-center text-center">
                                <BarChart3 className="w-10 h-10 text-zinc-200 mb-3" />
                                <p className="text-sm font-medium text-zinc-600">Henüz satış verin yok</p>
                                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                                    İlk satışın gerçekleştiğinde aylık brüt satış ve net kazancın burada
                                    grafiğe dönüşecek.
                                </p>
                            </div>
                        ) : (
                            <div className='h-[320px] w-full'>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <ComposedChart data={revenueData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f4f4f5' />
                                        <XAxis
                                            dataKey='month'
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#71717a', fontSize: 11 }}
                                            dy={8}
                                            interval={0}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#a1a1aa', fontSize: 11 }}
                                            tickFormatter={compactMoney}
                                            width={58}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#fafafa' }}
                                            content={({ active, payload, label }: any) => {
                                                if (!active || !payload?.length) return null;
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg text-[13px] min-w-[190px]">
                                                        <p className="font-semibold text-zinc-900 mb-2">{label}</p>
                                                        <div className="flex justify-between gap-6">
                                                            <span className="text-zinc-500">Brüt satış</span>
                                                            <span className="text-zinc-800 font-medium">{money(d.gross)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-6">
                                                            <span className="text-zinc-500">Vergi (%20)</span>
                                                            <span className="text-zinc-800">−{money(d.tax)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-6 mt-1.5 pt-1.5 border-t border-zinc-100">
                                                            <span className="text-zinc-600 font-medium">Net kazancın</span>
                                                            <span className="text-emerald-600 font-semibold">{money(d.revenue)}</span>
                                                        </div>
                                                        <p className="text-zinc-400 text-xs mt-1.5">{d.sales} satış</p>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Legend
                                            verticalAlign='top'
                                            height={32}
                                            iconType='circle'
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: 12, color: '#71717a' }}
                                        />
                                        {/* Brüt satış çubuk, net kazanç çizgi: aradaki fark vergi + platform payı */}
                                        <Bar dataKey='gross' name='Brüt satış' fill='#e4e4e7' radius={[4, 4, 0, 0]} maxBarSize={38}>
                                            {revenueData.map((_, i) => (
                                                // İçinde bulunulan ay vurgulansın
                                                <Cell key={i} fill={i === lastIndex ? '#c7d2fe' : '#e4e4e7'} />
                                            ))}
                                        </Bar>
                                        <Line
                                            type='monotone'
                                            dataKey='revenue'
                                            name='Net kazancın'
                                            stroke='#059669'
                                            strokeWidth={2.5}
                                            dot={{ r: 3, fill: '#059669', strokeWidth: 0 }}
                                            activeDot={{ r: 5 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className='border border-zinc-200 shadow-sm rounded-xl bg-white'>
                    <CardHeader className="border-b border-zinc-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-zinc-900 tracking-tight">Hızlı İşlemler</CardTitle>
                        <CardDescription className="text-zinc-500">Sık kullandığınız araçlar</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {[
                                { label: 'Kursları Yönet', desc: 'İçeriklerini düzenle ve yayınla', path: '/instructor/courses/list' },
                                { label: 'Öğrenci Soruları', desc: 'Soru ve cevaplara yanıt ver', path: '/instructor/students/qa' },
                                { label: 'Kupon Oluştur', desc: 'İndirim kampanyaları düzenle', path: '/instructor/finance/report' },
                                { label: 'Finansal Rapor', desc: 'Gelirlerini detaylı incele', path: '/instructor/finance/report' }
                            ].map((action, i) => (
                                <button key={i} onClick={() => navigate(action.path)} className='flex items-center justify-between p-4 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 transition-colors text-left group'>
                                    <div>
                                        <p className='text-sm font-semibold text-zinc-900'>{action.label}</p>
                                        <p className='text-xs text-zinc-500 mt-0.5'>{action.desc}</p>
                                    </div>
                                    <ArrowRight className='w-4 h-4 text-zinc-300 group-hover:text-zinc-700 transition-colors' />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

