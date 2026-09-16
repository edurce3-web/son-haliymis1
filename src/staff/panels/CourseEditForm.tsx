import React, { useState } from 'react';
import { staffApi } from '../staffApi';
import { ErrorBox, Button, Field, inputClass, textareaClass } from '../ui';

const LEVELS = [
    { value: 'beginner', label: 'Başlangıç' },
    { value: 'intermediate', label: 'Orta' },
    { value: 'advanced', label: 'İleri' },
    { value: 'all', label: 'Tüm seviyeler' },
];

/**
 * Kurs düzenleme.
 *
 * Yalnızca sunucunun beyaz listesindeki alanlar var; eğitmen, onay durumu ve
 * müfredat buradan değiştirilemiyor. Gerekçe zorunlu ve eğitmene bildirim
 * olarak gidiyor — sessizce düzenlenen bir kurs, eğitmen için açıklanamaz
 * bir duruma dönüşür.
 *
 * Yalnızca değişen alanlar gönderiliyor; sunucu da kendi tarafında
 * karşılaştırıp değişmeyenleri atıyor.
 */
const CourseEditForm: React.FC<{
    course: any;
    onCancel: () => void;
    onSaved: () => void;
}> = ({ course, onCancel, onSaved }) => {
    const [form, setForm] = useState({
        title: course.title || '',
        short_description: course.short_description || '',
        description: course.description || '',
        price: String(course.price ?? ''),
        level: course.level || 'all',
        language: course.language || 'tr',
    });
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

    const changed = Object.entries(form).filter(
        ([k, v]) => String(course[k] ?? '') !== String(v)
    );

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            const payload: Record<string, unknown> = { note: note.trim() };
            for (const [k, v] of changed) payload[k] = k === 'price' ? Number(v) : v;
            await staffApi.editCourse(course.course_id, payload);
            onSaved();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-md border border-slate-300 bg-white p-4 space-y-4">
            <p className="text-[13px] font-semibold text-slate-800">Kursu düzenle</p>
            {error && <ErrorBox message={error} />}

            <Field label="Başlık">
                <input value={form.title} onChange={e => set('title', e.target.value)} maxLength={120} className={inputClass} />
            </Field>

            <Field label="Kısa açıklama" hint="Kart ve kurs sayfasında başlığın altında görünür.">
                <input value={form.short_description} onChange={e => set('short_description', e.target.value)} maxLength={255} className={inputClass} />
            </Field>

            <Field label="Açıklama">
                <textarea rows={6} value={form.description} onChange={e => set('description', e.target.value)} className={textareaClass} />
            </Field>

            <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Fiyat (₺)">
                    <input
                        type="number" min={0} step="0.01"
                        value={form.price}
                        onChange={e => set('price', e.target.value)}
                        className={inputClass}
                    />
                </Field>
                <Field label="Seviye">
                    <select value={form.level} onChange={e => set('level', e.target.value)} className={inputClass}>
                        {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                </Field>
                <Field label="Dil">
                    <input value={form.language} onChange={e => set('language', e.target.value)} maxLength={10} className={inputClass} />
                </Field>
            </div>

            <Field label="Gerekçe" hint="Eğitmene bildirim olarak iletilir; en az 5 karakter.">
                <input value={note} onChange={e => setNote(e.target.value)} className={inputClass} />
            </Field>

            <div className="flex items-center gap-2 pt-1">
                <Button
                    variant="primary"
                    disabled={busy || changed.length === 0 || note.trim().length < 5}
                    onClick={save}
                >
                    {busy ? '…' : `Kaydet (${changed.length} alan)`}
                </Button>
                <Button onClick={onCancel} disabled={busy}>Vazgeç</Button>
                {changed.length === 0 && (
                    <span className="text-[12.5px] text-slate-500">Değişiklik yok</span>
                )}
            </div>
        </div>
    );
};

export default CourseEditForm;
