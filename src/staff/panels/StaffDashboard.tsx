import React, { useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Loading, ErrorBox } from '../ui';

/**
 * Genel bakış.
 *
 * Üstte bekleyen iş kuyrukları, altta son yedi günün moderatör etkinliği.
 * Kuyruk sayıları tıklanabilir değil; hangi bölüme gidileceği zaten soldaki
 * gezintide ve rozetleri orada da görünüyor.
 */
const StaffDashboard: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        staffApi.dashboard().then(setData).catch(e => setError(e.message));
    }, []);

    if (error) return <ErrorBox message={error} />;
    if (!data) return <Loading />;

    const queues = [
        { label: 'İnceleme bekleyen kurs', value: data.queues.pendingCourses },
        { label: 'Eğitmen başvurusu', value: data.queues.pendingApplications },
        { label: 'Açık şikâyet', value: data.queues.openReports },
        { label: 'Açık itiraz', value: data.queues.openAppeals },
        { label: 'Telif bildirimi', value: data.queues.openDmca },
    ];

    const health = [
        { label: 'Kısıtlı hesap', value: data.health.suspendedUsers },
        { label: 'Gizlenmiş yorum', value: data.health.hiddenReviews },
        { label: 'Bugün verilen kurs kararı', value: data.health.decidedToday },
    ];

    const maxActivity = Math.max(1, ...(data.activity || []).map((a: any) => a.count));

    return (
        <div className="space-y-7">
            <section>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                    Bekleyen iş
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {queues.map(q => (
                        <Card key={q.label} className="p-4">
                            <p className={`text-[30px] font-bold leading-none tabular-nums ${q.value > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                                {q.value}
                            </p>
                            <p className="text-[12.5px] text-slate-600 mt-2 leading-snug">{q.label}</p>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                    Platform durumu
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {health.map(h => (
                        <Card key={h.label} className="p-4">
                            <p className="text-[22px] font-bold text-slate-900 leading-none tabular-nums">{h.value}</p>
                            <p className="text-[12.5px] text-slate-600 mt-2">{h.label}</p>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                    Son 7 günde yapılan işlem
                </h2>
                <Card className="p-5">
                    {(data.activity || []).length === 0 ? (
                        <p className="text-[13.5px] text-slate-500">Henüz kayıt yok.</p>
                    ) : (
                        <div className="flex items-end gap-3 h-32">
                            {data.activity.map((a: any) => (
                                <div key={a.day} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full flex-1 flex items-end">
                                        <div
                                            className="w-full rounded-t bg-slate-800"
                                            style={{ height: `${Math.max(4, (a.count / maxActivity) * 100)}%` }}
                                            title={`${a.count} işlem`}
                                        />
                                    </div>
                                    <span className="text-[11px] text-slate-500 tabular-nums">
                                        {new Date(a.day).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </section>
        </div>
    );
};

export default StaffDashboard;
