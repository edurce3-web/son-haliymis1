import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Mail, ShieldAlert, Loader2 } from 'lucide-react';

export const InstructorAccountSettings: React.FC = () => {
    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/instructor/settings/account`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        setAccount(result.account);
                    }
                }
            } catch (error) {
                console.error("Hesap verisi çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAccount();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
            </div>
        );
    }

    if (!account) {
        return <div className="text-zinc-500">Hesap verisi yüklenemedi. Yardım için lütfen destek ile iletişime geçin.</div>;
    }

    return (
        <div className='max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500'>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Hesap Ayarları</h1>
                    <p className="text-zinc-500 text-sm">Oturum açma bilgilerinizi ve güvenlik ayarlarınızı yönetin.</p>
                </div>
            </div>

            <div className='space-y-6'>
                <Card className='border border-zinc-200 shadow-sm rounded-xl bg-white overflow-hidden'>
                    <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900">E-posta Adresi</h3>
                            <p className="text-sm text-zinc-500 mt-1">Giriş ve iletişim için kullanılan e-posta.</p>
                        </div>
                        <Mail className="w-5 h-5 text-zinc-400" />
                    </div>
                    <CardContent className="p-6">
                        <div className='flex gap-4 items-end'>
                            <div className='flex-1 space-y-2'>
                                <Label className='text-xs font-semibold text-zinc-700'>Geçerli E-posta</Label>
                                <Input disabled defaultValue={account.email} className='bg-zinc-50 border-zinc-200 text-zinc-500' />
                            </div>
                            <Button variant="outline" className="border-zinc-200 text-zinc-700">Değiştir</Button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-4">Platforma katılım tarihi: {new Date(account.created_at).toLocaleDateString('tr-TR')}</p>
                    </CardContent>
                </Card>

                <Card className='border border-zinc-200 shadow-sm rounded-xl bg-white overflow-hidden'>
                    <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900">Parola Güncelle</h3>
                            <p className="text-sm text-zinc-500 mt-1">Hesap güvenliğiniz için düzenli olarak değiştirin.</p>
                        </div>
                        <Key className="w-5 h-5 text-zinc-400" />
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className='space-y-4 max-w-md'>
                            <div className='space-y-2'>
                                <Label className='text-xs font-semibold text-zinc-700'>Mevcut Parola</Label>
                                <Input type="password" placeholder="••••••••" className='bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900' />
                            </div>
                            <div className='space-y-2'>
                                <Label className='text-xs font-semibold text-zinc-700'>Yeni Parola</Label>
                                <Input type="password" placeholder="••••••••" className='bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900' />
                            </div>
                            <div className='space-y-2'>
                                <Label className='text-xs font-semibold text-zinc-700'>Yeni Parolayı Doğrula</Label>
                                <Input type="password" placeholder="••••••••" className='bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900' />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button className='bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg'>
                                Parolayı Güncelle
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border border-red-100 shadow-sm rounded-xl bg-red-50/10 overflow-hidden'>
                    <div className="p-6 border-b border-red-50 bg-red-50/30 flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-semibold text-red-700">Tehlikeli Bölge</h3>
                    </div>
                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <p className="font-semibold text-zinc-900">Hesabı Sil veya Devre Dışı Bırak</p>
                            <p className="text-sm text-zinc-500 mt-1 max-w-lg">Hesabınızı sildiğinizde, tüm kurslarınız, satış verileriniz ve iletişim geçmişiniz kalıcı olarak kaldırılır. Bu işlem geri alınamaz.</p>
                        </div>
                        <Button variant="destructive" className="shrink-0 bg-red-600 hover:bg-red-700">
                            Hesabı Sil
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
