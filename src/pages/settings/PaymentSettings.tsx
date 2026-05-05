import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, PlusCircle } from 'lucide-react';

const PaymentSettings: React.FC = () => {
    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Ödeme Yöntemleri</h1>
                <p className="text-slate-500 mt-2">Kayıtlı kartlarınızı yönetin ve yeni ödeme yöntemleri ekleyin.</p>
            </div>

            {/* Eklenmiş herhangi bir ödeme yöntemi yok (Mock Tasarım) */}
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <CreditCard className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Kayıtlı Ödeme Yöntemi Yok</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">Hızlı ve güvenli işlemler için kredi/banka kartınızı buraya ekleyebilirsiniz.</p>

                <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl h-11 px-6 shadow-[0_8px_16px_-6px_rgba(79,70,229,0.3)] flex items-center gap-2 transition-all">
                    <PlusCircle className="w-5 h-5" /> Yeni Kart Ekle
                </Button>
            </div>
        </div>
    );
};

export default PaymentSettings;
