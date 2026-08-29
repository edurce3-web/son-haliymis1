import React, { useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Shield, Bell, CreditCard, History, XOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageBand from '@/components/layout/PageBand';

const SETTINGS_TABS = [
    { id: 'profile', label: 'Profil', icon: User, path: '/home/settings/profile' },
    { id: 'security', label: 'Güvenlik', icon: Shield, path: '/home/settings/security' },
    { id: 'notifications', label: 'Bildirimler', icon: Bell, path: '/home/settings/notifications' },
    { id: 'payment', label: 'Ödeme', icon: CreditCard, path: '/home/settings/payment' },
    { id: 'history', label: 'Satın alma geçmişi', icon: History, path: '/home/settings/history' },
    { id: 'close', label: 'Hesabı kapat', icon: XOctagon, path: '/home/settings/close', danger: true },
];

/**
 * Ayarlar sayfalarının çerçevesi.
 *
 * Sekmeler solda dikey bir listedeydi; altı kısa başlık için ekranın dörtte
 * birini harcıyor ve dar ekranda içeriğin üstünde uzun bir yığın oluşturuyordu.
 * Şimdi başlığın altında yatay bir şerit: aynı bilgi, tek satır.
 */
const SettingsLayout: React.FC = () => {
    const location = useLocation();
    const navRef = useRef<HTMLDivElement>(null);

    // Dar ekranda şerit kayabiliyor; seçili sekme görünür alana getiriliyor
    useEffect(() => {
        const active = navRef.current?.querySelector('[data-active="true"]');
        active?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }, [location.pathname]);

    const current = SETTINGS_TABS.find(t => location.pathname.startsWith(t.path));

    return (
        <div className="min-h-screen bg-white">
            <PageBand
                title="Ayarlar"
                breadcrumb={
                    <>
                        <span className="text-slate-500">Hesabım</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-700">{current?.label || 'Ayarlar'}</span>
                    </>
                }
            />

            {/* Sekme şeridi — bandın hemen altında, sayfayla aynı genişlikte */}
            <div className="border-b border-slate-200 bg-white sticky top-0 z-20">
                <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px]">
                    <div ref={navRef} className="flex gap-1 overflow-x-auto scrollbar-none">
                        {SETTINGS_TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = location.pathname.startsWith(tab.path);
                            return (
                                <NavLink
                                    key={tab.id}
                                    to={tab.path}
                                    data-active={isActive}
                                    className={cn(
                                        'relative flex items-center gap-2 px-4 py-3.5 text-[14px] font-semibold whitespace-nowrap transition-colors',
                                        isActive
                                            ? (tab.danger ? 'text-red-600' : 'text-brand-800')
                                            : (tab.danger
                                                ? 'text-red-400 hover:text-red-600'
                                                : 'text-slate-500 hover:text-slate-900')
                                    )}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {tab.label}
                                    {/* Seçili sekmenin altındaki çizgi */}
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'absolute left-3 right-3 bottom-0 h-[3px] rounded-t-full transition-opacity',
                                            tab.danger ? 'bg-red-500' : 'bg-brand-700',
                                            isActive ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-10">
                <main className="max-w-3xl">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SettingsLayout;
