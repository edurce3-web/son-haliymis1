import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import {
    Send, Search, Loader2, CheckCheck, Plus, X, ArrowLeft,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Conversation {
    other_user_id: number;
    first_name: string;
    last_name: string;
    profile_image: string | null;
    role: string;
    last_message_at: string;
    last_message: string;
    unread_count: number;
}

interface Message {
    message_id: number;
    sender_id: number;
    receiver_id: number;
    message_content: string;
    sent_at: string;
    is_read: boolean;
    first_name: string;
    last_name: string;
    profile_image: string | null;
}

interface Contact {
    user_id: number;
    first_name: string;
    last_name: string;
    role: 'instructor' | 'student';
    shared_courses: number;
    profile_image: string | null;
}

/** Konuşma listesindeki tarih: bugünse saat, bu haftaysa gün adı, yoksa tarih. */
const shortTime = (value: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays < 7) return d.toLocaleDateString('tr-TR', { weekday: 'short' });
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
};

/** Mesaj balonlarının üstündeki gün ayracı. */
const dayLabel = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86_400_000).toDateString();
    if (d.toDateString() === today) return 'Bugün';
    if (d.toDateString() === yesterday) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function MessagesPage() {
    const qc = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [messageText, setMessageText] = useState('');
    const [search, setSearch] = useState('');
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [contactQuery, setContactQuery] = useState('');
    const [composeTo, setComposeTo] = useState<Contact | null>(null);
    const toInputRef = useRef<HTMLInputElement>(null);

    // scrollIntoView tüm sayfayı kaydırıyordu (sayfa açılır açılmaz aşağı
    // atlıyordu). Bunun yerine yalnızca mesaj kutusunun kendi scrollTop'unu
    // ayarlıyoruz; sayfa yerinde kalıyor.
    const scrollBoxRef = useRef<HTMLDivElement>(null);
    const token = () => localStorage.getItem('token');

    const currentUserId = useMemo(() => {
        try {
            const t = token();
            if (!t) return null;
            return JSON.parse(atob(t.split('.')[1])).user_id as number;
        } catch { return null; }
    }, []);

    // Bildirimden gelen /messages?user=12 bağlantısı doğrudan o konuşmayı açar
    useEffect(() => {
        const target = searchParams.get('user');
        if (target && !Number.isNaN(Number(target))) {
            setSelectedUserId(Number(target));
        }
    }, [searchParams]);

    const { data: convData, isLoading: convLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/conversations`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!r.ok) throw new Error();
            return r.json();
        },
        refetchInterval: 15000,
    });

    const { data: msgData, isLoading: msgLoading } = useQuery({
        queryKey: ['messages', selectedUserId],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/${selectedUserId}`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!r.ok) throw new Error();
            return r.json();
        },
        enabled: !!selectedUserId,
        refetchInterval: 8000,
    });

    // Kiminle konuşabilirim: öğrenciysem eğitmenlerim, eğitmensem öğrencilerim
    const { data: contactData } = useQuery({
        queryKey: ['message-contacts'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/messages/contacts`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!r.ok) throw new Error();
            return r.json();
        },
    });

    const sendMutation = useMutation({
        mutationFn: async (text: string) => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ receiver_id: selectedUserId, message_content: text }),
            });
            if (!r.ok) throw new Error('Mesaj gönderilemedi');
            return r.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['messages', selectedUserId] });
            qc.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (_e, text) => {
            // Gönderilemeyen metni kaybetmeyelim
            setMessageText(prev => prev || text);
            toast.error('Mesaj gönderilemedi');
        },
    });

    const conversations: Conversation[] = convData?.conversations || [];
    const messages: Message[] = msgData?.messages || [];
    const otherUser = msgData?.otherUser;

    const contacts: Contact[] = useMemo(() => {
        const list = [
            ...(contactData?.instructors || []),
            ...(contactData?.students || []),
        ] as Contact[];
        // Aynı kişi hem eğitmenim hem öğrencim olabilir; bir kez göster
        const seen = new Set<number>();
        return list.filter(c => (seen.has(c.user_id) ? false : (seen.add(c.user_id), true)));
    }, [contactData]);

    // Sayfa başlığı role göre: eğitmen öğrencileriyle, öğrenci eğitmenleriyle konuşur
    const audience = useMemo(() => {
        const hasStudents = (contactData?.students || []).length > 0;
        const hasInstructors = (contactData?.instructors || []).length > 0;
        if (hasStudents && hasInstructors) return 'Öğrenciler ve eğitmenlerle yazış';
        if (hasStudents) return 'Öğrencilerinle yazış';
        return 'Eğitmenlerinle yazış';
    }, [contactData]);

    const filteredConversations = conversations.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
    );

    const filteredContacts = contacts.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(contactQuery.toLowerCase())
    );

    // Mesajları güne göre grupla — uzun konuşmalarda tarih ayracı okunurluğu artırır
    const grouped = useMemo(() => {
        const out: Array<{ day: string; items: Message[] }> = [];
        for (const m of messages) {
            const day = dayLabel(m.sent_at);
            const last = out[out.length - 1];
            if (last && last.day === day) last.items.push(m);
            else out.push({ day, items: [m] });
        }
        return out;
    }, [messages]);

    // Yeni mesaj geldiğinde kutuyu en alta al (sayfayı değil)
    useEffect(() => {
        const box = scrollBoxRef.current;
        if (box) box.scrollTop = box.scrollHeight;
    }, [messages.length, selectedUserId]);

    const openConversation = (userId: number) => {
        setSelectedUserId(userId);
        setShowNewMessage(false);
        // Adres çubuğundaki ?user parametresi seçim değişince yanıltmasın
        if (searchParams.get('user')) {
            searchParams.delete('user');
            setSearchParams(searchParams, { replace: true });
        }
    };

    const handleSend = () => {
        const text = messageText.trim();
        if (!text || !selectedUserId || sendMutation.isPending) return;
        setMessageText('');
        sendMutation.mutate(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const totalUnread = conversations.reduce((s, c) => s + (Number(c.unread_count) || 0), 0);

    /* ── Yeni mesaj: alıcı üstte seçiliyor ── */
    const startCompose = () => {
        setShowNewMessage(true);
        setComposeTo(null);
        setContactQuery('');
        setSelectedUserId(null);
        requestAnimationFrame(() => toInputRef.current?.focus());
    };
    const closeCompose = () => { setShowNewMessage(false); setComposeTo(null); setContactQuery(''); };

    const composeMutation = useMutation({
        mutationFn: async ({ to, text }: { to: number; text: string }) => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ receiver_id: to, message_content: text }),
            });
            if (!r.ok) throw new Error('Mesaj gönderilemedi');
            return r.json();
        },
        onSuccess: (_d, { to }) => {
            qc.invalidateQueries({ queryKey: ['conversations'] });
            setMessageText('');
            openConversation(to);
        },
        onError: () => toast.error('Mesaj gönderilemedi'),
    });

    const sendCompose = () => {
        const text = messageText.trim();
        if (!composeTo || !text || composeMutation.isPending) return;
        composeMutation.mutate({ to: composeTo.user_id, text });
    };

    const rightOpen = showNewMessage || !!selectedUserId;

    return (
        <div className="min-h-screen bg-white text-[#111827]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

                <div className="flex items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-[-0.025em] flex items-center gap-2.5">
                            Mesajlar
                            {totalUnread > 0 && (
                                <span className="text-[12px] bg-[#1B7A43] text-white font-bold px-2 py-0.5 rounded-full tabular-nums">
                                    {totalUnread}
                                </span>
                            )}
                        </h1>
                        <p className="text-[14px] text-[#6B7280] mt-1">{audience}</p>
                    </div>
                    <button
                        type="button"
                        onClick={showNewMessage ? closeCompose : startCompose}
                        className={cn(
                            'h-11 px-5  inline-flex items-center gap-2 text-[14px] font-bold transition-colors',
                            showNewMessage ? 'bg-[#F1F3F5] text-[#111827] hover:bg-[#E9ECEF]' : 'bg-[#1B7A43] text-white hover:bg-[#16613A]'
                        )}
                    >
                        {showNewMessage ? <><X className="w-4 h-4" /> Vazgeç</> : <><Plus className="w-4 h-4" /> Yeni mesaj</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-3 h-[calc(100vh-220px)] min-h-[520px]">

                    {/* Sol: konuşmalar */}
                    <div className={cn(' bg-[#F5F6F8] flex flex-col overflow-hidden', rightOpen && 'hidden md:flex')}>
                        <div className="p-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                                <input
                                    placeholder="Konuşma ara…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full h-10 pl-10 pr-3  bg-white text-[14px] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#1B7A43]/40"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 pb-2">
                            {convLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="px-5 py-12 text-center">
                                    <p className="text-[14px] font-semibold">Henüz mesajın yok</p>
                                    <p className="text-[13px] text-[#6B7280] mt-1">"Yeni mesaj" ile bir konuşma başlat.</p>
                                </div>
                            ) : (
                                filteredConversations.map(c => (
                                    <button
                                        key={c.other_user_id}
                                        onClick={() => openConversation(c.other_user_id)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5  text-left transition-colors',
                                            selectedUserId === c.other_user_id ? 'bg-white ' : 'hover:bg-white/70'
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <UserAvatar src={c.profile_image} name={`${c.first_name} ${c.last_name}`} size={40} />
                                            {Number(c.unread_count) > 0 && (
                                                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#1B7A43] rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                                                    {c.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <p className="text-[14px] font-bold truncate">{c.first_name} {c.last_name}</p>
                                                <span className="text-[11px] text-[#9CA3AF] shrink-0">{shortTime(c.last_message_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {c.role === 'instructor' && (
                                                    <span className="text-[10px] font-bold text-[#1B7A43] bg-[#EEFBF3] px-1.5 py-0.5  shrink-0">Eğitmen</span>
                                                )}
                                                <p className={cn('text-[12.5px] truncate', Number(c.unread_count) > 0 ? 'text-[#111827] font-semibold' : 'text-[#6B7280]')}>
                                                    {c.last_message || '…'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sağ: yeni mesaj ya da seçili konuşma */}
                    <div className={cn(' bg-[#F5F6F8] flex flex-col overflow-hidden', !rightOpen && 'hidden md:flex')}>
                        {showNewMessage ? (
                            <>
                                <div className="px-4 sm:px-5 pt-4 pb-3 flex items-center gap-3">
                                    <button onClick={closeCompose} className="md:hidden p-1 -ml-1 text-[#6B7280]" aria-label="Geri">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <p className="text-[17px] font-extrabold tracking-[-0.01em]">Yeni mesaj</p>
                                </div>

                                {/* Kime: en üstte */}
                                <div className="px-3 sm:px-4">
                                    <div className="relative  bg-white px-4 py-2.5 flex items-center gap-3 min-h-[52px] focus-within:ring-2 focus-within:ring-[#1B7A43]/40">
                                        <span className="text-[13.5px] font-bold text-[#6B7280] shrink-0">Kime</span>
                                        {composeTo ? (
                                            <span className="inline-flex items-center gap-2 h-9 pl-1 pr-2 rounded-full bg-[#EEFBF3]">
                                                <UserAvatar src={composeTo.profile_image} name={`${composeTo.first_name} ${composeTo.last_name}`} size={28} />
                                                <span className="text-[14px] font-bold">{composeTo.first_name} {composeTo.last_name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => { setComposeTo(null); requestAnimationFrame(() => toInputRef.current?.focus()); }}
                                                    aria-label="Alıcıyı değiştir"
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[#1B7A43] hover:bg-white"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ) : (
                                            <input
                                                ref={toInputRef}
                                                value={contactQuery}
                                                onChange={e => setContactQuery(e.target.value)}
                                                placeholder="İsim yaz ya da listeden seç…"
                                                className="flex-1 min-w-0 h-9 bg-transparent text-[15px] placeholder:text-[#9CA3AF] outline-none"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
                                    {composeTo ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                            <UserAvatar src={composeTo.profile_image} name={`${composeTo.first_name} ${composeTo.last_name}`} size={56} />
                                            <p className="mt-3 text-[16px] font-bold">{composeTo.first_name} {composeTo.last_name}</p>
                                            <p className="mt-1 text-[13.5px] text-[#6B7280]">
                                                {composeTo.role === 'instructor' ? 'Eğitmenin' : 'Öğrencin'}
                                                {composeTo.shared_courses > 0 && ` · ${composeTo.shared_courses} ortak kurs`}
                                            </p>
                                            <p className="mt-4 text-[13.5px] text-[#6B7280]">İlk mesajını aşağıya yaz.</p>
                                        </div>
                                    ) : filteredContacts.length === 0 ? (
                                        <div className="px-5 py-12 text-center">
                                            <p className="text-[14px] font-semibold">
                                                {contacts.length === 0 ? 'Henüz mesajlaşabileceğin kimse yok.' : 'Eşleşen kişi yok.'}
                                            </p>
                                            {contacts.length === 0 && (
                                                <p className="text-[13px] text-[#6B7280] mt-2 leading-relaxed max-w-sm mx-auto">
                                                    Bir kursa kaydolduğunda eğitmenine, kursun satıldığında öğrencine yazabilirsin.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <p className="px-2 pb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">Kişiler</p>
                                            <div className="grid sm:grid-cols-2 gap-1.5">
                                                {filteredContacts.map(c => (
                                                    <button
                                                        key={c.user_id}
                                                        onClick={() => { setComposeTo(c); setContactQuery(''); }}
                                                        className="flex items-center gap-3 px-3 py-2.5  bg-white/60 hover:bg-white text-left transition-colors"
                                                    >
                                                        <UserAvatar src={c.profile_image} name={`${c.first_name} ${c.last_name}`} size={36} className="shrink-0" />
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-[14px] font-bold truncate">{c.first_name} {c.last_name}</span>
                                                            <span className="block text-[12px] text-[#6B7280]">
                                                                {c.role === 'instructor' ? 'Eğitmenin' : 'Öğrencin'}
                                                                {c.shared_courses > 0 && ` · ${c.shared_courses} ortak kurs`}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="p-3">
                                    <div className="flex gap-2 items-end  bg-white p-2">
                                        <Textarea
                                            placeholder={composeTo ? 'Mesajını yaz…' : 'Önce alıcıyı seç'}
                                            disabled={!composeTo}
                                            value={messageText}
                                            onChange={e => setMessageText(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCompose(); } }}
                                            className="flex-1 min-h-[40px] max-h-[140px] shadow-none focus-visible:ring-0 text-[14px] resize-none"
                                            rows={1}
                                        />
                                        <Button
                                            onClick={sendCompose}
                                            disabled={!composeTo || !messageText.trim() || composeMutation.isPending}
                                            className="h-10 w-10  bg-[#1B7A43] hover:bg-[#16613A] shrink-0 p-0"
                                            aria-label="Gönder"
                                        >
                                            {composeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : !selectedUserId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <p className="text-[17px] font-bold">Bir konuşma seç</p>
                                <p className="text-[14px] text-[#6B7280] mt-1.5">Soldan bir konuşmaya tıkla ya da yeni mesaj başlat.</p>
                                <button
                                    type="button"
                                    onClick={startCompose}
                                    className="mt-5 h-10 px-5  bg-white text-[14px] font-bold hover:bg-[#EEFBF3] hover:text-[#1B7A43] transition-colors"
                                >
                                    Yeni mesaj
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="px-4 py-3 flex items-center gap-3 bg-white/60">
                                    <button
                                        onClick={() => setSelectedUserId(null)}
                                        className="md:hidden p-1 -ml-1 text-[#6B7280] hover:text-[#111827]"
                                        aria-label="Geri"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    {otherUser && (
                                        <>
                                            <UserAvatar src={otherUser.profile_image} name={`${otherUser.first_name} ${otherUser.last_name}`} size={36} />
                                            <div className="min-w-0">
                                                <p className="text-[14.5px] font-bold truncate">{otherUser.first_name} {otherUser.last_name}</p>
                                                <p className="text-[12px] text-[#6B7280]">{otherUser.role === 'instructor' ? 'Eğitmen' : 'Öğrenci'}</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div ref={scrollBoxRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                                    {msgLoading && messages.length === 0 ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <p className="text-[14px] text-[#6B7280]">İlk mesajı sen gönder.</p>
                                        </div>
                                    ) : (
                                        grouped.map(group => (
                                            <div key={group.day} className="space-y-2">
                                                <div className="flex justify-center">
                                                    <span className="text-[11px] font-semibold text-[#6B7280] bg-white px-2.5 py-1 rounded-full">{group.day}</span>
                                                </div>
                                                {group.items.map(m => {
                                                    const isMe = m.sender_id === currentUserId;
                                                    return (
                                                        <div key={m.message_id} className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}>
                                                            {!isMe && (
                                                                <UserAvatar src={m.profile_image} name={`${m.first_name} ${m.last_name}`} size={28} className="shrink-0 mt-0.5" />
                                                            )}
                                                            <div className="max-w-[75%]">
                                                                <div className={cn(
                                                                    ' px-3.5 py-2 text-[14px] leading-relaxed whitespace-pre-wrap break-words',
                                                                    isMe ? 'bg-[#1B7A43] text-white ' : 'bg-white text-[#1F2937] '
                                                                )}>
                                                                    {m.message_content}
                                                                </div>
                                                                <div className={cn('flex items-center gap-1 mt-1 text-[10.5px] text-[#9CA3AF]', isMe ? 'justify-end' : 'justify-start')}>
                                                                    {new Date(m.sent_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                    {isMe && <CheckCheck className={cn('w-3 h-3', m.is_read ? 'text-[#1B7A43]' : 'text-[#D1D5DB]')} />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-3">
                                    <div className="flex gap-2 items-end  bg-white p-2">
                                        <Textarea
                                            placeholder="Mesajını yaz… (Enter ile gönder, Shift+Enter alt satır)"
                                            value={messageText}
                                            onChange={e => setMessageText(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="flex-1 min-h-[40px] max-h-[140px] shadow-none focus-visible:ring-0 text-[14px] resize-none"
                                            rows={1}
                                        />
                                        <Button
                                            onClick={handleSend}
                                            disabled={!messageText.trim() || sendMutation.isPending}
                                            className="h-10 w-10  bg-[#1B7A43] hover:bg-[#16613A] shrink-0 p-0"
                                            aria-label="Gönder"
                                        >
                                            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
