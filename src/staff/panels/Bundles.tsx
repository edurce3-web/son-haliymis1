import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Button, Tag, Field, inputClass, textareaClass } from '../ui';

interface BundleCourse {
    id: number;
    title: string;
    price: number;
    status?: string;
    instructor_name?: string | null;
}

interface Bundle {
    id: number;
    title: string;
    description: string | null;
    price: number;
    is_active: boolean;
    list_total: number;
    savings_percent: number;
    total_hours: number;
    courses: BundleCourse[];
}

const MIN = 2;
const MAX = 5;

const lira = (n: number) =>
    `${(Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

/**
 * Kurs paketleri.
 *
 * Birkaç kursu tek fiyatla satmak için. Paket misafir ana sayfasında
 * "Yeni eklenenler" rafının altında görünüyor; alıcı ödeme sayfasında
 * hangi kursu kaça aldığını kalem kalem görüyor.
 *
 * Fiyat sunucuda doğrulanıyor: sıfırdan büyük ve kursların toplamından küçük
 * olmalı. Buradaki tasarruf hesabı yalnızca yazarken yol göstermek için.
 */
const Bundles: React.FC = () => {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState<Bundle | 'new' | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['staff-bundles'],
        queryFn: () => staffApi.bundles(),
    });

    const removeMutation = useMutation({
        mutationFn: (id: number) => staffApi.deleteBundle(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-bundles'] }),
    });

    const items: Bundle[] = data?.items || [];

    if (isLoading) return <Loading />;
    if (error) return <ErrorBox message={(error as Error).message} />;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Kurs paketleri</h1>
                    <p className="text-[13.5px] text-slate-500 mt-1 max-w-3xl leading-relaxed">
                        {MIN}-{MAX} yayındaki kursu tek fiyatla sat. Paket, misafir ana sayfasında
                        "Yeni eklenenler" rafının altında çıkar. Pakettekilerden birine zaten sahip
                        olan alıcıya o kurs düşülür ve fiyat aynı oranda iner. Bir kurs yayından
                        kalkarsa paket o kurs dönene kadar vitrinden kendiliğinden düşer.
                    </p>
                </div>
                {!editing && <Button variant="primary" onClick={() => setEditing('new')}>Yeni paket</Button>}
            </div>

            {editing && (
                <BundleForm
                    initial={editing === 'new' ? null : editing}
                    onDone={() => {
                        setEditing(null);
                        queryClient.invalidateQueries({ queryKey: ['staff-bundles'] });
                    }}
                    onCancel={() => setEditing(null)}
                />
            )}

            {items.length === 0 ? (
                <Card><Empty text="Henüz paket yok. 'Yeni paket' ile oluştur." /></Card>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {items.map(b => {
                        const offline = b.courses.some(c => c.status && c.status !== 'published');
                        return (
                            <Card key={b.id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="text-[15px] font-bold text-slate-900">{b.title}</h2>
                                        {b.description && (
                                            <p className="text-[12.5px] text-slate-500 mt-0.5 line-clamp-2">{b.description}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 shrink-0">
                                        {!b.is_active && <Tag tone="neutral">Kapalı</Tag>}
                                        {offline && <Tag tone="warn">Kursu yayında değil</Tag>}
                                        {b.is_active && !offline && <Tag tone="ok">Satışta</Tag>}
                                    </div>
                                </div>

                                <ol className="mt-3 space-y-1">
                                    {b.courses.map((c, i) => (
                                        <li key={c.id} className="flex justify-between gap-3 text-[13px]">
                                            <span className="truncate text-slate-700">{i + 1}. {c.title}</span>
                                            <span className="text-slate-400 tabular-nums shrink-0">{lira(c.price)}</span>
                                        </li>
                                    ))}
                                </ol>

                                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
                                    <p className="text-[13px] text-slate-600">
                                        <span className="line-through text-slate-400 mr-2">{lira(b.list_total)}</span>
                                        <span className="font-bold text-slate-900">{lira(b.price)}</span>
                                        <span className="ml-2 text-emerald-700 font-semibold">%{b.savings_percent} tasarruf</span>
                                    </p>
                                    <div className="flex gap-1.5">
                                        <Button onClick={() => setEditing(b)}>Düzenle</Button>
                                        <Button
                                            variant="danger"
                                            disabled={removeMutation.isPending}
                                            onClick={() => {
                                                if (window.confirm(`"${b.title}" paketi silinsin mi?`)) {
                                                    removeMutation.mutate(b.id);
                                                }
                                            }}
                                        >
                                            Sil
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const BundleForm: React.FC<{
    initial: Bundle | null;
    onDone: () => void;
    onCancel: () => void;
}> = ({ initial, onDone, onCancel }) => {
    const [title, setTitle] = useState(initial?.title || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [price, setPrice] = useState(initial ? String(initial.price) : '');
    const [isActive, setIsActive] = useState(initial ? initial.is_active : true);
    const [courses, setCourses] = useState<BundleCourse[]>(initial?.courses || []);
    const [term, setTerm] = useState('');

    const { data: search, isFetching } = useQuery({
        queryKey: ['bundle-course-search', term],
        queryFn: () => staffApi.searchShelfCourses(term),
    });

    const listTotal = useMemo(
        () => courses.reduce((s, c) => s + (Number(c.price) || 0), 0),
        [courses]
    );
    const numericPrice = Number(String(price).replace(',', '.')) || 0;
    const savings = listTotal > 0 && numericPrice > 0
        ? Math.round((1 - numericPrice / listTotal) * 100)
        : 0;

    const save = useMutation({
        mutationFn: () => {
            const body = {
                title,
                description,
                price: numericPrice,
                isActive,
                courseIds: courses.map(c => c.id),
            };
            return initial ? staffApi.updateBundle(initial.id, body) : staffApi.createBundle(body);
        },
        onSuccess: onDone,
    });

    const add = (row: any) => {
        if (courses.length >= MAX || courses.some(c => c.id === row.course_id)) return;
        setCourses([...courses, {
            id: row.course_id, title: row.title, price: Number(row.price) || 0,
            instructor_name: row.instructor_name,
        }]);
    };

    const move = (i: number, d: -1 | 1) => {
        const j = i + d;
        if (j < 0 || j >= courses.length) return;
        const next = [...courses];
        [next[i], next[j]] = [next[j], next[i]];
        setCourses(next);
    };

    const problem =
        title.trim().length < 3 ? 'Başlık en az 3 karakter olmalı'
            : courses.length < MIN ? `En az ${MIN} kurs seç`
                : !(numericPrice > 0) ? 'Paket fiyatını gir'
                    : numericPrice >= listTotal ? 'Paket fiyatı kursların toplamından düşük olmalı'
                        : null;

    return (
        <Card>
            <h2 className="text-[15px] font-bold text-slate-900 mb-4">
                {initial ? 'Paketi düzenle' : 'Yeni paket'}
            </h2>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <Field label="Başlık">
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            maxLength={160}
                            placeholder="Örn. Full-Stack Web Geliştirici Paketi"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Kısa açıklama">
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Paketin kime ve ne için olduğunu iki cümlede anlat."
                            className={textareaClass}
                        />
                    </Field>
                    <Field label="Paket fiyatı (₺)">
                        <input
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            inputMode="decimal"
                            placeholder="899"
                            className={inputClass}
                        />
                    </Field>
                    <label className="flex items-center gap-2 text-[13px] text-slate-700">
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                        Satışta (ana sayfada görünsün)
                    </label>

                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[13px] text-slate-600">
                        Kursların toplamı: <b className="text-slate-900">{lira(listTotal)}</b>
                        {savings > 0 && (
                            <span className="ml-2 text-emerald-700 font-semibold">→ %{savings} tasarruf</span>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-[12.5px] font-semibold text-slate-700 mb-1.5">
                        Paketteki kurslar ({courses.length}/{MAX}) — ilk sıradaki önde görünür
                    </p>
                    {courses.length === 0 ? (
                        <p className="text-[13px] text-slate-400 mb-3">Aşağıdan en az {MIN} kurs ekle.</p>
                    ) : (
                        <ol className="divide-y divide-slate-200 border border-slate-200 rounded-lg mb-3">
                            {courses.map((c, i) => (
                                <li key={c.id} className="flex items-center gap-2 px-3 py-2">
                                    <span className="text-[12px] font-bold text-slate-500 w-4">{i + 1}</span>
                                    <span className="flex-1 min-w-0 text-[13px] text-slate-800 truncate">{c.title}</span>
                                    <span className="text-[12px] text-slate-400 tabular-nums">{lira(c.price)}</span>
                                    <Button onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
                                    <Button onClick={() => move(i, 1)} disabled={i === courses.length - 1}>↓</Button>
                                    <Button variant="danger" onClick={() => setCourses(courses.filter(x => x.id !== c.id))}>×</Button>
                                </li>
                            ))}
                        </ol>
                    )}

                    <input
                        value={term}
                        onChange={e => setTerm(e.target.value)}
                        placeholder="Yayındaki kurslarda ara…"
                        className={inputClass}
                    />
                    <div className="mt-2 max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {isFetching && <p className="text-[12.5px] text-slate-400 py-2">Aranıyor…</p>}
                        {(search?.items || []).map((row: any) => {
                            const added = courses.some(c => c.id === row.course_id);
                            return (
                                <div key={row.course_id} className="flex items-center justify-between gap-2 py-2">
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-slate-900 truncate">{row.title}</p>
                                        <p className="text-[11.5px] text-slate-500 truncate">
                                            {row.instructor_name} · {lira(Number(row.price) || 0)}
                                        </p>
                                    </div>
                                    <Button
                                        disabled={added || courses.length >= MAX}
                                        onClick={() => add(row)}
                                    >
                                        {added ? 'Eklendi' : 'Ekle'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {save.isError && (
                <p className="text-[13px] text-red-600 mt-3">{(save.error as Error).message}</p>
            )}

            <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                {problem && <span className="text-[12.5px] text-slate-500 mr-auto">{problem}</span>}
                <Button onClick={onCancel}>Vazgeç</Button>
                <Button
                    variant="primary"
                    disabled={Boolean(problem) || save.isPending}
                    onClick={() => save.mutate()}
                >
                    {save.isPending ? 'Kaydediliyor…' : initial ? 'Kaydet' : 'Paketi oluştur'}
                </Button>
            </div>
        </Card>
    );
};

export default Bundles;
