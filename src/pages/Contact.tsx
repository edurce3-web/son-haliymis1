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
        'w-full h-12 px-4 rounded-lg border border-slate-300 bg-white text-[15.5px] placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 transition-all';

    return (
        <div className="min-h-screen bg-white">
            <PageHeader
                title="İletişim"
                lead="Sorunuzu aşağıdaki formdan iletin. Mesajınız kayda alınır, size bir talep numarası verilir ve en geç iki iş günü içinde dönüş yapılır."
            />

            <div className="container px-4 py-16 lg:py-24">
                <div className="flex flex-col lg:flex-row gap-14 lg:gap-20">

                    {/* Form */}
                    <div className="flex-1 max-w-2xl">
                        {ticketId !== null ? (
                            <div className="rounded-xl border border-slate-200 px-8 py-10">
                                <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                                    Talep numaranız
                                </p>
                                <p className="font-montserrat text-[44px] font-extrabold text-brand-800 tracking-[-0.03em] leading-none mt-3">
                                    #{ticketId}
                                </p>
                                <h2 className="font-montserrat text-[20px] font-extrabold text-slate-900 tracking-tight mt-8">
                                    Mesajınız alındı
                                </h2>
                                <p className="text-[16px] text-slate-600 mt-3 leading-[1.8] max-w-md">
                                    Onay e-postası gönderdik; dönüşü de aynı adrese yapacağız. Bu
                                    numarayı saklarsanız takip etmek kolaylaşır.
                                </p>
                                <button
                                    onClick={() => setTicketId(null)}
                                    className="text-[15px] font-semibold text-brand-700 hover:text-brand-900 hover:underline mt-6"
                                >
                                    Yeni mesaj gönder
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="space-y-5">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="name" className="text-[14px] font-semibold text-slate-800">
                                            Ad soyad <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="name" required value={form.name}
                                            onChange={e => set('name', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className="text-[14px] font-semibold text-slate-800">
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
                                        <label htmlFor="subject" className="text-[14px] font-semibold text-slate-800">
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
                                        <label htmlFor="phone" className="text-[14px] font-semibold text-slate-800">
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
                                    <label htmlFor="message" className="text-[14px] font-semibold text-slate-800">
                                        Mesajınız <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="message" required rows={7} value={form.message}
                                        onChange={e => set('message', e.target.value)}
                                        placeholder="Sorununuzu mümkün olduğunca açık anlatın. Bir kursla ilgiliyse kursun adını, hata alıyorsanız hatanın tam metnini yazmanız çözümü hızlandırır."
                                        className="w-full p-4 rounded-lg border border-slate-300 bg-white text-[15.5px] leading-[1.7] placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 transition-all resize-y"
                                    />
                                    <p className="text-xs text-slate-500">
                                        {form.message.length} / 5000 karakter
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 pt-1">
                                    <Button
                                        type="submit"
                                        disabled={sending}
                                        className="h-12 px-8 rounded-lg bg-brand-700 hover:bg-brand-800 font-semibold text-[15px]"
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
                    <aside className="lg:w-72 shrink-0">
                        <div className="lg:sticky lg:top-28 space-y-9">
                            <div>
                                <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-3">
                                    Yanıt süresi
                                </p>
                                <p className="font-montserrat text-[34px] font-extrabold text-brand-800 tracking-[-0.03em] leading-none">
                                    2 iş günü
                                </p>
                                <p className="text-[15px] text-slate-600 leading-[1.75] mt-3">
                                    En geç yanıt süremiz. Hafta içi gelen mesajlara genellikle aynı
                                    gün, hafta sonu gelenlere pazartesi dönüş yapıyoruz.
                                </p>
                            </div>

                            <div className="border-t border-slate-200 pt-8">
                                <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-3">
                                    Önce buraya bakın
                                </p>
                                <p className="text-[15px] text-slate-600 leading-[1.75]">
                                    Soruların çoğunun yanıtı{' '}
                                    <Link to="/help" className="text-brand-700 font-medium hover:underline">yardım merkezinde</Link>{' '}
                                    var. Oradan çözemezseniz formu doldurun.
                                </p>
                            </div>

                            <div className="border-t border-slate-200 pt-8">
                                <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-4">
                                    Özel konular
                                </p>
                                <dl className="space-y-5">
                                    {[
                                        { t: 'Telif hakkı bildirimi', d: <>Hakkınızı ihlal eden içeriğin bağlantısını ve hak sahipliğinizi gösteren belgeyi ekleyin.</> },
                                        { t: 'Kişisel veri talebi', d: <>KVKK kapsamındaki talepler 30 gün içinde ücretsiz sonuçlandırılır. Ayrıntılar <Link to="/privacy" className="text-brand-700 font-medium hover:underline">gizlilik politikasında</Link>.</> },
                                        { t: 'Güvenlik açığı', d: <>Bulduğunuz açığı yayınlamadan önce bize bildirin; hızlıca kapatıp size dönüş yapalım.</> },
                                        { t: 'Eğitmen olmak', d: <>Süreç ve kazanç modeli <Link to="/become-instructor" className="text-brand-700 font-medium hover:underline">eğitmen sayfasında</Link> anlatılıyor.</> },
                                    ].map(item => (
                                        <div key={item.t}>
                                            <dt className="text-[15px] font-semibold text-slate-900">{item.t}</dt>
                                            <dd className="text-[15px] text-slate-600 leading-[1.75] mt-1">{item.d}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Contact;
