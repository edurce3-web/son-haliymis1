import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { ChevronRight, Loader2 } from 'lucide-react';
import { drawCertificate, downloadPNG, downloadPDF } from '@/lib/certificateGenerator';
import { PageBand } from '@/components/layout/PageBand';
import { toast } from 'sonner';

type Cert = {
    certificate_id: string;
    course_title: string;
    user_name: string;
    instructor_name?: string;
    category_name?: string;
    issued_at: string;
    certificate_url?: string;
    /** Kursun toplam ders süresi — sertifikada gösteriliyor. */
    duration_seconds?: number | null;
};

const Certificates = () => {
    /**
     * Tek bir gizli tuval.
     *
     * Önceden biri sayfada biri de önizleme penceresinde olmak üzere iki
     * tuval vardı ve ikisi aynı ref'i paylaşıyordu. Pencere açılınca ref
     * boş olan ikinci tuvale geçiyor, çizim ilkine yapıldığı için önizleme
     * yalnızca ilk seferde görünüyordu. Artık tek tuval var ve üretilen
     * görsel durumda tutuluyor.
     */
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [previewCert, setPreviewCert] = useState<Cert | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['certificates'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/certificates`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!r.ok) return { certificates: [] };
            return r.json();
        },
    });

    const certs: Cert[] = data?.certificates || [];

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    /** Sertifikayı tuvale çizer; çağıranlar sonucu indirir ya da gösterir. */
    const render = async (cert: Cert) => {
        if (!canvasRef.current) return null;
        await drawCertificate(canvasRef.current, {
            studentName: cert.user_name,
            courseTitle: cert.course_title,
            instructorName: cert.instructor_name || 'Edurce',
            issuedDate: formatDate(cert.issued_at),
            certificateId: cert.certificate_id,
            // Süre saniye olarak geliyor; belgede dakika gösteriliyor
            durationMinutes: cert.duration_seconds ? Math.round(cert.duration_seconds / 60) : null,
        });
        return canvasRef.current;
    };

    const handlePreview = async (cert: Cert) => {
        setBusy(`${cert.certificate_id}-preview`);
        try {
            const canvas = await render(cert);
            if (!canvas) return;
            setPreviewUrl(canvas.toDataURL('image/png'));
            setPreviewCert(cert);
        } catch {
            toast.error('Sertifika oluşturulamadı.');
        } finally {
            setBusy(null);
        }
    };

    const handleDownload = async (cert: Cert, format: 'png' | 'pdf') => {
        setBusy(`${cert.certificate_id}-${format}`);
        try {
            const canvas = await render(cert);
            if (!canvas) return;
            const slug = cert.course_title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
            if (format === 'png') downloadPNG(canvas, `sertifika-${slug}`);
            else await downloadPDF(canvas, `sertifika-${slug}`);
        } catch {
            toast.error('İndirme sırasında bir hata oluştu.');
        } finally {
            setBusy(null);
        }
    };

    const closePreview = () => {
        setPreviewCert(null);
        setPreviewUrl(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <canvas ref={canvasRef} className="hidden" />

            <PageBand
                breadcrumb={
                    <>
                        <Link to="/" className="hover:text-brand-800 transition-colors">Ana sayfa</Link>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <Link to="/home/learning" className="hover:text-brand-800 transition-colors">Eğitimlerim</Link>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-700">Sertifikalarım</span>
                    </>
                }
                title="Sertifikalarım"
                subtitle={certs.length > 0
                    ? `${certs.length} sertifika · PNG veya PDF olarak indirebilirsin`
                    : undefined}
            />

            <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-10">
                {certs.length === 0 ? (
                    <p className="text-[15px] text-slate-500">
                        Bir kursu tamamladığında sertifikan burada listelenir.
                    </p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {certs.map(cert => (
                            <article
                                key={cert.certificate_id}
                                className="border border-slate-200 rounded-xl p-5 flex flex-col transition-colors hover:border-brand-300"
                            >
                                <p className="font-montserrat text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-700">
                                    Bitirme sertifikası
                                </p>
                                <h2 className="text-[16px] font-bold text-slate-900 leading-snug line-clamp-2 mt-2">
                                    {cert.course_title}
                                </h2>

                                <dl className="mt-4 space-y-1.5 text-[13px]">
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-slate-500">Eğitmen</dt>
                                        <dd className="font-medium text-slate-800 text-right truncate">
                                            {cert.instructor_name || 'Edurce'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-slate-500">Veriliş</dt>
                                        <dd className="font-medium text-slate-800 text-right">
                                            {formatDate(cert.issued_at)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-slate-500">Belge no</dt>
                                        <dd className="font-mono text-[12px] text-slate-600 text-right truncate">
                                            {cert.certificate_id}
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-auto pt-4 flex gap-2">
                                    <button
                                        onClick={() => handlePreview(cert)}
                                        disabled={!!busy}
                                        className="flex-1 h-9 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-[13px] font-semibold transition-colors disabled:opacity-60"
                                    >
                                        {busy === `${cert.certificate_id}-preview` ? 'Açılıyor…' : 'Görüntüle'}
                                    </button>
                                    <button
                                        onClick={() => handleDownload(cert, 'pdf')}
                                        disabled={!!busy}
                                        className="h-9 px-3 rounded-md border border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-700 text-[13px] font-semibold transition-colors disabled:opacity-60"
                                    >
                                        {busy === `${cert.certificate_id}-pdf` ? '…' : 'PDF'}
                                    </button>
                                    <button
                                        onClick={() => handleDownload(cert, 'png')}
                                        disabled={!!busy}
                                        className="h-9 px-3 rounded-md border border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-700 text-[13px] font-semibold transition-colors disabled:opacity-60"
                                    >
                                        {busy === `${cert.certificate_id}-png` ? '…' : 'PNG'}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* Önizleme penceresi */}
            {previewCert && previewUrl && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={closePreview}
                >
                    <div
                        className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xl max-w-3xl w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200">
                            <h3 className="text-[14.5px] font-semibold text-slate-900 truncate">
                                {previewCert.course_title}
                            </h3>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleDownload(previewCert, 'pdf')}
                                    disabled={!!busy}
                                    className="h-9 px-3.5 rounded-md border border-slate-300 hover:border-brand-400 text-slate-700 text-[13px] font-semibold transition-colors disabled:opacity-60"
                                >
                                    PDF
                                </button>
                                <button
                                    onClick={() => handleDownload(previewCert, 'png')}
                                    disabled={!!busy}
                                    className="h-9 px-3.5 rounded-md border border-slate-300 hover:border-brand-400 text-slate-700 text-[13px] font-semibold transition-colors disabled:opacity-60"
                                >
                                    PNG
                                </button>
                                <button
                                    onClick={closePreview}
                                    className="w-9 h-9 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                    aria-label="Kapat"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50">
                            <img
                                src={previewUrl}
                                alt={`${previewCert.course_title} sertifikası`}
                                className="w-full rounded-lg border border-slate-200"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Certificates;
