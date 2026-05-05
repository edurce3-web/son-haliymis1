import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, ArrowRight, Sparkles, BookOpen, Layers, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { COURSE_CATEGORIES } from '@/constants/categories';

export const CreateCourseInitial: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [subcategoryId, setSubcategoryId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const apiBase = (window as any)?.__API_BASE__ || (import.meta as any)?.env?.VITE_API_URL || 'https://api.edurce.com';

    const categories = COURSE_CATEGORIES;
    const selectedCategoryObj = categories.find(c => c.id.toString() === categoryId);
    const subcategories = selectedCategoryObj ? selectedCategoryObj.subcategories : [];

    const handleCreate = async () => {
        if (!title.trim() || !categoryId) {
            toast.error('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const res = await fetch(`${apiBase}/api/instructor/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    title,
                    category_id: categoryId,
                    subcategory_id: subcategoryId || null,
                    status: 'draft'
                }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Kurs taslağı oluşturuldu!');
                navigate(`/instructor/courses/edit/${data.id}`);
            } else {
                toast.error(data.error || 'Kurs oluşturulurken bir hata oluştu.');
            }
        } catch (err) {
            console.error('Create error:', err);
            toast.error('Sunucu bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50/50">
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button onClick={() => navigate('/instructor/dashboard')} className="flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 mb-2 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> İçerik Paneline Dön
                </button>
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Yeni Bir Serüvene Başla</h1>
                    <p className="text-slate-500 font-medium text-lg">Kursunun temel bilgilerini belirleyerek ilk adımı at.</p>
                </div>
                <div className="p-8 space-y-8">
                        {/* Course Title */}
                        <div className="space-y-3">
                            <Label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                Kurs Başlığı
                            </Label>
                            <Input
                                placeholder="Örn: Sıfırdan İleri Seviye React"
                                className="h-14 rounded-2xl bg-slate-50 border-0 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-lg px-6"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <p className="text-xs text-slate-400 font-medium px-2">Endişelenmeyin, başlığı daha sonra değiştirebilirsiniz.</p>
                        </div>

                        {/* Category & Subcategory */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-500" />
                                    Ana Kategori
                                </Label>
                                <Select onValueChange={setCategoryId} value={categoryId}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-0 focus:ring-4 focus:ring-indigo-50 font-bold px-6">
                                        <SelectValue placeholder="Kategori Seç" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()} className="font-bold py-3 rounded-xl cursor-pointer">
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                                    Alt Kategori (Opsiyonel)
                                </Label>
                                <Select onValueChange={setSubcategoryId} value={subcategoryId} disabled={!categoryId || subcategories.length === 0}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-0 focus:ring-4 focus:ring-indigo-50 font-bold px-6">
                                        <SelectValue placeholder={subcategories.length === 0 ? "Alt Kategori Yok" : "Alt Kategori Seç"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                        {subcategories.map((sub) => (
                                            <SelectItem key={sub.id} value={sub.id.toString()} className="font-bold py-3 rounded-xl cursor-pointer">
                                                {sub.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleCreate}
                                disabled={loading || !title.trim() || !categoryId}
                                className="w-full h-16 rounded-[1.25rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-600/20 gap-3 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Devam Et
                                        <ArrowRight className="w-6 h-6" />
                                    </>
                                )}
                            </Button>
                        </div>
                </div>
            </div>
        </div>
    );
};
