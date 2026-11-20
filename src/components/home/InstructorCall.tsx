import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Ana sayfanın eğitmen çağrısı.
 *
 * Nane zemin, koyu mürekkep yazı. Vurgu tek: yüksek komisyon. Oran yazılmıyor;
 * yerine "eğitmen olmanın maliyeti" diye bir fiş var: kurs açmak, video
 * yüklemek, yayınlamak ve aylık ücret sıfır, en altta "satıştan payın: yüksek
 * komisyon". Platform yalnızca satış olduğunda pay aldığı için fişteki her
 * satır doğru.
 */
const LINES = [
    { k: 'Kurs açma', v: '0 ₺' },
    { k: 'Video yükleme', v: '0 ₺' },
    { k: 'Yayınlama', v: '0 ₺' },
    { k: 'Aylık ücret', v: '0 ₺' },
];

export const InstructorCall: React.FC = () => (
    <section className="relative overflow-hidden bg-[#b2f0c8] text-[#111827]">
        {/* Büyük, soluk "%" yerine marka işareti: köşede dev bir halka */}
        <div aria-hidden className="absolute -right-40 -bottom-56 w-[620px] h-[620px] rounded-full border-[70px] border-[#111827]/[0.05]" />
        <div aria-hidden className="absolute -left-24 -top-32 w-[360px] h-[360px] rounded-full bg-white/30 blur-[90px]" />

        <div className="container relative px-4 py-16 lg:py-24">
            <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-14 lg:gap-16 items-center">
                <div>
                    <h2 className="font-jakarta font-extrabold tracking-[-0.035em] leading-[1.14] text-[38px] sm:text-[52px] lg:text-[60px]">
                        <span className="block">Bildiğini öğret,</span>
                        <span className="inline-block my-1 -ml-1 -rotate-[1.5deg] rounded-[0.32em] bg-[#1B7A43] px-[0.28em] pb-[0.1em] pt-[0.02em] text-white whitespace-nowrap shadow-[0_14px_30px_-14px_rgba(0,32,29,0.7)]">
                            yüksek komisyonla
                        </span>{' '}
                        <span className="whitespace-nowrap">kazan.</span>
                    </h2>

                    <p className="mt-7 text-[17px] sm:text-[18px] leading-relaxed text-[#14423d] max-w-[36rem]">
                        Kursunu bir kez hazırla, her satışta kazan. Edurce yalnızca satış olduğunda pay alır;
                        satışın büyük kısmı her zaman senin. Kurulum ücreti yok, aylık ödeme yok.
                    </p>

                    <ul className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-[36rem] text-[15px] font-semibold text-[#111827]">
                        {[
                            'Ödemen her ay seçtiğin gün hesabında',
                            'Satışlar, kesintiler, net kazanç tek ekranda',
                            'Öğrenci soruları ve mesajları tek yerde',
                            'Kendi kuponunla kendi kampanyanı yap',
                        ].map(t => (
                            <li key={t} className="flex items-start gap-3">
                                <span aria-hidden className="mt-[9px] w-2 h-2 rounded-full bg-[#1B7A43] shrink-0" />
                                {t}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                        <Link
                            to="/become-instructor"
                            className="group inline-flex items-center gap-2.5 h-14 px-7 rounded-2xl bg-[#1B7A43] text-white text-[16px] font-extrabold shadow-[0_18px_36px_-16px_rgba(0,32,29,0.7)] hover:bg-[#16613A] active:scale-[0.98] transition-[background-color,transform]"
                        >
                            Eğitmen ol
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            to="/pricing"
                            className="text-[15px] font-bold text-[#111827] underline underline-offset-[6px] decoration-2 decoration-[#111827]/30 hover:decoration-[#111827] transition-colors"
                        >
                            Nasıl kazanırım?
                        </Link>
                    </div>
                </div>

                {/* ── Fiş ───────────────────────────────────────────────── */}
                <div className="flex justify-center lg:justify-end">
                    <figure
                        className="group/receipt relative w-full max-w-[380px] rotate-[2.5deg] hover:rotate-0 transition-transform duration-500 motion-reduce:transition-none"
                        style={{ transitionTimingFunction: 'cubic-bezier(0.23,1,0.32,1)' }}
                    >
                        <div
                            className="bg-white px-7 pt-7 pb-10 shadow-[0_40px_70px_-30px_rgba(0,32,29,0.55)]"
                            style={{
                                // Alt kenar tırtıklı: fiş kopartılmış gibi
                                maskImage: 'linear-gradient(#000 0 0) top/100% calc(100% - 12px) no-repeat, radial-gradient(circle at 10px 0, transparent 9px, #000 9.5px) bottom/20px 12px repeat-x',
                                WebkitMaskImage: 'linear-gradient(#000 0 0) top/100% calc(100% - 12px) no-repeat, radial-gradient(circle at 10px 0, transparent 9px, #000 9.5px) bottom/20px 12px repeat-x',
                                borderRadius: '18px 18px 0 0',
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <img src="/logo-ink.png" alt="Edurce" className="h-6 w-auto" />
                                <span className="text-[12px] font-bold text-[#4B5563]">Eğitmen</span>
                            </div>
                            <p className="mt-6 text-[19px] font-extrabold tracking-tight">Eğitmen olmanın maliyeti</p>

                            <dl className="mt-5">
                                {LINES.map(l => (
                                    <div key={l.k} className="flex items-baseline gap-2 py-2.5 text-[15px]">
                                        <dt className="text-[#374151]">{l.k}</dt>
                                        <span aria-hidden className="flex-1 border-b-2 border-dotted border-[#c9d6d3] translate-y-[-4px]" />
                                        <dd className="font-extrabold tabular-nums">{l.v}</dd>
                                    </div>
                                ))}
                            </dl>

                            <div className="mt-4 pt-5 border-t-2 border-dashed border-[#c9d6d3]">
                                <p className="text-[13px] font-bold text-[#4B5563]">Satıştan payın</p>
                                <p className="mt-2 inline-flex items-center rounded-xl bg-[#1B7A43] px-4 py-2.5 text-[22px] font-extrabold tracking-tight text-white">
                                    Yüksek komisyon
                                </p>
                            </div>

                            <figcaption className="mt-6 text-[12.5px] text-[#6B7280] leading-relaxed">
                                Platform yalnızca kursun satıldığında pay alır.
                            </figcaption>
                        </div>
                    </figure>
                </div>
            </div>
        </div>
    </section>
);

export default InstructorCall;
