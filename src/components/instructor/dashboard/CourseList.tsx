import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Star, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { btn, field, Empty, Loading, PageHead, Panel, SearchBox, Tag, lira } from '../shell/kit';
import { relativeTime } from '../shell/useInstructorWorkspace';

type Status = 'active' | 'draft' | 'pending';

interface Course {
    id: string;
    title: string;
    thumbnail: string;
    students: number;
    revenue: number;
    rating: number;
    reviews: number;
    status: Status;
    lastUpdated: string;
    price: number;
}

const STATUS: Record<Status, { label: string; tone: 'live' | 'draft' | 'review' }> = {
    active: { label: 'Yayında', tone: 'live' },
    draft: { label: 'Taslak', tone: 'draft' },
    pending: { label: 'İncelemede', tone: 'review' },
};

export const CourseList: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                const res = await fetch(`${API_BASE_URL}/instructor/courses`, {
                    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    credentials: 'include',
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                if (data.success && Array.isArray(data.courses)) {
                    setCourses(data.courses.map((c: any) => ({
                        id: String(c.id || c.course_id),
                        title: c.title || 'Adsız kurs',
                        thumbnail: c.thumbnail || c.image_path || '',
                        students: Number(c.student_count || 0),
                        revenue: Number(c.price || 0) * Number(c.student_count || 0),
                        rating: Number(c.rating || 0),
                        reviews: Number(c.review_count || 0),
                        status: c.status === 'published' ? 'active' : c.status === 'draft' ? 'draft' : 'pending',
                        lastUpdated: c.updated_at || c.created_at || new Date().toISOString(),
                        price: Number(c.price || 0),
                    })));
                }
            } catch {
                toast.error('Kurslar yüklenemedi. Sayfayı yenileyip tekrar dene.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const live = courses.filter(c => c.status === 'active').length;
    const work = courses.length - live;

    const list = useMemo(() => {
        const q = query.trim().toLocaleLowerCase('tr-TR');
        return courses
            .filter(c => !q || c.title.toLocaleLowerCase('tr-TR').includes(q))
            .sort((a, b) => {
                if (sortBy === 'students') return b.students - a.students;
                if (sortBy === 'revenue') return b.revenue - a.revenue;
                const d = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
                return sortBy === 'oldest' ? -d : d;
            });
    }, [courses, query, sortBy]);

    // Yayındakiler üstte; taslak ve incelemedekiler ayrı bir grupta altta.
    const liveList = list.filter(c => c.status === 'active');
    const workList = list.filter(c => c.status !== 'active');

    if (loading) return <Loading label="Kursların yükleniyor" />;

    const create = (
        <Link to="/instructor/courses/create" className={cn(btn.primary, btn.md)}>
            <Plus className="w-4 h-4" /> Yeni kurs oluştur
        </Link>
    );

    if (courses.length === 0) {
        return (
            <>
                <PageHead title="Kurslarım" />
                <Empty
                    title="Henüz kursun yok"
                    text="İlk kursunu oluştur; bölümleri ve dersleri istediğin hızda ekle, hazır olduğunda incelemeye gönder."
                    action={{ label: 'İlk kursunu oluştur', to: '/instructor/courses/create' }}
                />
            </>
        );
    }

    return (
        <>
            <PageHead
                title="Kurslarım"
                sub={`${work} kurs hazırlanıyor · ${live} kurs yayında`}
                actions={create}
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
                    <SearchBox value={query} onChange={setQuery} placeholder="Kurs ara" className="flex-1 sm:w-64" />
                    <label className="shrink-0">
                        <span className="sr-only">Sırala</span>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={cn(field, 'h-10 w-auto pr-8 font-semibold')}>
                            <option value="newest">Son düzenlenen</option>
                            <option value="oldest">En eski</option>
                            <option value="students">Öğrenci sayısı</option>
                            <option value="revenue">Gelir</option>
                        </select>
                    </label>
                </div>
            </div>

            {list.length === 0 ? (
                <Empty title="Bu aramayla eşleşen kurs yok" text="Arama kelimesini kısaltmayı dene." />
            ) : (
                <div className="space-y-9">
                    <Group
                        title="Yayında"
                        note="Onaylanmış, öğrencilerin satın alabildiği kurslar"
                        items={liveList}
                        empty="Henüz yayında kursun yok. İncelemeye gönderdiğin kurs onaylanınca burada görünür."
                    />
                    <Group
                        title="Hazırlanan"
                        note="Taslaklar ve incelemeyi bekleyenler"
                        items={workList}
                        empty="Hazırlanan kursun yok."
                    />
                </div>
            )}
        </>
    );
};

const Group: React.FC<{ title: string; note: string; items: Course[]; empty: string }> = ({ title, note, items, empty }) => (
    <section>
        <header className="flex items-baseline gap-3 mb-3">
            <h2 className="text-[19px] font-extrabold tracking-tight text-[#00201d]">{title}</h2>
            <span className="text-[14px] font-bold tabular-nums text-[#5f7774]">{items.length}</span>
            <span className="hidden sm:inline text-[13px] text-[#5f7774]">· {note}</span>
        </header>
        {items.length === 0 ? (
            <p className="rounded-2xl bg-[#ecfbf8] px-5 py-6 text-[14px] text-[#4a6360]">{empty}</p>
        ) : (
            <Panel className="divide-y divide-[#e8f2f0] overflow-hidden">
                {items.map(c => <Row key={c.id} course={c} />)}
            </Panel>
        )}
    </section>
);

const Row: React.FC<{ course: Course }> = ({ course: c }) => {
    const st = STATUS[c.status];
    const editing = c.status !== 'active';
    return (
        <div className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-[#f4fcfa] transition-colors duration-150">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
            <Link to={`/instructor/courses/edit/${c.id}`} tabIndex={-1} aria-hidden className="w-[88px] h-[50px] sm:w-[112px] sm:h-[63px] rounded-xl overflow-hidden bg-[#e3f6f2] shrink-0">
                {c.thumbnail ? (
                    <img
                        src={c.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : null}
            </Link>

            <div className="min-w-0 flex-1">
                <Link
                    to={`/instructor/courses/edit/${c.id}`}
                    className="block text-[15px] font-bold text-[#00201d] leading-snug line-clamp-2 hover:text-[#005c55]"
                >
                    {c.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Tag tone={st.tone}>{st.label}</Tag>
                    <span className="text-[12.5px] text-[#5f7774]" title={new Date(c.lastUpdated).toLocaleString('tr-TR')}>
                        Son düzenleme {relativeTime(c.lastUpdated)}
                    </span>
                </div>
            </div>
            </div>

            <dl className="hidden md:grid grid-cols-3 gap-6 shrink-0 text-right">
                <Fig label="Öğrenci" icon={<Users className="w-3.5 h-3.5" />} value={c.students.toLocaleString('tr-TR')} />
                <Fig
                    label="Puan"
                    icon={<Star className="w-3.5 h-3.5 fill-[#fea619] text-[#fea619]" />}
                    value={c.rating > 0 ? c.rating.toFixed(1).replace('.', ',') : '—'}
                />
                <Fig label="Fiyat" value={c.price > 0 ? lira(c.price) : 'Ücretsiz'} />
            </dl>

            <Link
                to={`/instructor/courses/edit/${c.id}`}
                className={cn(editing ? btn.primary : btn.outline, btn.md, 'shrink-0 self-start sm:self-auto ml-[102px] sm:ml-0 sm:w-[124px]')}
            >
                {editing ? 'Devam et' : 'Düzenle'}
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
        </div>
    );
};

const Fig: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="min-w-[64px]">
        <dt className="text-[11.5px] text-[#5f7774]">{label}</dt>
        <dd className="mt-0.5 inline-flex items-center gap-1 text-[14.5px] font-bold tabular-nums text-[#00201d]">
            {icon}{value}
        </dd>
    </div>
);
