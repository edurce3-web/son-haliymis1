import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import {
    Award, CheckCircle, ChevronRight, Download,
    BookOpen, FileImage, FileText, Eye, Loader2,
    GraduationCap, Calendar, User2, Hash, Sparkles
} from 'lucide-react';
import { drawCertificate, downloadPNG, downloadPDF } from '@/lib/certificateGenerator';
import { toast } from 'sonner';

type Cert = {
    certificate_id: string;
    course_title: string;
    user_name: string;
    instructor_name?: string;
    category_name?: string;
    issued_at: string;
    certificate_url?: string;
};

const Certificates = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [previewCert, setPreviewCert] = useState<Cert | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['certificates'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/certificates`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!r.ok) return { certificates: [] };
            return r.json();
        }
    });

    const certs: Cert[] = data?.certificates || [];

    // ── Re-draw certificate on canvas and trigger download ───────────────────
    const handleDownload = async (cert: Cert, format: 'png' | 'pdf') => {
        if (!canvasRef.current) return;
        setDownloading(`${cert.certificate_id}-${format}`);
        try {
            const dateStr = new Date(cert.issued_at).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            await drawCertificate(canvasRef.current, {
                studentName: cert.user_name,
                courseTitle: cert.course_title,
                instructorName: cert.instructor_name || 'Neural Akademi',
                issuedDate: dateStr,
                certificateId: cert.certificate_id,
            });
            const slug = cert.course_title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
            if (format === 'png') {
                downloadPNG(canvasRef.current, `sertifika-${slug}`);
            } else {
                await downloadPDF(canvasRef.current, `sertifika-${slug}`);
            }
            toast.success(`Sertifika ${format.toUpperCase()} olarak indirildi!`);
        } catch {
            toast.error('İndirme sırasında bir hata oluştu.');
        } finally {
            setDownloading(null);
        }
    };

    const handlePreview = async (cert: Cert) => {
        if (!canvasRef.current) return;
        setPreviewCert(cert);
        const dateStr = new Date(cert.issued_at).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        await drawCertificate(canvasRef.current, {
            studentName: cert.user_name,
            courseTitle: cert.course_title,
            instructorName: cert.instructor_name || 'Neural Akademi',
            issuedDate: dateStr,
            certificateId: cert.certificate_id,
        });
    };

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm animate-pulse">Sertifikalar yükleniyor...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
            {/* Hidden canvas used for generation */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Preview Modal */}
            {previewCert && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPreviewCert(null)}
                >
                    <div
                        className="relative bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl max-w-4xl w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <Award className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">{previewCert.course_title}</h3>
                                    <p className="text-xs text-slate-400">Sertifika Önizleme</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(previewCert, 'png')}
                                    disabled={!!downloading}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                    {downloading === `${previewCert.certificate_id}-png`
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <FileImage className="w-3.5 h-3.5" />
                                    }
                                    PNG İndir
                                </button>
                                <button
                                    onClick={() => handleDownload(previewCert, 'pdf')}
                                    disabled={!!downloading}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                    {downloading === `${previewCert.certificate_id}-pdf`
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <FileText className="w-3.5 h-3.5" />
                                    }
                                    PDF İndir
                                </button>
                                <button
                                    onClick={() => setPreviewCert(null)}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                >✕</button>
                            </div>
                        </div>
                        {/* Canvas Preview */}
                        <div className="p-4 bg-slate-950/50">
                            <canvas
                                ref={canvasRef}
                                className="w-full rounded-xl"
                                style={{ display: 'none' }}
                            />
                            <img
                                src={canvasRef.current?.toDataURL('image/png') || ''}
                                alt="Certificate Preview"
                                className="w-full rounded-xl shadow-xl"
                                id="cert-preview-img"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <nav className="flex items-center gap-2 text-xs text-slate-500 mb-5">
                        <Link to="/" className="hover:text-indigo-400 transition-colors">Ana Sayfa</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link to="/home/learning" className="hover:text-indigo-400 transition-colors">Öğrenim Alanım</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-300 font-medium">Sertifikalarım</span>
                    </nav>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-black text-white tracking-tight">Sertifikalarım</h1>
                            </div>
                            <p className="text-slate-400 text-sm pl-1">
                                Tamamladığın kursların resmi belgelerini PNG veya PDF olarak indirebilirsin.
                            </p>
                        </div>

                        {certs.length > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-2xl px-5 py-3">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    <span className="text-amber-300 font-bold text-sm">{certs.length} Sertifika</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-10">
                {certs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center mb-8 shadow-2xl">
                            <Award className="w-14 h-14 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Henüz Sertifikan Yok</h3>
                        <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
                            Bir kursu %100 tamamladığında Neural Akademi kalitesinde profesyonel sertifikan otomatik hazırlanır.
                        </p>
                        <Link
                            to="/home/learning"
                            className="flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        >
                            <BookOpen className="w-4 h-4" />
                            Kurslarıma Git
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {certs.map((cert) => (
                            <CertCard
                                key={cert.certificate_id}
                                cert={cert}
                                downloading={downloading}
                                onPreview={() => handlePreview(cert)}
                                onDownload={(fmt) => handleDownload(cert, fmt)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Certificate Card Component ────────────────────────────────────────────────
const CertCard = ({
    cert,
    downloading,
    onPreview,
    onDownload,
}: {
    cert: Cert;
    downloading: string | null;
    onPreview: () => void;
    onDownload: (fmt: 'png' | 'pdf') => void;
}) => {
    const dateStr = new Date(cert.issued_at).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const isPNGLoading = downloading === `${cert.certificate_id}-png`;
    const isPDFLoading = downloading === `${cert.certificate_id}-pdf`;

    return (
        <div className="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/8 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
            {/* Top gradient bar */}
            <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

            {/* Certificate Visual Header */}
            <div className="relative p-6 pb-4">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-2 right-2 w-32 h-32 rounded-full border-2 border-white" />
                    <div className="absolute top-6 right-6 w-20 h-20 rounded-full border border-white" />
                    <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full border-2 border-white" />
                </div>

                <div className="relative flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                                Resmi Sertifika
                            </span>
                        </div>
                        <h3 className="text-white font-black text-lg leading-tight mb-1 line-clamp-2">
                            {cert.course_title}
                        </h3>
                    </div>

                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="px-6 pb-5 grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-2xl p-3.5 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <User2 className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Öğrenci</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">{cert.user_name}</p>
                </div>

                <div className="bg-black/20 rounded-2xl p-3.5 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Tarih</span>
                    </div>
                    <p className="text-sm font-bold text-white">{dateStr}</p>
                </div>

                {cert.instructor_name && (
                    <div className="bg-black/20 rounded-2xl p-3.5 border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Award className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Eğitmen</span>
                        </div>
                        <p className="text-sm font-bold text-white truncate">{cert.instructor_name}</p>
                    </div>
                )}

                <div className="bg-black/20 rounded-2xl p-3.5 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Hash className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Sertifika ID</span>
                    </div>
                    <p className="text-xs font-mono text-slate-300 truncate">{cert.certificate_id}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 grid grid-cols-3 gap-2">
                <button
                    onClick={onPreview}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                    <Eye className="w-3.5 h-3.5" />
                    Önizle
                </button>

                <button
                    onClick={() => onDownload('png')}
                    disabled={!!downloading}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all disabled:opacity-50"
                >
                    {isPNGLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <FileImage className="w-3.5 h-3.5" />
                    }
                    PNG
                </button>

                <button
                    onClick={() => onDownload('pdf')}
                    disabled={!!downloading}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 transition-all disabled:opacity-50"
                >
                    {isPDFLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <FileText className="w-3.5 h-3.5" />
                    }
                    PDF
                </button>
            </div>

            {/* Verified badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-2.5 py-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">Doğrulandı</span>
            </div>
        </div>
    );
};

export default Certificates;
