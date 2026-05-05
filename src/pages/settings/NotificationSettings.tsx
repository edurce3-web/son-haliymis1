import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const NotificationSettings: React.FC = () => {
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Bildirim Ayarları</h1>
                <p className="text-slate-500 mt-2">Hangi konularda e-posta ve site içi bildirim alacağınızı yönetin.</p>
            </div>

            <div className="space-y-8 bg-slate-50 border border-slate-100 p-6 rounded-2xl">

                <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
                    <div>
                        <h3 className="font-bold text-slate-800">Promosyon ve Fırsatlar</h3>
                        <p className="text-sm text-slate-500 mt-1">Sana özel indirimler, yeni kurslar ve öneriler hakkında e-posta gönder.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
                    <div>
                        <h3 className="font-bold text-slate-800">Kurs Güncellemeleri</h3>
                        <p className="text-sm text-slate-500 mt-1">Kayıtlı olduğunuz kurslarla ilgili duyurular, yeni dersler ve materyaller.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
                    <div>
                        <h3 className="font-bold text-slate-800">Soru ve Cevaplar</h3>
                        <p className="text-sm text-slate-500 mt-1">Kurs Soru&Cevap bölümündeki hareketlilik, sorduğunuz sorulara gelen yanıtlar.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-slate-800">Hesap Hareketleri</h3>
                        <p className="text-sm text-slate-500 mt-1">Satın alımlar, hesap güvenliği değişiklikleri (Zorunludur).</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-not-allowed shrink-0 opacity-60">
                        <input type="checkbox" className="sr-only peer" checked disabled />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-500"></div>
                    </label>
                </div>

            </div>

            <div className="pt-2">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 rounded-lg font-medium">Tercihleri Kaydet</Button>
            </div>
        </div>
    );
};

export default NotificationSettings;
