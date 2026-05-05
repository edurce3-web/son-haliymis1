import React from 'react';
import { History, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PurchaseHistorySettings: React.FC = () => {
    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Satın Alma Geçmişi</h1>
                <p className="text-slate-500 mt-2">Daha önce satın aldığınız tüm kursları ve faturaları görüntüleyin.</p>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="grid grid-cols-5 md:grid-cols-6 gap-4 p-4 border-b border-slate-200 bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <div className="col-span-2 md:col-span-3">Kurs Adı</div>
                    <div>Tarih</div>
                    <div>Tutar</div>
                    <div className="text-right">Fatura</div>
                </div>

                {/* Mock Veri Listesi */}
                <div className="divide-y divide-slate-100">
                    {/* İlk Öğe */}
                    <div className="grid grid-cols-5 md:grid-cols-6 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-2 md:col-span-3">
                            <p className="text-sm font-semibold text-slate-800 line-clamp-1">Sıfırdan İleri Seviye Modern React Bootcamp</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Başarılı</span>
                        </div>
                        <div className="text-sm text-slate-600">
                            12 Mar 2026
                        </div>
                        <div className="text-sm font-bold text-indigo-600">
                            ₺349.00
                        </div>
                        <div className="text-right flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="Faturayı İndir">
                                <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full hidden md:flex" title="Detaylar">
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* İkinci Öğe */}
                    <div className="grid grid-cols-5 md:grid-cols-6 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-2 md:col-span-3">
                            <p className="text-sm font-semibold text-slate-800 line-clamp-1">Kapsamlı Python Veri Bilimi ve Makine Öğrenmesi Uygulamaları</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Başarılı</span>
                        </div>
                        <div className="text-sm text-slate-600">
                            28 Şub 2026
                        </div>
                        <div className="text-sm font-bold text-indigo-600">
                            ₺299.90
                        </div>
                        <div className="text-right flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="Faturayı İndir">
                                <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full hidden md:flex" title="Detaylar">
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Üçüncü Öğe */}
                    <div className="grid grid-cols-5 md:grid-cols-6 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-2 md:col-span-3">
                            <p className="text-sm font-semibold text-slate-800 line-clamp-1">UI/UX Tasarım Temelleri ve İleri Seviye Figma</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md">İade Edildi</span>
                        </div>
                        <div className="text-sm text-slate-600">
                            04 Şub 2026
                        </div>
                        <div className="text-sm font-bold text-slate-400 line-through">
                            ₺450.00
                        </div>
                        <div className="text-right flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="Faturayı İndir">
                                <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full hidden md:flex" title="Detaylar">
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PurchaseHistorySettings;
