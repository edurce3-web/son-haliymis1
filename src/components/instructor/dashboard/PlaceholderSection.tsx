import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { btn, PageHead, Panel } from '../shell/kit';

interface PlaceholderSectionProps {
    title?: string;
    onBack?: () => void;
}

/*
 * Yardım sayfası. Yalnızca panelde gerçekten olan yolları anlatıyor;
 * kural ya da oran uydurmuyor. Daha fazlası için sitenin yardım ve
 * iletişim sayfalarına yönlendiriyor.
 */
const FAQ: { q: string; a: React.ReactNode }[] = [
    {
        q: 'Yeni bir kursa nasıl başlarım?',
        a: <>Soldaki menüde <b>Kurslar</b> başlığının üzerine gel ve <b>Yeni kurs oluştur</b>'a tıkla. Kursu bir oturumda bitirmen gerekmiyor; yarım kalan kurslar Genel bakış'ta "Hazırlanan kursların" altında bekler, <b>Devam et</b> ile kaldığın yerden sürersin.</>,
    },
    {
        q: 'Kursum neden "İncelemede" görünüyor?',
        a: <>İncelemeye gönderdiğin kurs, ekibimiz kontrol edene kadar bu durumda kalır. Onaylanınca durumu <b>Yayında</b> olur ve öğrenciler satın alabilir.</>,
    },
    {
        q: 'Öğrencimin sorusunu nerede cevaplarım?',
        a: <><b>Öğrenciler → Soru-Cevap</b> sayfasında. Cevap bekleyen sorular üstte durur; menüdeki turuncu sayı kaç sorunun beklediğini gösterir.</>,
    },
    {
        q: 'Kazancım ne zaman ve nereye yatar?',
        a: <><b>Kazanç → Ödeme bilgileri</b> sayfasında IBAN'ını ve ödeme gününü seç. Ödenecek bakiyen o gün hesabına aktarılır. Satış ve kesintilerin dökümü <b>Gelir raporu</b>'nda.</>,
    },
    {
        q: 'Profilim öğrencilere nasıl görünüyor?',
        a: <><b>Hesap → Eğitmen profili</b> sayfasında solda duran kart, kurs sayfandaki tanıtımının önizlemesidir. Fotoğrafını, unvanını ve biyografini oradan değiştirirsin.</>,
    },
];

export const PlaceholderSection: React.FC<PlaceholderSectionProps> = () => {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <div className="max-w-3xl">
            <PageHead title="Yardım" sub="Panelde en çok sorulanlar" />

            <Panel as="section" className="divide-y divide-[#e8f2f0] overflow-hidden">
                {FAQ.map((f, i) => {
                    const isOpen = open === i;
                    return (
                        <div key={f.q}>
                            <h2>
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-controls={`faq-${i}`}
                                    onClick={() => setOpen(isOpen ? null : i)}
                                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left hover:bg-[#f4fcfa] focus-visible:outline-none focus-visible:bg-[#ecfbf8] transition-colors"
                                >
                                    <span className="text-[15.5px] font-bold text-[#00201d]">{f.q}</span>
                                    <ChevronDown className={cn('w-4 h-4 text-[#4a6360] shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
                                </button>
                            </h2>
                            {isOpen && (
                                <p id={`faq-${i}`} className="px-5 sm:px-6 pb-5 -mt-1 text-[14.5px] leading-relaxed text-[#1d3a37] max-w-[68ch] [&_b]:font-bold [&_b]:text-[#00201d]">
                                    {f.a}
                                </p>
                            )}
                        </div>
                    );
                })}
            </Panel>

            <section className="mt-6 rounded-2xl bg-[#9cf2e8] px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-[17px] font-extrabold tracking-tight text-[#00201d]">Cevabını bulamadın mı?</h2>
                    <p className="mt-1 text-[14px] text-[#1d4a45]">Bize yaz, sorunun ne olduğunu birlikte çözelim.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link to="/help" className={cn(btn.outline, btn.md, 'ring-[#00201d]/15')}>Yardım merkezi</Link>
                    <Link to="/contact" className={cn(btn.dark, btn.md)}>Bize yaz</Link>
                </div>
            </section>
        </div>
    );
};
