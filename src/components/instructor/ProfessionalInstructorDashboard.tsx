import React, { useState } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, Users, Wallet, Settings,
    LogOut, Grid,
    MessageCircle, MessageSquare, ClipboardList, Star,
    Mail, Ticket, BarChart3, CreditCard, History,
    UserCircle, Shield, HelpCircle, Bell, ChevronDown, ChevronRight,
    Zap, Book, Library
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DashboardOverview } from './dashboard/DashboardOverview';
import { CourseList } from './dashboard/CourseList';
import { StudentList } from './dashboard/StudentList';
import { InstructorEarnings } from './dashboard/InstructorEarnings';
import { InstructorProfileSettings } from './dashboard/InstructorProfileSettings';
import { InstructorAccountSettings } from './dashboard/InstructorAccountSettings';
import { PlaceholderSection } from './dashboard/PlaceholderSection';
import { CreateCourseInitial } from '@/pages/instructor/CreateCourseInitial';
import AdvancedCourseCreator from '@/components/course/AdvancedCourseCreator';
import { InstructorQA } from './dashboard/InstructorQA';
import { InstructorAnnouncements } from './dashboard/InstructorAnnouncements';
import { InstructorReviews } from './dashboard/InstructorReviews';
import { InstructorMessages } from './dashboard/InstructorMessages';
import { BookManager } from './dashboard/BookManager';
import { CreateBook } from './dashboard/CreateBook';

import { InstructorSalesHistory } from './dashboard/InstructorSalesHistory';
import { InstructorPayoutSettings } from './dashboard/InstructorPayoutSettings';

// Removed unsued DashboardStats interface

export default function ProfessionalInstructorDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // Updated expandedMenus to include new structure sections
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['course-mgmt', 'book-mgmt', 'student-ops', 'finance', 'settings']);

    // Data fetching is now handled inside DashboardOverview

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
        );
    };

    // UPDATED MENU STRUCTURE with new URL pattern
    const menuStructure = [
        { id: 'dashboard', label: 'Panel', icon: LayoutDashboard, isMain: true, path: '/instructor/dashboard' },
        {
            id: 'course-mgmt',
            label: 'Kurs Yönetimi',
            icon: BookOpen,
            subItems: [
                { id: 'my-courses', label: 'Kurslarım', icon: Grid, path: '/instructor/courses/list' },
                { id: 'announcements', label: 'Duyurular', icon: Bell, path: '/instructor/courses/announcements' },
            ]
        },
        {
            id: 'book-mgmt',
            label: 'Kitap Yönetimi',
            icon: Library,
            subItems: [
                { id: 'my-books', label: 'E-Kitaplar', icon: Book, path: '/instructor/books/manage' },
            ]
        },
        {
            id: 'student-ops',
            label: 'Öğrenci İşlemleri',
            icon: Users,
            subItems: [
                { id: 'student-list', label: 'Öğrenci Listesi', icon: Users, path: '/instructor/students/list' },
                { id: 'qa', label: 'Soru & Cevap', icon: MessageCircle, path: '/instructor/students/qa' },
                { id: 'reviews', label: 'Yorumlar', icon: Star, path: '/instructor/students/reviews' },
                { id: 'messages', label: 'Mesaj Kutusu', icon: Mail, path: '/instructor/students/messages' },
            ]
        },
        {
            id: 'finance',
            label: 'Finansal Yönetim',
            icon: Wallet,
            subItems: [
                { id: 'earnings', label: 'Gelir Raporu', icon: BarChart3, path: '/instructor/finance/earnings' },
                { id: 'payout-settings', label: 'Ödeme Ayarları', icon: CreditCard, path: '/instructor/finance/payout' },
                { id: 'sales-history', label: 'Satış Geçmişi', icon: History, path: '/instructor/finance/sales' },
            ]
        },
        {
            id: 'settings',
            label: 'Profil & Ayarlar',
            icon: Settings,
            subItems: [
                { id: 'instructor-profile', label: 'Eğitmen Profili', icon: UserCircle, path: '/instructor/settings/profile' },
                { id: 'account-settings', label: 'Hesap Ayarları', icon: Shield, path: '/instructor/settings/account' },
                { id: 'help-support', label: 'Yardım & Destek', icon: HelpCircle, path: '/instructor/settings/help' },
            ]
        }
    ];

    // Determine active path - handle both exact match and dashboard root
    const isActive = (path: string) => {
        if (path === '/instructor/dashboard') {
            // Dashboard is active if we're at /instructor, /instructor/, or /instructor/dashboard
            return location.pathname === '/instructor/dashboard' ||
                location.pathname === '/instructor/dashboard/' ||
                location.pathname === '/instructor' ||
                location.pathname === '/instructor/';
        }
        return location.pathname === path;
    };
    return (
        <div className='flex min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900'>
            <aside className={cn(
                'fixed left-4 top-4 bottom-4 z-50 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col',
                'bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl overflow-hidden',
                isSidebarOpen ? 'w-[280px]' : 'w-[80px]'
            )}>
                <div className='p-6 flex flex-col gap-1 shrink-0'>
                    {isSidebarOpen ? (
                        <div className='flex-1 overflow-hidden min-w-0 animate-in fade-in duration-300'>
                            <h1 className='text-[16px] font-bold text-slate-800 tracking-tight truncate'>Eğitmen Paneli</h1>
                            <p className='text-[12px] text-slate-500 font-medium truncate'>Yönetim Ekranı</p>
                        </div>
                    ) : (
                        <div className='w-full flex justify-center'>
                            <div className='w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center'>
                                <span className='text-sm font-bold text-slate-600'>EP</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className='px-5 mb-6 shrink-0'>
                    <Button
                        variant='ghost'
                        className={cn(
                            'group transition-all duration-300 rounded-2xl flex items-center gap-3 border border-slate-200/50 bg-slate-50 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 hover:shadow-sm',
                            isSidebarOpen
                                ? 'w-full px-4 h-11 text-slate-500'
                                : 'w-11 h-11 px-0 justify-center mx-auto text-slate-500'
                        )}
                        onClick={() => navigate('/')}
                        title={!isSidebarOpen ? "Platforma Dön" : undefined}
                    >
                        <LogOut className={cn('w-[18px] h-[18px] transition-transform', isSidebarOpen ? 'group-hover:-translate-x-1' : '')} />
                        {isSidebarOpen && <span className='font-bold text-[13px]'>Platforma Dön</span>}
                    </Button>
                </div>

                <nav className='px-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar pb-6'>
                    {menuStructure.map((menu) => (
                        <div key={menu.id} className='space-y-1.5 relative'>
                            {menu.isMain ? (
                                <button onClick={() => navigate(menu.path!)} className={cn('w-full flex items-center gap-3 rounded-2xl transition-all duration-300 group relative', isSidebarOpen ? 'px-4 py-3.5' : 'mx-auto p-3 w-12 h-12 justify-center', isActive(menu.path!) ? 'bg-indigo-600 shadow-[0_8px_16px_rgba(79,70,229,0.25)] text-white' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900')} title={!isSidebarOpen ? menu.label : undefined}>
                                    <menu.icon className={cn('w-[20px] h-[20px] transition-colors', isActive(menu.path!) ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600')} />
                                    {isSidebarOpen && <span className={cn('text-[14px]', isActive(menu.path!) ? 'font-bold' : 'font-semibold')}>{menu.label}</span>}
                                </button>
                            ) : (
                                <>
                                    {isSidebarOpen && (
                                        <div className='px-4 mb-3 mt-6 flex justify-between items-center group cursor-pointer select-none' onClick={() => toggleMenu(menu.id)}>
                                            <span className='text-[10px] font-black text-slate-400 tracking-[0.15em] uppercase'>{menu.label}</span>
                                            {expandedMenus.includes(menu.id) ?
                                                <ChevronDown className='w-4 h-4 text-slate-300 transition-colors group-hover:text-slate-500' /> :
                                                <ChevronRight className='w-4 h-4 text-slate-300 transition-colors group-hover:text-slate-500' />
                                            }
                                        </div>
                                    )}
                                    {(!isSidebarOpen || expandedMenus.includes(menu.id)) && (
                                        <div className={cn('space-y-1.5', !isSidebarOpen && 'mt-5 pt-5 border-t border-slate-100')}>
                                            {menu.subItems?.map((sub) => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => navigate(sub.path!)}
                                                    className={cn(
                                                        'w-full flex items-center gap-3 rounded-2xl transition-all duration-300 group',
                                                        isSidebarOpen ? 'px-4 py-3' : 'p-3 justify-center mx-auto w-12 h-12 mb-2',
                                                        isActive(sub.path!)
                                                            ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50'
                                                            : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
                                                    )}
                                                    title={!isSidebarOpen ? sub.label : undefined}
                                                >
                                                    <sub.icon className={cn('w-[18px] h-[18px] transition-all relative z-10 shrink-0', isActive(sub.path!) ? 'text-indigo-600 scale-110' : 'text-slate-400 group-hover:text-indigo-500')} />
                                                    {isSidebarOpen && <span className={cn('text-[13px] truncate', isActive(sub.path!) ? 'font-bold' : 'font-semibold')}>{sub.label}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </nav>
                <div className='p-4 bg-slate-50/50 border-t border-slate-100/50 shrink-0'>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className='w-full flex items-center justify-center h-12 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all duration-300'
                        title={isSidebarOpen ? "Menüyü Daralt" : "Menüyü Genişlet"}
                    >
                        <ChevronRight className={cn('w-5 h-5 transition-transform duration-500 text-slate-400', isSidebarOpen && 'rotate-180')} />
                    </button>
                </div>
            </aside>
            <main className={cn('flex-1 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] min-h-screen flex flex-col', isSidebarOpen ? 'pl-[300px]' : 'pl-[100px]')}>
                <div className='p-10 pb-32 max-w-[1600px] mx-auto w-full'>
                    <Routes>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardOverview />} />
                        <Route path="courses/list" element={<CourseList />} />
                        <Route path="courses/edit/:id" element={<AdvancedCourseCreator />} />
                        <Route path="courses/announcements" element={<InstructorAnnouncements />} />
                        <Route path="students/list" element={<StudentList />} />
                        <Route path="students/qa" element={<InstructorQA onBack={() => navigate('/instructor/dashboard')} />} />
                        <Route path="books/manage" element={<BookManager />} />

                        <Route path="students/reviews" element={<InstructorReviews />} />
                        <Route path="students/messages" element={<InstructorMessages />} />
                        <Route path="finance/earnings" element={<InstructorEarnings />} />
                        <Route path="finance/payout" element={<InstructorPayoutSettings />} />
                        <Route path="finance/sales" element={<InstructorSalesHistory />} />
                        <Route path="settings/profile" element={<InstructorProfileSettings />} />
                        <Route path="settings/account" element={<InstructorAccountSettings />} />
                        <Route path="settings/help" element={<PlaceholderSection title="Yardım & Destek" onBack={() => navigate('/instructor/dashboard')} />} />
                        <Route path="*" element={
                            <div className='flex flex-col items-center justify-center py-32 text-center'>
                                <div className='w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-8'>
                                    <Zap className='w-10 h-10 text-slate-300' />
                                </div>
                                <h2 className='text-3xl font-black text-slate-900 tracking-tight'>Sayfa Bulunamadı</h2>
                                <Button variant='link' onClick={() => navigate('/instructor/dashboard')} className='mt-8 text-indigo-600 font-black text-sm'>
                                    PANELE GERİ DÖN
                                </Button>
                            </div>
                        } />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
