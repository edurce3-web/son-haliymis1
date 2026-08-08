import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Landmark, Wallet, CalendarClock, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface PayoutAccount {
    account_holder?: string;
    bank_name?: string;
    iban?: string;
    tc_or_tax_no?: string;
    phone?: string;
    address?: string;
    payout_day?: number;
}

interface Payout {
    id: number;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
    method: string;
    reference: string | null;
    note: string | null;
    period_start: string | null;
    period_end: string | null;
    paid_at: string | null;
    created_at: string;
}

const BANKS = [
    'Ziraat Bankası', 'İş Bankası', 'Garanti BBVA', 'Yapı Kredi', 'Akbank',
    'VakıfBank', 'Halkbank', 'QNB Finansbank', 'DenizBank', 'TEB',
    'Şekerbank', 'ING', 'HSBC', 'Odeabank', 'Enpara', 'Papara', 'Diğer',
];

/** IBAN'ı 4'erli gruplara ayırır: TR12 3456 ... */
const formatIban = (v: string) =>
    v.replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();

const statusMeta: Record<Payout['status'], { label: string; cls: string; Icon: any }> = {
    paid: { label: 'Ödendi', cls: 'text-emerald-700 bg-emerald-50', Icon: CheckCircle2 },
    pending: { label: 'Beklemede', cls: 'text-amber-700 bg-amber-50', Icon: Clock },
    failed: { label: 'Başarısız', cls: 'text-red-700 bg-red-50', Icon: XCircle },
};

const InstructorPayoutSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<PayoutAccount>({ payout_day: 15 });
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [balance, setBalance] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [nextPayoutDate, setNextPayoutDate] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            try {
                const [accRes, payRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/instructor/finance/payout-account`, { headers }),
                    fetch(`${API_BASE_URL}/instructor/finance/payouts`, { headers }),
                ]);

                if (accRes.ok) {
                    const data = await accRes.json();
                    if (data.account) {
                        setForm({ ...data.account, iban: formatIban(data.account.iban || '') });
                    }
                }
                if (payRes.ok) {
                    const data = await payRes.json();
                    setPayouts(data.payouts || []);
                    setBalance(data.balance || 0);
                    setTotalPaid(data.totalPaid || 0);
                    setNextPayoutDate(data.nextPayoutDate || null);
                }
            } catch (e: any) {
                toast.error('Ödeme bilgileri yüklenemedi', { description: e.message });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const set = (key: keyof PayoutAccount, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/instructor/finance/payout-account`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, iban: (form.iban || '').replace(/\s+/g, '') }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Kaydedilemedi');

            toast.success('Ödeme bilgileri kaydedildi');
            if (data.account) setForm({ ...data.account, iban: formatIban(data.account.iban || '') });
        } catch (e: any) {
            toast.error('Kaydedilemedi', { description: e.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    const ibanDigits = (form.iban || '').replace(/\s+/g, '');
    const ibanValid = /^TR\d{24}$/.test(ibanDigits);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Ödeme Ayarları</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Kazancının yatırılacağı banka hesabı ve ödeme geçmişin.
                </p>
            </div>

            {/* Bakiye özeti */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-500">Ödenecek bakiye</span>
                        <Wallet className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{formatPrice(balance)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-500">Bugüne kadar ödenen</span>
                        <CheckCircle2 className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatPrice(totalPaid)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-500">Sonraki ödeme</span>
                        <CalendarClock className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {nextPayoutDate ? new Date(nextPayoutDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '—'}
                    </p>
                </div>
            </div>

            {/* Banka bilgileri */}
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <header className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">Banka bilgileri</h2>
                </header>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Hesap sahibi <span className="text-red-500">*</span></Label>
                        <Input
                            value={form.account_holder || ''}
                            onChange={e => set('account_holder', e.target.value)}
                            placeholder="Ad Soyad (hesaptaki isimle aynı)"
                            className="h-11 rounded-xl border-slate-200"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Banka <span className="text-red-500">*</span></Label>
                        <Select value={form.bank_name || ''} onValueChange={v => set('bank_name', v)}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                <SelectValue placeholder="Banka seçin" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm text-slate-700">IBAN <span className="text-red-500">*</span></Label>
                        <Input
                            value={form.iban || ''}
                            onChange={e => set('iban', formatIban(e.target.value).slice(0, 32))}
                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                            className={`h-11 rounded-xl font-mono tracking-wide ${form.iban && !ibanValid ? 'border-amber-300' : 'border-slate-200'
                                }`}
                        />
                        <p className={`text-xs ${form.iban && !ibanValid ? 'text-amber-600' : 'text-slate-400'}`}>
                            {form.iban && !ibanValid
                                ? 'IBAN "TR" ile başlamalı ve toplam 26 karakter olmalı.'
                                : 'Hesabın senin adına olmalı; başkasının hesabına ödeme yapılamaz.'}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">TC kimlik / Vergi no</Label>
                        <Input
                            value={form.tc_or_tax_no || ''}
                            onChange={e => set('tc_or_tax_no', e.target.value.replace(/\D/g, '').slice(0, 11))}
                            placeholder="11 haneli TC veya 10 haneli vergi no"
                            className="h-11 rounded-xl border-slate-200"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Telefon</Label>
                        <Input
                            value={form.phone || ''}
                            onChange={e => set('phone', e.target.value)}
                            placeholder="05xx xxx xx xx"
                            className="h-11 rounded-xl border-slate-200"
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm text-slate-700">Fatura adresi</Label>
                        <textarea
                            value={form.address || ''}
                            onChange={e => set('address', e.target.value)}
                            rows={3}
                            placeholder="Açık adres"
                            className="w-full rounded-xl border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Ödeme günü</Label>
                        <Select
                            value={String(form.payout_day || 15)}
                            onValueChange={v => set('payout_day', Number(v))}
                        >
                            <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl max-h-64">
                                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                    <SelectItem key={d} value={String(d)}>Her ayın {d}. günü</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-400">Ödemeler bu tarihte hesabına aktarılır.</p>
                    </div>
                </div>

                <footer className="px-6 py-4 border-t border-slate-100 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kaydediliyor</> : 'Kaydet'}
                    </Button>
                </footer>
            </section>

            {/* Ödeme geçmişi */}
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <header className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">Gelen ödemeler</h2>
                </header>

                {payouts.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-sm text-slate-400">Henüz ödeme yapılmadı.</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Bakiyen {nextPayoutDate ? new Date(nextPayoutDate).toLocaleDateString('tr-TR') : 'ödeme gününde'} hesabına aktarılacak.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                                    <th className="font-medium px-6 py-2">Tarih</th>
                                    <th className="font-medium px-3 py-2">Dönem</th>
                                    <th className="font-medium px-3 py-2">Yöntem</th>
                                    <th className="font-medium px-3 py-2">Durum</th>
                                    <th className="font-medium px-6 py-2 text-right">Tutar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payouts.map(p => {
                                    const meta = statusMeta[p.status] || statusMeta.pending;
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/60">
                                            <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                                                {new Date(p.paid_at || p.created_at).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                                                {p.period_start && p.period_end
                                                    ? `${new Date(p.period_start).toLocaleDateString('tr-TR')} – ${new Date(p.period_end).toLocaleDateString('tr-TR')}`
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-3 text-slate-500">{p.method || 'IBAN'}</td>
                                            <td className="px-3 py-3">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${meta.cls}`}>
                                                    <meta.Icon className="w-3.5 h-3.5" />
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                                                {formatPrice(p.amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default InstructorPayoutSettings;
