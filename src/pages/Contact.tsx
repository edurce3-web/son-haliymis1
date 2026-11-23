import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { PageHeader } from '@/components/content/PageLayout';
import { Loader2 } from 'lucide-react';
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

/** Sol sütundaki kısa bilgiler: ne zaman dönülür, ne alınır. */
const FACTS = [
    { k: 'Yanıt süresi', v: '48 saat içinde', d: 'Her mesaj en geç 48 saat içinde yanıtlanır.' },
    { k: 'Takip', v: 'Talep numarası', d: 'Mesajına bir numara verilir ve e-postana iletilir.' },
];

const ROUTES = [
    { t: 'Telif hakkı bildirimi', d: 'İçeriğin bulunduğu kursun bağlantısını ve hak sahipliğini gösteren bilgiyi ekle.' },
    { t: 'Kişisel veri talebi', d: 'Hesabına kayıtlı e-posta adresinden yazman talebi hızlandırır.' },
    { t: 'Güvenlik açığı', d: 'Konu olarak "Teknik arıza"yı seç; bu bildirimleri öncelikli ele alıyoruz.' },
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
        'w-full h-12 px-4 rounded-2xl bg-white text-[15px] text-[#111827] placeholder:text-[#9CA3AF] outline-none' +
        'focus:ring-2 focus:ring-[#1B7A43]/50 transition-shadow';
    const labelClass = 'block text-[13.5px] font-bold text-[#111827] mb-1.5';

    return (
        <div className="min-h-screen bg-white text-[#111827]">
            <PageHeader
                eyebrow="Destek"
                title="İletişim"
                lead="Sorunu bize yaz. Mesajın kayda alınır, sana bir talep numarası verilir ve 48 saat içinde yanıtlanır."
            />

            <div className="mx-auto max-w-[1140px] px-5 sm:px-10 py-14 lg:py-20 grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-12 lg:gap-16 items-start">
                {/* Sol: önce bilmen gerekenler */}
                <aside className="lg:sticky lg:top-28 space-y-10">
                    <div className="grid grid-cols-2 gap-3">
                        {FACTS.map(f => (
                            <div key={f.k} className="rounded-[22px] bg-[#F5F6F8] p-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">{f.k}</p>
                                <p className="mt-2 text-[18px] font-extrabold tracking-[-0.01em] leading-tight">{f.v}</p>
                                <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#6B7280]">{f.d}</p>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-[22px] bg-[#B2F0C8] p-6">
                        <p className="text-[17px] font-bold">Önce yardım merkezine bak</p>
                        <p className="mt-1.5 text-[14.5px] leading-[1.6] text-[#1F2937]/80">
                            Ödeme, iade, erişim ve video sorunlarının çoğunun yanıtı orada; beklemeden çözülür.
                        </p>
                        <Link to="/help" className="mt-4 inline-flex items-center h-10 px-5 rounded-xl bg-white/80 hover:bg-white text-[14px] font-bold transition-colors">
                            Yardım merkezi
                        </Link>
                    </div>

                    <div>
                        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Özel konular</p>
                        <ul className="mt-4 space-y-5">
                            {ROUTES.map(r => (
                                <li key={r.t}>
                                    <p className="text-[15.5px] font-bold">{r.t}</p>
                                    <p className="mt-1 text-[14px] leading-[1.6] text-[#6B7280]">{r.d}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Sağ: form ya da gönderildi ekranı */}
                {ticketId !== null ? (
                    <div className="rounded-[28px] bg-[#F5F6F8] px-7 sm:px-10 py-14 text-center">
                        <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#1B7A43]">Mesajın alındı</p>
                        <h2 className="mt-3 font-montserrat text-[28px] sm:text-[34px] font-extrabold tracking-[-0.025em]">Teşekkürler.</h2>
                        <p className="mt-3 text-[15.5px] leading-[1.75] text-[#4B5563] max-w-md mx-auto">
                            Onay e-postası gönderdik; dönüşü de aynı adrese, 48 saat içinde yapacağız.
                        </p>
                        <div className="mt-8 inline-flex flex-col items-center rounded-[22px] bg-white px-8 py-5">
                            <span className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">Talep no</span>
                            <span className="mt-1 font-montserrat text-[34px] font-extrabold tracking-[-0.02em] leading-none tabular-nums text-[#1B7A43]">
                                #{ticketId}
                            </span>
                        </div>
                        <div className="mt-8">
                            <button
                                onClick={() => setTicketId(null)}
                                className="text-[15px] font-bold text-[#1B7A43] hover:underline underline-offset-4"
                            >
                                Yeni mesaj gönder
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={submit} className="rounded-[28px] bg-[#F5F6F8] p-6 sm:p-9 space-y-6">
                        <div>
                            <h2 className="font-montserrat text-[24px] sm:text-[28px] font-extrabold tracking-[-0.025em]">Bize yaz</h2>
                            <p className="mt-1.5 text-[14.5px] text-[#6B7280]">Yıldızlı alanlar zorunlu.</p>
                        </div>

                        <fieldset>
                            <legend className={labelClass}>Konu <span className="text-[#1B7A43]">*</span></legend>
                            <div role="radiogroup" className="flex flex-wrap gap-2">
                                {SUBJECTS.map(sub => {
                                    const on = form.subject === sub;
                                    return (
                                        <button
                                            key={sub}
                                            type="button"
                                            role="radio"
                                            aria-checked={on}
                                            onClick={() => set('subject', sub)}
                                            className={on
                                                ? 'h-10 px-4 rounded-xl bg-[#1B7A43] text-white text-[14px] font-bold'
                                                : 'h-10 px-4 rounded-xl bg-white text-[#374151] text-[14px] font-semibold hover:bg-[#EEFBF3] hover:text-[#1B7A43] transition-colors'}
                                        >
                                            {sub}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className={labelClass}>Ad soyad <span className="text-[#1B7A43]">*</span></label>
                                <input id="name" required value={form.name} onChange={e => set('name', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="email" className={labelClass}>E-posta <span className="text-[#1B7A43]">*</span></label>
                                <input id="email" type="email" required value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className={labelClass}>
                                Telefon <span className="font-normal text-[#9CA3AF]">(isteğe bağlı)</span>
                            </label>
                            <input id="phone" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputClass} />
                        </div>

                        <div>
                            <label htmlFor="message" className={labelClass}>Mesajın <span className="text-[#1B7A43]">*</span></label>
                            <textarea
                                id="message" required rows={7} maxLength={5000} value={form.message}
                                onChange={e => set('message', e.target.value)}
                                placeholder="Sorunu olabildiğince açık anlat. Bir kursla ilgiliyse kursun adını, hata alıyorsan hatanın tam metnini yazman çözümü hızlandırır."
                                className="w-full p-4 rounded-2xl bg-white text-[15px] leading-[1.7] text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#1B7A43]/50 transition-shadow resize-y"
                            />
                            <p className="mt-1.5 text-[12.5px] text-[#9CA3AF] text-right tabular-nums">{`${form.message.length} / 5000`}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <button
                                type="submit"
                                disabled={sending}
                                className="shrink-0 inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl bg-[#1B7A43] hover:bg-[#16613A] disabled:opacity-60 text-white text-[15px] font-bold transition-colors"
                            >
                                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor</> : 'Mesajı gönder'}
                            </button>
                            <p className="text-[12.5px] text-[#6B7280] leading-relaxed">
                                Formu göndererek bilgilerinin talebini yanıtlamak amacıyla işlenmesini kabul edersin.
                                Ayrıntılar <Link to="/privacy" className="font-semibold text-[#1B7A43] hover:underline">gizlilik politikasında</Link>.
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Contact;
