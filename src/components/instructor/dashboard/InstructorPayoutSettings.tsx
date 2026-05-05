import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Landmark, Plus } from 'lucide-react';

export const InstructorPayoutSettings: React.FC = () => {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayouts = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('https://api.edurce.com/api/instructor/finance/payouts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        setPayouts(result.payouts);
                    }
                }
            } catch (error) {
                console.error("Ödeme çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPayouts();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
            </div>
        );
    }

    return (
        <div className='space-y-6 animate-in fade-in duration-500'>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Ödeme Geçmişi</h1>
                    <p className="text-zinc-500 text-sm">Platformdan aldığınız komisyonlar ve banka ödemelerinizin dökümü.</p>
                </div>
            </div>

            <div className='grid lg:grid-cols-4 gap-6'>
                <Card className='lg:col-span-1 border border-zinc-200 shadow-sm rounded-xl overflow-hidden bg-white'>
                    <CardHeader className="border-b border-zinc-100 pb-4 bg-zinc-50/50">
                        <CardTitle className="text-lg font-semibold text-zinc-900 tracking-tight">Ödeme Yöntemi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 p-4 border border-zinc-200 rounded-lg bg-zinc-50">
                                <Landmark className="w-5 h-5 text-zinc-500" />
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">TR** **** **** 1234</p>
                                    <p className="text-xs text-zinc-500">Banka Hesabı</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-zinc-700 font-medium">
                                Yöntemi Güncelle
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className='lg:col-span-3 border border-zinc-200 shadow-sm rounded-xl overflow-hidden bg-white'>
                    <CardHeader className="border-b border-zinc-100 pb-4 bg-zinc-50/50">
                        <CardTitle className="text-lg font-semibold text-zinc-900 tracking-tight">Geçmiş Ödemeler</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {payouts.length === 0 ? (
                            <div className="p-12 text-center text-zinc-500 text-sm">
                                Henüz bir ödeme almadınız. Bakiyeniz ödeme eşiğine geldiğinde işlem başlatılacaktır.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-zinc-50/50">
                                    <TableRow>
                                        <TableHead className="font-semibold text-zinc-600">ID</TableHead>
                                        <TableHead className="font-semibold text-zinc-600">Tarih</TableHead>
                                        <TableHead className="font-semibold text-zinc-600">Yöntem</TableHead>
                                        <TableHead className="font-semibold text-zinc-600">Tutar</TableHead>
                                        <TableHead className="font-semibold text-zinc-600 text-right">Durum</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.map((p, i) => (
                                        <TableRow key={i} className="hover:bg-zinc-50/50 transition-colors">
                                            <TableCell className="font-medium text-zinc-700">#{p.id}</TableCell>
                                            <TableCell className="text-zinc-500">
                                                {new Date(p.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="text-zinc-600 uppercase text-xs">{p.method}</TableCell>
                                            <TableCell className="font-semibold text-zinc-900">₺{parseFloat(p.amount).toLocaleString('tr-TR')}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={
                                                    p.status === 'paid' ? 'default' :
                                                        p.status === 'pending' ? 'outline' :
                                                            p.status === 'processing' ? 'secondary' : 'destructive'}
                                                    className={p.status === 'paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                                                >
                                                    {p.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
