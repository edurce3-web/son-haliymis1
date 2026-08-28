import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface CodeInputProps {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    autoFocus?: boolean;
    /** Altı dolduğunda çağrılır — kullanıcı ayrıca düğmeye basmak zorunda kalmasın. */
    onComplete?: (value: string) => void;
}

/**
 * Doğrulama kodu girişi.
 *
 * Görünürde altı ayrı kutu var ama arkada tek bir input duruyor: kutu başına
 * ayrı input kullanmak, yapıştırma ve geri silme davranışını her tarayıcıda
 * ayrı ayrı düzeltmeyi gerektiriyor. Tek input, şifre yöneticilerinin ve
 * iOS'un otomatik kod doldurmasıyla da sorunsuz çalışıyor.
 *
 * Boş kutularda "000000" gibi bir yer tutucu yok; kutunun kendisi zaten kaç
 * hane girileceğini söylüyor ve sıfırlar gerçek değerle karışıyordu.
 */
export const CodeInput: React.FC<CodeInputProps> = ({
    value,
    onChange,
    length = 6,
    autoFocus,
    onComplete,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const digits = value.split('');
    // Sıradaki kutu: dolmamışsa ilk boş kutu, dolduysa sonuncusu.
    const activeIndex = Math.min(value.length, length - 1);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value.replace(/\D/g, '').slice(0, length);
        onChange(next);
        if (next.length === length) onComplete?.(next);
    };

    return (
        <div
            className="relative"
            onClick={() => inputRef.current?.focus()}
        >
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus={autoFocus}
                maxLength={length}
                value={value}
                onChange={handleChange}
                aria-label="Doğrulama kodu"
                /* Görsel kutular altta; gerçek input üstte ve şeffaf. Caret
                   gizli, çünkü konumu kutularla hizalanmıyor. */
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            <div className="flex gap-2 sm:gap-2.5 justify-between pointer-events-none">
                {Array.from({ length }).map((_, i) => {
                    const filled = Boolean(digits[i]);
                    const active = i === activeIndex;
                    return (
                        <div
                            key={i}
                            className={cn(
                                'flex-1 h-14 rounded-xl border-2 flex items-center justify-center',
                                'text-[22px] font-bold text-slate-900 tabular-nums transition-all duration-150',
                                filled && 'border-brand-600 bg-brand-50/60',
                                !filled && active && 'border-brand-400 bg-white shadow-[0_0_0_4px_rgba(23,93,93,0.08)]',
                                !filled && !active && 'border-slate-200 bg-slate-50/60'
                            )}
                        >
                            {digits[i] ? (
                                digits[i]
                            ) : (
                                /* Boş kutuda ince bir alt çizgi — yer tutucu rakam yerine */
                                <span className="block w-4 h-[2px] rounded-full bg-slate-300" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CodeInput;
