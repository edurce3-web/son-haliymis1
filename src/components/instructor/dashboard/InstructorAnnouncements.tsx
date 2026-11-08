import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { ChevronDown, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { btn, field, label, Empty, Loading, PageHead, Panel, PanelHead } from '../shell/kit';

export function InstructorAnnouncements() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [form, setForm] = useState({ course_id: '', title: '', content: '' });

    const token = () => localStorage.getItem('token');

    // Kursları getir
    const { data: coursesData } = useQuery({
        queryKey: ['instructor-courses-ann'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/courses`, { headers: { Authorization: `Bearer ${token()}` } });
            return r.json();
        }
    });

    // Duyuruları getir
    const { data, isLoading } = useQuery({
        queryKey: ['instructor-announcements'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/announcements`, { headers: { Authorization: `Bearer ${token()}` } });
            if (!r.ok) throw new Error('Duyurular yüklenemedi');
            return r.json();
        }
    });

    // Oluştur
    const createMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ course_id: Number(form.course_id), title: form.title, content: form.content })
            });
            if (!r.ok) throw new Error('Duyuru oluşturulamadı');
            return r.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['instructor-announcements'] });
            setForm({ course_id: '', title: '', content: '' });
            setShowForm(false);
            toast.success('Duyurun yayınlandı');
        },
        onError: () => toast.error('Duyuru oluşturulamadı.')
    });

    // Güncelle
    const updateMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/announcements/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ title: form.title, content: form.content })
            });
            if (!r.ok) throw new Error('Güncellenemedi');
            return r.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['instructor-announcements'] });
            setEditingId(null);
            setShowForm(false);
            setForm({ course_id: '', title: '', content: '' });
            toast.success('Duyuru güncellendi');
        },
        onError: () => toast.error('Güncelleme başarısız.')
    });

    // Sil
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const r = await fetch(`${API_BASE_URL}/instructor/announcements/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (!r.ok) throw new Error('Silinemedi');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['instructor-announcements'] });
            toast.success('Duyuru silindi.');
        },
        onError: () => toast.error('Silme başarısız.')
    });

    const courses = coursesData?.courses || coursesData || [];
    const announcements = data?.announcements || [];

    const startEdit = (ann: any) => {
        setEditingId(ann.announcement_id);
        setForm({ course_id: ann.course_id, title: ann.title, content: ann.content });
        setShowForm(true);
        setExpandedId(null);
    };

    const handleSubmit = () => {
        if (!form.title.trim() || !form.content.trim()) {
            toast.error('Başlık ve duyuru metni boş olamaz.');
            return;
        }
        if (!editingId && !form.course_id) {
            toast.error('Önce duyurunun hangi kurs için olduğunu seç.');
            return;
        }
        editingId ? updateMutation.mutate() : createMutation.mutate();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ course_id: '', title: '', content: '' }); };

    if (isLoading) return <Loading label="Duyurular yükleniyor" />;

    return (
        <>
            <PageHead
                title="Duyurular"
                sub="Bir kursun bütün öğrencilerine aynı anda haber ver"
                actions={!showForm && (
                    <button
                        type="button"
                        onClick={() => { setShowForm(true); setEditingId(null); setForm({ course_id: '', title: '', content: '' }); }}
                        className={cn(btn.primary, btn.md)}
                    >
                        <Plus className="w-4 h-4" /> Yeni duyuru
                    </button>
                )}
            />

            {showForm && (
                <Panel as="section" className="mb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                    <PanelHead
                        title={editingId ? 'Duyuruyu düzenle' : 'Yeni duyuru'}
                        sub={editingId ? undefined : 'Seçtiğin kursun öğrencileri duyuruyu kurs sayfasında görür.'}
                        actions={
                            <button type="button" onClick={closeForm} className={cn(btn.ghost, 'w-9 h-9 p-0')} aria-label="Kapat">
                                <X className="w-4 h-4" />
                            </button>
                        }
                    />
                    <form
                        className="p-5 sm:p-6 space-y-5"
                        onSubmit={e => { e.preventDefault(); handleSubmit(); }}
                    >
                        {!editingId && (
                            <div>
                                <label htmlFor="ann-course" className={label}>Hangi kurs?</label>
                                <select
                                    id="ann-course"
                                    value={form.course_id}
                                    onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                                    className={cn(field, 'h-11')}
                                >
                                    <option value="">Kurs seç</option>
                                    {courses.map((c: any) => (
                                        <option key={c.course_id || c.id} value={c.course_id || c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label htmlFor="ann-title" className={label}>Başlık</label>
                            <input
                                id="ann-title"
                                placeholder="Örnek: 5. bölüme iki yeni ders eklendi"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className={cn(field, 'h-11')}
                            />
                        </div>
                        <div>
                            <label htmlFor="ann-content" className={label}>Duyuru metni</label>
                            <textarea
                                id="ann-content"
                                placeholder="Öğrencilerine ne söylemek istiyorsun?"
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                rows={6}
                                className={cn(field, 'py-3 resize-y leading-relaxed')}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={closeForm} className={cn(btn.ghost, btn.md)}>Vazgeç</button>
                            <button type="submit" disabled={isPending} className={cn(btn.primary, btn.md, 'min-w-[140px]')}>
                                {isPending
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</>
                                    : editingId ? 'Değişiklikleri kaydet' : 'Duyuruyu yayınla'}
                            </button>
                        </div>
                    </form>
                </Panel>
            )}

            {announcements.length === 0 ? (
                !showForm && (
                    <Empty
                        title="Henüz duyuru yapmadın"
                        text="Yeni ders eklediğinde ya da canlı bir etkinlik planladığında öğrencilerine buradan haber ver."
                        action={{ label: 'İlk duyuruyu yaz', onClick: () => setShowForm(true) }}
                    />
                )
            ) : (
                <Panel as="section" className="divide-y divide-[#e8f2f0]">
                    {announcements.map((ann: any) => {
                        const isExp = expandedId === ann.announcement_id;
                        return (
                            <article key={ann.announcement_id} className="group">
                                <div className="flex items-start gap-3 px-5 sm:px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(isExp ? null : ann.announcement_id)}
                                        aria-expanded={isExp}
                                        className="flex-1 min-w-0 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/45"
                                    >
                                        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px]">
                                            <span className="font-bold text-[#005c55]">{ann.course_title}</span>
                                            <span className="text-[#5f7774]">{new Date(ann.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </span>
                                        <span className="mt-1 flex items-center gap-2">
                                            <span className="text-[15.5px] font-bold text-[#00201d]">{ann.title}</span>
                                            <ChevronDown className={cn('w-4 h-4 text-[#5f7774] shrink-0 transition-transform duration-200', isExp && 'rotate-180')} />
                                        </span>
                                        {!isExp && (
                                            <span className="block mt-1 text-[13.5px] text-[#4a6360] line-clamp-1">{ann.content}</span>
                                        )}
                                    </button>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button type="button" onClick={() => startEdit(ann)} className={cn(btn.ghost, btn.sm)}>
                                            <Pencil className="w-3.5 h-3.5" /> Düzenle
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Duyuruyu sil"
                                            onClick={() => { if (confirm('Bu duyuru silinsin mi? Öğrencilerin artık göremeyecek.')) deleteMutation.mutate(ann.announcement_id); }}
                                            className={cn(btn.ghost, 'w-8 h-8 p-0 rounded-lg hover:bg-[#fff3f1] hover:text-[#b42318]')}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                {isExp && (
                                    <p className="px-5 sm:px-6 pb-5 -mt-1 text-[14.5px] text-[#1d3a37] leading-relaxed whitespace-pre-wrap max-w-[72ch]">
                                        {ann.content}
                                    </p>
                                )}
                            </article>
                        );
                    })}
                </Panel>
            )}
        </>
    );
}
