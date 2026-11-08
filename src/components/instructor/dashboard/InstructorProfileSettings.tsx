import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Camera, Facebook, Globe, Loader2, Plus, Twitter, X, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ImageCropDialog from '@/components/ui/image-crop-dialog';
import { btn, field, hint, label, Empty, Loading, PageHead, Panel, PanelHead } from '../shell/kit';

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
    // Seçilen dosya önce kırpma penceresine gider, sonra yüklenir
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // aynı dosya tekrar seçilebilsin
        if (!file) return;

        if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
            return toast.error('Yalnızca JPEG, PNG ya da WebP yükleyebilirsin');
        }
        if (file.size > 10 * 1024 * 1024) {
            return toast.error('Fotoğraf en fazla 10 MB olabilir');
        }
        // Doğrudan yüklemiyoruz; önce kırpma penceresi açılıyor
        setPendingFile(file);
    };

    /** Kırpılmış kare görseli yükler. */
    const uploadCropped = async (file: File) => {
        setPendingFile(null);
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

    const addExpertise = (e?: React.SyntheticEvent) => {
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
                toast.success('Profilin kaydedildi');
            } else {
                toast.error(result.error || 'Profil kaydedilemedi.');
            }
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            toast.error('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
        } finally {
            setSaving(false);
        }
    };


    if (loading) return <Loading label="Profilin yükleniyor" />;

    if (!profile) {
        return (
            <>
                <PageHead title="Eğitmen profili" />
                <Empty title="Profil yüklenemedi" text="Sayfayı yenile; düzelmezse Yardım sayfasından bize yaz." action={{ label: 'Sayfayı yenile', onClick: () => window.location.reload() }} />
            </>
        );
    }

    const photo = (photoUrl ?? profile.profile_image) as string | null;
    const fullName = `${formData.first_name} ${formData.last_name}`.trim();

    return (
        <>
            <PageHead title="Eğitmen profili" sub="Öğrencilerin kurs sayfasında seni böyle görüyor" />

            <form
                onSubmit={e => { e.preventDefault(); handleSave(); }}
                className="grid lg:grid-cols-[300px_1fr] gap-6 items-start"
            >
                {/* Önizleme: öğrencinin gördüğü kart */}
                <aside className="lg:sticky lg:top-8 rounded-2xl bg-[#9cf2e8] p-6 text-center">
                    <div className="relative w-28 h-28 mx-auto">
                        {photo ? (
                            <img src={photo} alt="" className="w-28 h-28 rounded-full object-cover ring-4 ring-white/70" />
                        ) : (
                            <span className="w-28 h-28 rounded-full bg-[#00201d] text-[#9cf2e8] text-[36px] font-extrabold flex items-center justify-center">
                                {(formData.first_name[0] || '') + (formData.last_name[0] || '') || '?'}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={photoBusy}
                            aria-label="Fotoğraf yükle"
                            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#00201d] text-[#9cf2e8] flex items-center justify-center ring-4 ring-[#9cf2e8] hover:bg-[#03302b] transition-colors disabled:opacity-60"
                        >
                            {photoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                    />

                    <p className="mt-4 text-[19px] font-extrabold tracking-tight text-[#00201d] text-balance">{fullName || 'Adın'}</p>
                    <p className="mt-0.5 text-[13.5px] font-semibold text-[#1d4a45] text-balance">{formData.title || 'Unvanın'}</p>
                    {formData.expertise.length > 0 && (
                        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                            {formData.expertise.slice(0, 6).map(x => (
                                <span key={x} className="px-2.5 py-1 rounded-full bg-white/60 text-[12px] font-bold text-[#00201d]">{x}</span>
                            ))}
                        </div>
                    )}

                    <div className="mt-5 pt-4 border-t border-[#00201d]/10 flex flex-col items-center gap-1">
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photoBusy} className={cn(btn.ghost, btn.sm, 'hover:bg-white/50')}>
                            {photo ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}
                        </button>
                        {photo && (
                            <button type="button" onClick={handlePhotoRemove} disabled={photoBusy} className={cn(btn.ghost, btn.sm, 'hover:bg-white/50 hover:text-[#b42318]')}>
                                Fotoğrafı kaldır
                            </button>
                        )}
                        <p className="text-[12px] text-[#1d4a45] mt-1">JPEG, PNG ya da WebP · en fazla 10 MB</p>
                    </div>
                </aside>

                <div className="space-y-6 min-w-0">
                    <Panel as="section">
                        <PanelHead title="Hakkında" />
                        <div className="p-5 sm:p-6 space-y-5">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="pf-first" className={label}>Ad</label>
                                    <input id="pf-first" name="first_name" value={formData.first_name} onChange={handleChange} className={cn(field, 'h-11')} autoComplete="given-name" />
                                </div>
                                <div>
                                    <label htmlFor="pf-last" className={label}>Soyad</label>
                                    <input id="pf-last" name="last_name" value={formData.last_name} onChange={handleChange} className={cn(field, 'h-11')} autoComplete="family-name" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="pf-title" className={label}>Unvan</label>
                                <input id="pf-title" name="title" value={formData.title} onChange={handleChange} placeholder="Örnek: Yazılım geliştirici, 10 yıllık matematik öğretmeni" className={cn(field, 'h-11')} />
                            </div>
                            <div>
                                <label htmlFor="pf-bio" className={label}>Biyografi</label>
                                <textarea id="pf-bio" name="bio" value={formData.bio} onChange={handleChange} rows={6}
                                    placeholder="Kim olduğunu, ne öğrettiğini ve neden seninle öğrenmeleri gerektiğini birkaç cümleyle anlat."
                                    className={cn(field, 'py-3 resize-y leading-relaxed')} />
                                <p className={cn(hint, 'mt-1.5 text-right tabular-nums')}>{formData.bio.length} karakter</p>
                            </div>
                            <div>
                                <label htmlFor="pf-exp" className={label}>Uzmanlık alanların</label>
                                <div className="flex gap-2">
                                    <input
                                        id="pf-exp"
                                        value={expertiseInput}
                                        onChange={e => setExpertiseInput(e.target.value)}
                                        placeholder="Örnek: JavaScript, pazarlama, tasarım"
                                        onKeyDown={e => { if (e.key === 'Enter') addExpertise(e); }}
                                        className={cn(field, 'h-11')}
                                    />
                                    <button type="button" onClick={addExpertise} className={cn(btn.outline, 'h-11 px-4 text-[13.5px] shrink-0')}>
                                        <Plus className="w-4 h-4" /> Ekle
                                    </button>
                                </div>
                                {formData.expertise.length > 0 && (
                                    <ul className="flex flex-wrap gap-2 mt-3">
                                        {formData.expertise.map(exp => (
                                            <li key={exp}>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExpertise(exp)}
                                                    aria-label={`${exp} alanını kaldır`}
                                                    className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full bg-[#e3f6f2] hover:bg-[#fff3f1] text-[13px] font-bold text-[#00201d] hover:text-[#b42318] transition-colors"
                                                >
                                                    {exp} <X className="w-3.5 h-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </Panel>

                    <Panel as="section">
                        <PanelHead title="Bağlantılar" sub="İstersen doldur; kurs sayfanda simge olarak görünür." />
                        <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-5">
                            {[
                                { icon: Globe, label: 'Web siten', name: 'website', val: formData.website, ph: 'https://' },
                                { icon: Youtube, label: 'YouTube', name: 'youtube', val: formData.youtube, ph: 'https://youtube.com/@...' },
                                { icon: Twitter, label: 'X (Twitter)', name: 'twitter', val: formData.twitter, ph: 'https://x.com/...' },
                                { icon: Facebook, label: 'Facebook', name: 'facebook', val: formData.facebook, ph: 'https://facebook.com/...' },
                            ].map(l => (
                                <div key={l.name}>
                                    <label htmlFor={`pf-${l.name}`} className={label}>{l.label}</label>
                                    <div className="relative">
                                        <l.icon aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5f7774]" />
                                        <input id={`pf-${l.name}`} type="text" inputMode="url" name={l.name} value={l.val} onChange={handleChange} placeholder={l.ph} className={cn(field, 'h-11 pl-10')} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <div className="sticky bottom-4 z-10 flex justify-end">
                        <button type="submit" disabled={saving} className={cn(btn.primary, btn.lg, 'min-w-[180px] shadow-[0_10px_24px_-10px_rgba(0,64,58,0.45)]')}>
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</> : 'Profili kaydet'}
                        </button>
                    </div>
                </div>
            </form>

            <ImageCropDialog
                file={pendingFile}
                onCancel={() => setPendingFile(null)}
                onCropped={uploadCropped}
                title="Profil fotoğrafını kırp"
            />
        </>
    );
};
