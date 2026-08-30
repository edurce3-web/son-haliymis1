import React, { useCallback, useEffect, useState } from 'react';
import { staffApi, PERMISSIONS as P } from '../staffApi';
import type { StaffUser } from '../StaffPortal';
import {
    Card, Empty, Loading, ErrorBox, Tag, Button, Tabs, ReasonBox,
    inputClass, formatDate, relativeDays,
} from '../ui';

const STATUS_TABS = [
    { value: 'pending', label: 'Bekleyen' },
    { value: 'approved', label: 'Onaylı' },
    { value: 'rejected', label: 'Reddedilen' },
    { value: 'taken_down', label: 'Kaldırılan' },
];

const STATUS_TONE: Record<string, string> = {
    pending: 'warn', approved: 'ok', rejected: 'danger', taken_down: 'danger', draft: 'neutral',
};
const STATUS_LABEL: Record<string, string> = {
    pending: 'Bekliyor', approved: 'Onaylı', rejected: 'Reddedildi',
    taken_down: 'Kaldırıldı', draft: 'Taslak',
};

/**
 * Kurs inceleme kuyruğu.
 *
 * Liste ve ayrıntı aynı ekranda: moderatör kararı verirken müfredatı görmek
 * zorunda ve ayrı bir sayfaya gidip geri dönmek, kuyruktaki yerini kaybetmesi
 * demek.
 */
const CourseQueue: React.FC<{ staff: StaffUser }> = ({ staff }) => {
    const [status, setStatus] = useState('pending');
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openId, setOpenId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffApi.courses({ status, q: search, limit: 50 });
            setItems(data.items);
            setTotal(data.total);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [status, search]);

    useEffect(() => { load(); }, [load]);

    return (
        <div>
            <Tabs value={status} onChange={(v) => { setStatus(v); setOpenId(null); }} options={STATUS_TABS} />

            <div className="flex items-center gap-3 mb-4">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Kurs adı veya eğitmen ara"
                    className={`${inputClass} max-w-xs`}
                />
                <span className="text-[13px] text-slate-500 tabular-nums">{total} kayıt</span>
            </div>

            {error && <ErrorBox message={error} />}
            {loading ? <Loading /> : items.length === 0 ? (
                <Empty text={status === 'pending' ? 'İnceleme bekleyen kurs yok.' : 'Kayıt yok.'} />
            ) : (
                <div className="space-y-2">
                    {items.map(course => (
                        <CourseRow
                            key={course.course_id}
                            course={course}
                            staff={staff}
                            expanded={openId === course.course_id}
                            onToggle={() => setOpenId(openId === course.course_id ? null : course.course_id)}
                            onDecided={load}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CourseRow: React.FC<{
    course: any;
    staff: StaffUser;
    expanded: boolean;
    onToggle: () => void;
    onDecided: () => void;
}> = ({ course, staff, expanded, onToggle, onDecided }) => {
    const [detail, setDetail] = useState<any>(null);
    const [pending, setPending] = useState<null | 'approved' | 'rejected' | 'taken_down'>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!expanded || detail) return;
        staffApi.course(course.course_id).then(setDetail).catch(e => setError(e.message));
    }, [expanded, detail, course.course_id]);

    const decide = async (decision: string, note: string) => {
        setError(null);
        try {
            await staffApi.decideCourse(course.course_id, decision, note);
            setPending(null);
            onDecided();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const canTakedown = staff.permissions.includes(P.CONTENT_TAKEDOWN);

    return (
        <Card>
            <button
                onClick={onToggle}
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[14.5px] font-semibold text-slate-900">{course.title}</span>
                        <Tag tone={STATUS_TONE[course.review_status]}>{STATUS_LABEL[course.review_status]}</Tag>
                        {Number(course.student_count) > 0 && (
                            <Tag tone="info">{course.student_count} öğrenci</Tag>
                        )}
                    </div>
                    <p className="text-[12.5px] text-slate-500 mt-1.5">
                        {course.instructor_name || 'Eğitmen yok'}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {course.category_name || 'Kategorisiz'}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {course.lesson_count} ders
                        <span className="mx-1.5 text-slate-300">·</span>
                        {Number(course.price) > 0 ? `${course.price} ₺` : 'Ücretsiz'}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {relativeDays(course.created_at)}
                    </p>
                </div>
                <span className="text-slate-400 text-[13px] shrink-0 mt-0.5">{expanded ? '−' : '+'}</span>
            </button>

            {expanded && (
                <div className="border-t border-slate-200 p-4 bg-slate-50/60">
                    {error && <div className="mb-3"><ErrorBox message={error} /></div>}

                    {!detail ? <Loading /> : (
                        <>
                            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 mb-5">
                                <Meta label="Eğitmen" value={`${detail.course.instructor_name} <${detail.course.instructor_email}>`} />
                                <Meta label="Seviye" value={detail.course.level || '—'} />
                                <Meta label="Dil" value={detail.course.language || '—'} />
                                <Meta label="Oluşturulma" value={formatDate(detail.course.created_at)} />
                            </dl>

                            {detail.course.description && (
                                <div className="mb-5">
                                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Açıklama</p>
                                    <p className="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                                        {detail.course.description}
                                    </p>
                                </div>
                            )}

                            <div className="mb-5">
                                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Müfredat ({detail.lessons.length} ders)
                                </p>
                                <div className="rounded-md border border-slate-200 bg-white max-h-64 overflow-y-auto divide-y divide-slate-100">
                                    {detail.sections.map((section: any) => (
                                        <div key={section.section_id}>
                                            <p className="px-3 py-2 text-[12.5px] font-semibold text-slate-700 bg-slate-50">
                                                {section.title}
                                            </p>
                                            {detail.lessons
                                                .filter((l: any) => l.section_id === section.section_id)
                                                .map((lesson: any) => (
                                                    <LessonRow
                                                        key={lesson.lesson_id}
                                                        lesson={lesson}
                                                        canTakedown={canTakedown}
                                                        onChanged={() => setDetail(null)}
                                                    />
                                                ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {detail.history.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-2">Geçmiş</p>
                                    <ul className="space-y-1.5">
                                        {detail.history.slice(0, 6).map((h: any, i: number) => (
                                            <li key={i} className="text-[12.5px] text-slate-600">
                                                <span className="text-slate-400 tabular-nums">{formatDate(h.created_at)}</span>
                                                <span className="mx-2 text-slate-300">·</span>
                                                {h.summary}
                                                {h.actor_name && <span className="text-slate-400"> — {h.actor_name}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {pending ? (
                                <ReasonBox
                                    title={
                                        pending === 'approved' ? 'Onay notu (isteğe bağlı)'
                                            : pending === 'rejected' ? 'Red gerekçesi — eğitmene aynen iletilecek'
                                                : 'Kaldırma gerekçesi — eğitmene aynen iletilecek'
                                    }
                                    confirmLabel={
                                        pending === 'approved' ? 'Onayla ve yayınla'
                                            : pending === 'rejected' ? 'Reddet' : 'Yayından kaldır'
                                    }
                                    minLength={pending === 'approved' ? 0 : 10}
                                    danger={pending !== 'approved'}
                                    onCancel={() => setPending(null)}
                                    onConfirm={(note) => decide(pending, note)}
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {detail.course.review_status !== 'approved' && (
                                        <Button variant="primary" onClick={() => setPending('approved')}>
                                            Onayla ve yayınla
                                        </Button>
                                    )}
                                    {detail.course.review_status !== 'rejected' && (
                                        <Button onClick={() => setPending('rejected')}>Reddet</Button>
                                    )}
                                    {canTakedown && detail.course.review_status !== 'taken_down' && (
                                        <Button variant="danger" onClick={() => setPending('taken_down')}>
                                            Yayından kaldır
                                        </Button>
                                    )}
                                    <a
                                        href={`https://edurce.com/course/${detail.course.slug || detail.course.course_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-9 px-3.5 leading-9 rounded-md border border-slate-300 text-[13px] font-semibold text-slate-700 hover:border-slate-400"
                                    >
                                        Sitede aç
                                    </a>
                                </div>
                            )}

                            {detail.course.review_note && (
                                <p className="text-[12.5px] text-slate-500 mt-3">
                                    Son not: {detail.course.review_note}
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}
        </Card>
    );
};

const LessonRow: React.FC<{ lesson: any; canTakedown: boolean; onChanged: () => void }> = ({
    lesson, canTakedown, onChanged,
}) => {
    const [asking, setAsking] = useState(false);

    return (
        <div className="px-3 py-2">
            <div className="flex items-center justify-between gap-3">
                <span className={`text-[13px] truncate ${lesson.is_taken_down ? 'text-red-600 line-through' : 'text-slate-700'}`}>
                    {lesson.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    {lesson.is_free ? <Tag tone="info">önizleme</Tag> : null}
                    {lesson.video_status !== 'completed' && lesson.video_status !== 'processed' && (
                        <Tag tone="warn">{lesson.video_status}</Tag>
                    )}
                    {canTakedown && (
                        <button
                            onClick={() => lesson.is_taken_down
                                ? staffApi.lessonTakedown(lesson.lesson_id, false, '').then(onChanged)
                                : setAsking(true)}
                            className="text-[12px] font-semibold text-slate-500 hover:text-red-600"
                        >
                            {lesson.is_taken_down ? 'Geri al' : 'Kaldır'}
                        </button>
                    )}
                </div>
            </div>
            {asking && (
                <ReasonBox
                    title="Bu dersi yayından kaldır"
                    confirmLabel="Kaldır"
                    danger
                    onCancel={() => setAsking(false)}
                    onConfirm={async (note) => {
                        await staffApi.lessonTakedown(lesson.lesson_id, true, note);
                        setAsking(false);
                        onChanged();
                    }}
                />
            )}
        </div>
    );
};

const Meta: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="min-w-0">
        <dt className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
        <dd className="text-[13px] text-slate-800 mt-0.5 truncate">{value}</dd>
    </div>
);

export default CourseQueue;
