import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { PageHeader } from '@/components/content/PageLayout';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Hash, LifeBuoy, Check } from 'lucide-react';
import { toast } from 'sonner';

/** Konu listesi — talebi doğru kişiye yönlendirmek için. */
const SUBJECTS = [
    'Satın alma ve ödeme',
    'İade talebi',
    'Kursa erişim sorunu',
    'Teknik arıza',
    'Eğitmenlik başvurusu',
    'Telif hakkı bildirimi',
    'Kişisel veri talebi',
    'Diğer',
];

/**
 * Sayfanın üstündeki üç güvence kartı.
 *
 * Eskiden bunların yerinde, formun sağında uzun bir metin sütunu vardı:
 * telif bildirimi, KVKK, güvenlik açığı… Hepsi konu listesinde zaten var olan
 * şeylerdi ve formu ekranın soluna sıkıştırıyordu. Kullanıcının gerçekten
 * merak ettiği üç şey kaldı: ne zaman dönülür, ne alırım, önce nereye bakarım.
 */
const ASSURANCES = [
    {
        icon: Clock,
        title: '48 saat içinde yanıt',
        text: 'Her mesaj en geç 48 saat içinde yanıtlanır.',
        ring: 'border-brand-200 bg-brand-50/70',
        chip: 'bg-brand-700',
    },
    {
        icon: Hash,
        title: 'Talep numarası',
        text: 'Mesajınıza numara verilir, e-postayla iletilir.',
        ring: 'border-amber-200 bg-amber-50/70',
        chip: 'bg-amber-500',
    },
    {
        icon: LifeBuoy,
        title: 'Anında çözüm',
        text: 'Soruların çoğunun yanıtı yardım merkezinde.',
        ring: 'border-sky-200 bg-sky-50/70',
        chip: 'bg-sky-600',
        to: '/help',
    },
];

const Contact: React.FC = () => {
    const { user } = useAuth();
    const [sending, setSending] = useState(false);
    const [ticketId, setTicketId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        subject: SUBJECTS[0],
        message: '',
    });

    useSeo({
        title: 'İletişim | Edurce',
        description: 'Edurce ile iletişime geçin. Satın alma, iade, teknik destek ve kişisel veri talepleriniz 48 saat içinde yanıtlanır.',
        canonical: 'https://edurce.com/contact',
        robots: 'index, follow',
    }, []);

    // Giriş yapmış kullanıcının bilgilerini bir kez doldur
    React.useEffect(() => {
        if (!user) return;
        setForm(prev => ({
            ...prev,
            name: prev.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: prev.email || user.email || '',
        }));
    }, [user]);

    const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.message.trim().length < 10) {
            toast.error('Mesajın en az 10 karakter olmalı');
            return;
        }

        setSending(true);
        try {
            const res = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Mesaj gönderilemedi');

            setTicketId(data.ticketId ?? null);
            setForm(prev => ({ ...prev, phone: '', message: '' }));
        } catch (error: any) {
            toast.error('Mesaj gönderilemedi', { description: error.message });
        } finally {
            setSending(false);
        }
    };

    const inputClass =
        'w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/60 text-[15px] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all';

    const labelClass = 'text-[13.5px] font-semibold text-slate-800';

    return (
        <div className="min-h-screen bg-white">
            <PageHeader
                title="İletişim"
                lead="Sorunuzu aşağıdaki formdan iletin. Mesajınız kayda alınır, size bir talep numarası verilir ve 48 saat içinde yanıtlanır."
            />

            <div className="container px-5 sm:px-8 py-12 lg:py-16">
                <div className="max-w-3xl mx-auto">

                    {/* Güvence kartları */}
                    <div className="grid sm:grid-cols-3 gap-3.5">
                        {ASSURANCES.map(item => {
                            const Icon = item.icon;
                            const inner = (
                                <>
                                    <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${item.chip} text-white shrink-0`}>
                                        <Icon className="w-[18px] h-[18px]" />
                                    </span>
                                    <span className="block mt-3.5 text-[14.5px] font-bold text-slate-900 leading-snug">
                                        {item.title}
                                    </span>
                                    <span className="block mt-1 text-[13.5px] text-slate-600 leading-[1.6]">
                                        {item.text}
                                    </span>
                                </>
                            );
                            const cls = `rounded-2xl border p-5 transition-colors ${item.ring}`;
                            return item.to ? (
                                <Link key={item.title} to={item.to} className={`${cls} hover:brightness-[0.98] block`}>
                                    {inner}
                                </Link>
                            ) : (
                                <div key={item.title} className={cls}>{inner}</div>
                            );
                        })}
                    </div>

                    {/* Form / gönderildi ekranı */}
                    <div className="mt-10">
                        {ticketId !== null ? (
                            <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white px-8 py-12 text-center">
                                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-700 text-white">
                                    <Check className="w-7 h-7 stroke-[3]" />
                                </span>
                                <h2 className="font-montserrat text-[24px] font-extrabold text-slate-900 tracking-tight mt-5">
                                    Mesajınız alındı
                                </h2>
                                <p className="text-[15.5px] text-slate-600 mt-3 leading-[1.75] max-w-md mx-auto">
                                    Onay e-postası gönderdik; dönüşü de aynı adrese, 48 saat içinde
                                    yapacağız.
                                </p>

                                <div className="inline-flex items-center gap-3 rounded-xl bg-white border border-brand-200 px-5 py-3 mt-7">
                                    <span className="font-montserrat text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                                        Talep no
                                    </span>
                                    <span className="font-montserrat text-[24px] font-extrabold text-brand-800 tracking-[-0.02em] leading-none tabular-nums">
                                        #{ticketId}
                                    </span>
                                </div>

                                <div className="mt-7">
                                    <button
                                        onClick={() => setTicketId(null)}
                                        className="text-[15px] font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                                    >
                                        Yeni mesaj gönder
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form
                                onSubmit={submit}
                                className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-5"
                            >
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="name" className={labelClass}>
                                            Ad soyad <span className="text-brand-700">*</span>
                                        </label>
                                        <input
                                            id="name" required value={form.name}
                                            onChange={e => set('name', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className={labelClass}>
                                            E-posta <span className="text-brand-700">*</span>
                                        </label>
                                        <input
                                            id="email" type="email" required value={form.email}
                                            onChange={e => set('email', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="subject" className={labelClass}>
                                            Konu <span className="text-brand-700">*</span>
                                        </label>
                                        <select
                                            id="subject" value={form.subject}
                                            onChange={e => set('subject', e.target.value)}
                                            className={`${inputClass} cursor-pointer`}
                                        >
                                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="phone" className={labelClass}>
                                            Telefon <span className="text-slate-400 font-normal">(isteğe bağlı)</span>
                                        </label>
                                        <input
                                            id="phone" value={form.phone}
                                            onChange={e => set('phone', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="message" className={labelClass}>
                                        Mesajınız <span className="text-brand-700">*</span>
                                    </label>
                                    <textarea
                                        id="message" required rows={7} value={form.message}
                                        onChange={e => set('message', e.target.value)}
                                        placeholder="Sorununuzu mümkün olduğunca açık anlatın. Bir kursla ilgiliyse kursun adını, hata alıyorsanız hatanın tam metnini yazmanız çözümü hızlandırır."
                                        className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-[15px] leading-[1.7] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all resize-y"
                                    />
                                    <p className="text-xs text-slate-400 text-right">
                                        {form.message.length} / 5000
                                    </p>
                                </div>

                                <div className="pt-1">
                                    <Button
                                        type="submit"
                                        disabled={sending}
                                        className="w-full sm:w-auto h-12 px-10 rounded-xl bg-brand-700 hover:bg-brand-800 font-semibold text-[15px]"
                                    >
                                        {sending
                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gönderiliyor</>
                                            : 'Mesajı gönder'}
                                    </Button>
                                    <p className="text-[12.5px] text-slate-500 leading-relaxed mt-4">
                                        Formu göndererek bilgilerinizin talebinizi yanıtlamak amacıyla
                                        işlenmesini kabul etmiş olursunuz. Ayrıntılar{' '}
                                        <Link to="/privacy" className="text-brand-700 font-medium hover:underline">
                                            gizlilik politikasında
                                        </Link>.
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
