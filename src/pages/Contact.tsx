import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/hooks/useSeo';
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
        'w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-[15px] focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15 transition-colors';

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-slate-200 bg-slate-50/70">
                <div className="container px-4 py-12 lg:py-16">
                    <nav className="text-xs text-slate-500 mb-4">
                        <Link to="/" className="hover:text-brand-700">Ana sayfa</Link>
                        <span className="mx-2 text-slate-300">/</span>
                        <span className="text-slate-700">İletişim</span>
                    </nav>
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">İletişim</h1>
                    <p className="text-[17px] text-slate-600 mt-4 max-w-2xl leading-relaxed">
                        Sorunuzu aşağıdaki formdan iletin. Mesajınız kayda alınır, size bir talep
                        numarası verilir ve en geç iki iş günü içinde dönüş yapılır.
                    </p>
                </div>
            </header>

            <div className="container px-4 py-12 lg:py-16">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

                    {/* Form */}
                    <div className="flex-1 max-w-2xl">
                        {ticketId !== null ? (
                            <div className="border border-brand-200 bg-brand-50/60 rounded-xl p-6">
                                <h2 className="text-lg font-bold text-slate-900">Mesajınız alındı</h2>
                                <p className="text-[15px] text-slate-700 mt-2 leading-relaxed">
                                    Talep numaranız <strong>#{ticketId}</strong>. Onay e-postası
                                    gönderdik; dönüşü de aynı adrese yapacağız.
                                </p>
                                <button
                                    onClick={() => setTicketId(null)}
                                    className="text-sm font-semibold text-brand-700 hover:underline mt-4"
                                >
                                    Yeni mesaj gönder
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="space-y-5">
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
                                        className="w-full p-3.5 rounded-lg border border-slate-300 bg-white text-[15px] leading-relaxed focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15 transition-colors resize-y"
                                    />
                                    <p className="text-xs text-slate-500">
                                        {form.message.length} / 5000 karakter
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 pt-1">
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
                    <aside className="lg:w-72 shrink-0 space-y-8">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 mb-3">Önce buraya bakın</h2>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                Soruların çoğunun yanıtı{' '}
                                <Link to="/help" className="text-brand-700 hover:underline">yardım merkezinde</Link>{' '}
                                var. Oradan çözemezseniz formu doldurun.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-sm font-bold text-slate-900 mb-3">Yanıt süresi</h2>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                Hafta içi mesajlara aynı gün, hafta sonu gelenlere pazartesi dönüş
                                yapmaya çalışıyoruz. En geç yanıt süremiz iki iş günüdür.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-sm font-bold text-slate-900 mb-3">Özel konular</h2>
                            <ul className="space-y-3 text-[15px] text-slate-600 leading-relaxed">
                                <li>
                                    <strong className="text-slate-800">Telif hakkı bildirimi:</strong>{' '}
                                    Hakkınızı ihlal eden içeriğin bağlantısını ve hak sahipliğinizi
                                    gösteren belgeyi ekleyin.
                                </li>
                                <li>
                                    <strong className="text-slate-800">Kişisel veri talebi:</strong>{' '}
                                    KVKK kapsamındaki taleplerinizi 30 gün içinde ücretsiz
                                    sonuçlandırıyoruz. Ayrıntılar{' '}
                                    <Link to="/privacy" className="text-brand-700 hover:underline">gizlilik politikasında</Link>.
                                </li>
                                <li>
                                    <strong className="text-slate-800">Güvenlik açığı:</strong>{' '}
                                    Bulduğunuz açığı yayınlamadan önce bize bildirin; hızlıca
                                    kapatıp size dönüş yapalım.
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-sm font-bold text-slate-900 mb-3">Eğitmen olmak</h2>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                Süreç ve kazanç modeli{' '}
                                <Link to="/become-instructor" className="text-brand-700 hover:underline">
                                    eğitmen sayfasında
                                </Link>{' '}
                                anlatılıyor.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Contact;
