import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { ArrowLeft, CheckCheck, Loader2, Plus, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { btn, field, Initials, PageHead, Panel, SearchBox } from '../shell/kit';
import { relativeTime } from '../shell/useInstructorWorkspace';

interface Conversation {
    other_user_id: number;
    first_name: string;
    last_name: string;
    profile_image_path: string | null;
    profile_image?: string | null;
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
    profile_image_path: string | null;
    profile_image?: string | null;
}


export function InstructorMessages() {
    const qc = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [messageText, setMessageText] = useState('');
    const [search, setSearch] = useState('');
    const [showNewMessage, setShowNewMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const token = () => localStorage.getItem('token');

    const currentUserId = (() => {
        try {
            const t = token();
            if (!t) return null;
            const payload = JSON.parse(atob(t.split('.')[1]));
            return payload.user_id;
        } catch { return null; }
    })();

    // Konuşmalar
    const { data: convData, isLoading: convLoading } = useQuery({
        queryKey: ['instructor-conversations'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/conversations`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (!r.ok) throw new Error();
            return r.json();
        },
        refetchInterval: 10000
    });

    // Seçili kullanıcının mesajları
    const { data: msgData, isLoading: msgLoading } = useQuery({
        queryKey: ['instructor-messages', selectedUserId],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/${selectedUserId}`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (!r.ok) throw new Error();
            return r.json();
        },
        enabled: !!selectedUserId,
        refetchInterval: 5000
    });

    // Yeni mesaj için öğrenci listesi
    const { data: studentsData } = useQuery({
        queryKey: ['instructor-msg-students'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/students/list`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            return r.json();
        }
    });

    // Mesaj gönder
    const sendMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ receiver_id: selectedUserId, message_content: messageText })
            });
            if (!r.ok) throw new Error('Mesaj gönderilemedi');
            return r.json();
        },
        onSuccess: () => {
            setMessageText('');
            qc.invalidateQueries({ queryKey: ['instructor-messages', selectedUserId] });
            qc.invalidateQueries({ queryKey: ['instructor-conversations'] });
        },
        onError: () => toast.error('Mesaj gönderilemedi. Tekrar dene.')
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [msgData]);

    const conversations = convData?.conversations || [];
    const filteredConversations = conversations.filter((c: Conversation) => {
        const name = `${c.first_name} ${c.last_name}`.toLocaleLowerCase('tr-TR');
        return name.includes(search.trim().toLocaleLowerCase('tr-TR'));
    });
    const messages = msgData?.messages || [];
    const otherUser = msgData?.otherUser;
    const students = studentsData?.students || [];

    const handleSend = () => {
        if (!messageText.trim() || !selectedUserId) return;
        sendMutation.mutate();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const selected = conversations.find((c: Conversation) => c.other_user_id === selectedUserId);
    const otherName = otherUser
        ? `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim()
        : selected ? `${selected.first_name} ${selected.last_name}` : '';

    return (
        <>
            <PageHead
                title="Mesajlar"
                sub="Öğrencilerinle birebir yazışmalar"
                actions={
                    <button type="button" onClick={() => setShowNewMessage(v => !v)} className={cn(btn.primary, btn.md)}>
                        <Plus className="w-4 h-4" /> Yeni mesaj
                    </button>
                }
            />

            {showNewMessage && (
                <Panel className="p-5 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-[14.5px] font-extrabold text-[#00201d]">Kime yazacaksın?</p>
                        <button type="button" onClick={() => setShowNewMessage(false)} className={cn(btn.ghost, btn.sm)} aria-label="Kapat">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    {students.length === 0 ? (
                        <p className="text-[14px] text-[#4a6360]">Henüz kursuna kayıtlı öğrencin yok.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                            {students.map((s: any) => (
                                <button
                                    key={s.user_id}
                                    type="button"
                                    onClick={() => { setSelectedUserId(s.user_id); setShowNewMessage(false); }}
                                    className="inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full bg-[#f5f6f6] ring-1 ring-inset ring-[#dadfdd] hover:bg-[#9cf2e8]/50 hover:ring-[#9cdcd3] text-[13.5px] font-semibold text-[#00201d] transition-colors"
                                >
                                    <Initials name={`${s.first_name || ''} ${s.last_name || ''}`} size={28} />
                                    {s.first_name} {s.last_name}
                                </button>
                            ))}
                        </div>
                    )}
                </Panel>
            )}

            <Panel className="grid lg:grid-cols-[320px_1fr] overflow-hidden h-[calc(100dvh-230px)] min-h-[520px]">
                {/* Konuşmalar */}
                <div className={cn('flex flex-col min-h-0 lg:border-r border-[#eceeed]', selectedUserId && 'hidden lg:flex')}>
                    <div className="p-3 border-b border-[#eceeed]">
                        <SearchBox value={search} onChange={setSearch} placeholder="Kişi ara" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {convLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-[#005c55] animate-spin" /></div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center py-12 px-6">
                                <p className="text-[14.5px] font-bold text-[#00201d]">{search ? 'Bu isimde biri yok' : 'Henüz yazışma yok'}</p>
                                {!search && <p className="text-[13px] text-[#5f7774] mt-1">Yeni mesaj ile bir öğrencine yaz.</p>}
                            </div>
                        ) : (
                            <ul className="space-y-0.5">
                                {filteredConversations.map((c: Conversation) => {
                                    const on = selectedUserId === c.other_user_id;
                                    const unread = Number(c.unread_count) > 0;
                                    return (
                                        <li key={c.other_user_id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedUserId(c.other_user_id)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors duration-150',
                                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/45',
                                                    on ? 'bg-[#9cf2e8]/45' : 'hover:bg-[#f5f6f6]'
                                                )}
                                            >
                                                <Initials name={`${c.first_name || ''} ${c.last_name || ''}`} src={c.profile_image || c.profile_image_path} size={40} />
                                                <span className="flex-1 min-w-0">
                                                    <span className="flex items-baseline justify-between gap-2">
                                                        <span className={cn('text-[14px] truncate text-[#00201d]', unread ? 'font-extrabold' : 'font-semibold')}>
                                                            {c.first_name} {c.last_name}
                                                        </span>
                                                        <span className="text-[11.5px] text-[#5f7774] shrink-0">{relativeTime(c.last_message_at)}</span>
                                                    </span>
                                                    <span className="flex items-center gap-2 mt-0.5">
                                                        <span className={cn('text-[13px] truncate flex-1', unread ? 'text-[#00201d] font-semibold' : 'text-[#5f7774]')}>
                                                            {c.last_message || '…'}
                                                        </span>
                                                        {unread && (
                                                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#00201d] text-[#9cf2e8] text-[11px] font-bold tabular-nums flex items-center justify-center">
                                                                {c.unread_count}
                                                            </span>
                                                        )}
                                                    </span>
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Yazışma */}
                <div className={cn('flex flex-col min-h-0', !selectedUserId && 'hidden lg:flex')}>
                    {!selectedUserId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f3f4f4]">
                            <p className="text-[17px] font-extrabold text-[#00201d]">Bir yazışma seç</p>
                            <p className="text-[14px] text-[#4a6360] mt-1.5 max-w-xs">Soldan bir kişi seç ya da yeni mesaj başlat.</p>
                        </div>
                    ) : (
                        <>
                            <div className="h-16 shrink-0 px-3 sm:px-5 border-b border-[#eceeed] flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedUserId(null)}
                                    className={cn(btn.ghost, 'lg:hidden w-9 h-9 p-0')}
                                    aria-label="Yazışmalara dön"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <Initials name={otherName} src={otherUser?.profile_image || otherUser?.profile_image_path || selected?.profile_image} size={38} />
                                <div className="min-w-0">
                                    <p className="text-[14.5px] font-extrabold text-[#00201d] truncate">{otherName || 'Yükleniyor'}</p>
                                    <p className="text-[12.5px] text-[#5f7774]">{otherUser?.role === 'instructor' ? 'Eğitmen' : 'Öğrenci'}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-2.5 bg-[#f3f4f4]">
                                {msgLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#005c55] animate-spin" /></div>
                                ) : messages.length === 0 ? (
                                    <p className="text-center text-[14px] text-[#4a6360] py-12">Henüz mesaj yok. İlk mesajı sen yaz.</p>
                                ) : (
                                    messages.map((m: Message) => {
                                        const isMe = m.sender_id === currentUserId;
                                        return (
                                            <div key={m.message_id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                                                <div className="max-w-[78%] sm:max-w-[65%]">
                                                    <div className={cn(
                                                        'rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap break-words',
                                                        isMe
                                                            ? 'bg-[#9cf2e8] text-[#00201d] rounded-br-md'
                                                            : 'bg-white text-[#00201d] ring-1 ring-[#e3e6e5] rounded-bl-md'
                                                    )}>
                                                        {m.message_content}
                                                    </div>
                                                    <div className={cn('flex items-center gap-1 mt-1 text-[11.5px] text-[#5f7774]', isMe ? 'justify-end' : 'justify-start')}>
                                                        {new Date(m.sent_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && (
                                                            <CheckCheck
                                                                aria-label={m.is_read ? 'Okundu' : 'İletildi'}
                                                                className={cn('w-3.5 h-3.5', m.is_read ? 'text-[#005c55]' : 'text-[#9bb0ad]')}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form
                                className="shrink-0 p-3 sm:p-4 border-t border-[#eceeed] flex gap-2.5 items-end"
                                onSubmit={e => { e.preventDefault(); handleSend(); }}
                            >
                                <label htmlFor="msg-input" className="sr-only">Mesajın</label>
                                <textarea
                                    id="msg-input"
                                    placeholder="Mesajını yaz. Enter gönderir, Shift+Enter alt satıra geçer."
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                    className={cn(field, 'flex-1 min-h-[44px] max-h-[140px] py-2.5 resize-none')}
                                />
                                <button
                                    type="submit"
                                    disabled={!messageText.trim() || sendMutation.isPending}
                                    className={cn(btn.primary, 'h-11 w-11 p-0 shrink-0')}
                                    aria-label="Gönder"
                                >
                                    {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </Panel>
        </>
    );
}
