import React from 'react';
import {
    Bell, BookOpen, CornerDownRight, HelpCircle, Megaphone, MessageSquare,
    Settings, ShoppingBag, Star, Trophy, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Bildirim türü -> ikon ve renk tonu. Emoji kullanılmıyor.
 * Türler backend'de services/notificationService.js içindeki TYPES ile aynı.
 *
 * Üç sakin ton var: alışveriş ve öğrenme yeşil, iletişim mavi, geri kalanı
 * nötr gri. Her bildirime ayrı renk vermek listeyi alacalı yapıyordu.
 */

type Tone = 'green' | 'blue' | 'neutral';

const TONES: Record<Tone, { bg: string; fg: string }> = {
    green: { bg: 'bg-[#EEFBF3]', fg: 'text-[#1B7A43]' },
    blue: { bg: 'bg-[#EEF3FB]', fg: 'text-[#2F5FAF]' },
    neutral: { bg: 'bg-[#F1F3F5]', fg: 'text-[#374151]' },
};

const META: Record<string, { icon: React.ElementType; tone: Tone; label: string }> = {
    purchase: { icon: ShoppingBag, tone: 'green', label: 'Satın alma' },
    sale: { icon: TrendingUp, tone: 'green', label: 'Satış' },
    enrollment: { icon: BookOpen, tone: 'green', label: 'Kayıt' },
    achievement: { icon: Trophy, tone: 'green', label: 'Başarı' },
    message: { icon: MessageSquare, tone: 'blue', label: 'Mesaj' },
    question: { icon: HelpCircle, tone: 'blue', label: 'Soru' },
    answer: { icon: CornerDownRight, tone: 'blue', label: 'Cevap' },
    announcement: { icon: Megaphone, tone: 'neutral', label: 'Duyuru' },
    review: { icon: Star, tone: 'neutral', label: 'Değerlendirme' },
    system: { icon: Settings, tone: 'neutral', label: 'Sistem' },
};

export const notificationMeta = (type: string) => {
    const m = META[type] || { icon: Bell, tone: 'neutral' as Tone, label: 'Bildirim' };
    return { ...m, ...TONES[m.tone] };
};

/** Bildirim satırının solundaki ikon kutusu. */
export const NotificationIcon: React.FC<{ type: string; size?: 'sm' | 'md'; className?: string }> = ({
    type, size = 'md', className,
}) => {
    const m = notificationMeta(type);
    const Icon = m.icon;
    return (
        <span
            aria-hidden
            className={cn(
                'shrink-0 flex items-center justify-center ',
                size === 'sm' ? 'w-8 h-8' : 'w-10 h-10',
                m.bg, m.fg, className
            )}
        >
            <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]'} strokeWidth={2} />
        </span>
    );
};
