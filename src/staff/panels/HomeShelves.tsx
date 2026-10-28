import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Button, Tag, inputClass, Tabs } from '../ui';

interface ShelfItem {
    id: number;
    slot: string;
    sort_order: number;
    course_id: number;
    title: string;
    slug: string | null;
    image_path: string | null;
    status: string;
    review_status: string | null;
    price: number | null;
    rating: number | null;
    student_count: number | null;
    instructor_name: string | null;
    category_name: string | null;
}

interface SearchRow {
    course_id: number;
    title: string;
    instructor_name: string | null;
    category_name: string | null;
    price: number | null;
    rating: number | null;
    student_count: number | null;
}

const SLOTS = [
    {
        key: 'featured',
        label: 'Öne çıkarılan kurslar',
        where: 'Hem misafir hem üye ana sayfasında, "Öne çıkarılan kurslar" başlığı altında.',
    },
    {
        key: 'recommended',
        label: 'Sizin için önerilenler',
        where: 'Yalnızca giriş yapmış kullanıcının ana sayfasında, en üstteki öneri şeridinde.',
    },
];

/**
 * Ana sayfa vitrini.
 *
 * Ana sayfadaki iki şerit buradan elle dolduruluyor. Geri kalan şeritler —
 * en çok tercih edilenler, yeni eklenenler, kategori rafları — kendiliğinden
 * hesaplanıyor; onları da elle yönetmek her yeni kursta panele girmeyi
 * gerektirirdi.
 *
 * Şerit boş bırakılırsa ana sayfada kaybolmuyor, otomatik listeye düşüyor.
 * Böylece buraya hiç girilmese bile ana sayfa dolu görünüyor.
 */
const HomeShelves: React.FC = () => {
    const [slot, setSlot] = useState('featured');

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Ana sayfa vitrini</h1>
                <p className="text-[13.5px] text-slate-500 mt-1 max-w-3xl leading-relaxed">
                    Ana sayfadaki iki şeridin içeriğini buradan seçiyorsun. Diğer şeritler
                    (en çok tercih edilenler, yeni eklenenler, kategori rafları) kendiliğinden
                    dolduğu için burada görünmüyor. Bir şeridi boş bırakırsan ana sayfada
                    kaybolmaz — otomatik listeye düşer.
                </p>
            </div>

            <Tabs
                value={slot}
                onChange={setSlot}
                options={SLOTS.map(s => ({ value: s.key, label: s.label }))}
            />

            <ShelfEditor slot={slot} />
        </div>
    );
};

const ShelfEditor: React.FC<{ slot: string }> = ({ slot }) => {
    const queryClient = useQueryClient();
    const [term, setTerm] = useState('');
    const [picking, setPicking] = useState(false);

    const meta = SLOTS.find(s => s.key === slot)!;

    const { data, isLoading, error } = useQuery({
        queryKey: ['home-shelves'],
        queryFn: () => staffApi.homeShelves(),
    });

    const items: ShelfItem[] = data?.[slot]?.items || [];

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['home-shelves'] });

    const addMutation = useMutation({
        mutationFn: (courseId: number) => staffApi.addToShelf(slot, courseId),
        onSuccess: () => { refresh(); setPicking(false); setTerm(''); },
    });

    const removeMutation = useMutation({
        mutationFn: (id: number) => staffApi.removeFromShelf(id),
        onSuccess: refresh,
    });

    const reorderMutation = useMutation({
        mutationFn: (ids: number[]) => staffApi.reorderShelf(slot, ids),
        onSuccess: refresh,
    });

    /** Sırayı yerelde değiştirip tüm diziyi gönderiyoruz; kısmi güncelleme
     *  iki moderatör aynı anda çalışınca sırayı bozabiliyordu. */
    const move = (index: number, direction: -1 | 1) => {
        const next = [...items];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        reorderMutation.mutate(next.map(i => i.id));
    };

    const { data: search, isFetching: searching } = useQuery({
        queryKey: ['shelf-search', term],
        queryFn: () => staffApi.searchShelfCourses(term),
        enabled: picking,
    });

    const alreadyIn = useMemo(
        () => new Set(items.map(i => i.course_id)),
        [items]
    );

    if (isLoading) return <Loading />;
    if (error) return <ErrorBox message={(error as Error).message} />;

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                        <h2 className="text-[15px] font-bold text-slate-900">{meta.label}</h2>
                        <p className="text-[13px] text-slate-500 mt-0.5">{meta.where}</p>
                        <p className="text-[12.5px] text-slate-400 mt-1">
                            {items.length === 0
                                ? 'Şu an boş — ana sayfada otomatik liste gösteriliyor.'
                                : `${items.length} kurs seçili. Sıralama ana sayfada da aynı.`}
                        </p>
                    </div>

                    <Button onClick={() => setPicking(v => !v)}>
                        {picking ? 'Kapat' : 'Kurs ekle'}
                    </Button>
                </div>

                {picking && (
                    <div className="mb-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <input
                            autoFocus
                            value={term}
                            onChange={e => setTerm(e.target.value)}
                            placeholder="Kurs adı ya da kategori ara…"
                            className={inputClass}
                        />

                        {addMutation.isError && (
                            <p className="text-[13px] text-rose-600 mt-2">
                                {(addMutation.error as Error).message}
                            </p>
                        )}

                        <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-200">
                            {searching && <p className="text-[13px] text-slate-400 py-3">Aranıyor…</p>}

                            {(search?.items || []).map((row: SearchRow) => {
                                const already = alreadyIn.has(row.course_id);
                                return (
                                    <div
                                        key={row.course_id}
                                        className="flex items-center justify-between gap-3 py-2.5"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[13.5px] font-semibold text-slate-900 truncate">
                                                {row.title}
                                            </p>
                                            <p className="text-[12px] text-slate-500 truncate">
                                                {[row.instructor_name, row.category_name].filter(Boolean).join(' · ')}
                                                {row.student_count ? ` · ${row.student_count} öğrenci` : ''}
                                            </p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            disabled={already || addMutation.isPending}
                                            onClick={() => addMutation.mutate(row.course_id)}
                                        >
                                            {already ? 'Eklendi' : 'Ekle'}
                                        </Button>
                                    </div>
                                );
                            })}

                            {!searching && (search?.items || []).length === 0 && (
                                <p className="text-[13px] text-slate-400 py-3">
                                    Eşleşen yayındaki kurs yok.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {items.length === 0 ? (
                    <Empty text="Bu şeritte henüz kurs yok. 'Kurs ekle' ile seç." />
                ) : (
                    <ol className="divide-y divide-slate-200">
                        {items.map((item, index) => (
                            <li key={item.id} className="flex items-center gap-3 py-3">
                                <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 text-[12px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                    {index + 1}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="text-[13.5px] font-semibold text-slate-900 truncate">
                                        {item.title}
                                    </p>
                                    <p className="text-[12px] text-slate-500 truncate">
                                        {[item.instructor_name, item.category_name].filter(Boolean).join(' · ')}
                                    </p>
                                </div>

                                {/* Yayından kalkan kurs ana sayfada çizilmiyor ama kaydı
                                    burada duruyor; tekrar yayına alınırsa geri gelsin. */}
                                {item.status !== 'published' && (
                                    <Tag tone="warn">Yayında değil</Tag>
                                )}

                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        disabled={index === 0 || reorderMutation.isPending}
                                        onClick={() => move(index, -1)}
                                    >
                                        ↑
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        disabled={index === items.length - 1 || reorderMutation.isPending}
                                        onClick={() => move(index, 1)}
                                    >
                                        ↓
                                    </Button>
                                    <Button
                                        variant="danger"
                                        disabled={removeMutation.isPending}
                                        onClick={() => removeMutation.mutate(item.id)}
                                    >
                                        Çıkar
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </Card>
        </div>
    );
};

export default HomeShelves;
