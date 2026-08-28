import React from 'react';

interface Props {
    /** Ekmek kırıntısı içeriği — bağlantılar ve ayraçlar */
    breadcrumb?: React.ReactNode;
    title: string;
    subtitle?: string;
    /** Sağ tarafa gelen eylemler (bağlantı, buton) */
    actions?: React.ReactNode;
}

/**
 * Öğrenci sayfalarının üst bandı.
 *
 * Kurs detay ve profil sayfalarındaki bandın aynısı: markanın açık tonunda
 * bir zemin ve ince ızgara dokusu. Eğitimlerim, Sertifikalarım ve Kitaplarım
 * aynı bileşeni kullanıyor; böylece sayfalar arasında geçerken başlık
 * yüksekliği ve rengi değişmiyor.
 */
export const PageBand: React.FC<Props> = ({ breadcrumb, title, subtitle, actions }) => (
    <div className="relative bg-gradient-to-br from-brand-50 via-brand-100/60 to-white border-b border-brand-100">
        <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
                backgroundImage:
                    'linear-gradient(to right, rgba(23,93,93,0.06) 1px, transparent 1px),'
                    + 'linear-gradient(to bottom, rgba(23,93,93,0.06) 1px, transparent 1px)',
                backgroundSize: '34px 34px',
            }}
        />

        <div className="container relative mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-8 lg:py-10">
            {breadcrumb && (
                <nav className="flex items-center gap-2 text-[13px] text-slate-500 mb-4">
                    {breadcrumb}
                </nav>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="font-montserrat text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-[-0.025em] leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[14.5px] text-slate-600 mt-2">{subtitle}</p>
                    )}
                </div>
                {actions && <div className="flex flex-wrap gap-2.5 shrink-0">{actions}</div>}
            </div>
        </div>
    </div>
);

export default PageBand;
