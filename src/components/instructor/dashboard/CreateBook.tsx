import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BookOpen, User, ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function CreateBook() {
    const qc = useQueryClient();
    const navigate = useNavigate();

    // Form States
    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState('');

    const token = () => localStorage.getItem('token');

    // ─── Mutation ──────────────────────────────────────────────────────────────
    const createDbMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch('/api/instructor/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`
                },
                body: JSON.stringify({
                    title,
                    author_name: authorName,
                    subtitle: '',
                    description: '',
                    price: 0,
                    has_copyright: false
                })
            });
            if (!r.ok) {
                const errData = await r.json().catch(() => null);
                throw new Error(errData?.error || 'Kaydedilemedi');
            }
            return r.json();
        },
        onSuccess: (data) => {
            toast.success('Kitap taslağı oluşturuldu!');
            qc.invalidateQueries({ queryKey: ['instructor-books'] });
            navigate(`/instructor/books/edit/${data.book_id}`); // Navigate to edit mode with ID
        },
        onError: (err) => {
            toast.error(err.message || 'Bir hata oluştu');
        }
    });

    const handleCreate = () => {
        if (!title.trim() || !authorName.trim()) return toast.error('Başlık ve Yazar Adı zorunludur');
        createDbMutation.mutate();
    };


    // ─── Render View: INITIAL CREATE ──────────────────────────────────────────
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50/50">
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button onClick={() => navigate('/instructor/dashboard')} className="flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 mb-2 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> İçerik Paneline Dön
                </button>

                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">E-Kitabını Oluştur</h1>
                    <p className="text-slate-500 font-medium text-lg">Eserinizin temel bilgilerini girerek ilk adımı atın.</p>
                </div>

                <div className="p-8 space-y-8">
                        {/* Book Title */}
                        <div className="space-y-3">
                            <Label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                Kitap Başlığı
                            </Label>
                            <Input
                                placeholder="Örn: Modern Javascript Geliştirme"
                                className="h-14 rounded-2xl bg-slate-50 border-0 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-lg px-6"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <p className="text-xs text-slate-400 font-medium px-2">Endişelenmeyin, başlığı daha sonra değiştirebilirsiniz.</p>
                        </div>

                        {/* Author Name */}
                        <div className="space-y-3">
                            <Label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-500" />
                                Yazar Adı
                            </Label>
                            <Input
                                placeholder="Kendi adınız veya mahlas"
                                className="h-14 rounded-2xl bg-slate-50 border-0 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-lg px-6"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                            />
                        </div>


                        <div className="pt-4">
                            <Button
                                onClick={handleCreate}
                                disabled={createDbMutation.isPending || !title.trim() || !authorName.trim()}
                                className="w-full h-16 rounded-[1.25rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-600/20 gap-3 transition-all active:scale-[0.98]"
                            >
                                {createDbMutation.isPending ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Devam Et (Taslak Oluştur)
                                        <ArrowRight className="w-6 h-6" />
                                    </>
                                )}
                            </Button>
                        </div>
                </div>
            </div>
        </div>
    );
}
