import React, { useState, useEffect } from 'react';
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
                const res = await fetch('https://api.edurce.com/api/instructor/dashboard', {
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

    const { stats, revenueData } = data;

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
                    { title: 'Aylık Kazanç', value: `₺${stats.monthlyRevenue.toLocaleString('tr-TR')}`, icon: DollarSign, desc: `Toplam: ₺${stats.totalRevenue.toLocaleString('tr-TR')}` },
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
                        <div className='flex items-center justify-between'>
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-zinc-900 tracking-tight">Gelir Trendi</CardTitle>
                                <CardDescription className="text-zinc-500">Son 6 ayın finansal performansı</CardDescription>
                            </div>
                            <div className='p-2 bg-zinc-50 rounded-md'>
                                <TrendingUp className='w-4 h-4 text-zinc-700' />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className='h-[300px] w-full'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <AreaChart data={revenueData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id='colorRevenue' x1='0' y1='0' x2='0' y2='1'>
                                            <stop offset='5%' stopColor='#18181b' stopOpacity={0.1} />
                                            <stop offset='95%' stopColor='#18181b' stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e4e4e7' />
                                    <XAxis dataKey='month' axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={(val) => `₺${val}`} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '13px' }}
                                        itemStyle={{ color: '#18181b', fontWeight: 600 }}
                                        formatter={(value: number) => [`₺${value}`, 'Gelir']}
                                    />
                                    <Area type='monotone' dataKey='revenue' stroke='#18181b' strokeWidth={2} fill='url(#colorRevenue)' />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
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
                                { label: 'Kupon Oluştur', desc: 'İndirim kampanyaları düzenle', path: '/instructor/finance/earnings' },
                                { label: 'Finansal Rapor', desc: 'Gelirlerini detaylı incele', path: '/instructor/finance/earnings' }
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

