import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
    /** Sol paneldeki başlık — sayfaya göre değişir */
    title: React.ReactNode;
    subtitle: string;
    /** Sol panelde sıralanan maddeler */
    points: string[];
    children: React.ReactNode;
}

/**
 * Giriş ve kayıt sayfalarının ortak çerçevesi.
 *
 * Tek bir dosyada durmasının sebebi: iki sayfa daha önce aynı düzeni ayrı ayrı
 * taşıyordu ve zamanla ayrışmıştı (farklı gradyanlar, farklı içerik). Ortak
 * bileşenle ikisi de aynı görünüyor.
 *
 * Sol panel marka renginde, sağ taraf form için beyaz.
 */
export const AuthLayout: React.FC<Props> = ({ title, subtitle, points, children }) => (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
        <div className="w-full max-w-[1080px] flex flex-col lg:flex-row bg-white rounded-3xl shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)] overflow-hidden border border-slate-200">

            {/* ── Sol: marka paneli ──────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[44%] relative bg-brand-900 p-12 flex-col justify-between">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -top-24 -left-16 w-96 h-96 bg-brand-500/25 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-28 -right-10 w-96 h-96 bg-brand-400/15 rounded-full blur-[110px]" />
                    <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                        }}
                    />
                </div>

                <div className="relative">
                    {/* Logo görselinin çevresi boş olduğu için büyütülüp kırpılıyor */}
                    <Link to="/" className="flex items-center overflow-hidden h-12 w-max -ml-1">
                        <img
                            src="/logo.png"
                            alt="Edurce"
                            className="h-40 w-auto object-contain brightness-0 invert"
                        />
                    </Link>
                </div>

                <div className="relative">
                    <h1 className="text-3xl font-bold text-white leading-tight">{title}</h1>
                    <p className="text-brand-100/75 mt-4 leading-relaxed">{subtitle}</p>

                    <ul className="mt-9 space-y-3.5">
                        {points.map(point => (
                            <li key={point} className="flex items-start gap-3 text-brand-50/90 text-[15px]">
                                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand-300 shrink-0" />
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative text-xs text-brand-200/60">
                    © {new Date().getFullYear()} Edurce
                </div>
            </div>

            {/* ── Sağ: form ──────────────────────────────────────────────── */}
            <div className="w-full lg:w-[56%] p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
                <div className="w-full max-w-[420px] mx-auto">
                    {/* Dar ekranda sol panel gizli; logo forma taşınıyor */}
                    <Link to="/" className="lg:hidden flex items-center justify-center overflow-hidden h-11 mb-8">
                        <img src="/logo.png" alt="Edurce" className="h-36 w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    </div>
);

export default AuthLayout;
