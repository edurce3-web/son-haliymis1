import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    /** Fotoğraf adresi. Yoksa/yüklenemezse baş harflere düşer. */
    src?: string | null;
    /** Tam ad — baş harfler bundan üretilir. */
    name?: string | null;
    /** Piksel cinsinden çap. */
    size?: number;
    className?: string;
}

/** "Ahmet Yılmaz" -> "AY", "Ahmet" -> "A" */
export const getInitials = (name?: string | null) => {
    const clean = (name || '').trim();
    if (!clean) return '?';
    return clean
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toLocaleUpperCase('tr-TR') || '')
        .join('') || '?';
};

// İsme göre sabit bir renk — aynı kişi her sayfada aynı renkte görünsün diye
const PALETTE = [
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
    'bg-teal-100 text-teal-700',
];

const colorFor = (name?: string | null) => {
    const s = (name || '').trim();
    if (!s) return PALETTE[0];
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return PALETTE[hash % PALETTE.length];
};

/**
 * Kullanıcı avatarı.
 * Fotoğraf varsa gösterir; yoksa veya yüklenemezse baş harf rozetine düşer.
 * Profil fotoğrafları private bucket'tan proxy üzerinden geldiği için
 * yükleme hatası olağan — bu yüzden fallback şart.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ src, name, size = 40, className }) => {
    const [failed, setFailed] = useState(false);
    const showImage = Boolean(src) && !failed;

    return showImage ? (
        <img
            src={src as string}
            alt={name || 'Kullanıcı'}
            loading="lazy"
            onError={() => setFailed(true)}
            style={{ width: size, height: size }}
            className={cn('rounded-full object-cover bg-slate-100 shrink-0', className)}
        />
    ) : (
        <span
            style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
            className={cn(
                'rounded-full flex items-center justify-center font-semibold shrink-0 select-none',
                colorFor(name),
                className
            )}
            aria-label={name || 'Kullanıcı'}
        >
            {getInitials(name)}
        </span>
    );
};

export default UserAvatar;
