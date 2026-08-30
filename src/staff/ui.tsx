import React, { useState } from 'react';

/**
 * Panelin ortak parçaları.
 *
 * Panel, ana uygulamanın shadcn bileşenlerini kullanmıyor: onlar marka
 * paletine göre ayarlı ve panelde yanlış duruyor. Buradakiler kasıtlı olarak
 * yoğun, gri ve dar — moderatör ekranında birim alana düşen bilgi önemli.
 */

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>{children}</div>
);

export const Empty: React.FC<{ text: string }> = ({ text }) => (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white py-14 text-center">
        <p className="text-[14px] text-slate-500">{text}</p>
    </div>
);

export const Loading: React.FC = () => (
    <div className="py-14 text-center text-[14px] text-slate-400">Yükleniyor…</div>
);

export const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-[13.5px] text-red-700">{message}</p>
    </div>
);

const TONES: Record<string, string> = {
    neutral: 'bg-slate-100 text-slate-700',
    warn: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-700',
    ok: 'bg-emerald-100 text-emerald-700',
    info: 'bg-sky-100 text-sky-700',
};

export const Tag: React.FC<{ tone?: keyof typeof TONES | string; children: React.ReactNode }> = ({ tone = 'neutral', children }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-semibold ${TONES[tone] || TONES.neutral}`}>
        {children}
    </span>
);

export const Button: React.FC<{
    onClick?: () => void;
    variant?: 'primary' | 'danger' | 'ghost';
    disabled?: boolean;
    children: React.ReactNode;
    type?: 'button' | 'submit';
}> = ({ onClick, variant = 'ghost', disabled, children, type = 'button' }) => {
    const styles = {
        primary: 'bg-slate-900 text-white hover:bg-slate-800',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900',
    }[variant];
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`h-9 px-3.5 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles}`}
        >
            {children}
        </button>
    );
};

export const Field: React.FC<{
    label: string;
    hint?: string;
    children: React.ReactNode;
}> = ({ label, hint, children }) => (
    <div className="space-y-1.5">
        <label className="block text-[12.5px] font-semibold text-slate-700">{label}</label>
        {children}
        {hint && <p className="text-[11.5px] text-slate-500">{hint}</p>}
    </div>
);

export const inputClass =
    'w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-[13.5px] '
    + 'focus:outline-none focus:border-slate-500 transition-colors';

export const textareaClass =
    'w-full p-3 rounded-md border border-slate-300 bg-white text-[13.5px] leading-relaxed '
    + 'focus:outline-none focus:border-slate-500 transition-colors resize-y';

/** Basit sekme şeridi — kuyruk durumları arasında geçiş için. */
export const Tabs: React.FC<{
    value: string;
    onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
}> = ({ value, onChange, options }) => (
    <div className="flex gap-1 mb-4">
        {options.map(o => (
            <button
                key={o.value}
                onClick={() => onChange(o.value)}
                className={[
                    'h-8 px-3.5 rounded-md text-[13px] font-semibold transition-colors',
                    value === o.value
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-200',
                ].join(' ')}
            >
                {o.label}
            </button>
        ))}
    </div>
);

/**
 * Gerekçe isteyen onay kutusu.
 *
 * Moderasyon kararlarının çoğunda gerekçe zorunlu; sunucu da bunu doğruluyor.
 * Arayüzde ayrı bir ekran açmak yerine satırın altında açılıyor, moderatör
 * bağlamı kaybetmiyor.
 */
export const ReasonBox: React.FC<{
    title: string;
    confirmLabel: string;
    minLength?: number;
    danger?: boolean;
    onCancel: () => void;
    onConfirm: (note: string) => Promise<void> | void;
}> = ({ title, confirmLabel, minLength = 10, danger, onCancel, onConfirm }) => {
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const tooShort = note.trim().length < minLength;

    return (
        <div className="mt-3 rounded-md border border-slate-300 bg-slate-50 p-3.5">
            <p className="text-[13px] font-semibold text-slate-800 mb-2">{title}</p>
            <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={`Gerekçe (en az ${minLength} karakter)`}
                className={textareaClass}
                autoFocus
            />
            <div className="flex items-center gap-2 mt-2.5">
                <Button
                    variant={danger ? 'danger' : 'primary'}
                    disabled={tooShort || busy}
                    onClick={async () => {
                        setBusy(true);
                        try { await onConfirm(note.trim()); } finally { setBusy(false); }
                    }}
                >
                    {busy ? '…' : confirmLabel}
                </Button>
                <Button onClick={onCancel} disabled={busy}>Vazgeç</Button>
                {tooShort && note.length > 0 && (
                    <span className="text-[12px] text-slate-500">
                        {minLength - note.trim().length} karakter daha
                    </span>
                )}
            </div>
        </div>
    );
};

export const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }) : '—';

export const relativeDays = (value?: string | null) => {
    if (!value) return '';
    const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
    if (days === 0) return 'bugün';
    if (days === 1) return 'dün';
    return `${days} gün önce`;
};
