import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { staffApi, staffToken, StaffApiError, PERMISSIONS as P, isStaffPanelEnabled } from './staffApi';
import StaffLogin from './StaffLogin';
import StaffDashboard from './panels/StaffDashboard';
import CourseQueue from './panels/CourseQueue';
import UserManagement from './panels/UserManagement';
import ApplicationQueue from './panels/ApplicationQueue';
import ReportQueue from './panels/ReportQueue';
import AppealQueue from './panels/AppealQueue';
import DmcaQueue from './panels/DmcaQueue';
import ReviewIntegrity from './panels/ReviewIntegrity';
import Announcements from './panels/Announcements';
import StaffTeam from './panels/StaffTeam';
import AuditLog from './panels/AuditLog';

export interface StaffUser {
    user_id: number;
    name: string;
    email: string;
    role: string;
    roleLabel: string;
    permissions: string[];
}

interface Section {
    key: string;
    label: string;
    group: string;
    permission?: string;
    badge?: (counts: Record<string, number>) => number;
    render: (ctx: { staff: StaffUser }) => React.ReactNode;
}

const SECTIONS: Section[] = [
    {
        key: 'dashboard', label: 'Genel bakış', group: 'Panel',
        render: () => <StaffDashboard />,
    },
    {
        key: 'courses', label: 'Kurs incelemesi', group: 'İçerik',
        permission: P.CONTENT_REVIEW,
        badge: c => c.pendingCourses,
        render: ({ staff }) => <CourseQueue staff={staff} />,
    },
    {
        key: 'reviews', label: 'Şüpheli değerlendirmeler', group: 'İçerik',
        permission: P.REPORT_HANDLE,
        render: () => <ReviewIntegrity />,
    },
    {
        key: 'applications', label: 'Eğitmen başvuruları', group: 'Kullanıcılar',
        permission: P.INSTRUCTOR_VERIFY,
        badge: c => c.pendingApplications,
        render: () => <ApplicationQueue />,
    },
    {
        key: 'users', label: 'Hesaplar', group: 'Kullanıcılar',
        permission: P.USER_VIEW,
        render: ({ staff }) => <UserManagement staff={staff} />,
    },
    {
        key: 'reports', label: 'Şikâyetler', group: 'Destek',
        permission: P.REPORT_HANDLE,
        badge: c => c.openReports,
        render: () => <ReportQueue />,
    },
    {
        key: 'appeals', label: 'İtirazlar', group: 'Destek',
        permission: P.APPEAL_HANDLE,
        badge: c => c.openAppeals,
        render: () => <AppealQueue />,
    },
    {
        key: 'dmca', label: 'Telif bildirimleri', group: 'Destek',
        permission: P.DMCA_HANDLE,
        badge: c => c.openDmca,
        render: ({ staff }) => <DmcaQueue staff={staff} />,
    },
    {
        key: 'announcements', label: 'Duyurular', group: 'Destek',
        permission: P.ANNOUNCE_SEND,
        render: () => <Announcements />,
    },
    {
        key: 'team', label: 'Ekip', group: 'Yönetim',
        permission: P.STAFF_MANAGE,
        render: ({ staff }) => <StaffTeam staff={staff} />,
    },
    {
        key: 'audit', label: 'Denetim günlüğü', group: 'Yönetim',
        permission: P.AUDIT_VIEW,
        render: () => <AuditLog />,
    },
];

/**
 * Moderasyon paneli kabuğu.
 *
 * Ana uygulamanın Header/Footer'ından tamamen ayrı; paylaşılan tek şey Tailwind
 * yapılandırması. Panelin platformun geri kalanına benzemesi için bir sebep yok,
 * benzemesi ekran görüntülerinde ikisinin karışmasına yol açıyor.
 */
const StaffPortal: React.FC = () => {
    const [staff, setStaff] = useState<StaffUser | null>(null);
    const [checking, setChecking] = useState(true);
    const [active, setActive] = useState('dashboard');
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [blocked, setBlocked] = useState(false);

    const loadSession = useCallback(async () => {
        if (!staffToken.get()) { setChecking(false); return; }
        try {
            const data = await staffApi.me();
            setStaff(data.staff);
        } catch (e) {
            if (e instanceof StaffApiError && e.code === 'NETWORK_BLOCKED') setBlocked(true);
            staffToken.clear();
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => { loadSession(); }, [loadSession]);

    // Kuyruk sayıları hem rozetlerde hem genel bakışta kullanılıyor
    useEffect(() => {
        if (!staff) return;
        let cancelled = false;
        const load = async () => {
            try {
                const d = await staffApi.dashboard();
                if (!cancelled) setCounts(d.queues || {});
            } catch { /* rozet yoksa panel yine çalışır */ }
        };
        load();
        const timer = setInterval(load, 60000);
        return () => { cancelled = true; clearInterval(timer); };
    }, [staff, active]);

    const visible = useMemo(
        () => SECTIONS.filter(s => !s.permission || staff?.permissions.includes(s.permission)),
        [staff]
    );

    const groups = useMemo(() => {
        const map = new Map<string, Section[]>();
        for (const s of visible) {
            if (!map.has(s.group)) map.set(s.group, []);
            map.get(s.group)!.push(s);
        }
        return [...map.entries()];
    }, [visible]);

    const handleLogout = async () => {
        try { await staffApi.logout(); } catch { /* zaten düşmüş olabilir */ }
        staffToken.clear();
        setStaff(null);
    };

    if (!isStaffPanelEnabled()) {
        return <Blank text="Panel bu dağıtımda yapılandırılmamış." />;
    }
    if (blocked) {
        return <Blank text="Bu ağdan erişim yok." />;
    }
    if (checking) {
        return <Blank text="…" />;
    }
    if (!staff) {
        return <StaffLogin onAuthenticated={setStaff} />;
    }

    const current = visible.find(s => s.key === active) || visible[0];

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <div className="flex min-h-screen">
                {/* Yan gezinti */}
                <aside className="w-60 shrink-0 bg-slate-900 text-slate-300 flex flex-col">
                    <div className="px-5 py-5 border-b border-slate-800">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Edurce
                        </p>
                        <p className="text-[15px] font-bold text-white mt-0.5">Moderasyon</p>
                    </div>

                    <nav className="flex-1 overflow-y-auto py-3">
                        {groups.map(([group, items]) => (
                            <div key={group} className="mb-1">
                                <p className="px-5 pt-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-600">
                                    {group}
                                </p>
                                {items.map(item => {
                                    const badge = item.badge?.(counts) || 0;
                                    const isActive = current?.key === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => setActive(item.key)}
                                            className={[
                                                'w-full flex items-center justify-between gap-2 px-5 py-2 text-[13.5px] text-left transition-colors',
                                                isActive
                                                    ? 'bg-slate-800 text-white font-semibold'
                                                    : 'hover:bg-slate-800/50 hover:text-white',
                                            ].join(' ')}
                                        >
                                            <span className="truncate">{item.label}</span>
                                            {badge > 0 && (
                                                <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-slate-900 text-[11px] font-bold flex items-center justify-center">
                                                    {badge > 99 ? '99+' : badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    <div className="px-5 py-4 border-t border-slate-800">
                        <p className="text-[13px] font-semibold text-white truncate">{staff.name}</p>
                        <p className="text-[11.5px] text-slate-500 truncate">{staff.roleLabel}</p>
                        <button
                            onClick={handleLogout}
                            className="mt-3 text-[12.5px] font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Oturumu kapat
                        </button>
                    </div>
                </aside>

                <main className="flex-1 min-w-0 overflow-x-hidden">
                    <div className="px-8 py-7 max-w-[1400px]">
                        <h1 className="text-[22px] font-bold tracking-tight mb-6">{current?.label}</h1>
                        {current?.render({ staff })}
                    </div>
                </main>
            </div>
        </div>
    );
};

const Blank: React.FC<{ text: string }> = ({ text }) => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-sm text-slate-500">{text}</p>
    </div>
);

export default StaffPortal;
