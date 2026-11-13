import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import { CornerDownRight, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { btn, field, Empty, Initials, Loading, PageHead, Panel, SearchBox, Segments, Tag } from '../shell/kit';
import { relativeTime } from '../shell/useInstructorWorkspace';

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

type Filter = 'all' | 'unanswered' | 'answered';

export function InstructorQA(_props: InstructorQAProps) {
    const [answerContent, setAnswerContent] = useState('');
    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<Filter>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading, isError, refetch } = useQuery({
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
            // Sunucu is_answered'ı işaretledi; liste tazelenince menüdeki sayı da düşüyor
            refetch();
            toast.success('Cevabın gönderildi');
        },
        onError: () => toast.error('Cevap gönderilemedi. Bağlantını kontrol edip tekrar dene.'),
    });

    const questions: Question[] = data?.questions || [];

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
        const has = (s?: string) => !!s && s.toLocaleLowerCase('tr-TR').includes(q);
        return questions
            .filter(item => {
                if (filterStatus === 'unanswered' && item.is_answered) return false;
                if (filterStatus === 'answered' && !item.is_answered) return false;
                if (!q) return true;
                return has(item.content) || has(item.title) || has(item.course_title) || has(`${item.first_name || ''} ${item.last_name || ''}`);
            })
            // Bekleyenler üstte
            .sort((a, b) => Number(Boolean(a.is_answered)) - Number(Boolean(b.is_answered)));
    }, [questions, filterStatus, searchTerm]);

    const unansweredCount = questions.filter(q => !q.is_answered).length;

    if (isLoading) return <Loading label="Sorular yükleniyor" />;

    return (
        <>
            <PageHead
                title="Soru-Cevap"
                sub={unansweredCount > 0
                    ? <><b className="font-bold text-[#00201d]">{unansweredCount} soru</b> cevabını bekliyor.</>
                    : 'Bekleyen soru yok, hepsi cevaplanmış.'}
            />

            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
                <Segments
                    value={filterStatus}
                    onChange={v => setFilterStatus(v as Filter)}
                    items={[
                        { value: 'all', label: 'Tümü', count: questions.length },
                        { value: 'unanswered', label: 'Cevap bekleyen', count: unansweredCount },
                        { value: 'answered', label: 'Cevaplanan', count: questions.length - unansweredCount },
                    ]}
                />
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Soru, kurs veya öğrenci ara"
                    className="lg:ml-auto lg:w-72"
                />
            </div>

            {isError ? (
                <Empty title="Sorular yüklenemedi" text="Bağlantıda bir sorun oldu." action={{ label: 'Tekrar dene', onClick: () => refetch() }} />
            ) : filtered.length === 0 ? (
                <Empty
                    title={questions.length === 0 ? 'Henüz soru gelmedi' : 'Bu filtreye uyan soru yok'}
                    text={questions.length === 0
                        ? 'Öğrencilerin derslerin altından soru sorduğunda burada göreceksin.'
                        : 'Başka bir sekmeyi seç ya da aramayı temizle.'}
                />
            ) : (
                <Panel as="section" className="divide-y divide-[#eceeed]">
                    {filtered.map(q => {
                        const studentName = `${q.first_name || ''} ${q.last_name || ''}`.trim() || 'Öğrenci';
                        const answered = Boolean(q.is_answered);
                        const isReplying = activeQuestionId === q.question_id;

                        return (
                            <article key={q.question_id} className="px-5 sm:px-6 py-5">
                                <div className="flex items-start gap-3.5">
                                    <Initials name={studentName} src={q.profile_image} size={40} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="text-[14px] font-bold text-[#00201d]">{studentName}</span>
                                            <span className="text-[12.5px] text-[#5f7774]">{relativeTime(q.created_at)}</span>
                                            {answered
                                                ? <Tag tone="live">Cevaplandı</Tag>
                                                : <Tag tone="warn">Cevap bekliyor</Tag>}
                                        </div>
                                        {q.course_title && (
                                            <p className="text-[12.5px] text-[#5f7774] mt-0.5">
                                                {q.course_title}{q.lesson_title ? ` · ${q.lesson_title}` : ''}
                                            </p>
                                        )}
                                        {q.title && <h3 className="text-[15.5px] font-bold text-[#00201d] mt-2.5">{q.title}</h3>}
                                        <p className={cn('text-[14.5px] text-[#1d3a37] leading-relaxed whitespace-pre-wrap', q.title ? 'mt-1' : 'mt-2.5')}>
                                            {q.content}
                                        </p>

                                        {(q.answers?.length ?? 0) > 0 && (
                                            <ul className="mt-4 space-y-2">
                                                {q.answers!.map(a => {
                                                    const name = `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Kullanıcı';
                                                    const mine = Boolean(a.is_instructor_answer);
                                                    return (
                                                        <li
                                                            key={a.answer_id}
                                                            className={cn('flex items-start gap-3 rounded-xl px-3.5 py-3', mine ? 'bg-[#ecfbf8]' : 'bg-[#f6f9f8]')}
                                                        >
                                                            <Initials name={name} src={a.profile_image} size={28} />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-x-2.5">
                                                                    <span className="text-[13px] font-bold text-[#00201d]">{name}</span>
                                                                    {mine && <span className="text-[12px] font-bold text-[#005c55]">Eğitmen</span>}
                                                                    <span className="text-[12px] text-[#5f7774]">{relativeTime(a.created_at)}</span>
                                                                </div>
                                                                <p className="text-[14px] text-[#1d3a37] mt-0.5 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}

                                        <div className="mt-3.5">
                                            {isReplying ? (
                                                <form
                                                    className="space-y-2.5"
                                                    onSubmit={e => { e.preventDefault(); answerMutation.mutate(q.question_id); }}
                                                >
                                                    <label className="sr-only" htmlFor={`a-${q.question_id}`}>Cevabın</label>
                                                    <textarea
                                                        id={`a-${q.question_id}`}
                                                        value={answerContent}
                                                        onChange={e => setAnswerContent(e.target.value)}
                                                        rows={4}
                                                        autoFocus
                                                        placeholder={`${studentName.split(' ')[0]} için cevabını yaz`}
                                                        className={cn(field, 'py-3 resize-y leading-relaxed')}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="submit"
                                                            disabled={!answerContent.trim() || answerMutation.isPending}
                                                            className={cn(btn.primary, btn.md)}
                                                        >
                                                            {answerMutation.isPending
                                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor</>
                                                                : <><Send className="w-4 h-4" /> Cevabı gönder</>}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setActiveQuestionId(null); setAnswerContent(''); }}
                                                            className={cn(btn.ghost, btn.md)}
                                                        >
                                                            Vazgeç
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => { setActiveQuestionId(q.question_id); setAnswerContent(''); }}
                                                    className={cn(answered ? btn.ghost : btn.primary, btn.sm, answered && '-ml-3')}
                                                >
                                                    <CornerDownRight className="w-4 h-4" />
                                                    {answered ? 'Yeni cevap ekle' : 'Cevapla'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </Panel>
            )}
        </>
    );
}

export default InstructorQA;
