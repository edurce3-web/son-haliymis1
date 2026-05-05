import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Shield, Bell, CreditCard, History, XOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

const SETTINGS_TABS = [
    { id: 'profile', label: 'Hesap Profili', icon: User, path: '/home/settings/profile' },
    { id: 'security', label: 'Hesap Güvenliği', icon: Shield, path: '/home/settings/security' },
    { id: 'notifications', label: 'Bildirim Ayarları', icon: Bell, path: '/home/settings/notifications' },
    { id: 'payment', label: 'Ödeme Yöntemleri', icon: CreditCard, path: '/home/settings/payment' },
    { id: 'history', label: 'Satın Alma Geçmişi', icon: History, path: '/home/settings/history' },
    { id: 'close', label: 'Hesabı Kapat', icon: XOctagon, path: '/home/settings/close', danger: true },
];

const SettingsLayout: React.FC = () => {
    const location = useLocation();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="sticky top-24">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 px-3">Ayarlar</h2>
                        <nav className="space-y-1">
                            {SETTINGS_TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = location.pathname.startsWith(tab.path);

                                return (
                                    <NavLink
                                        key={tab.id}
                                        to={tab.path}
                                        className={({ isActive }) => cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                            isActive
                                                ? (tab.danger ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600")
                                                : (tab.danger ? "text-red-500 hover:bg-red-50" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </NavLink>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 min-h-[500px]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SettingsLayout;
