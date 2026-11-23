import React from 'react';

interface Props {
    /** Ekmek kırıntısı içeriği — bağlantılar ve ayraçlar */
    breadcrumb?: React.ReactNode;
    /** Başlığın üstündeki küçük etiket */
    eyebrow?: string;
    title: string;
    subtitle?: string;
    /** Sağ tarafa gelen eylemler (bağlantı, buton) */
    actions?: React.ReactNode;
}

/**
 * Öğrenci sayfalarının üst bandı.
 *
 * Kenarlardan içeri çekilmiş, köşeleri yuvarlak açık gri yüzey; sağ üstte
 * logonun nane renginde yumuşak bir şekil. Bilgi sayfalarının başlığıyla aynı
 * dil. Eğitimlerim, Başarılarım, Sertifikalarım, Kitaplarım, Favoriler, Sepet,
 * Bildirimler ve Ayarlar bu bileşeni kullanıyor; sayfalar arasında geçerken
 * başlığın yüksekliği ve rengi değişmiyor.
 */
export const PageBand: React.FC<Props> = ({ breadcrumb, eyebrow, title, subtitle, actions }) => (
    <div>
        <div className="relative overflow-hidden   bg-[#F5F6F8]">
            <div aria-hidden className="absolute -right-20 -top-24 w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] rounded-[38%] bg-[#B2F0C8] rotate-12" />

            <div className="relative mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-7 lg:py-9">
                {breadcrumb && (
                    <nav className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280] mb-5 [&_a:hover]:text-[#111827]">
                        {breadcrumb}
                    </nav>
                )}

                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        {eyebrow && (
                            <p className="text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#1B7A43] mb-2">{eyebrow}</p>
                        )}
                        <h1 className="font-jakarta text-[28px] sm:text-[36px] font-extrabold text-[#111827] tracking-[-0.03em] leading-[1.08]">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-[15px] text-[#4B5563] mt-2 max-w-[60ch]">{subtitle}</p>
                        )}
                    </div>
                    {actions && <div className="relative flex flex-wrap gap-2.5 shrink-0">{actions}</div>}
                </div>
            </div>
        </div>
    </div>
);

export default PageBand;
