import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { btn, field, hint, label, Loading, PageHead, Panel, PanelHead, Tag } from '../shell/kit';

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

const statusMeta: Record<Payout['status'], { label: string; tone: 'live' | 'warn' | 'bad' }> = {
    paid: { label: 'Ödendi', tone: 'live' },
    pending: { label: 'Bekliyor', tone: 'warn' },
    failed: { label: 'Yapılamadı', tone: 'bad' },
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

            toast.success('Ödeme bilgilerin kaydedildi');
            if (data.account) setForm({ ...data.account, iban: formatIban(data.account.iban || '') });
        } catch (e: any) {
            toast.error('Kaydedilemedi', { description: e.message || 'Bilgileri kontrol edip tekrar dene.' });
        } finally {
            setSaving(false);
        }
    };


    if (loading) return <Loading label="Ödeme bilgilerin yükleniyor" />;

    const ibanDigits = (form.iban || '').replace(/\s+/g, '');
    const ibanValid = /^TR\d{24}$/.test(ibanDigits);
    const ibanBad = !!form.iban && !ibanValid;
    const next = nextPayoutDate ? new Date(nextPayoutDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : null;

    return (
        <>
            <PageHead title="Ödeme bilgileri" sub="Kazancının yatacağı hesap ve şimdiye kadarki ödemelerin" />

            <section className="rounded-2xl bg-[#00201d] text-white grid sm:grid-cols-3 mb-6 overflow-hidden">
                {[
                    { l: 'Ödenecek bakiye', v: formatPrice(balance), mint: true },
                    { l: 'Bugüne kadar ödenen', v: formatPrice(totalPaid) },
                    { l: 'Sonraki ödeme', v: next || '—' },
                ].map((x, i) => (
                    <div key={x.l} className={cn('px-6 py-5', i > 0 && 'border-t sm:border-t-0 sm:border-l border-white/[0.08]')}>
                        <p className="text-[12.5px] text-[#a9cfc9]">{x.l}</p>
                        <p className={cn('mt-1.5 text-[26px] leading-none font-extrabold tracking-[-0.02em] tabular-nums', x.mint ? 'text-[#9cf2e8]' : 'text-white')}>
                            {x.v}
                        </p>
                    </div>
                ))}
            </section>

            <Panel as="section" className="mb-6">
                <PanelHead title="Banka hesabın" sub="Hesap senin adına olmalı; başkasının hesabına ödeme yapılamıyor." />
                <form
                    onSubmit={e => { e.preventDefault(); handleSave(); }}
                    className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5"
                >
                    <div>
                        <label htmlFor="p-holder" className={label}>Hesap sahibi</label>
                        <input id="p-holder" required value={form.account_holder || ''} onChange={e => set('account_holder', e.target.value)}
                            placeholder="Bankadaki adınla aynı" className={cn(field, 'h-11')} />
                    </div>
                    <div>
                        <label htmlFor="p-bank" className={label}>Banka</label>
                        <select id="p-bank" required value={form.bank_name || ''} onChange={e => set('bank_name', e.target.value)} className={cn(field, 'h-11')}>
                            <option value="">Banka seç</option>
                            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="p-iban" className={label}>IBAN</label>
                        <input
                            id="p-iban"
                            required
                            inputMode="text"
                            autoComplete="off"
                            value={form.iban || ''}
                            onChange={e => set('iban', formatIban(e.target.value).slice(0, 32))}
                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                            aria-invalid={ibanBad}
                            aria-describedby="p-iban-hint"
                            className={cn(field, 'h-11 tabular-nums tracking-[0.04em]', ibanBad && 'ring-[#e0a33a] hover:ring-[#e0a33a]')}
                        />
                        <p id="p-iban-hint" className={cn('mt-1.5', ibanBad ? 'text-[12.5px] font-semibold text-[#8a5a0b]' : hint)}>
                            {ibanBad ? 'IBAN "TR" ile başlamalı ve toplam 26 karakter olmalı.' : 'Boşlukları sen yazma, kendiliğinden ekleniyor.'}
                        </p>
                    </div>
                    <div>
                        <label htmlFor="p-tc" className={label}>TC kimlik ya da vergi no</label>
                        <input id="p-tc" inputMode="numeric" value={form.tc_or_tax_no || ''} onChange={e => set('tc_or_tax_no', e.target.value.replace(/\D/g, '').slice(0, 11))}
                            placeholder="11 haneli TC ya da 10 haneli vergi no" className={cn(field, 'h-11 tabular-nums')} />
                    </div>
                    <div>
                        <label htmlFor="p-phone" className={label}>Telefon</label>
                        <input id="p-phone" type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)}
                            placeholder="05xx xxx xx xx" className={cn(field, 'h-11')} />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="p-addr" className={label}>Fatura adresi</label>
                        <textarea id="p-addr" value={form.address || ''} onChange={e => set('address', e.target.value)} rows={3}
                            placeholder="Mahalle, sokak, no, ilçe, il" className={cn(field, 'py-3 resize-y')} />
                    </div>
                    <div>
                        <label htmlFor="p-day" className={label}>Ödeme günü</label>
                        <select id="p-day" value={String(form.payout_day || 15)} onChange={e => set('payout_day', Number(e.target.value))} className={cn(field, 'h-11')}>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                <option key={d} value={d}>Her ayın {d}. günü</option>
                            ))}
                        </select>
                        <p className={cn(hint, 'mt-1.5')}>Bakiyen bu gün hesabına aktarılır.</p>
                    </div>
                    <div className="md:col-span-2 flex justify-end pt-2 border-t border-[#e8f2f0] -mx-5 sm:-mx-6 px-5 sm:px-6 mt-1">
                        <button type="submit" disabled={saving} className={cn(btn.primary, btn.lg, 'mt-4 min-w-[160px]')}>
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</> : 'Bilgileri kaydet'}
                        </button>
                    </div>
                </form>
            </Panel>

            <Panel as="section" className="overflow-hidden">
                <PanelHead title="Gelen ödemeler" />
                {payouts.length === 0 ? (
                    <p className="px-6 py-10 text-center text-[14px] text-[#4a6360]">
                        Henüz ödeme yapılmadı. Bakiyen {next ? `${next} tarihinde` : 'ödeme gününde'} hesabına aktarılacak.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-[13.5px]">
                            <thead>
                                <tr className="text-left text-[12.5px] text-[#4a6360] border-b border-[#e8f2f0]">
                                    <th scope="col" className="font-bold px-5 sm:px-6 py-3">Tarih</th>
                                    <th scope="col" className="font-bold px-3 py-3">Dönem</th>
                                    <th scope="col" className="font-bold px-3 py-3">Durum</th>
                                    <th scope="col" className="font-bold px-5 sm:px-6 py-3 text-right">Tutar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eef5f3]">
                                {payouts.map(p => {
                                    const m = statusMeta[p.status] || statusMeta.pending;
                                    return (
                                        <tr key={p.id} className="hover:bg-[#f4fcfa]">
                                            <td className="px-5 sm:px-6 py-3 text-[#1d3a37] whitespace-nowrap tabular-nums">
                                                {new Date(p.paid_at || p.created_at).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-3 py-3 text-[#4a6360] whitespace-nowrap tabular-nums">
                                                {p.period_start && p.period_end
                                                    ? `${new Date(p.period_start).toLocaleDateString('tr-TR')} – ${new Date(p.period_end).toLocaleDateString('tr-TR')}`
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-3"><Tag tone={m.tone}>{m.label}</Tag></td>
                                            <td className="px-5 sm:px-6 py-3 text-right font-bold text-[#00201d] whitespace-nowrap tabular-nums">{formatPrice(p.amount)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </>
    );
};

export default InstructorPayoutSettings;
