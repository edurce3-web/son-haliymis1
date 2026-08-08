import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Globe, Youtube, Twitter, Facebook, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export const InstructorProfileSettings: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Controlled form state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        title: '',
        bio: '',
        expertise: [] as string[],
        website: '',
        youtube: '',
        twitter: '',
        facebook: ''
    });

    const [expertiseInput, setExpertiseInput] = useState('');

    // --- Profil fotoğrafı ---------------------------------------------------
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photoBusy, setPhotoBusy] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // aynı dosya tekrar seçilebilsin
        if (!file) return;

        if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
            return toast.error('Sadece JPEG, PNG veya WebP yükleyebilirsiniz');
        }
        if (file.size > 10 * 1024 * 1024) {
            return toast.error('Fotoğraf en fazla 10 MB olabilir');
        }

        setPhotoBusy(true);
        try {
            const token = localStorage.getItem('token');
            const fd = new FormData();
            fd.append('profileImage', file);

            const res = await fetch(`${API_BASE_URL}/instructor/upload-profile-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Yüklenemedi');

            // Aynı adrese yazılırsa tarayıcı eski görseli cache'ten gösterebiliyor
            setPhotoUrl(`${data.url}?v=${Date.now()}`);
            toast.success('Profil fotoğrafı güncellendi', {
                description: 'Önceki fotoğrafın depolamadan silindi.',
            });

            // Menüdeki avatar da tazelensin
            const stored = localStorage.getItem('user');
            if (stored) {
                const u = JSON.parse(stored);
                u.profile_image = data.url;
                localStorage.setItem('user', JSON.stringify(u));
            }
        } catch (err: any) {
            toast.error('Fotoğraf yüklenemedi', { description: err.message });
        } finally {
            setPhotoBusy(false);
        }
    };

    const handlePhotoRemove = async () => {
        setPhotoBusy(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/instructor/profile-image`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Kaldırılamadı');

            setPhotoUrl(null);
            toast.success('Profil fotoğrafı kaldırıldı');

            const stored = localStorage.getItem('user');
            if (stored) {
                const u = JSON.parse(stored);
                u.profile_image = null;
                localStorage.setItem('user', JSON.stringify(u));
            }
        } catch (err: any) {
            toast.error('Kaldırılamadı', { description: err.message });
        } finally {
            setPhotoBusy(false);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/instructor/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        setProfile(result.profile);
                        setFormData({
                            first_name: result.profile.first_name || '',
                            last_name: result.profile.last_name || '',
                            title: result.profile.title || result.profile.instructor_title || '',
                            bio: result.profile.bio || result.profile.instructor_bio || '',
                            expertise: Array.isArray(result.profile.expertise) ? result.profile.expertise : [],
                            website: result.profile.website || '',
                            youtube: result.profile.youtube || '',
                            twitter: result.profile.twitter || '',
                            facebook: result.profile.facebook || ''
                        });
                    }
                } else {
                    console.error("fetch return not ok:", res.status);
                    toast.error("Profil bilgisi yüklenemedi, sunucu hatası");
                }
            } catch (error) {
                console.error("Profil verisi çekme hatası:", error);
                toast.error("Profil bilgisi yüklenirken ağ hatası oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const addExpertise = (e?: React.MouseEvent | React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = expertiseInput.trim();
        if (trimmed && !formData.expertise.includes(trimmed)) {
            setFormData(prev => ({ ...prev, expertise: [...prev.expertise, trimmed] }));
            setExpertiseInput('');
        }
    };

    const removeExpertise = (expToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            expertise: prev.expertise.filter(e => e !== expToRemove)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/instructor/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (res.ok) {
                toast.success('Değişiklikler başarıyla kaydedildi!');
            } else {
                toast.error(result.error || 'Profil kaydedilemedi.');
            }
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            toast.error('Bağlantı hatası.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return <div className="text-zinc-500">Profil verisi yüklenemedi. Yardım için lütfen destek ile iletişime geçin.</div>;
    }

    return (
        <div className='max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500'>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Profil Ayarları</h1>
                    <p className="text-zinc-500 text-sm">Platformdaki genel görünümünüzü ve kişisel bilgilerinizi yönetin.</p>
                </div>
            </div>

            <div className='flex flex-col md:flex-row gap-8 items-start'>
                <div className='flex flex-col items-center space-y-3 shrink-0'>
                    <div className='relative'>
                        <Avatar className='h-32 w-32 rounded-2xl border border-zinc-200 shadow-sm'>
                            {(photoUrl ?? profile.profile_image) && (
                                <AvatarImage src={(photoUrl ?? profile.profile_image) as string} className="object-cover" />
                            )}
                            <AvatarFallback className='text-3xl font-bold bg-zinc-100 text-zinc-600 rounded-2xl'>
                                {formData.first_name?.[0]}{formData.last_name?.[0]}
                            </AvatarFallback>
                        </Avatar>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handlePhotoSelect}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={photoBusy}
                            title="Fotoğraf yükle"
                            className='absolute -bottom-3 -right-3 w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-60'
                        >
                            {photoBusy
                                ? <Loader2 className='w-4 h-4 text-zinc-700 animate-spin' />
                                : <Camera className='w-4 h-4 text-zinc-700' />}
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={photoBusy}
                            className="text-xs font-medium text-zinc-700 hover:text-zinc-900 disabled:opacity-60"
                        >
                            {(photoUrl ?? profile.profile_image) ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}
                        </button>
                        {(photoUrl ?? profile.profile_image) && (
                            <button
                                type="button"
                                onClick={handlePhotoRemove}
                                disabled={photoBusy}
                                className="text-xs text-zinc-400 hover:text-red-500 disabled:opacity-60"
                            >
                                Kaldır
                            </button>
                        )}
                        <p className="text-[11px] text-zinc-400 text-center mt-1 max-w-[140px]">
                            JPEG, PNG veya WebP · en fazla 10 MB
                        </p>
                    </div>
                </div>

                <div className='flex-1 w-full space-y-6'>
                    <Card className='border border-zinc-200 shadow-sm rounded-xl bg-white overflow-hidden'>
                        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                            <h3 className="text-lg font-semibold text-zinc-900">Temel Bilgiler</h3>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className='grid md:grid-cols-2 gap-6'>
                                <div className='space-y-2'>
                                    <Label className='text-xs font-semibold text-zinc-700'>Ad</Label>
                                    <Input
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className='bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label className='text-xs font-semibold text-zinc-700'>Soyad</Label>
                                    <Input
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className='bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900'
                                    />
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-xs font-semibold text-zinc-700'>Unvan / Uzmanlık (Başvurudan)</Label>
                                <Input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className='bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900'
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-xs font-semibold text-zinc-700'>Biyografi</Label>
                                <Textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className='min-h-[120px] bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 resize-none'
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-xs font-semibold text-zinc-700'>Uzmanlık Alanları (İsteğe bağlı)</Label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={expertiseInput}
                                        onChange={(e) => setExpertiseInput(e.target.value)}
                                        placeholder="ör. JavaScript, Marketing, Tasarım (isteğe bağlı)"
                                        onKeyPress={(e) => e.key === 'Enter' && addExpertise(e)}
                                        className='bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900'
                                    />
                                    <Button
                                        type="button"
                                        onClick={addExpertise}
                                        variant="outline"
                                        className='border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                                    >
                                        Ekle
                                    </Button>
                                </div>
                                {formData.expertise.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 p-1">
                                        {formData.expertise.map((exp, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-none px-3 py-1 font-medium select-none"
                                                onClick={() => removeExpertise(exp)}
                                            >
                                                {exp} <span className="text-zinc-400 hover:text-red-500 ml-2 transition-colors">×</span>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='border border-zinc-200 shadow-sm rounded-xl bg-white overflow-hidden'>
                        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                            <h3 className="text-lg font-semibold text-zinc-900">Sosyal Medya & Linkler</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            {[
                                { icon: Globe, label: 'Kişisel Web Sitesi', name: 'website', val: formData.website },
                                { icon: Youtube, label: 'YouTube Profil Linki', name: 'youtube', val: formData.youtube },
                                { icon: Twitter, label: 'Twitter (X) Profil Linki', name: 'twitter', val: formData.twitter },
                                { icon: Facebook, label: 'Facebook Profil Linki', name: 'facebook', val: formData.facebook }
                            ].map((link, i) => (
                                <div key={i} className='flex gap-3'>
                                    <div className='w-10 h-10 shrink-0 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center'>
                                        <link.icon className='w-4 h-4 text-zinc-500' />
                                    </div>
                                    <div className='flex-1 space-y-1'>
                                        <Label className='text-xs text-zinc-500'>{link.label}</Label>
                                        <Input
                                            name={link.name}
                                            value={link.val}
                                            onChange={handleChange}
                                            className='h-9 text-sm bg-white border-zinc-200 focus-visible:ring-zinc-900'
                                            placeholder={`${link.label} linkini yapıştırın`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className='flex justify-end pt-2'>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className='bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg px-8'
                        >
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

