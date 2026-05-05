import React from 'react';
import { Trophy, Star, Target, Flame, ChevronRight, Award, Zap, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface GamificationDashboardProps {
    userId?: number;
}

const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ userId }) => {
    return (
        <div className="min-h-screen bg-[#f1f5f9] p-6 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            BAŞARILARIM <Trophy className="w-8 h-8 text-amber-500" />
                        </h1>
                        <p className="text-slate-500 font-medium">İlerlemeni takip et, rozetleri topla ve liderlik tablosunda yüksel!</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white p-4 px-8 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Toplam XP</span>
                            <span className="text-2xl font-black">12,450</span>
                        </div>
                        <div className="bg-white p-4 px-8 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Seviye</span>
                            <span className="text-2xl font-black">12</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Main Stats Area */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Level Progress */}
                        <section className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-end mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">12</div>
                                    <div>
                                        <h3 className="font-black text-xl">Usta Öğrenci</h3>
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">350 XP sonra Seviye 13</p>
                                    </div>
                                </div>
                                <span className="text-indigo-600 font-black">75%</span>
                            </div>
                            <Progress value={75} className="h-4 rounded-none bg-slate-100" indicatorClassName="bg-indigo-600" />
                        </section>

                        {/* Badges Grid */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-black border-l-8 border-indigo-600 pl-4 uppercase tracking-tight">Kazanılan Rozetler</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { icon: Flame, title: '7 Gün Aktif', color: 'text-orange-500' },
                                    { icon: Star, title: 'Hızlı Başlangıç', color: 'text-amber-500' },
                                    { icon: Zap, title: 'Pratik Zeka', color: 'text-indigo-500' },
                                    { icon: Target, title: 'İlk Kurs', color: 'text-green-500' },
                                ].map((badge, idx) => (
                                    <div key={idx} className="bg-white border-2 border-slate-200 p-6 flex flex-col items-center text-center group hover:border-slate-900 transition-all cursor-pointer">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <badge.icon className={`w-8 h-8 ${badge.color}`} />
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-tight">{badge.title}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-10">
                        {/* Leaderboard */}
                        <section className="bg-slate-900 text-white p-8 space-y-8 rounded-none border-t-8 border-indigo-500 shadow-2xl">
                            <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                                <Users className="w-5 h-5 text-indigo-400" /> Liderlik Tablosu
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { name: 'Ahmet Karasulu', xp: '15,800', pos: 1 },
                                    { name: 'Sizin Sıranız', xp: '12,450', pos: 2, me: true },
                                    { name: 'Ayşe Yılmaz', xp: '11,200', pos: 3 },
                                    { name: 'Caner Özcan', xp: '9,800', pos: 4 },
                                ].map((u, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 border-b border-white/10 ${u.me ? 'bg-white/10' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-indigo-400">#{u.pos}</span>
                                            <span className={`font-bold text-sm ${u.me ? 'text-indigo-300' : ''}`}>{u.name}</span>
                                        </div>
                                        <span className="font-mono text-xs">{u.xp} XP</span>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full text-center text-xs font-black uppercase text-slate-500 hover:text-white transition-colors py-2">
                                Tümünü Gör <ChevronRight className="inline w-3 h-3" />
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamificationDashboard;
