import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface PlaceholderSectionProps {
    title?: string;
    onBack: () => void;
}

export const PlaceholderSection: React.FC<PlaceholderSectionProps> = ({ title, onBack }) => {
    return (
        <div className='flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-500'>
            <div className='w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-8'>
                <Zap className='w-10 h-10 text-slate-300' />
            </div>
            <h2 className='text-3xl font-black text-slate-900 tracking-tight'>
                {title ? `${title} Yapım Aşamasında` : 'Bu bölüm geliştirme aşamasındadır'}
            </h2>
            <p className='text-slate-400 font-bold mt-2 uppercase tracking-widest text-sm'>Çok yakında burada harika şeyler olacak!</p>
            <Button variant='link' onClick={onBack} className='mt-8 text-indigo-600 font-black text-sm'>
                PANELE GERİ DÖN
            </Button>
        </div>
    );
};
