import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { PageHeader } from '@/components/content/PageLayout';
import { Button } from '@/components/ui/button';
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
        description: 'Edurce ile iletişime geçin. Satın alma, iade, teknik destek ve kişisel veri talepleriniz için form.',
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
        'w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all';

    return (
        <div className="min-h-screen bg-white">
            <PageHeader
                title="İletişim"
                lead="Sorunuzu aşağıdaki formdan iletin. Mesajınız kayda alınır, size bir talep numarası verilir ve en geç iki iş günü içinde dönüş yapılır."
            />

            <div className="container px-4 py-14 lg:py-20">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

                    {/* Form */}
                    <div className="flex-1 max-w-2xl">
                        {ticketId !== null ? (
                            <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-brand-50/20 px-7 py-8">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700/70">
                                    Talep numarası
                                </p>
                                <div className="text-[40px] font-bold text-brand-800 tabular-nums leading-none mt-2">
                                    #{ticketId}
                                </div>
                                <span className="block w-10 h-[3px] rounded-full bg-brand-600 mt-5 mb-4" />
                                <h2 className="text-[19px] font-bold text-slate-900 tracking-tight">
                                    Mesajınız alındı
                                </h2>
                                <p className="text-[15.5px] text-slate-700 mt-2 leading-[1.75] max-w-md">
                                    Onay e-postası gönderdik; dönüşü de aynı adrese yapacağız. Bu
                                    numarayı saklarsanız takip etmek kolaylaşır.
                                </p>
                                <button
                                    onClick={() => setTicketId(null)}
                                    className="text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline mt-5"
                                >
                                    Yeni mesaj gönder
                                </button>
                            </div>
                        ) : (
                            <form
                                onSubmit={submit}
                                className="space-y-5 rounded-2xl border border-slate-200 bg-white px-6 py-7 sm:px-8 sm:py-8 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(23,93,93,0.18)]"
                            >
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="name" className="text-sm font-medium text-slate-700">
                                            Ad soyad <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="name" required value={form.name}
                                            onChange={e => set('name', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className="text-sm font-medium text-slate-700">
                                            E-posta <span className="text-red-500">*</span>
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
                                        <label htmlFor="subject" className="text-sm font-medium text-slate-700">
                                            Konu <span className="text-red-500">*</span>
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
                                        <label htmlFor="phone" className="text-sm font-medium text-slate-700">
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
                                    <label htmlFor="message" className="text-sm font-medium text-slate-700">
                                        Mesajınız <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="message" required rows={7} value={form.message}
                                        onChange={e => set('message', e.target.value)}
                                        placeholder="Sorununuzu mümkün olduğunca açık anlatın. Bir kursla ilgiliyse kursun adını, hata alıyorsanız hatanın tam metnini yazmanız çözümü hızlandırır."
                                        className="w-full p-3.5 rounded-lg border border-slate-300 bg-white text-[15px] leading-relaxed placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all resize-y"
                                    />
                                    <p className="text-xs text-slate-500 tabular-nums">
                                        {form.message.length} / 5000 karakter
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 mt-6 -mx-6 sm:-mx-8 px-6 sm:px-8 pt-5">
                                    <Button
                                        type="submit"
                                        disabled={sending}
                                        className="h-11 px-7 rounded-lg bg-brand-700 hover:bg-brand-800 font-semibold"
                                    >
                                        {sending
                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gönderiliyor</>
                                            : 'Mesajı gönder'}
                                    </Button>
                                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                                        Formu göndererek bilgilerinizin talebinizi yanıtlamak amacıyla
                                        işlenmesini kabul etmiş olursunuz.
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Yan bilgi */}
                    <aside className="lg:w-80 shrink-0 space-y-6">
                        <div className="rounded-2xl border border-slate-200 px-6 py-6">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700/70">
                                Yanıt süresi
                            </p>
                            <div className="text-[34px] font-bold text-brand-800 tabular-nums leading-none mt-2.5">
                                2 <span className="text-[15px] font-semibold text-slate-500">iş günü</span>
                            </div>
                            <p className="text-[14.5px] text-slate-600 leading-[1.7] mt-3">
                                En geç yanıt süremiz bu. Hafta içi gelen mesajlara genellikle aynı
                                gün, hafta sonu gelenlere pazartesi dönüş yapıyoruz.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-brand-50/20 px-6 py-6">
                            <h2 className="text-[15px] font-bold text-slate-900">Önce buraya bakın</h2>
                            <span className="block w-8 h-[3px] rounded-full bg-brand-600 mt-2.5 mb-3" />
                            <p className="text-[14.5px] text-slate-600 leading-[1.7]">
                                Soruların çoğunun yanıtı{' '}
                                <Link to="/help" className="text-brand-700 font-medium hover:underline">yardım merkezinde</Link>{' '}
                                var. Oradan çözemezseniz formu doldurun.
                            </p>
                        </div>

                        <div className="px-1">
                            <h2 className="text-[15px] font-bold text-slate-900">Özel konular</h2>
                            <span className="block w-8 h-[3px] rounded-full bg-brand-600 mt-2.5 mb-4" />
                            <dl className="space-y-4">
                                {[
                                    {
                                        t: 'Telif hakkı bildirimi',
                                        d: <>Hakkınızı ihlal eden içeriğin bağlantısını ve hak sahipliğinizi gösteren belgeyi ekleyin.</>,
                                    },
                                    {
                                        t: 'Kişisel veri talebi',
                                        d: <>KVKK kapsamındaki taleplerinizi 30 gün içinde ücretsiz sonuçlandırıyoruz. Ayrıntılar <Link to="/privacy" className="text-brand-700 font-medium hover:underline">gizlilik politikasında</Link>.</>,
                                    },
                                    {
                                        t: 'Güvenlik açığı',
                                        d: <>Bulduğunuz açığı yayınlamadan önce bize bildirin; hızlıca kapatıp size dönüş yapalım.</>,
                                    },
                                    {
                                        t: 'Eğitmen olmak',
                                        d: <>Süreç ve kazanç modeli <Link to="/become-instructor" className="text-brand-700 font-medium hover:underline">eğitmen sayfasında</Link> anlatılıyor.</>,
                                    },
                                ].map(item => (
                                    <div key={item.t} className="pl-4 border-l-2 border-slate-200 hover:border-brand-400 transition-colors">
                                        <dt className="text-[14px] font-semibold text-slate-800">{item.t}</dt>
                                        <dd className="text-[14.5px] text-slate-600 leading-[1.7] mt-1">{item.d}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Contact;
