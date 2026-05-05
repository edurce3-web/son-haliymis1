import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CloseAccountSettings: React.FC = () => {
    const [confirmText, setConfirmText] = useState('');

    const isMatch = confirmText === "Hesabımı Kalıcı Olarak Sil";

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-red-600">Hesabı Kapat</h1>
                <p className="text-slate-500 mt-2">Educre platformundaki üyeliğinizi kalıcı olarak sonlandırın.</p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-3xl p-6 lg:p-8 space-y-6 relative overflow-hidden">
                {/* Dekoratif Arka Plan (isteğe bağlı) */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 pointer-events-none">
                    <AlertTriangle className="w-64 h-64 text-red-500" />
                </div>

                <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-800">Ciddi Uyarı</h3>
                        <p className="text-sm text-red-700/80 mt-2 leading-relaxed font-medium">Hesabınızı kapatırsanız, şu andan itibaren satın aldığınız kurslara, geçmiş faturaya, favorilerinize, sertifikalarınıza ve edindiğiniz tüm deneyim puanlarına bir daha asla ulaşamazsınız. <span className="font-bold underline">Bu işlem geri alınamaz.</span></p>
                    </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-red-200/50">
                    <p className="text-sm font-semibold text-slate-800">Devam etmek istediğinize tamamen eminseniz kutucuğa işlemi onaylamak için aşağıdaki metni girin:</p>
                    <div className="bg-slate-100 px-4 py-2 rounded-lg mt-3 inline-block border border-slate-200 shadow-inner">
                        <code className="text-slate-600 font-bold tracking-tight select-all">Hesabımı Kalıcı Olarak Sil</code>
                    </div>

                    <div className="mt-4">
                        <input
                            type="text"
                            className="w-full h-12 px-4 border border-red-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 placeholder:text-slate-300 font-medium transition-all"
                            placeholder="Hesabımı Kalıcı Olarak Sil"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                        />
                    </div>
                </div>

                <div className="relative z-10 pt-4">
                    <Button
                        variant="destructive"
                        className={cn(
                            "w-full h-12 text-md font-bold rounded-xl transition-all shadow-[0_8px_16px_-6px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2",
                            !isMatch && "opacity-50 cursor-not-allowed shadow-none"
                        )}
                        disabled={!isMatch}
                    >
                        Hesabı Tamamen Kapat ve Verilerimi Sil
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CloseAccountSettings;
