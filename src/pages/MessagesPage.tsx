import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import {
    Send, Search, Loader2, MessageCircle, CheckCheck, Plus, X, ArrowLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 py-8">

                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            Mesajlar
                            {totalUnread > 0 && (
                                <span className="text-xs bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full">
                                    {totalUnread}
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">{audience}</p>
                    </div>
                    <Button
                        onClick={() => setShowNewMessage(v => !v)}
                        variant={showNewMessage ? 'outline' : 'default'}
                        className={cn(
                            'h-10 rounded-xl gap-2',
                            !showNewMessage && 'bg-indigo-600 hover:bg-indigo-700'
                        )}
                    >
                        {showNewMessage ? <><X className="w-4 h-4" /> Kapat</> : <><Plus className="w-4 h-4" /> Yeni mesaj</>}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">

                    {/* Sol sütun: konuşmalar ya da yeni mesaj kişi listesi */}
                    <div className={cn(
                        'bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden',
                        selectedUserId && 'hidden md:flex'
                    )}>
                        <div className="p-3 border-b border-slate-100">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder={showNewMessage ? 'Kişi ara…' : 'Konuşma ara…'}
                                    value={showNewMessage ? contactQuery : search}
                                    onChange={e => (showNewMessage ? setContactQuery : setSearch)(e.target.value)}
                                    className="pl-9 h-9 rounded-xl border-slate-200 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {showNewMessage ? (
                                filteredContacts.length === 0 ? (
                                    <div className="px-5 py-12 text-center">
                                        <p className="text-sm text-slate-500">
                                            {contacts.length === 0
                                                ? 'Henüz mesajlaşabileceğin kimse yok.'
                                                : 'Eşleşen kişi yok.'}
                                        </p>
                                        {contacts.length === 0 && (
                                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                                Bir kursa kaydolduğunda eğitmenine, kursun satıldığında
                                                öğrencine yazabilirsin.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    filteredContacts.map(c => (
                                        <button
                                            key={c.user_id}
                                            onClick={() => openConversation(c.user_id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50"
                                        >
                                            <UserAvatar
                                                src={c.profile_image}
                                                name={`${c.first_name} ${c.last_name}`}
                                                size={36}
                                                className="shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {c.first_name} {c.last_name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {c.role === 'instructor' ? 'Eğitmenin' : 'Öğrencin'}
                                                    {c.shared_courses > 0 && ` · ${c.shared_courses} ortak kurs`}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )
                            ) : convLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="px-5 py-12 text-center">
                                    <MessageCircle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">Henüz mesajın yok</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        "Yeni mesaj" ile bir konuşma başlat.
                                    </p>
                                </div>
                            ) : (
                                filteredConversations.map(c => (
                                    <button
                                        key={c.other_user_id}
                                        onClick={() => openConversation(c.other_user_id)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 transition-colors',
                                            selectedUserId === c.other_user_id && 'bg-indigo-50/70'
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <UserAvatar
                                                src={c.profile_image}
                                                name={`${c.first_name} ${c.last_name}`}
                                                size={40}
                                            />
                                            {Number(c.unread_count) > 0 && (
                                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-indigo-600 rounded-full text-[10px] text-white font-semibold flex items-center justify-center">
                                                    {c.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {c.first_name} {c.last_name}
                                                </p>
                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                    {shortTime(c.last_message_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {c.role === 'instructor' && (
                                                    <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                                                        Eğitmen
                                                    </span>
                                                )}
                                                <p className={cn(
                                                    'text-xs truncate',
                                                    Number(c.unread_count) > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'
                                                )}>
                                                    {c.last_message || '…'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sağ sütun: seçili konuşma */}
                    <div className={cn(
                        'bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden',
                        !selectedUserId && 'hidden md:flex'
                    )}>
                        {!selectedUserId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                    <MessageCircle className="w-7 h-7 text-slate-300" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-700">Bir konuşma seç</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Soldan bir konuşmaya tıkla ya da yeni mesaj başlat.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedUserId(null)}
                                        className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-800"
                                        aria-label="Geri"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    {otherUser && (
                                        <>
                                            <UserAvatar
                                                src={otherUser.profile_image}
                                                name={`${otherUser.first_name} ${otherUser.last_name}`}
                                                size={36}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {otherUser.first_name} {otherUser.last_name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {otherUser.role === 'instructor' ? 'Eğitmen' : 'Öğrenci'}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div ref={scrollBoxRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/50">
                                    {msgLoading && messages.length === 0 ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <MessageCircle className="w-8 h-8 text-slate-200 mb-3" />
                                            <p className="text-sm text-slate-400">İlk mesajı sen gönder.</p>
                                        </div>
                                    ) : (
                                        grouped.map(group => (
                                            <div key={group.day} className="space-y-2">
                                                <div className="flex justify-center">
                                                    <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-100 px-2.5 py-1 rounded-full">
                                                        {group.day}
                                                    </span>
                                                </div>
                                                {group.items.map(m => {
                                                    const isMe = m.sender_id === currentUserId;
                                                    return (
                                                        <div
                                                            key={m.message_id}
                                                            className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}
                                                        >
                                                            {!isMe && (
                                                                <UserAvatar
                                                                    src={m.profile_image}
                                                                    name={`${m.first_name} ${m.last_name}`}
                                                                    size={28}
                                                                    className="shrink-0 mt-0.5"
                                                                />
                                                            )}
                                                            <div className="max-w-[75%]">
                                                                <div className={cn(
                                                                    'rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                                                                    isMe
                                                                        ? 'bg-indigo-600 text-white rounded-br-sm'
                                                                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
                                                                )}>
                                                                    {m.message_content}
                                                                </div>
                                                                <div className={cn(
                                                                    'flex items-center gap-1 mt-1 text-[10px] text-slate-400',
                                                                    isMe ? 'justify-end' : 'justify-start'
                                                                )}>
                                                                    {new Date(m.sent_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                    {isMe && (
                                                                        <CheckCheck className={cn('w-3 h-3', m.is_read ? 'text-indigo-500' : 'text-slate-300')} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-3 border-t border-slate-100">
                                    <div className="flex gap-2 items-end">
                                        <Textarea
                                            placeholder="Mesajını yaz… (Enter ile gönder, Shift+Enter alt satır)"
                                            value={messageText}
                                            onChange={e => setMessageText(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="flex-1 min-h-[42px] max-h-[140px] rounded-xl border-slate-200 text-sm resize-none"
                                            rows={1}
                                        />
                                        <Button
                                            onClick={handleSend}
                                            disabled={!messageText.trim() || sendMutation.isPending}
                                            className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 shrink-0 p-0"
                                            aria-label="Gönder"
                                        >
                                            {sendMutation.isPending
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Send className="w-4 h-4" />}
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
