import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, ArrowRight, GraduationCap, CheckCircle, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface HeroSectionProps {
  data?: {
    title?: string;
    subtitle?: string;
    cta_text?: string;
    cta_link?: string;
  };
  stats?: any[];
}

export const HeroSection = ({ data }: HeroSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const slides = [
    {
      badge: "Yapay Zeka Destekli Kariyer Yolculuğu",
      title: data?.title ? [data.title, "Geleceğinizi", "Şekillendirin"] : ["Hayallerinizdeki", "Kariyeri", "İnşa Edin"],
      subtitle: data?.subtitle || "Sektör liderlerinden öğrenin, gerçek projelerle yetkinlik kazanın.",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
      link: data?.cta_link || "/courses",
      bgColor: "bg-purple-100/80"
    },
    {
      badge: "Geleceğin Teknolojileri",
      title: ["Yazılım ve", "Tasarımda", "Uzmanlaşın"],
      subtitle: "En güncel müfredatlarla yeteneklerinizi bir üst seviyeye taşıyın.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
      link: "/courses",
      bgColor: "bg-blue-100/80"
    },
    {
      badge: "Uygulamalı Öğrenim",
      title: ["Gerçek Dünya", "Projeleriyle", "Tanışın"],
      subtitle: "Şirketlerin aradığı gerçek problemlere çözüm üreterek portfolyo oluşturun.",
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
      link: "/courses",
      bgColor: "bg-emerald-100/80"
    }
  ];

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  return (
    <section className="relative bg-white pt-6 pb-12 overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-50/40 rounded-full blur-3xl -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/40 rounded-full blur-3xl -ml-48 -mb-48" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="relative group/hero">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {slides.map((slide, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0 px-2 lg:px-4">
                  <div className={cn(
                    "rounded-[2rem] p-6 lg:p-10 border transition-colors duration-500",
                    slide.bgColor,
                    index === 0 ? "border-purple-200/50" : index === 1 ? "border-blue-200/50" : "border-emerald-200/50"
                  )}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                      {/* Left Content */}
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 mr-1.5" />
                          {slide.badge}
                        </Badge>

                        <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                          <span className="block mb-1">{slide.title[0]}</span>
                          <span className="relative inline-block pb-1">
                            <span className="relative z-10 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{slide.title[1]}</span>
                            <span className="absolute bottom-2 left-0 w-full h-2.5 bg-purple-100 -z-0 rounded-lg opacity-40" />
                          </span>
                          <span className="block">{slide.title[2]}</span>
                        </h1>

                        <p className="text-sm lg:text-base text-gray-500 leading-relaxed max-w-md font-medium">
                          {slide.subtitle}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {index === 0 ? (
                            <form className="relative flex items-center p-1 rounded-xl bg-white shadow-lg border border-gray-100 w-full max-w-sm">
                              <Search className="ml-3 w-4 h-4 text-gray-400" />
                              <Input
                                placeholder="Kurs ara..."
                                className="border-0 shadow-none focus-visible:ring-0 text-gray-700 h-10 pl-2 text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white px-4 h-10 rounded-lg font-bold">
                                Ara
                              </Button>
                            </form>
                          ) : (
                            <Link to={slide.link}>
                              <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-6 h-12 rounded-xl font-bold transition-all hover:scale-105">
                                Keşfet
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          )}
                        </div>

                        {/* Mini Benefits */}
                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter pt-2">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-green-500" /> Sertifika
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-green-500" /> Ömür Boyu
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-green-500" /> 7/24 Destek
                          </div>
                        </div>
                      </div>

                      {/* Right Visual */}
                      <div className="relative hidden lg:block">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video max-h-[300px] border-4 border-white">
                          <img
                            src={slide.image}
                            alt="Visual"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                        </div>

                        {/* Compact Floating Cards */}
                        <div className="absolute -top-4 -right-4 bg-white p-3 rounded-xl shadow-lg border border-gray-50 flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-900">PRATİK EĞİTİM</span>
                        </div>

                        <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-xl shadow-lg border border-gray-50 flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-900">RESMİ BELGE</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Controls (Oklar) */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center border border-gray-50 text-gray-400 hover:text-purple-600 hover:scale-110 transition-all z-20 opacity-0 group-hover/hero:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center border border-gray-50 text-gray-400 hover:text-purple-600 hover:scale-110 transition-all z-20 opacity-0 group-hover/hero:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Minified Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                selectedIndex === index
                  ? "bg-purple-600 w-4"
                  : "bg-gray-200 hover:bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};