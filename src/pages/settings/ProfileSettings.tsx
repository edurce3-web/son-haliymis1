import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ProfileSettings: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        language: 'tr',
        profile_image: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    const userData = result.user;
                    setFormData({
                        first_name: userData.first_name || '',
                        last_name: userData.last_name || '',
                        bio: userData.bio || '',
                        language: userData.language || 'tr',
                        profile_image: userData.profile_image || ''
                    });
                } else {
                    setFormData(prev => ({
                        ...prev,
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        profile_image: user.profile_image || ''
                    }));
                }
            } catch (error) {
                setFormData(prev => ({
                    ...prev,
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    profile_image: user.profile_image || ''
                }));
            }
        };
        fetchUserData();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
            return;
        }

        try {
            toast.loading('Profil fotoğrafı yükleniyor...');
            const formDataUpload = new FormData();
            formDataUpload.append('profileImage', file, 'profile.jpg');

            const response = await fetch(`${API_BASE_URL}/instructor/upload-profile-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formDataUpload
            });

            const data = await response.json();

            if (response.ok) {
                setFormData(prev => ({ ...prev, profile_image: data.url || data.profile_image }));
                toast.dismiss();
                toast.success('Profil fotoğrafı başarıyla yüklendi!');
                if (refreshUser) refreshUser();
            } else {
                throw new Error(data.error || 'Yükleme başarısız');
            }
        } catch (error: any) {
            toast.dismiss();
            toast.error(`Bağlantı hatası: ${error.message}`);
        } finally {
            e.target.value = '';
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, profile_image: '' }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/${user?.user_id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success('Profil bilgileri güncellendi.');
                if (refreshUser) refreshUser();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Güncelleme başarısız');
            }
        } catch (error: any) {
            toast.error('Bir hata oluştu.', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Hesap Profili</h1>
                <p className="text-slate-500 mt-2">Kişisel bilgilerinizi ve profil fotoğrafınızı yönetin.</p>
            </div>

            <div className="flex gap-6 items-center border-b border-slate-100 pb-6">
                <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-400 font-bold text-2xl shrink-0">
                    {formData.profile_image ? (
                        <img src={formData.profile_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span>{formData.first_name?.[0]}{formData.last_name?.[0]}</span>
                    )}
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <Button variant="outline" className="mr-3 hover:bg-slate-50" onClick={() => fileInputRef.current?.click()}>
                        Fotoğraf Yükle
                    </Button>
                    {formData.profile_image && (
                        <Button variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleRemoveImage}>
                            Sil
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 border-b border-slate-100 pb-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Ad</label>
                    <input name="first_name" type="text" className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500" value={formData.first_name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Soyad</label>
                    <input name="last_name" type="text" className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500" value={formData.last_name} onChange={handleChange} />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Biyografi</label>
                    <textarea name="bio" rows={4} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 resize-none" placeholder="Kendinizden bahsedin..." value={formData.bio} onChange={handleChange}></textarea>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Dil</label>
                    <select name="language" className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500" value={formData.language} onChange={handleChange}>
                        <option value="tr">Türkçe</option>
                        <option value="en">İngilizce</option>
                        <option value="de">Almanca</option>
                    </select>
                </div>
            </div>

            <div className="pt-2">
                <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 rounded-lg">
                    {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
            </div>
        </div>
    );
};

export default ProfileSettings;
