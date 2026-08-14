import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    /** Kullanıcının seçtiği dosya. null ise pencere kapalı. */
    file: File | null;
    onCancel: () => void;
    onCropped: (file: File) => void;
    /** Çıktı kenar uzunluğu (kare). Profil fotoğrafı için 512 yeterli. */
    outputSize?: number;
    title?: string;
}

const VIEWPORT = 320;
const MAX_ZOOM = 4;

/**
 * Profil fotoğrafı kırpma penceresi.
 *
 * Harici kütüphane kullanılmıyor: kırpma canvas ile yapılıyor, bu iş için
 * projeye yeni bir bağımlılık eklemeye değmez.
 *
 * Mantık: görsel her zaman görüntü alanını TAM KAPLAR. Taban ölçek
 * max(V/genişlik, V/yükseklik) olarak hesaplanır, yakınlaştırma bunun katıdır.
 * Kaydırma da görselin kenarları görüntü alanının içine giremeyecek şekilde
 * sınırlanır — böylece kırpılan karede asla boşluk kalmaz.
 */
export const ImageCropDialog: React.FC<Props> = ({
    file,
    onCancel,
    onCropped,
    outputSize = 512,
    title = 'Fotoğrafı kırp',
}) => {
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [busy, setBusy] = useState(false);
    const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
    const objectUrl = useRef<string | null>(null);

    // Dosyayı yükle ve ortala
    useEffect(() => {
        if (!file) { setImg(null); return; }

        const url = URL.createObjectURL(file);
        objectUrl.current = url;
        const image = new Image();
        image.onload = () => {
            setImg(image);
            setZoom(1);
            const base = Math.max(VIEWPORT / image.naturalWidth, VIEWPORT / image.naturalHeight);
            setOffset({
                x: (VIEWPORT - image.naturalWidth * base) / 2,
                y: (VIEWPORT - image.naturalHeight * base) / 2,
            });
        };
        image.src = url;

        return () => {
            URL.revokeObjectURL(url);
            objectUrl.current = null;
        };
    }, [file]);

    const baseScale = img ? Math.max(VIEWPORT / img.naturalWidth, VIEWPORT / img.naturalHeight) : 1;
    const scale = baseScale * zoom;
    const dispW = img ? img.naturalWidth * scale : 0;
    const dispH = img ? img.naturalHeight * scale : 0;

    /** Görselin kenarları görüntü alanının içine girmesin. */
    const clamp = useCallback((x: number, y: number, w: number, h: number) => ({
        x: Math.min(0, Math.max(VIEWPORT - w, x)),
        y: Math.min(0, Math.max(VIEWPORT - h, y)),
    }), []);

    // Yakınlaştırma değişince merkezi koruyarak yeniden sınırla
    useEffect(() => {
        if (!img) return;
        setOffset(prev => {
            const cx = VIEWPORT / 2 - prev.x;
            const cy = VIEWPORT / 2 - prev.y;
            const prevScale = dispW / img.naturalWidth || 1;
            const ratio = scale / prevScale;
            return clamp(VIEWPORT / 2 - cx * ratio, VIEWPORT / 2 - cy * ratio, dispW, dispH);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom]);

    const onPointerDown = (e: React.PointerEvent) => {
        if (!img) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const d = dragRef.current;
        if (!d || !img) return;
        setOffset(clamp(d.ox + (e.clientX - d.x), d.oy + (e.clientY - d.y), dispW, dispH));
    };

    const onPointerUp = () => { dragRef.current = null; };

    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(z => Math.min(MAX_ZOOM, Math.max(1, z - e.deltaY * 0.0015)));
    };

    const reset = () => {
        if (!img) return;
        setZoom(1);
        const base = Math.max(VIEWPORT / img.naturalWidth, VIEWPORT / img.naturalHeight);
        setOffset({
            x: (VIEWPORT - img.naturalWidth * base) / 2,
            y: (VIEWPORT - img.naturalHeight * base) / 2,
        });
    };

    const confirm = async () => {
        if (!img || !file) return;
        setBusy(true);
        try {
            // Görüntü alanında görünen bölge, kaynak görselde neye denk geliyor?
            const sx = -offset.x / scale;
            const sy = -offset.y / scale;
            const sSize = VIEWPORT / scale;

            const canvas = document.createElement('canvas');
            canvas.width = outputSize;
            canvas.height = outputSize;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('canvas yok');

            // Küçültürken yumuşak sonuç
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            // Saydam PNG'ler JPEG'e çevrilince siyah olmasın
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outputSize, outputSize);
            ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);

            const blob: Blob = await new Promise((resolve, reject) =>
                canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Görsel üretilemedi'))), 'image/jpeg', 0.9)
            );

            const name = file.name.replace(/\.[^.]+$/, '') || 'profil';
            onCropped(new File([blob], `${name}.jpg`, { type: 'image/jpeg' }));
        } catch {
            // Kırpma başarısızsa kullanıcıyı kilitlemeyelim
            onCropped(file);
        } finally {
            setBusy(false);
        }
    };

    if (!file) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-900">{title}</h2>
                    <button
                        onClick={onCancel}
                        aria-label="Kapat"
                        className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-xs text-slate-500 mb-3">
                        Sürükleyerek konumlandır, yakınlaştırarak çerçeveye otur.
                    </p>

                    {/* Görüntü alanı — daire maskesi, gerçek çıktı kare */}
                    <div
                        className="relative mx-auto rounded-full overflow-hidden bg-slate-100 cursor-grab active:cursor-grabbing touch-none select-none ring-1 ring-slate-200"
                        style={{ width: VIEWPORT, height: VIEWPORT }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onWheel={onWheel}
                    >
                        {img ? (
                            <img
                                src={img.src}
                                alt=""
                                draggable={false}
                                className="absolute max-w-none pointer-events-none"
                                style={{
                                    width: dispW,
                                    height: dispH,
                                    left: offset.x,
                                    top: offset.y,
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                        <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                            type="range"
                            min={1}
                            max={MAX_ZOOM}
                            step={0.01}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            aria-label="Yakınlaştırma"
                            className="flex-1 accent-brand-700"
                        />
                        <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
                        <button
                            onClick={reset}
                            aria-label="Sıfırla"
                            title="Sıfırla"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/60">
                    <Button variant="ghost" onClick={onCancel} className="rounded-lg">
                        Vazgeç
                    </Button>
                    <Button
                        onClick={confirm}
                        disabled={!img || busy}
                        className={cn('rounded-lg bg-brand-700 hover:bg-brand-800 px-6')}
                    >
                        {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Hazırlanıyor</> : 'Kırp ve yükle'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropDialog;
