import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import {
  MessageCircle,
    Send,
    CheckCircle2,
    Clock,
    User,
    BookOpen,
    BadgeCheck,
    Loader2,
    Filter,
    Search,
    ChevronDown,
    ChevronUp,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InstructorQAProps {
    onBack?: () => void;
}

export function InstructorQA({ onBack }: InstructorQAProps) {
    const queryClient = useQueryClient();
    const [answerContent, setAnswerContent] = useState('');
    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'unanswered' | 'answered'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Fetch instructor questions
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['instructor-questions'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/qa/instructor-questions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Sorular yüklenemedi');
            return res.json();
        },
    });

    // Answer mutation
    const answerMutation = useMutation({
        mutationFn: async (questionId: number) => {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/questions/${questionId}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: answerContent })
            });
            if (!res.ok) throw new Error('Cevap gönderilemedi');
            return res.json();
        },
        onSuccess: () => {
            setAnswerContent('');
            setActiveQuestionId(null);
            refetch();
            toast.success('Cevabınız gönderildi!');
        },
        onError: () => toast.error('Cevap gönderilemedi.')
    });

    const questions = data?.questions || [];

    // Filter & search
    const filteredQuestions = questions.filter((q: any) => {
        if (filterStatus === 'unanswered' && q.is_answered) return false;
        if (filterStatus === 'answered' && !q.is_answered) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return q.title?.toLowerCase().includes(term) || q.content?.toLowerCase().includes(term) || q.course_title?.toLowerCase().includes(term);
        }
        return true;
    });

    const unansweredCount = questions.filter((q: any) => !q.is_answered).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Soru & Cevap</h1>
                        <p className="text-sm text-slate-400 mt-1">Öğrencilerinizin sorularını yanıtlayın</p>
                    </div>
                </div>
                {unansweredCount > 0 && (
                    <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {unansweredCount} cevaplanmamış soru
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Soru veya kurs ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 h-11 rounded-xl bg-white border-slate-200 text-sm font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    {[
                        { key: 'all', label: 'Tümü', count: questions.length },
                        { key: 'unanswered', label: 'Cevaplanmamış', count: unansweredCount },
                        { key: 'answered', label: 'Cevaplanan', count: questions.length - unansweredCount },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilterStatus(f.key as any)}
                            className={cn(
                                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                filterStatus === f.key
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                            )}
                        >
                            {f.label}
                            <span className={cn("px-1.5 py-0.5 rounded-lg text-[10px]", filterStatus === f.key ? "bg-white/20" : "bg-slate-100")}>{f.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Questions List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                        <span className="text-sm text-slate-400 font-medium">Sorular yükleniyor...</span>
                    </div>
                </div>
            ) : filteredQuestions.length > 0 ? (
                <div className="space-y-4">
                    {filteredQuestions.map((q: any) => {
                        const isExpanded = expandedId === q.question_id;
                        return (
                            <div
                                key={q.question_id}
                                className={cn(
                                    "bg-white rounded-2xl border transition-all duration-300 overflow-hidden",
                                    !q.is_answered ? "border-orange-200 ring-1 ring-orange-100" : "border-slate-100",
                                    isExpanded && "shadow-lg"
                                )}
                            >
                                {/* Question Header */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : q.question_id)}
                                    className="w-full text-left p-5 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                            q.is_answered ? "bg-emerald-50" : "bg-orange-50"
                                        )}>
                                            {q.is_answered
                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                : <Clock className="w-5 h-5 text-orange-500" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-sm font-bold text-slate-700">{q.first_name} {q.last_name}</span>
                                                <span className="text-[10px] text-slate-400">•</span>
                                                <span className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString('tr-TR')}</span>
                                                {!q.is_answered && <Badge className="bg-orange-100 text-orange-600 border-none text-[10px] px-2 font-bold">Bekliyor</Badge>}
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 mb-1">{q.title}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">
                                                    <BookOpen className="w-3 h-3 mr-1" /> {q.course_title}
                                                </Badge>
                                                {q.lesson_title && (
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 font-medium">
                                                        {q.lesson_title}
                                                    </Badge>
                                                )}
                                                <span className="text-[10px] text-slate-400">{q.answer_count} cevap</span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-slate-300">
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Soru İçeriği */}
                                        <div className="py-4 mb-4 bg-slate-50 rounded-xl p-4 mt-4">
                                            <p className="text-sm text-slate-600 leading-relaxed">{q.content}</p>
                                        </div>

                                        {/* Mevcut Cevaplar */}
                                        {q.answers?.length > 0 && (
                                            <div className="space-y-3 mb-4">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Cevaplar</h4>
                                                {q.answers.map((a: any) => (
                                                    <div
                                                        key={a.answer_id}
                                                        className={cn(
                                                            "p-4 rounded-xl",
                                                            a.is_instructor_answer ? "bg-indigo-50 border border-indigo-100" : "bg-white border border-slate-100"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                                                <User className="w-3 h-3 text-slate-500" />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700">{a.first_name} {a.last_name}</span>
                                                            {a.is_instructor_answer && (
                                                                <Badge className="bg-indigo-100 text-indigo-600 border-none text-[10px] px-2">
                                                                    <BadgeCheck className="w-3 h-3 mr-1" /> Eğitmen
                                                                </Badge>
                                                            )}
                                                            <span className="text-[10px] text-slate-400 ml-auto">{new Date(a.created_at).toLocaleDateString('tr-TR')}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed">{a.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Cevap Yaz */}
                                        {activeQuestionId === q.question_id ? (
                                            <div className="space-y-3 mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Cevabınız</h4>
                                                <Textarea
                                                    placeholder="Soruyu yanıtlayın..."
                                                    value={answerContent}
                                                    onChange={(e) => setAnswerContent(e.target.value)}
                                                    className="bg-white border-indigo-200 min-h-[120px] text-slate-700 rounded-xl resize-none text-sm focus-visible:ring-indigo-500"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => { setActiveQuestionId(null); setAnswerContent(''); }}
                                                        className="text-slate-400 rounded-xl text-xs font-bold"
                                                    >
                                                        İptal
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => answerMutation.mutate(q.question_id)}
                                                        disabled={!answerContent || answerMutation.isPending}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 text-xs font-bold"
                                                    >
                                                        {answerMutation.isPending ? (
                                                            <><Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Gönderiliyor</>
                                                        ) : (
                                                            <><Send className="w-3 h-3 mr-1.5" /> Cevapla</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => setActiveQuestionId(q.question_id)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 text-xs font-bold mt-2"
                                            >
                                                <Send className="w-3 h-3 mr-1.5" /> Cevap Yaz
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <MessageCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">
                        {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz soru sorulmamış'}
                    </h3>
                    <p className="text-sm text-slate-400">
                        {searchTerm ? 'Farklı anahtar kelimeler deneyin' : 'Öğrencileriniz soru sorduğunda burada göreceksiniz'}
                    </p>
                </div>
            )}
        </div>
    );
}
