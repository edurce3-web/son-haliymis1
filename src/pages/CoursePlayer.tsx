import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import {
  Play,
    CheckCircle2,
    Circle,
    Menu,
    X,
    MessageSquare,
    FileText,
    Award,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    MonitorPlay,
    ListVideo,
    Trophy,
    GraduationCap,
    Star,
    Send,
    Download,
    User,
    Clock,
    BadgeCheck,
    Loader2,
    HelpCircle,
    Megaphone,
    StickyNote
} from 'lucide-react';
import { coursesAPI, progressAPI, reviewsAPI, certificatesAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { drawCertificate } from '@/lib/certificateGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import HLSVideoPlayer from '@/components/video/HLSVideoPlayer';

// ─── NotesTab ────────────────────────────────────────────────────────────────
const NotesTab: React.FC<{ courseId: number; lessonId: number | null }> = ({ courseId, lessonId }) => {
    const qc = useQueryClient();
    const [draft, setDraft] = React.useState('');
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [editText, setEditText] = React.useState('');
    const token = () => localStorage.getItem('token');

    const url = lessonId
        ? `/api/notes?course_id=${courseId}&lesson_id=${lessonId}`
        : `/api/notes?course_id=${courseId}`;

    const { data, isLoading } = useQuery({
        queryKey: ['course-notes', courseId, lessonId],
        queryFn: async () => {
            const r = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
            if (!r.ok) return { notes: [] };
            return r.json();
        },
        enabled: !!courseId && !!token()
    });

    const addMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ course_id: courseId, lesson_id: lessonId, content: draft })
            });
            if (!r.ok) throw new Error('Not kaydedilemedi');
            return r.json();
        },
        onSuccess: () => { setDraft(''); qc.invalidateQueries({ queryKey: ['course-notes', courseId, lessonId] }); toast.success('Not kaydedildi!'); },
        onError: () => toast.error('Not kaydedilemedi.')
    });

    const updateMutation = useMutation({
        mutationFn: async (noteId: number) => {
            const r = await fetch(`/api/notes/${noteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ content: editText })
            });
            if (!r.ok) throw new Error();
            return r.json();
        },
        onSuccess: () => { setEditingId(null); setEditText(''); qc.invalidateQueries({ queryKey: ['course-notes', courseId, lessonId] }); }
    });

    const deleteMutation = useMutation({
        mutationFn: async (noteId: number) => {
            await fetch(`/api/notes/${noteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['course-notes', courseId, lessonId] })
    });

    const notes = data?.notes || [];

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
                <StickyNote className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100">Ders Notlarım</h3>
                <span className="text-xs text-slate-500 ml-auto">{notes.length} not</span>
            </div>
            <div className="space-y-2">
                <Textarea
                    placeholder="Bu dersle ilgili notunuzu yazın..."
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); if (draft.trim()) addMutation.mutate(); } }}
                    className="bg-slate-900 border-white/10 text-slate-200 min-h-[100px] rounded-xl resize-none focus-visible:ring-indigo-500 placeholder:text-slate-600"
                />
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-600">Ctrl+Enter ile kaydet</span>
                    <Button onClick={() => addMutation.mutate()} disabled={!draft.trim() || addMutation.isPending} size="sm"
                        className="bg-indigo-500 hover:bg-indigo-600 rounded-full px-6 text-xs font-semibold">
                        {addMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Kaydet'}
                    </Button>
                </div>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
            ) : notes.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-sm">Henüz not yok. İlk notunuzu ekleyin!</div>
            ) : (
                <div className="space-y-3">
                    {notes.map((n: any) => (
                        <div key={n.note_id} className="bg-slate-800/40 border border-white/5 rounded-xl p-4 group">
                            {editingId === n.note_id ? (
                                <div className="space-y-2">
                                    <Textarea value={editText} onChange={e => setEditText(e.target.value)}
                                        className="bg-slate-900 border-white/10 text-slate-200 min-h-[80px] rounded-xl resize-none text-sm" />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingId(null)} className="text-[11px] text-slate-500 hover:text-slate-300">İptal</button>
                                        <button onClick={() => updateMutation.mutate(n.note_id)} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold">Kaydet</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] text-slate-600">
                                            {new Date(n.created_at).toLocaleString('tr-TR')}
                                        </span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
                                            <button onClick={() => { setEditingId(n.note_id); setEditText(n.content); }}
                                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium">Düzenle</button>
                                            <button onClick={() => deleteMutation.mutate(n.note_id)}
                                                className="text-[10px] text-rose-400 hover:text-rose-300 font-medium">Sil</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── AnnouncementsTab ─────────────────────────────────────────────────────────
const AnnouncementsTab: React.FC<{ courseId: number }> = ({ courseId }) => {
    const [expanded, setExpanded] = React.useState<number | null>(null);
    const { data, isLoading } = useQuery({
        queryKey: ['course-announcements', courseId],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const r = await fetch(`/api/courses/${courseId}/announcements`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!r.ok) return { announcements: [] };
            return r.json();
        },
        enabled: !!courseId
    });
    const anns = data?.announcements || [];
    if (isLoading) return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
    );
    if (anns.length === 0) return (
        <div className="text-center py-12">
            <Megaphone className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Henüz duyuru yok.</p>
        </div>
    );
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Megaphone className="w-5 h-5 text-indigo-400" /> Duyurular</h3>
            {anns.map((a: any) => (
                <div key={a.announcement_id} className="bg-slate-800/40 border border-white/5 rounded-xl overflow-hidden">
                    <button onClick={() => setExpanded(expanded === a.announcement_id ? null : a.announcement_id)}
                        className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-800/60 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <Megaphone className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-200 text-sm truncate">{a.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{new Date(a.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                    </button>
                    {expanded === a.announcement_id && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-3">
                            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const formatDuration = (seconds: number) => {
    if (!seconds) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const CoursePlayer = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");

    // Q&A state
    const [questionTitle, setQuestionTitle] = useState('');
    const [questionContent, setQuestionContent] = useState('');
    const [answerContent, setAnswerContent] = useState('');
    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
    const [showQuestionForm, setShowQuestionForm] = useState(false);

    const [hasReviewedLocal, setHasReviewedLocal] = useState(false);
    const { user } = useAuth();
    const [isClaimingCertificate, setIsClaimingCertificate] = useState(false);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [watchTimeSeconds, setWatchTimeSeconds] = useState(0);
    const watchTimeRef = React.useRef(0);

    const reviewMutation = useMutation({
        mutationFn: (data: { rating: number; comment?: string }) => reviewsAPI.addReview(Number(id), data),
        onSuccess: () => {
            setIsReviewModalOpen(false);
            setRating(0);
            setReviewComment("");
            setHasReviewedLocal(true);
            queryClient.invalidateQueries({ queryKey: ['course-player', id] });
            toast.success("Değerlendirmeniz için teşekkürler!", {
                style: { background: '#10b981', color: '#fff', border: 'none' }
            });
        },
        onError: (error: any) => {
            toast.error(error?.message || "Değerlendirme gönderilirken hata oluştu.");
        }
    });

    const submitReview = () => {
        if (rating === 0) {
            toast.error("Lütfen bir puan seçin.");
            return;
        }
        reviewMutation.mutate({ rating, comment: reviewComment });
    };

    // Fetch Course Content
    const { data: content, isLoading, error } = useQuery({
        queryKey: ['course-player', id],
        queryFn: () => coursesAPI.getPlayerContent(Number(id)),
        enabled: !!id,
    });

    // Fetch Questions
    const { data: questionsData, refetch: refetchQuestions } = useQuery({
        queryKey: ['course-questions', id],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/courses/${id}/questions`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return res.json();
        },
        enabled: !!id,
    });

    // Fetch lesson resources
    const { data: resourcesData, refetch: refetchResources } = useQuery({
        queryKey: ['lesson-resources', activeLessonId],
        queryFn: async () => {
            const res = await fetch(`/api/lessons/${activeLessonId}/resources`);
            return res.json();
        },
        enabled: !!activeLessonId,
    });

    // Ask question mutation
    const askQuestionMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/courses/${id}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: questionTitle, content: questionContent, lessonId: activeLessonId })
            });
            if (!res.ok) throw new Error('Soru gönderilemedi');
            return res.json();
        },
        onSuccess: () => {
            setQuestionTitle('');
            setQuestionContent('');
            setShowQuestionForm(false);
            refetchQuestions();
            toast.success('Sorunuz gönderildi!', { style: { background: '#10b981', color: '#fff', border: 'none' } });
        },
        onError: () => toast.error('Soru gönderilemedi.')
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
            refetchQuestions();
            toast.success('Cevabınız gönderildi!');
        },
        onError: () => toast.error('Cevap gönderilemedi.')
    });

    // Mark Lesson Complete Mutation
    const completeMutation = useMutation({
        mutationFn: (lessonId: number) => progressAPI.completeLesson(Number(id), lessonId),
        onMutate: async (lessonId) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['course-player', id] });
            // Snapshot the previous value
            const previousContent = queryClient.getQueryData(['course-player', id]);
            // Optimistically update to the new value
            queryClient.setQueryData(['course-player', id], (old: any) => {
                if (!old?.structure) return old;
                return {
                    ...old,
                    structure: old.structure.map((section: any) => ({
                        ...section,
                        lessons: section.lessons.map((lesson: any) =>
                            lesson.lesson_id === lessonId ? { ...lesson, is_completed: 1 } : lesson
                        )
                    }))
                };
            });
            return { previousContent };
        },
        onError: (err, lessonId, context) => {
            queryClient.setQueryData(['course-player', id], context?.previousContent);
            toast.error('Ders tamamlanamadı.');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['course-player', id] });
        },
        onSuccess: () => {
            toast.success('Ders tamamlandı!', { style: { background: '#10b981', color: '#fff', border: 'none' } });
        }
    });

    // Track Watch Time
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeLessonId) {
            watchTimeRef.current = 0;
            interval = setInterval(() => {
                watchTimeRef.current += 10;
                setWatchTimeSeconds(watchTimeRef.current);
                // Backend'e her 10 saniyede bir o 10 saniyelik ilerlemeyi gönder (backend üzerine ekleyecek)
                progressAPI.saveWatchTime(Number(id), activeLessonId, 10).catch(() => { });
            }, 10000); // Check every 10 seconds locally to be efficient
        }
        return () => clearInterval(interval);
    }, [activeLessonId, id]);

    // Set initial active lesson
    useEffect(() => {
        if (content?.structure && !activeLessonId) {
            let firstLesson = null;
            for (const section of content.structure) {
                if (section.lessons.length > 0) {
                    const uncompleted = section.lessons.find((l: any) => !l.is_completed);
                    firstLesson = uncompleted || section.lessons[0];
                    break;
                }
            }
            if (firstLesson) setActiveLessonId(firstLesson.lesson_id);
        }
    }, [content, activeLessonId]);

    if (isLoading) return (
        <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-100">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="font-medium tracking-wide animate-pulse">Eğitim Ortamı Hazırlanıyor...</p>
            </div>
        </div>
    );

    const handleClaimCertificate = async () => {
        if (!canvasRef.current || !user || !content?.course) return;
        setIsClaimingCertificate(true);

        try {
            const canvas = canvasRef.current;
            const instructorName = `${content.course.first_name || ''} ${content.course.last_name || ''}`.trim() || 'Neural Akademi';
            const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            const certNo = `CERT-${Date.now().toString().slice(-8)}`;

            await drawCertificate(canvas, {
                studentName: `${user.first_name} ${user.last_name}`,
                courseTitle: content.course.title,
                instructorName,
                issuedDate: dateStr,
                certificateId: certNo,
            });

            const imageData = canvas.toDataURL('image/png');
            const result = await certificatesAPI.claimCertificate(Number(id), imageData);

            if (result.success) {
                toast.success('Sertifikanız hazır! "Sertifikalarım" sayfasından indirebilirsiniz.');
                queryClient.invalidateQueries({ queryKey: ['course-player', id] });
            }
        } catch (error: any) {
            console.error('Certificate error:', error);
            toast.error(error?.message || 'Sertifika alınırken bir hata oluştu.');
        } finally {
            setIsClaimingCertificate(false);
        }
    };

    if (error || !content) return (
        <div className="h-screen flex items-center justify-center bg-slate-950 text-rose-400 font-medium">
            <div className="bg-slate-900/50 p-8 rounded-3xl border border-rose-500/20 backdrop-blur-md flex flex-col items-center gap-4">
                <X className="w-12 h-12 text-rose-500" />
                <p>{(error as any)?.message || 'Kursa erişilemedi'}</p>
                <Button variant="outline" onClick={() => navigate('/learning')} className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-full">
                    Öğrenim Sayfasına Dön
                </Button>
            </div>
        </div>
    );

    const activeLesson = content.structure
        .flatMap((s: any) => s.lessons)
        .find((l: any) => l.lesson_id === activeLessonId);

    const handleLessonComplete = () => {
        if (activeLessonId) {
            completeMutation.mutate(activeLessonId);
        }
    };

    const handleVideoEnded = () => {
        handleLessonComplete();
        // Auto-advance
        if (content?.structure && activeLessonId) {
            const allLessons = content.structure.flatMap((s: any) => s.lessons);
            const currentIndex = allLessons.findIndex((l: any) => l.lesson_id === activeLessonId);
            if (currentIndex < allLessons.length - 1) {
                const nextLesson = allLessons[currentIndex + 1];
                setActiveLessonId(nextLesson.lesson_id);
                toast('Geçiliyor:', {
                    description: nextLesson.title,
                    icon: <MonitorPlay className="w-4 h-4 text-indigo-400" />
                });
            }
        }
    };

    const allLessons = content.structure.flatMap((s: any) => s.lessons);
    const completedCount = allLessons.filter((l: any) => l.is_completed).length;
    const totalCount = allLessons.length;
    const progressPercent = Math.round((completedCount / (totalCount || 1)) * 100);

    const videoSrc = activeLesson?.video_url || '';
    const videoType = activeLesson?.video_type || (activeLesson?.hls_manifest_path ? 'hls' : 'mp4');

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">

            {/* Minimalist Top Navigation */}
            <header className="h-16 shrink-0 flex items-center justify-between px-6 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/5 hover:bg-white/10 text-white w-10 h-10 transition-transform hover:-translate-x-1"
                        onClick={() => navigate('/learning')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="hidden md:flex flex-col">
                        <span className="text-xs font-medium text-indigo-400 tracking-wider uppercase mb-0.5">Eğitim Ortamı</span>
                        <h1 className="font-bold text-sm text-slate-100 line-clamp-1 max-w-[300px] lg:max-w-xl">
                            {content.course.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Modern Circular Progress */}
                    <div className="hidden sm:flex items-center gap-4 bg-white/5 pl-4 pr-1.5 py-1.5 rounded-full border border-white/5">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-medium">İlerleme</span>
                            <span className="text-xs font-bold text-slate-200">{completedCount} / {totalCount}</span>
                        </div>
                        <div className="relative w-8 h-8 flex items-center justify-center bg-slate-900 rounded-full">
                            <svg className="w-8 h-8 transform -rotate-90">
                                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-800" />
                                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent"
                                    strokeDasharray={14 * 2 * Math.PI}
                                    strokeDashoffset={14 * 2 * Math.PI - (progressPercent / 100) * (14 * 2 * Math.PI)}
                                    className="text-indigo-500 transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <span className="absolute text-[8px] font-bold">{progressPercent}%</span>
                        </div>
                    </div>

                    {!content?.hasReviewed && !hasReviewedLocal && (
                        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="hidden md:flex bg-white/5 border-white/5 hover:bg-white/10 text-white rounded-full font-medium px-5"
                                >
                                    <Star className="w-3.5 h-3.5 mr-2" /> Değerlendir
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl">Kursu Değerlendir</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-6 py-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-sm text-slate-400">Puanınız</span>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoveredRating(star)}
                                                    onMouseLeave={() => setHoveredRating(0)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <Star className={cn("w-8 h-8 transition-colors duration-200",
                                                        (hoveredRating || rating) >= star ? "fill-amber-400 text-amber-400" : "text-slate-600"
                                                    )} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm text-slate-400">Düşünceleriniz (İsteğe Bağlı)</span>
                                        <Textarea
                                            placeholder="Kurs hakkında ne düşünüyorsunuz?"
                                            className="bg-slate-950 border-white/10 min-h-[100px] text-slate-200 resize-none focus-visible:ring-indigo-500"
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white mt-2"
                                        onClick={submitReview}
                                        disabled={reviewMutation.isPending}
                                    >
                                        {reviewMutation.isPending ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    {progressPercent === 100 && (
                        content.certificateId ? (
                            <Button
                                size="sm"
                                onClick={() => navigate('/home/certificates')}
                                className="hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium px-5 shadow-lg shadow-emerald-500/20 border-0"
                            >
                                <Award className="w-3.5 h-3.5 mr-2" /> Sertifikayı Gör
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleClaimCertificate}
                                disabled={isClaimingCertificate}
                                className="hidden md:flex bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full font-medium px-5 shadow-lg shadow-indigo-500/20 border-0 disabled:opacity-50"
                            >
                                {isClaimingCertificate ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                                ) : (
                                    <Trophy className="w-3.5 h-3.5 mr-2" />
                                )}
                                {isClaimingCertificate ? 'Hazırlanıyor...' : 'Sertifika Al'}
                            </Button>
                        )
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={cn(
                            "rounded-full w-10 h-10 transition-colors",
                            isSidebarOpen ? "bg-indigo-500/10 text-indigo-400" : "bg-white/5 text-slate-300 hover:bg-white/10"
                        )}
                    >
                        <ListVideo className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 p-2 md:p-6 gap-6 max-w-[1920px] mx-auto w-full items-start">

                {/* Main Content Area */}
                <main className={cn(
                    "flex flex-col min-w-0 transition-all duration-500 ease-in-out relative w-full lg:flex-1",
                    isSidebarOpen ? "lg:mr-0" : "mr-0"
                )}>
                    {/* Cinematic Video Container */}
                    <div className="w-full bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group shrink-0 aspect-video">
                        {activeLesson && videoSrc ? (
                            <HLSVideoPlayer
                                key={activeLesson.lesson_id}
                                src={videoSrc}
                                videoType={videoType}
                                poster={content.course.image_path}
                                onEnded={handleVideoEnded}
                                title={activeLesson.title}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-6 text-white bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-white/5 rounded-3xl">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse"></div>
                                    <MonitorPlay className="w-10 h-10 text-indigo-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="font-semibold text-xl text-slate-100">
                                        {activeLesson ? 'Medya Bulunamadı' : 'Derse Hazırsınız'}
                                    </p>
                                    <p className="text-sm text-indigo-300">
                                        {!activeLesson ? 'Yan panelden bir ders seçerek başlayın' : 'Bu ders için henüz bir video eklenmemiş.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Lesson Details & Tabs underneath video */}
                    <div className="flex-1 mt-6 px-2 md:px-6">
                        <div className="max-w-5xl mx-auto py-2 space-y-8 pb-10">

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 rounded-full font-semibold">
                                            Ders {activeLesson?.sort_order || '-'}
                                        </Badge>
                                        <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
                                            <MonitorPlay className="w-4 h-4" /> {formatDuration(activeLesson?.duration_minutes || 0)}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                        {activeLesson?.title || 'Ders Seçilmedi'}
                                    </h2>
                                </div>

                                <Button
                                    onClick={handleLessonComplete}
                                    disabled={activeLesson?.is_completed || completeMutation.isPending}
                                    size="lg"
                                    className={cn(
                                        "rounded-full h-12 px-8 font-semibold transition-all duration-300 shadow-xl",
                                        activeLesson?.is_completed
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                                            : "bg-white text-slate-900 hover:bg-slate-200"
                                    )}
                                >
                                    {activeLesson?.is_completed ? (
                                        <><CheckCircle2 className="w-5 h-5 mr-2" /> Tamamlandın</>
                                    ) : (
                                        'Tamamlandı İşaretle'
                                    )}
                                </Button>
                            </div>

                            {/* Pill Tabs */}
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="w-full justify-start h-auto p-1 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl mb-6 inline-flex overflow-x-auto no-scrollbar">
                                    <TabsTrigger value="overview" className="rounded-xl px-6 py-3 font-medium text-sm text-slate-400 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">Genel Bakış</TabsTrigger>
                                    <TabsTrigger value="qa" className="rounded-xl px-6 py-3 font-medium text-sm text-slate-400 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">Soru & Cevap</TabsTrigger>
                                    <TabsTrigger value="notes" className="rounded-xl px-6 py-3 font-medium text-sm text-slate-400 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">Notlar</TabsTrigger>
                                    <TabsTrigger value="resources" className="rounded-xl px-6 py-3 font-medium text-sm text-slate-400 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">Kaynaklar</TabsTrigger>
                                    <TabsTrigger value="announcements" className="rounded-xl px-6 py-3 font-medium text-sm text-slate-400 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">Duyurular</TabsTrigger>
                                </TabsList>

                                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md">
                                    <TabsContent value="overview" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                                            {activeLesson?.description ? (
                                                <p>{activeLesson.description}</p>
                                            ) : activeLesson?.content ? (
                                                <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                                                    <p>Bu ders için ek bir açıklama bulunmuyor.</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* ===== SORU & CEVAP ===== */}
                                    <TabsContent value="qa" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-6">
                                            {/* Soru Sor Butonu */}
                                            {!showQuestionForm ? (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-100">Soru & Cevap</h3>
                                                        <p className="text-sm text-slate-400">{questionsData?.questions?.length || 0} soru</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => setShowQuestionForm(true)}
                                                        className="bg-indigo-500 hover:bg-indigo-600 rounded-full px-6 text-sm font-medium"
                                                    >
                                                        <HelpCircle className="w-4 h-4 mr-2" /> Soru Sor
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/5 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-slate-200">Yeni Soru</h4>
                                                        <button onClick={() => setShowQuestionForm(false)} className="text-slate-400 hover:text-white">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <Input
                                                        placeholder="Sorunuzun başlığı"
                                                        value={questionTitle}
                                                        onChange={(e) => setQuestionTitle(e.target.value)}
                                                        className="bg-slate-900 border-white/10 text-slate-200 h-11 rounded-xl focus-visible:ring-indigo-500"
                                                    />
                                                    <Textarea
                                                        placeholder="Sorunuzu detaylı açıklayın..."
                                                        value={questionContent}
                                                        onChange={(e) => setQuestionContent(e.target.value)}
                                                        className="bg-slate-900 border-white/10 min-h-[100px] text-slate-200 rounded-xl resize-none focus-visible:ring-indigo-500"
                                                    />
                                                    <div className="flex justify-end gap-3">
                                                        <Button variant="ghost" onClick={() => setShowQuestionForm(false)} className="text-slate-400 rounded-full">İptal</Button>
                                                        <Button
                                                            onClick={() => askQuestionMutation.mutate()}
                                                            disabled={!questionTitle || !questionContent || askQuestionMutation.isPending}
                                                            className="bg-indigo-500 hover:bg-indigo-600 rounded-full px-6"
                                                        >
                                                            {askQuestionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                                            Gönder
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sorular Listesi */}
                                            {questionsData?.questions?.length > 0 ? (
                                                <div className="space-y-4">
                                                    {questionsData.questions.map((q: any) => (
                                                        <div key={q.question_id} className="bg-slate-800/30 rounded-2xl p-5 border border-white/5 space-y-4">
                                                            {/* Soru Başlığı */}
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                                    <User className="w-4 h-4 text-indigo-400" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-bold text-slate-200">{q.first_name} {q.last_name}</span>
                                                                        {q.is_answered && <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] px-2">Cevaplandı</Badge>}
                                                                    </div>
                                                                    <h4 className="text-base font-bold text-white mb-1">{q.title}</h4>
                                                                    <p className="text-sm text-slate-400 leading-relaxed">{q.content}</p>
                                                                    <div className="flex items-center gap-3 mt-2">
                                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" /> {new Date(q.created_at).toLocaleDateString('tr-TR')}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500">{q.answer_count} cevap</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Cevaplar */}
                                                            {q.answers?.length > 0 && (
                                                                <div className="ml-6 pl-6 border-l-2 border-white/5 space-y-3">
                                                                    {q.answers.map((a: any) => (
                                                                        <div key={a.answer_id} className={cn("p-3 rounded-xl", a.is_instructor_answer ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-slate-900/50")}>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-sm font-bold text-slate-200">{a.first_name} {a.last_name}</span>
                                                                                {a.is_instructor_answer && (
                                                                                    <Badge className="bg-indigo-500/20 text-indigo-300 border-none text-[10px] px-2">
                                                                                        <BadgeCheck className="w-3 h-3 mr-1" /> Eğitmen
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-slate-400">{a.content}</p>
                                                                            <span className="text-[10px] text-slate-600 mt-1 block">{new Date(a.created_at).toLocaleDateString('tr-TR')}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Cevap Yaz */}
                                                            {activeQuestionId === q.question_id ? (
                                                                <div className="ml-6 pl-6 border-l-2 border-indigo-500/30">
                                                                    <div className="flex gap-2">
                                                                        <Textarea
                                                                            placeholder="Cevabınızı yazın..."
                                                                            value={answerContent}
                                                                            onChange={(e) => setAnswerContent(e.target.value)}
                                                                            className="bg-slate-900 border-white/10 min-h-[60px] text-slate-200 rounded-xl resize-none text-sm flex-1"
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-end gap-2 mt-2">
                                                                        <Button variant="ghost" size="sm" onClick={() => { setActiveQuestionId(null); setAnswerContent(''); }} className="text-slate-400 rounded-full text-xs">İptal</Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => answerMutation.mutate(q.question_id)}
                                                                            disabled={!answerContent || answerMutation.isPending}
                                                                            className="bg-indigo-500 hover:bg-indigo-600 rounded-full px-4 text-xs"
                                                                        >
                                                                            {answerMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Gönder'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setActiveQuestionId(q.question_id)}
                                                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium ml-12 flex items-center gap-1"
                                                                >
                                                                    <MessageSquare className="w-3 h-3" /> Cevap Yaz
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                !showQuestionForm && (
                                                    <div className="text-center py-12">
                                                        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                                            <MessageSquare className="w-7 h-7 text-indigo-400/50" />
                                                        </div>
                                                        <p className="text-slate-500 text-sm">Henüz soru sorulmamış. İlk soruyu siz sorun!</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="notes" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <NotesTab courseId={Number(id)} lessonId={activeLessonId} />
                                    </TabsContent>

                                    {/* ===== KAYNAKLAR ===== */}
                                    <TabsContent value="resources" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {resourcesData?.resources?.length > 0 ? (
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-slate-100 mb-2">Ders Kaynakları</h3>
                                                {resourcesData.resources.map((r: any) => {
                                                    const ext = r.name?.split('.').pop()?.toLowerCase() || '';
                                                    const icon = ['pdf'].includes(ext) ? '📄' : ['doc', 'docx'].includes(ext) ? '📝' : ['zip', 'rar'].includes(ext) ? '📦' : ['ppt', 'pptx'].includes(ext) ? '📊' : '📁';
                                                    const sizeKB = r.file_size ? (r.file_size / 1024).toFixed(0) : '?';
                                                    const sizeMB = r.file_size > 1048576 ? (r.file_size / 1048576).toFixed(1) + ' MB' : sizeKB + ' KB';
                                                    const fileUrl = r.url || r.file_url || r.file_path;
                                                    return (
                                                        <a
                                                            key={r.resource_id}
                                                            href={fileUrl}
                                                            download={r.name || true}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-4 p-4 bg-slate-800/30 hover:bg-slate-800/60 rounded-xl border border-white/5 hover:border-indigo-500/20 transition-all group"
                                                        >
                                                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-xl border border-white/5 group-hover:border-indigo-500/30">
                                                                {icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{r.name}</p>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-xs text-slate-500 uppercase font-medium">{ext}</span>
                                                                    <span className="text-xs text-slate-600">{sizeMB}</span>
                                                                </div>
                                                            </div>
                                                            <Download className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16">
                                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6 border border-white/5">
                                                    <Award className="w-8 h-8 text-emerald-400/50" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-200 mb-2">Ek Kaynaklar</h3>
                                                <p className="text-slate-400 max-w-md mx-auto">Bu ders için eklenmiş kaynak dosyası bulunmuyor.</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* ===== DUYURULAR ===== */}
                                    <TabsContent value="announcements" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <AnnouncementsTab courseId={Number(id)} />
                                    </TabsContent>
                                </div>
                            </Tabs>

                        </div>
                    </div>
                </main>

                {/* Modern Floating Sidebar / Playlist */}
                <aside className={cn(
                    "bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl transition-all duration-500 flex flex-col overflow-hidden z-40 fixed lg:sticky right-2 md:right-4 lg:right-0 top-20 lg:top-[88px] bottom-4 lg:bottom-auto lg:h-[calc(100vh-112px)] shadow-2xl lg:shadow-none",
                    isSidebarOpen ? "w-[320px] md:w-[380px] translate-x-0 opacity-100" : "w-0 translate-x-[110%] lg:translate-x-0 lg:w-0 opacity-0 lg:border-none lg:mx-0"
                )}>
                    {/* Sidebar Header */}
                    <div className="p-6 shrink-0 border-b border-white/5 bg-gradient-to-b from-slate-800/50 to-transparent">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-indigo-400" />
                                İçerik
                            </h3>
                            <Button variant="ghost" size="icon" className="lg:hidden w-8 h-8 rounded-full bg-white/5 text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Mini Progress bar inside sidebar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-slate-400">
                                <span>Toplam İlerleme</span>
                                <span className="text-indigo-400">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2 bg-slate-800 [&>div]:bg-indigo-500" />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-4 py-2">
                        <Accordion type="multiple" defaultValue={content.structure.map((_: any, i: number) => `item-${i}`)} className="w-full space-y-3 pb-6">
                            {content.structure.map((section: any, idx: number) => (
                                <AccordionItem key={section.section_id} value={`item-${idx}`} className="border-none bg-slate-950/40 rounded-2xl overflow-hidden">
                                    <AccordionTrigger className="hover:no-underline px-5 py-4 hover:bg-slate-800/50 transition-colors group">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-300 border-none px-2 py-0 text-[9px] uppercase tracking-widest rounded-full">
                                                    Bölüm {idx + 1}
                                                </Badge>
                                            </div>
                                            <span className="text-[15px] font-semibold text-slate-200 text-left group-data-[state=open]:text-indigo-300 transition-colors leading-tight">
                                                {section.title}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                                                <span>{section.lessons.length} Ders</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                <span className="text-emerald-400/80">{section.lessons.filter((l: any) => l.is_completed).length} Biten</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="p-2 pt-0">
                                        <div className="flex flex-col space-y-1">
                                            {section.lessons.map((lesson: any, lessonIdx: number) => {
                                                const isActive = activeLessonId === lesson.lesson_id;
                                                return (
                                                    <button
                                                        key={lesson.lesson_id}
                                                        onClick={() => setActiveLessonId(lesson.lesson_id)}
                                                        className={cn(
                                                            "flex gap-3 p-3 rounded-xl transition-all text-left relative group overflow-hidden",
                                                            isActive
                                                                ? "bg-indigo-500/10 border border-indigo-500/20 shadow-inner"
                                                                : "hover:bg-slate-800/50 border border-transparent"
                                                        )}
                                                    >
                                                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl"></div>}

                                                        <div className="mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                                            {lesson.is_completed ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                            ) : isActive ? (
                                                                <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                                                            ) : (
                                                                <span className="text-[10px] text-slate-500 font-bold">{lessonIdx + 1}</span>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn(
                                                                "text-sm font-medium leading-tight mb-1",
                                                                isActive ? "text-indigo-300" : "text-slate-300 group-hover:text-slate-100"
                                                            )}>
                                                                {lesson.title}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                {lesson.video_type === 'hls' ? (
                                                                    <MonitorPlay className="w-3 h-3 text-slate-500" />
                                                                ) : (
                                                                    <FileText className="w-3 h-3 text-slate-500" />
                                                                )}
                                                                <span className="text-xs text-slate-500">{formatDuration(lesson.duration_minutes || 0)}</span>
                                                                {lesson.video_type === 'hls' && (
                                                                    <span className="text-[8px] px-1.5 rounded-sm bg-slate-800 text-slate-400 font-bold tracking-wider">HD</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </ScrollArea>
                </aside>

            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div >
    );
};

export default CoursePlayer;
