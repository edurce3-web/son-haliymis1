import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Eğitmen panelinin ortak parçaları. Renk dili menüden geliyor:
 * nane (#b2f0c8) zemin üstünde koyu mürekkep (#0b2619). Ana düğme nane,
 * seçili durum koyu mürekkep üstünde nane — menüdeki seçili başlık gibi.
 */

export const C = {
    ink: '#0b2619',
    mint: '#b2f0c8',
    teal: '#12613b',
};

const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap select-none ' +
    'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] ' +
    'disabled:opacity-50 disabled:pointer-events-none ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12613b]/45 focus-visible:ring-offset-2';

export const btn = {
    primary: cn(base, 'bg-[#b2f0c8] text-[#0b2619] hover:bg-[#9ce8b8] shadow-[0_1px_2px_rgba(0,64,58,0.18)]'),
    dark: cn(base, 'bg-[#0b2619] text-[#b2f0c8] hover:bg-[#10331f]'),
    outline: cn(base, 'bg-white text-[#0b2619] shadow-[0_1px_2px_rgba(0,32,29,0.1)] ring-1 ring-inset ring-[#0b2619]/[0.06] hover:bg-[#ecfaf1]'),
    ghost: cn(base, 'text-[#1d4a45] hover:bg-[#e8f8ee] hover:text-[#0b2619]'),
    danger: cn(base, 'bg-white text-[#b42318] ring-1 ring-inset ring-[#f3c9c4] hover:bg-[#fff3f1]'),
    md: 'h-10 px-4 text-[13.5px]',
    sm: 'h-8 px-3 text-[12.5px] rounded-lg',
    lg: 'h-11 px-5 text-[14px]',
};

/** Form alanları için tek sınıf: input, textarea, select. */
export const field =
    'w-full rounded-xl bg-white px-3.5 text-[14px] text-[#0b2619] placeholder:text-[#7c918e] ' +
    'ring-1 ring-inset ring-[#0b2619]/[0.09] border-0 outline-none transition-shadow duration-150 ' +
    'hover:ring-[#0b2619]/[0.16] focus:ring-2 focus:ring-[#12613b]/55 focus-visible:ring-2 focus-visible:ring-[#12613b]/55 ' +
    'disabled:bg-[#f3f7f6] disabled:text-[#6a7f74]';

export const label = 'block text-[13px] font-bold text-[#0b2619] mb-1.5';
export const hint = 'text-[12.5px] text-[#5e7268]';

export const PageHead: React.FC<{
    title: string;
    sub?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}> = ({ title, sub, actions, className }) => (
    <header className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7', className)}>
        <div className="min-w-0">
            <h1 className="text-[28px] sm:text-[32px] leading-[1.1] font-extrabold tracking-[-0.025em] text-[#0b2619] text-balance">
                {title}
            </h1>
            {sub && <p className="mt-2 text-[14.5px] text-[#4a5f55]">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
);

/** İçerik yüzeyi. İç içe kullanılmaz; içinde bölmek gerekiyorsa çizgi kullan. */
export const Panel: React.FC<React.HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' }> = ({
    className, as: Tag = 'div', ...rest
}) => (
    <Tag
        className={cn('rounded-2xl bg-[#f5f7f6]', className)}
        {...rest}
    />
);

export const PanelHead: React.FC<{ title: string; sub?: React.ReactNode; actions?: React.ReactNode }> = ({
    title, sub, actions,
}) => (
    <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-3">
        <div className="min-w-0">
            <h2 className="text-[16.5px] font-extrabold tracking-[-0.01em] text-[#0b2619]">{title}</h2>
            {sub && <p className="mt-0.5 text-[13px] text-[#5e7268]">{sub}</p>}
        </div>
        {actions}
    </div>
);

/** Sekme grubu: seçili olan koyu mürekkep üstünde nane, menüdeki seçili başlık gibi. */
export function Segments<T extends string>({
    value, onChange, items, className,
}: {
    value: T;
    onChange: (v: T) => void;
    items: { value: T; label: string; count?: number }[];
    className?: string;
}) {
    return (
        <div role="tablist" className={cn('inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-white ring-1 ring-[#e3e6e5]', className)}>
            {items.map(it => {
                const on = it.value === value;
                return (
                    <button
                        key={it.value}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(it.value)}
                        className={cn(
                            'h-9 px-3.5 rounded-xl text-[13.5px] font-bold inline-flex items-center gap-2',
                            'transition-[background-color,color] duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12613b]/45',
                            on ? 'bg-[#0b2619] text-[#b2f0c8]' : 'text-[#1d4a45] hover:bg-[#f3f4f4]'
                        )}
                    >
                        {it.label}
                        {it.count != null && (
                            <span className={cn('text-[12px] tabular-nums', on ? 'text-[#b2f0c8]/70' : 'text-[#5e7268]')}>
                                {it.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export const SearchBox: React.FC<{
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}> = ({ value, onChange, placeholder = 'Ara', className }) => (
    <label className={cn('relative block', className)}>
        <span className="sr-only">{placeholder}</span>
        <Search aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e7268] pointer-events-none" />
        <input
            type="search"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(field, 'h-10 pl-10')}
        />
    </label>
);

export const Empty: React.FC<{
    title: string;
    text?: React.ReactNode;
    action?: { label: string; to?: string; onClick?: () => void };
    className?: string;
}> = ({ title, text, action, className }) => (
    <div className={cn('rounded-2xl bg-[#ecfaf1] px-6 py-14 text-center', className)}>
        <p className="text-[17px] font-extrabold tracking-tight text-[#0b2619]">{title}</p>
        {text && <p className="mt-1.5 text-[14px] text-[#4a5f55] max-w-md mx-auto">{text}</p>}
        {action && (action.to ? (
            <Link to={action.to} className={cn(btn.primary, btn.md, 'mt-6')}>{action.label}</Link>
        ) : (
            <button type="button" onClick={action.onClick} className={cn(btn.primary, btn.md, 'mt-6')}>{action.label}</button>
        ))}
    </div>
);

export const Loading: React.FC<{ label?: string }> = ({ label = 'Yükleniyor' }) => (
    <div className="flex items-center justify-center gap-2.5 min-h-[40vh] text-[14px] text-[#4a5f55]" role="status">
        <Loader2 className="w-5 h-5 animate-spin text-[#12613b]" />
        {label}
    </div>
);

type Tone = 'live' | 'review' | 'draft' | 'warn' | 'bad' | 'muted' | 'mint';

/** Durum etiketi: küçük nokta + kelime. Arka plan yok; satırları kalabalıklaştırmıyor. */
export const Tag: React.FC<{ tone: Tone; children: React.ReactNode; className?: string }> = ({ tone, children, className }) => (
    <span className={cn(
        'inline-flex items-center gap-1.5 text-[12.5px] font-bold',
        tone === 'live' && 'text-[#146c43]',
        tone === 'review' && 'text-[#1f5f99]',
        tone === 'draft' && 'text-[#8a5a0b]',
        tone === 'warn' && 'text-[#8a5a0b]',
        tone === 'bad' && 'text-[#b42318]',
        tone === 'muted' && 'text-[#5e7268]',
        tone === 'mint' && 'text-[#12613b]',
        className
    )}>
        <span aria-hidden className={cn(
            'w-1.5 h-1.5 rounded-full',
            tone === 'live' && 'bg-[#1a9d5c]',
            tone === 'review' && 'bg-[#2f7fc1]',
            (tone === 'draft' || tone === 'warn') && 'bg-[#d08a1c]',
            tone === 'bad' && 'bg-[#d92d20]',
            tone === 'muted' && 'bg-[#9aaea3]',
            tone === 'mint' && 'bg-[#12613b]'
        )} />
        {children}
    </span>
);

/** Baş harflerden yuvarlak: nane zemin, koyu mürekkep harf. */
export const Initials: React.FC<{ name?: string; src?: string | null; size?: number; className?: string }> = ({
    name = '', src, size = 36, className,
}) => {
    const letters = name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toLocaleUpperCase('tr-TR') || '?';
    if (src) return <img src={src} alt="" className={cn('rounded-full object-cover shrink-0', className)} style={{ width: size, height: size }} />;
    return (
        <span
            aria-hidden
            className={cn('rounded-full bg-[#b2f0c8] text-[#0b2619] font-extrabold flex items-center justify-center shrink-0', className)}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
        >
            {letters}
        </span>
    );
};

export const lira = (n: number) =>
    `₺${(Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
