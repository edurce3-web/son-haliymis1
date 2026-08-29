import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Loader2, Megaphone, MessageSquare, TrendingUp, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Prefs {
    email_announcement: boolean;
    email_message: boolean;
    email_sale: boolean;
}

const DEFAULTS: Prefs = {
    email_announcement: true,
    email_message: true,
    email_sale: true,
};

/** Kapatılabilen e-posta türleri. */
const OPTIONS: Array<{
    key: keyof Prefs;
    icon: React.ElementType;
    title: string;
    desc: string;
    /** Yalnızca eğitmenlere gösterilir */
    instructorOnly?: boolean;
}> = [
        {
            key: 'email_announcement',
            icon: Megaphone,
            title: 'Kurs duyuruları',
            desc: 'Kayıtlı olduğun kurslarda eğitmen duyuru yaptığında e-posta gönderelim.',
        },
        {
            key: 'email_message',
            icon: MessageSquare,
            title: 'Yeni mesajlar',
            desc: 'Sana mesaj geldiğinde e-posta gönderelim. Konuşmayı okuyana kadar aynı kişi için tekrar göndermeyiz.',
        },
        {
            key: 'email_sale',
            icon: TrendingUp,
            title: 'Kursun satıldığında',
            desc: 'Bir kursun satın alındığında e-posta gönderelim.',
            instructorOnly: true,
        },
    ];

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
    checked, onChange, disabled,
}) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${checked ? 'bg-brand-700' : 'bg-slate-300'}`}
    >
        <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                }`}
        />
    </button>
);

const NotificationSettings: React.FC = () => {
    const { user } = useAuth();
    const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
    const [initial, setInitial] = useState<Prefs>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const isInstructor = Boolean((user as any)?.is_instructor || (user as any)?.role === 'instructor');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/account/notification-preferences`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                const p = { ...DEFAULTS, ...(data.preferences || {}) };
                setPrefs(p);
                setInitial(p);
            } catch {
                toast.error('Tercihler yüklenemedi', { description: 'Varsayılan ayarlar gösteriliyor.' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const dirty = (Object.keys(prefs) as Array<keyof Prefs>).some(k => prefs[k] !== initial[k]);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/account/notification-preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(prefs),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const p = { ...DEFAULTS, ...(data.preferences || {}) };
            setPrefs(p);
            setInitial(p);
            toast.success('Bildirim tercihlerin kaydedildi');
        } catch {
            toast.error('Tercihler kaydedilemedi');
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

    const visible = OPTIONS.filter(o => !o.instructorOnly || isInstructor);

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-slate-400" /> Bildirim Ayarları
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Hangi durumlarda e-posta almak istediğini seç. Site içi bildirimler her
                    zaman gelir, yalnızca e-posta gönderimini kapatırsın.
                </p>
            </div>

            <section className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {visible.map(opt => (
                    <div key={opt.key} className="flex items-start justify-between gap-4 p-5">
                        <div className="flex gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <opt.icon className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900">{opt.title}</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                            </div>
                        </div>
                        <Toggle
                            checked={prefs[opt.key]}
                            onChange={v => setPrefs(p => ({ ...p, [opt.key]: v }))}
                        />
                    </div>
                ))}

                {/* İşlemsel e-postalar kapatılamaz — kullanıcının bilmesi gereken kayıtlar */}
                <div className="flex items-start justify-between gap-4 p-5 bg-slate-50/60">
                    <div className="flex gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Lock className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-700">Hesap ve satın alma</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Satın alma onayı, doğrulama kodları ve şifre değişikliği e-postaları.
                                Güvenlik gereği kapatılamaz.
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 pt-1">her zaman açık</span>
                </div>
            </section>

            <div className="flex items-center gap-3">
                <Button
                    onClick={save}
                    disabled={!dirty || saving}
                    className="h-10 px-6 rounded-xl bg-brand-700 hover:bg-brand-800"
                >
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kaydediliyor</> : 'Tercihleri kaydet'}
                </Button>
                {dirty && !saving && (
                    <button
                        onClick={() => setPrefs(initial)}
                        className="text-sm text-slate-500 hover:text-slate-700"
                    >
                        Geri al
                    </button>
                )}
            </div>
        </div>
    );
};

export default NotificationSettings;
