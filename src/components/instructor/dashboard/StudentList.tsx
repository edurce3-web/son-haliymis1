import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { API_BASE_URL } from '@/lib/api';
import {
  Search, Users, BookOpen, TrendingUp, Loader2,
    Calendar, GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const StudentList: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'recent'>('all');

    const { data, isLoading } = useQuery({
        queryKey: ['instructor-students'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/instructor/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Öğrenci listesi alınamadı');
            return res.json();
        }
    });

    const students = (data?.students || []).filter((s: any) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term);
    });

    const totalStudents = data?.total || 0;
    const avgProgress = students.length
        ? Math.round(students.reduce((a: number, s: any) => a + (s.progress || 0), 0) / students.length)
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Öğrenci Listesi</h1>
                    <p className="text-sm text-slate-400 mt-1">Kurslarınıza kayıtlı tüm öğrenciler</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Toplam Öğrenci', value: totalStudents, icon: Users, color: 'indigo' },
                    { label: 'Ort. İlerleme', value: `%${avgProgress}`, icon: TrendingUp, color: 'emerald' },
                    { label: 'Kayıtlı Kurs', value: students.reduce((a: number, s: any) => a + (s.course_count || 0), 0), icon: BookOpen, color: 'violet' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
                        <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                            stat.color === 'indigo' ? 'bg-indigo-50' : stat.color === 'emerald' ? 'bg-emerald-50' : 'bg-violet-50'
                        )}>
                            <stat.icon className={cn("w-5 h-5", stat.color === 'indigo' ? 'text-indigo-500' : stat.color === 'emerald' ? 'text-emerald-500' : 'text-violet-500')} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900">{isLoading ? '—' : stat.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="İsim veya e-posta ile ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 h-11 rounded-xl bg-white border-slate-200 text-sm font-medium"
                    />
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                        <span className="text-sm text-slate-400 font-medium">Öğrenciler yükleniyor...</span>
                    </div>
                </div>
            ) : students.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <GraduationCap className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">
                        {search ? 'Arama sonucu bulunamadı' : 'Henüz öğrenci yok'}
                    </h3>
                    <p className="text-sm text-slate-400">
                        {search ? 'Farklı bir isim deneyin' : 'Kurslarınıza öğrenciler kayıt olduğunda burada görünecek'}
                    </p>
                </div>
            ) : (
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Öğrenci</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kurs</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İlerleme</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıt Tarihi</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {students.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm">
                                                        <AvatarImage src={s.avatar} />
                                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl">
                                                            {(s.name || '?').slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{s.name}</p>
                                                        <p className="text-[11px] text-slate-400">{s.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 text-sm font-black">
                                                    {s.course_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 min-w-[160px]">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-slate-400">TAMAMLANMA</span>
                                                        <span className="text-xs font-black text-indigo-600">%{s.progress}</span>
                                                    </div>
                                                    <Progress
                                                        value={s.progress}
                                                        className="h-1.5 bg-slate-100 [&>div]:bg-indigo-500 rounded-full"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {s.last_activity
                                                        ? new Date(s.last_activity).toLocaleDateString('tr-TR')
                                                        : '—'
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black rounded-lg px-3">
                                                    AKTİF
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
