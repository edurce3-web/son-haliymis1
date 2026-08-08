import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from 'sonner';
import {
    Loader2, MessageCircle, Search, Send, CheckCircle2,
    Clock, CornerDownRight, BookOpen,
} from 'lucide-react';

interface InstructorQAProps {
    onBack?: () => void;
}

interface Answer {
    answer_id: number;
    user_id: number;
    content: string;
    is_instructor_answer: boolean | number;
    first_name?: string;
    last_name?: string;
    profile_image?: string | null;
    created_at: string;
}

interface Question {
    question_id: number;
    user_id: number;
    title?: string;
    content: string;
    is_answered: boolean | number;
    created_at: string;
    first_name?: string;
    last_name?: string;
    profile_image?: string | null;
    course_title?: string;
    lesson_title?: string;
    answers?: Answer[];
}

const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'az önce';
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} sa önce`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} gün önce`;
    return new Date(date).toLocaleDateString('tr-TR');
};

export function InstructorQA({ onBack }: InstructorQAProps) {
    const [answerContent, setAnswerContent] = useState('');
    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'unanswered' | 'answered'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['instructor-questions'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/qa/instructor-questions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Sorular yüklenemedi');
            return res.json();
        },
    });

    const answerMutation = useMutation({
        mutationFn: async (questionId: number) => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/questions/${questionId}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: answerContent }),
            });
            if (!res.ok) throw new Error('Cevap gönderilemedi');
            return res.json();
        },
        onSuccess: () => {
            setAnswerContent('');
            setActiveQuestionId(null);
            // Sunucu is_answered'ı işaretledi; listeyi tazeleyince rozet güncellenir
            refetch();
            toast.success('Cevabın gönderildi');
        },
        onError: () => toast.error('Cevap gönderilemedi'),
    });

    const questions: Question[] = data?.questions || [];

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return questions.filter(item => {
            if (filterStatus === 'unanswered' && item.is_answered) return false;
            if (filterStatus === 'answered' && !item.is_answered) return false;
            if (!q) return true;
            return (
                item.content?.toLowerCase().includes(q) ||
                item.title?.toLowerCase().includes(q) ||
                item.course_title?.toLowerCase().includes(q) ||
                `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase().includes(q)
            );
        });
    }, [questions, filterStatus, searchTerm]);

    const unansweredCount = questions.filter(q => !q.is_answered).length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    const tabs = [
        { id: 'all' as const, label: 'Tümü', count: questions.length },
        { id: 'unanswered' as const, label: 'Cevap bekleyen', count: unansweredCount },
        { id: 'answered' as const, label: 'Cevaplanan', count: questions.length - unansweredCount },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Soru & Cevap</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {unansweredCount > 0
                            ? `${unansweredCount} soru cevabını bekliyor.`
                            : 'Bekleyen soru yok, hepsi cevaplanmış.'}
                    </p>
                </div>
                {onBack && (
                    <Button variant="ghost" onClick={onBack} className="h-9 rounded-lg text-sm text-slate-500">
                        Panele dön
                    </Button>
                )}
            </div>

            {/* Filtre + arama */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === tab.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                            <span className="ml-1.5 text-xs text-slate-400">{tab.count}</span>
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Soru, kurs veya öğrenci ara"
                        className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">
                        {questions.length === 0 ? 'Henüz soru sorulmamış.' : 'Bu filtreye uyan soru yok.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(q => {
                        const studentName = `${q.first_name || ''} ${q.last_name || ''}`.trim() || 'Öğrenci';
                        const answered = Boolean(q.is_answered);
                        const isReplying = activeQuestionId === q.question_id;

                        return (
                            <article
                                key={q.question_id}
                                className={`bg-white border rounded-2xl overflow-hidden transition-colors ${answered ? 'border-slate-200' : 'border-amber-200'
                                    }`}
                            >
                                <div className="p-5">
                                    <div className="flex items-start gap-3">
                                        <UserAvatar src={q.profile_image} name={studentName} size={40} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-900 text-sm">{studentName}</span>
                                                <span className="text-xs text-slate-400">{timeAgo(q.created_at)}</span>
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${answered
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {answered
                                                        ? <><CheckCircle2 className="w-3 h-3" /> Cevaplandı</>
                                                        : <><Clock className="w-3 h-3" /> Bekliyor</>}
                                                </span>
                                            </div>

                                            {q.course_title && (
                                                <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                                    <BookOpen className="w-3 h-3" />
                                                    {q.course_title}
                                                    {q.lesson_title ? ` · ${q.lesson_title}` : ''}
                                                </p>
                                            )}

                                            {q.title && (
                                                <h3 className="font-medium text-slate-900 mt-2">{q.title}</h3>
                                            )}
                                            <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                                                {q.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Cevaplar */}
                                    {(q.answers?.length ?? 0) > 0 && (
                                        <div className="mt-4 ml-4 pl-6 border-l-2 border-slate-100 space-y-4">
                                            {q.answers!.map(a => {
                                                const answerName = `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Kullanıcı';
                                                return (
                                                    <div key={a.answer_id} className="flex items-start gap-3">
                                                        <UserAvatar src={a.profile_image} name={answerName} size={32} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-slate-800 text-sm">{answerName}</span>
                                                                {Boolean(a.is_instructor_answer) && (
                                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                                                        Eğitmen
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-slate-400">{timeAgo(a.created_at)}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 mt-0.5 leading-relaxed whitespace-pre-wrap">
                                                                {a.content}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Cevap yaz */}
                                    <div className="mt-4 ml-4 pl-6 border-l-2 border-transparent">
                                        {isReplying ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={answerContent}
                                                    onChange={e => setAnswerContent(e.target.value)}
                                                    rows={3}
                                                    autoFocus
                                                    placeholder="Cevabını yaz..."
                                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => answerMutation.mutate(q.question_id)}
                                                        disabled={!answerContent.trim() || answerMutation.isPending}
                                                        className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm"
                                                    >
                                                        {answerMutation.isPending
                                                            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Gönderiliyor</>
                                                            : <><Send className="w-3.5 h-3.5 mr-1.5" /> Gönder</>}
                                                    </Button>
                                                    <button
                                                        onClick={() => { setActiveQuestionId(null); setAnswerContent(''); }}
                                                        className="text-sm text-slate-500 hover:text-slate-700"
                                                    >
                                                        Vazgeç
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setActiveQuestionId(q.question_id); setAnswerContent(''); }}
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                            >
                                                <CornerDownRight className="w-4 h-4" />
                                                {answered ? 'Yeni cevap ekle' : 'Cevapla'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default InstructorQA;
