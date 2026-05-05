import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SecuritySettings: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-6 h-6 text-indigo-500" /> Hesap Güvenliği
                </h1>
                <p className="text-slate-500 mt-2">Parolanızı değiştirebilir ve hesap güvenliğinizi güçlendirebilirsiniz.</p>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4">
                <ShieldAlert className="w-8 h-8 text-indigo-600 shrink-0" />
                <div>
                    <h3 className="text-sm font-bold text-slate-800">İki Faktörlü Doğrulama (2FA)</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">Hesabınızı korumak için iki faktörlü doğrulamayı etkinleştirmeniz önerilir.</p>
                    <Button size="sm" variant="outline" className="mt-4 border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg px-4 h-8 text-xs font-semibold">Etkinleştir</Button>
                </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-8 mt-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6">E-posta ve Parola</h2>
                <div className="space-y-2 mb-6 border-b border-slate-100 pb-6">
                    <label className="text-sm font-semibold text-slate-700">Mevcut E-posta</label>
                    <input type="email" readOnly className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-100/50 text-slate-500 cursor-not-allowed" defaultValue={user?.email || ''} />
                    <p className="text-xs text-slate-500 pt-1">Güvenlik gereği e-posta değişikliği için destek ile iletişime geçmelisiniz.</p>
                </div>

                <h2 className="text-lg font-bold text-slate-800 mb-6">Parola Değiştir</h2>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Mevcut Parola</label>
                    <input type="password" placeholder="••••••••" className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2 pt-2">
                    <label className="text-sm font-semibold text-slate-700">Yeni Parola</label>
                    <input type="password" placeholder="Yeni parola" className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Yeni Parola (Tekrar)</label>
                    <input type="password" placeholder="Yeni parola onayı" className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500" />
                </div>
            </div>

            <div className="pt-4">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 rounded-lg font-medium">Parolayı Güncelle</Button>
            </div>
        </div>
    );
};

export default SecuritySettings;
