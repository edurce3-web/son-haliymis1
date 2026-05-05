import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Megaphone, Plus, Pencil, Trash2, BookOpen, Loader2,
    Calendar, ChevronDown, ChevronUp, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
            const r = await fetch('/api/instructor/courses', { headers: { Authorization: `Bearer ${token()}` } });
            return r.json();
        }
    });

    // Duyuruları getir
    const { data, isLoading } = useQuery({
        queryKey: ['instructor-announcements'],
        queryFn: async () => {
            const r = await fetch('/api/instructor/announcements', { headers: { Authorization: `Bearer ${token()}` } });
            if (!r.ok) throw new Error('Duyurular yüklenemedi');
            return r.json();
        }
    });

    // Oluştur
    const createMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch('/api/instructor/announcements', {
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
            toast.success('Duyuru oluşturuldu!');
        },
        onError: () => toast.error('Duyuru oluşturulamadı.')
    });

    // Güncelle
    const updateMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`/api/instructor/announcements/${editingId}`, {
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
            toast.success('Duyuru güncellendi!');
        },
        onError: () => toast.error('Güncelleme başarısız.')
    });

    // Sil
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const r = await fetch(`/api/instructor/announcements/${id}`, {
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
            toast.error('Başlık ve içerik zorunludur.');
            return;
        }
        if (!editingId && !form.course_id) {
            toast.error('Kurs seçmelisiniz.');
            return;
        }
        editingId ? updateMutation.mutate() : createMutation.mutate();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Duyuru Merkezi</h1>
                    <p className="text-sm text-slate-400 mt-1">Öğrencilerinize kurs duyuruları gönderin</p>
                </div>
                {!showForm && (
                    <Button
                        onClick={() => { setShowForm(true); setEditingId(null); setForm({ course_id: '', title: '', content: '' }); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 font-bold shadow-md shadow-indigo-200"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Yeni Duyuru
                    </Button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-black text-slate-800">
                            {editingId ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Oluştur'}
                        </h2>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {!editingId && (
                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Kurs Seç</label>
                            <select
                                value={form.course_id}
                                onChange={(e) => setForm(f => ({ ...f, course_id: e.target.value }))}
                                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Kurs seçin...</option>
                                {courses.map((c: any) => (
                                    <option key={c.course_id || c.id} value={c.course_id || c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Duyuru Başlığı</label>
                        <Input
                            placeholder="Örn: Yeni ders eklendi!"
                            value={form.title}
                            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                            className="h-11 rounded-xl border-slate-200 text-sm font-medium"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">İçerik</label>
                        <Textarea
                            placeholder="Duyuru içeriğini yazın..."
                            value={form.content}
                            onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                            className="min-h-[140px] rounded-xl border-slate-200 text-sm resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl text-sm font-bold text-slate-400">
                            İptal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 font-bold"
                        >
                            {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Kaydediliyor</> : <><Check className="w-4 h-4 mr-2" />{editingId ? 'Güncelle' : 'Yayınla'}</>}
                        </Button>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                        <span className="text-sm text-slate-400 font-medium">Duyurular yükleniyor...</span>
                    </div>
                </div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Megaphone className="w-8 h-8 text-indigo-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Henüz duyuru yok</h3>
                    <p className="text-sm text-slate-400">İlk duyurunuzu oluşturmak için "Yeni Duyuru" butonuna tıklayın.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((ann: any) => {
                        const isExp = expandedId === ann.announcement_id;
                        return (
                            <div key={ann.announcement_id} className={cn("bg-white rounded-2xl border transition-all duration-300 overflow-hidden", isExp ? "border-indigo-100 shadow-lg" : "border-slate-100")}>
                                <button
                                    onClick={() => setExpandedId(isExp ? null : ann.announcement_id)}
                                    className="w-full text-left p-5 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                            <Megaphone className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">
                                                    <BookOpen className="w-3 h-3 mr-1" />{ann.course_title}
                                                </Badge>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(ann.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={(e) => { e.stopPropagation(); startEdit(ann); }} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center text-slate-400 transition-colors">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) deleteMutation.mutate(ann.announcement_id); }}
                                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            {isExp ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                                        </div>
                                    </div>
                                </button>
                                {isExp && (
                                    <div className="px-5 pb-5 border-t border-slate-50">
                                        <p className="text-sm text-slate-600 leading-relaxed mt-4 whitespace-pre-wrap">{ann.content}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
