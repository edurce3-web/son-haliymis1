import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const InstructorSalesHistory: React.FC = () => {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('https://api.edurce.com/api/instructor/finance/sales', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        setSales(result.sales);
                    }
                }
            } catch (error) {
                console.error("Satış geçmişi çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
            </div>
        );
    }

    const filteredSales = sales.filter(s =>
        s.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className='space-y-6 animate-in fade-in duration-500'>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Satış Geçmişi</h1>
                    <p className="text-zinc-500 text-sm">Satılan tüm kurslarınızın detaylı ve filtrelenebilir listesi.</p>
                </div>
            </div>

            <Card className='border border-zinc-200 shadow-sm rounded-xl overflow-hidden bg-white'>
                <CardHeader className="border-b border-zinc-100 pb-4 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-semibold text-zinc-900 tracking-tight">Tüm Satışlar</CardTitle>
                        <CardDescription className="text-zinc-500">Öğrenci ve tutar bazlı satış detayları</CardDescription>
                    </div>
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Kurs veya öğrenci ara..."
                            className="pl-9 bg-white border-zinc-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredSales.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-zinc-500 text-sm">Burada gösterilecek bir satış bulunamadı.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-zinc-50/50">
                                <TableRow>
                                    <TableHead className="font-semibold text-zinc-600">Kurs Adı</TableHead>
                                    <TableHead className="font-semibold text-zinc-600">Öğrenci</TableHead>
                                    <TableHead className="font-semibold text-zinc-600">Tarih</TableHead>
                                    <TableHead className="font-semibold text-zinc-600">Tutar</TableHead>
                                    <TableHead className="font-semibold text-zinc-600 text-right">Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSales.map((sale, i) => (
                                    <TableRow key={i} className="hover:bg-zinc-50/50 transition-colors">
                                        <TableCell className="font-medium text-zinc-900">{sale.courseTitle}</TableCell>
                                        <TableCell className="text-zinc-600">{sale.first_name} {sale.last_name}</TableCell>
                                        <TableCell className="text-zinc-500">
                                            {new Date(sale.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                        <TableCell className="font-semibold text-zinc-900">₺{parseFloat(sale.amount).toLocaleString('tr-TR')}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className={sale.status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                                {sale.status === 'completed' ? 'Başarılı' : sale.status}
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
    );
};
