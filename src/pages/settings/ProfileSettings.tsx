import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/user-avatar';
import ImageCropDialog from '@/components/ui/image-crop-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ProfileSettings: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Kırpma penceresine gidecek ham dosya
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        website_url: '',
        profile_image: '',
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                if (response.ok) {
                    const result = await response.json();
                    const u = result.user || {};
                    setFormData({
                        first_name: u.first_name || '',
                        last_name: u.last_name || '',
                        bio: u.bio || '',
                        website_url: u.website_url || '',
                        profile_image: u.profile_image || '',
                    });
                    return;
                }
            } catch { /* aşağıdaki yedeğe düş */ }

            setFormData(prev => ({
                ...prev,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                profile_image: (user as any).profile_image || '',
            }));
        };
        fetchUserData();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /** Dosya seçilince doğrudan yüklemiyoruz; önce kırpma penceresi açılıyor. */
    const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Lütfen bir görsel dosyası seç');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Dosya 10MB\'dan küçük olmalı');
            return;
        }
        setPendingFile(file);
    };

    /** Kırpılmış kare görseli yükler. */
    const uploadCropped = async (cropped: File) => {
        setPendingFile(null);
        setUploading(true);
        try {
            const body = new FormData();
            body.append('profileImage', cropped, cropped.name);

            const response = await fetch(`${API_BASE_URL}/instructor/upload-profile-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Yükleme başarısız');

            // Aynı adres önbellekten gelmesin diye sürüm damgası
            const url = `${data.url || data.profile_image}${(data.url || '').includes('?') ? '&' : '?'}v=${Date.now()}`;
            setFormData(prev => ({ ...prev, profile_image: url }));
            toast.success('Profil fotoğrafın güncellendi');
            refreshUser?.();
        } catch (error: any) {
            toast.error('Fotoğraf yüklenemedi', { description: error.message });
        } finally {
            setUploading(false);
        }
    };

    // Formu temizlemek yetmiyor; dosyanın depolamadan da silinmesi gerekiyor.
    const handleRemoveImage = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/instructor/profile-image`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!res.ok) throw new Error('Kaldırılamadı');

            setFormData(prev => ({ ...prev, profile_image: '' }));

            const stored = localStorage.getItem('user');
            if (stored) {
                const u = JSON.parse(stored);
                u.profile_image = null;
                localStorage.setItem('user', JSON.stringify(u));
            }
            refreshUser?.();
            toast.success('Profil fotoğrafı kaldırıldı');
        } catch (error: any) {
            toast.error('Fotoğraf kaldırılamadı', { description: error.message });
        }
    };

    const handleSave = async () => {
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            toast.error('Ad ve soyad boş bırakılamaz');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/${user?.user_id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                // Yalnızca sunucunun kabul ettiği alanlar; profile_image ayrı
                // uçtan yükleniyor, burada gönderilmiyor.
                body: JSON.stringify({
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    bio: formData.bio,
                    website_url: formData.website_url,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Güncelleme başarısız');

            toast.success('Profil bilgilerin güncellendi');
            refreshUser?.();
        } catch (error: any) {
            toast.error('Kaydedilemedi', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const fullName = `${formData.first_name} ${formData.last_name}`.trim();
    const inputClass =
        'w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors';

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Hesap profili</h1>
                <p className="text-slate-500 mt-1.5 text-sm">
                    Bu bilgiler herkese açık profilinde görünür.
                </p>
            </div>

            {/* Fotoğraf */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-6">
                    <UserAvatar src={formData.profile_image} name={fullName} size={88} />

                    <div className="min-w-0">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFilePick}
                            accept="image/*"
                            className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                disabled={uploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-xl"
                            >
                                {uploading
                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Yükleniyor</>
                                    : 'Fotoğraf seç'}
                            </Button>
                            {formData.profile_image && (
                                <Button
                                    variant="ghost"
                                    onClick={handleRemoveImage}
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl"
                                >
                                    Kaldır
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Seçtikten sonra kırpma penceresi açılır. JPG veya PNG, en fazla 10MB.
                        </p>
                    </div>
                </div>
            </section>

            {/* Bilgiler */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label htmlFor="first_name" className="text-sm font-medium text-slate-700">Ad</label>
                        <input
                            id="first_name" name="first_name" type="text"
                            className={inputClass} value={formData.first_name} onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="last_name" className="text-sm font-medium text-slate-700">Soyad</label>
                        <input
                            id="last_name" name="last_name" type="text"
                            className={inputClass} value={formData.last_name} onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="bio" className="text-sm font-medium text-slate-700">Biyografi</label>
                    <textarea
                        id="bio" name="bio" rows={4}
                        placeholder="Kendinden kısaca bahset…"
                        className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors resize-none"
                        value={formData.bio}
                        onChange={handleChange}
                    />
                    <p className="text-xs text-slate-400">Profil sayfanda adının altında görünür.</p>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="website_url" className="text-sm font-medium text-slate-700">Web sitesi</label>
                    <input
                        id="website_url" name="website_url" type="url"
                        placeholder="https://…"
                        className={inputClass} value={formData.website_url} onChange={handleChange}
                    />
                </div>
            </section>

            <Button
                onClick={handleSave}
                disabled={loading}
                className="h-11 px-6 rounded-xl bg-brand-700 hover:bg-brand-800 font-semibold"
            >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kaydediliyor</> : 'Değişiklikleri kaydet'}
            </Button>

            <ImageCropDialog
                file={pendingFile}
                onCancel={() => setPendingFile(null)}
                onCropped={uploadCropped}
                title="Profil fotoğrafını kırp"
            />
        </div>
    );
};

export default ProfileSettings;
