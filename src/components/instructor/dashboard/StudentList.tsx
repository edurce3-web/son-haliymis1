import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { Empty, Initials, Loading, PageHead, Panel, SearchBox } from '../shell/kit';
import { relativeTime } from '../shell/useInstructorWorkspace';

export const StudentList: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['instructor-students'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/instructor/students`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Öğrenci listesi alınamadı');
            return res.json();
        },
    });

    const all: any[] = data?.students || [];
    const term = search.trim().toLocaleLowerCase('tr-TR');
    const students = all.filter(s =>
        !term ||
        s.name?.toLocaleLowerCase('tr-TR').includes(term) ||
        s.email?.toLocaleLowerCase('tr-TR').includes(term)
    );

    const total = data?.total || all.length;
    const avgProgress = all.length
        ? Math.round(all.reduce((a, s) => a + (Number(s.progress) || 0), 0) / all.length)
        : 0;

    if (isLoading) return <Loading label="Öğrencilerin yükleniyor" />;

    return (
        <>
            <PageHead
                title="Öğrenci listesi"
                sub={all.length
                    ? <><b className="font-bold text-[#00201d]">{Number(total).toLocaleString('tr-TR')} öğrenci</b> · ortalama ilerleme %{avgProgress}</>
                    : 'Kurslarına kayıtlı öğrenciler'}
                actions={all.length ? <SearchBox value={search} onChange={setSearch} placeholder="İsim veya e-posta ara" className="w-full sm:w-72" /> : undefined}
            />

            {isError ? (
                <Empty title="Liste yüklenemedi" text="Bağlantıda bir sorun oldu." action={{ label: 'Tekrar dene', onClick: () => refetch() }} />
            ) : all.length === 0 ? (
                <Empty title="Henüz öğrencin yok" text="Biri kursuna kayıt olduğunda burada, ilerlemesiyle birlikte görünecek." />
            ) : students.length === 0 ? (
                <Empty title="Bu aramayla eşleşen öğrenci yok" text="İsmin ya da e-postanın bir kısmını yazmayı dene." />
            ) : (
                <Panel as="section" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[640px]">
                            <thead>
                                <tr className="border-b border-[#e8f2f0] text-[12.5px] font-bold text-[#4a6360]">
                                    <th scope="col" className="px-5 sm:px-6 py-3.5 font-bold">Öğrenci</th>
                                    <th scope="col" className="px-4 py-3.5 font-bold text-right">Kurs</th>
                                    <th scope="col" className="px-4 py-3.5 font-bold w-[30%]">İlerleme</th>
                                    <th scope="col" className="px-5 sm:px-6 py-3.5 font-bold text-right">Son etkinlik</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eef5f3]">
                                {students.map(s => {
                                    const p = Math.max(0, Math.min(100, Number(s.progress) || 0));
                                    return (
                                        <tr key={s.id} className="hover:bg-[#f4fcfa] transition-colors">
                                            <td className="px-5 sm:px-6 py-3.5">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Initials name={s.name} src={s.avatar} size={36} />
                                                    <div className="min-w-0">
                                                        <p className="text-[14px] font-bold text-[#00201d] truncate">{s.name || 'Öğrenci'}</p>
                                                        <p className="text-[12.5px] text-[#5f7774] truncate">{s.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-[14px] font-bold tabular-nums text-[#00201d]">{s.course_count || 0}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex-1 h-2 rounded-full bg-[#e3f6f2] overflow-hidden" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
                                                        <span className="block h-full rounded-full bg-[#00201d]" style={{ width: `${p}%` }} />
                                                    </span>
                                                    <span className="w-10 text-right text-[13px] font-bold tabular-nums text-[#00201d]">%{p}</span>
                                                </div>
                                            </td>
                                            <td
                                                className="px-5 sm:px-6 py-3.5 text-right text-[13px] text-[#4a6360] whitespace-nowrap"
                                                title={s.last_activity ? new Date(s.last_activity).toLocaleString('tr-TR') : undefined}
                                            >
                                                {s.last_activity ? relativeTime(s.last_activity) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            )}
        </>
    );
};
