import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import {
    Card, Empty, Loading, ErrorBox, Tag, Button, Field,
    inputClass, textareaClass, formatDate,
} from '../ui';

/**
 * Gizli kurs paylaşımı.
 *
 * Bir kursu bir hesaba elle açar. Normal kayıttan farkı: öğrenci sayısına
 * eklenmiyor, satış raporuna girmiyor ve öğrencinin Eğitimlerim sayfasında
 * ayrı bir rozetle görünüyor. Erişim yetkisi aynı — dersleri izliyor,
 * duyuruları alıyor.
 *
 * Arama kutuları en az iki (kurs) ve üç (kullanıcı) karakterden sonra
 * çalışıyor: daha kısa bir sorgu neredeyse tüm tabloyu döndürür ve seçim
 * yapmaya yaramaz.
 */
const CourseGrants: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await staffApi.grants({ limit: 100 });
            setItems(data.items);
            setTotal(data.total);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-7">
            <p className="text-[13.5px] text-slate-600 max-w-2xl leading-relaxed">
                Buradan verilen erişim satış sayılmaz: kursun öğrenci sayısına eklenmez,
                gelir raporuna girmez. Kullanıcı dersleri izleyebilir ve kurs duyurularını
                alır; Eğitimlerim sayfasında ayrı bir rozetle görünür.
            </p>

            {error && <ErrorBox message={error} />}

            {creating ? (
                <GrantForm
                    onCancel={() => setCreating(false)}
                    onDone={() => { setCreating(false); load(); }}
                />
            ) : (
                <Button variant="primary" onClick={() => setCreating(true)}>
                    Yeni paylaşım
                </Button>
            )}

            <section>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                    Paylaşılan kurslar ({total})
                </h2>

                {loading ? <Loading /> : items.length === 0 ? (
                    <Empty text="Henüz gizli paylaşım yok." />
                ) : (
                    <div className="space-y-2">
                        {items.map(g => (
                            <Card key={g.enrollment_id} className="p-4 flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="text-[14px] font-semibold text-slate-900">
                                            {g.course_title}
                                        </span>
                                        <Tag tone="info">gizli</Tag>
                                        {Number(g.progress_percentage) > 0 && (
                                            <Tag tone="ok">%{Math.round(Number(g.progress_percentage))} izlendi</Tag>
                                        )}
                                    </div>
                                    <p className="text-[12.5px] text-slate-500 mt-1">
                                        {g.user_name} · {g.email}
                                        <span className="mx-1.5 text-slate-300">·</span>
                                        {formatDate(g.enrollment_date)}
                                        {g.granted_by_name && (
                                            <>
                                                <span className="mx-1.5 text-slate-300">·</span>
                                                {g.granted_by_name}
                                            </>
                                        )}
                                    </p>
                                    {g.grant_note && (
                                        <p className="text-[12.5px] text-slate-600 mt-1.5 border-l-2 border-slate-200 pl-2.5">
                                            {g.grant_note}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    variant="danger"
                                    onClick={async () => {
                                        if (!confirm(`${g.email} hesabından "${g.course_title}" erişimi kaldırılsın mı?`)) return;
                                        try {
                                            await staffApi.revokeGrant(g.enrollment_id);
                                            load();
                                        } catch (e: any) { setError(e.message); }
                                    }}
                                >
                                    Kaldır
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const GrantForm: React.FC<{ onCancel: () => void; onDone: () => void }> = ({ onCancel, onDone }) => {
    const [courseQuery, setCourseQuery] = useState('');
    const [courseResults, setCourseResults] = useState<any[]>([]);
    const [course, setCourse] = useState<any>(null);

    const [userQuery, setUserQuery] = useState('');
    const [userResults, setUserResults] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);

    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Her tuşta istek atmamak için kısa bir bekleme
    useEffect(() => {
        if (course || courseQuery.trim().length < 2) { setCourseResults([]); return; }
        const t = setTimeout(() => {
            staffApi.searchGrantCourses(courseQuery.trim())
                .then(d => setCourseResults(d.items))
                .catch(() => setCourseResults([]));
        }, 300);
        return () => clearTimeout(t);
    }, [courseQuery, course]);

    useEffect(() => {
        if (user || userQuery.trim().length < 3) { setUserResults([]); return; }
        const t = setTimeout(() => {
            staffApi.searchGrantUsers(userQuery.trim())
                .then(d => setUserResults(d.items))
                .catch(() => setUserResults([]));
        }, 300);
        return () => clearTimeout(t);
    }, [userQuery, user]);

    const canSubmit = course && user && note.trim().length >= 5;

    return (
        <Card className="p-5 max-w-2xl">
            <h2 className="text-[15px] font-bold text-slate-900 mb-4">Yeni gizli paylaşım</h2>
            {error && <div className="mb-3"><ErrorBox message={error} /></div>}

            <div className="space-y-5">
                <Field label="Kurs" hint="En az 2 karakter yazın.">
                    {course ? (
                        <div className="flex items-center justify-between gap-3 h-9 px-3 rounded-md border border-slate-300 bg-slate-50">
                            <span className="text-[13.5px] text-slate-800 truncate">{course.title}</span>
                            <button
                                onClick={() => { setCourse(null); setCourseQuery(''); }}
                                className="text-[12.5px] font-semibold text-slate-500 hover:text-slate-900 shrink-0"
                            >
                                Değiştir
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                value={courseQuery}
                                onChange={e => setCourseQuery(e.target.value)}
                                placeholder="Kurs adı"
                                className={inputClass}
                            />
                            {courseResults.length > 0 && (
                                <div className="mt-1.5 rounded-md border border-slate-200 bg-white max-h-52 overflow-y-auto divide-y divide-slate-100">
                                    {courseResults.map(c => (
                                        <button
                                            key={c.course_id}
                                            onClick={() => setCourse(c)}
                                            className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="block text-[13.5px] text-slate-800 truncate">{c.title}</span>
                                            <span className="block text-[12px] text-slate-500">
                                                {c.instructor_name || 'eğitmen yok'} · {Number(c.price) > 0 ? `${c.price} ₺` : 'ücretsiz'} · {c.review_status}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </Field>

                <Field label="Kullanıcı" hint="E-posta veya ad soyad, en az 3 karakter.">
                    {user ? (
                        <div className="flex items-center justify-between gap-3 h-9 px-3 rounded-md border border-slate-300 bg-slate-50">
                            <span className="text-[13.5px] text-slate-800 truncate">
                                {user.name} · {user.email}
                            </span>
                            <button
                                onClick={() => { setUser(null); setUserQuery(''); }}
                                className="text-[12.5px] font-semibold text-slate-500 hover:text-slate-900 shrink-0"
                            >
                                Değiştir
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                value={userQuery}
                                onChange={e => setUserQuery(e.target.value)}
                                placeholder="ornek@mail.com"
                                className={inputClass}
                            />
                            {userResults.length > 0 && (
                                <div className="mt-1.5 rounded-md border border-slate-200 bg-white max-h-52 overflow-y-auto divide-y divide-slate-100">
                                    {userResults.map(u => (
                                        <button
                                            key={u.user_id}
                                            onClick={() => setUser(u)}
                                            className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="block text-[13.5px] text-slate-800 truncate">{u.name}</span>
                                            <span className="block text-[12px] text-slate-500">
                                                {u.email}
                                                {u.account_status !== 'active' && ` · ${u.account_status}`}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </Field>

                <Field label="Gerekçe" hint="Kayda geçer; en az 5 karakter.">
                    <textarea
                        rows={2}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Örn: iade sonrası telafi erişimi"
                        className={textareaClass}
                    />
                </Field>

                <div className="flex gap-2">
                    <Button
                        variant="primary"
                        disabled={!canSubmit || busy}
                        onClick={async () => {
                            setBusy(true);
                            setError(null);
                            try {
                                await staffApi.createGrant(course.course_id, user.user_id, note.trim());
                                onDone();
                            } catch (e: any) {
                                setError(e.message);
                            } finally {
                                setBusy(false);
                            }
                        }}
                    >
                        {busy ? '…' : 'Paylaş'}
                    </Button>
                    <Button onClick={onCancel} disabled={busy}>Vazgeç</Button>
                </div>
            </div>
        </Card>
    );
};

export default CourseGrants;
