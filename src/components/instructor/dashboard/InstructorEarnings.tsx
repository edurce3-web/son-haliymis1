import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, Users, ArrowRight, Loader2 } from 'lucide-react';

export const InstructorEarnings: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('https://api.edurce.com/api/instructor/finance/earnings', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        setData(result);
                    }
                }
            } catch (error) {
                console.error("Gelir verisi çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
            </div>
        );
    }

    if (!data) {
        return <div className="text-zinc-500">Veri yüklenemedi. Lütfen sayfayı yenileyin.</div>;
    }

    return (
        <div className='space-y-10 animate-in fade-in duration-500'>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Gelir Raporu</h1>
                    <p className="text-zinc-500 text-sm">Tüm finansal performansınızı ve güncel bakiyenizi inceleyin.</p>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <Card className='border border-zinc-200 shadow-sm rounded-xl bg-white'>
                    <CardContent className='p-6 flex flex-col justify-center h-full'>
                        <div className='flex items-center justify-between space-y-0 pb-2 mb-2'>
                            <p className='text-sm font-medium tracking-tight text-zinc-600'>Toplam Bakiye</p>
                            <div className="p-2 bg-zinc-50 rounded-md">
                                <Wallet className='w-4 h-4 text-zinc-700' />
                            </div>
                        </div>
                        <div>
                            <h3 className='text-3xl font-bold text-zinc-900'>₺{parseFloat(data.totalRevenue).toLocaleString('tr-TR')}</h3>
                            <p className='text-xs text-zinc-500 font-medium mt-1'>Tüm zamanların toplam geliri</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border border-zinc-200 shadow-sm rounded-xl bg-white'>
                    <CardContent className='p-6 flex flex-col justify-center h-full'>
                        <div className='flex items-center justify-between space-y-0 pb-2 mb-2'>
                            <p className='text-sm font-medium tracking-tight text-zinc-600'>Bu Ayın Kazancı</p>
                            <div className="p-2 bg-zinc-50 rounded-md">
                                <TrendingUp className='w-4 h-4 text-zinc-700' />
                            </div>
                        </div>
                        <div>
                            <h3 className='text-3xl font-bold text-zinc-900'>₺{parseFloat(data.monthlyRevenue).toLocaleString('tr-TR')}</h3>
                            <p className='text-xs text-zinc-500 font-medium mt-1'>Sadece içinde bulunduğumuz ay</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border border-zinc-200 shadow-sm rounded-xl bg-white'>
                    <CardContent className='p-6 flex flex-col justify-center h-full'>
                        <div className='flex items-center justify-between space-y-0 pb-2 mb-2'>
                            <p className='text-sm font-medium tracking-tight text-zinc-600'>Satılan Kurs</p>
                            <div className="p-2 bg-zinc-50 rounded-md">
                                <Users className='w-4 h-4 text-zinc-700' />
                            </div>
                        </div>
                        <div>
                            <h3 className='text-3xl font-bold text-zinc-900'>{data.soldCourses}</h3>
                            <p className='text-xs text-zinc-500 font-medium mt-1'>Bu ayki toplam satış adedi</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className='border border-zinc-200 shadow-sm rounded-xl overflow-hidden bg-white'>
                <CardHeader className="border-b border-zinc-100 pb-4 bg-zinc-50/50">
                    <CardTitle className="text-lg font-semibold text-zinc-900 tracking-tight">Son İşlemler</CardTitle>
                    <CardDescription className="text-zinc-500">Hesabınıza yansıyan en son kurs satışları</CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                    {(!data.recentTransactions || data.recentTransactions.length === 0) ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">Henüz herhangi bir finansal işlem bulunmuyor.</div>
                    ) : (
                        <div className='divide-y divide-zinc-100'>
                            {data.recentTransactions.map((tx: any, i: number) => (
                                <div key={i} className='flex items-center justify-between p-4 px-6 hover:bg-zinc-50 transition-colors'>
                                    <div className='flex items-center gap-4'>
                                        <div>
                                            <p className='text-sm font-semibold text-zinc-900'>{tx.courseTitle}</p>
                                            <p className='text-xs text-zinc-500 mt-1'>{new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className='text-right'>
                                        <p className='text-sm font-bold text-zinc-900'>+₺{parseFloat(tx.amount).toLocaleString('tr-TR')}</p>
                                        <p className='text-xs text-emerald-600 font-medium mt-1'>{tx.status === 'completed' ? 'Başarılı' : tx.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

