import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
import { API_BASE_URL } from '@/lib/api';
    Send, Search, Loader2, MessageCircle, CheckCheck, Clock, GraduationCap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Conversation {
    other_user_id: number;
    first_name: string;
    last_name: string;
    profile_image_path: string | null;
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
}

export default function MessagesPage() {
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

    // Konuşmalar — aynı instructor endpoint'i kullanıyoruz (user_id bazlı, role kontrolü yok)
    const { data: convData, isLoading: convLoading } = useQuery({
        queryKey: ['student-conversations'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/conversations', {
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (!r.ok) throw new Error();
            return r.json();
        },
        refetchInterval: 10000
    });

    // Seçili eğitmenin mesajları
    const { data: msgData, isLoading: msgLoading } = useQuery({
        queryKey: ['student-messages', selectedUserId],
        queryFn: async () => {
            const r = await fetch(`/api/instructor/messages/${selectedUserId}`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (!r.ok) throw new Error();
            return r.json();
        },
        enabled: !!selectedUserId,
        refetchInterval: 5000
    });

    // Yeni mesaj için eğitmen listesi (kayıtlı olduğu kursların eğitmenleri)
    const { data: instructorsData } = useQuery({
        queryKey: ['student-msg-instructors'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/student/messages/instructors/list', {
                headers: { Authorization: `Bearer ${token()}` }
            });
            return r.json();
        }
    });

    // Mesaj gönder
    const sendMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ receiver_id: selectedUserId, message_content: messageText })
            });
            if (!r.ok) throw new Error('Mesaj gönderilemedi');
            return r.json();
        },
        onSuccess: () => {
            setMessageText('');
            qc.invalidateQueries({ queryKey: ['student-messages', selectedUserId] });
            qc.invalidateQueries({ queryKey: ['student-conversations'] });
        },
        onError: () => toast.error('Mesaj gönderilemedi.')
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgData]);

    const conversations = convData?.conversations || [];
    const filteredConversations = conversations.filter((c: Conversation) => {
        const name = `${c.first_name} ${c.last_name}`.toLowerCase();
        return name.includes(search.toLowerCase());
    });
    const messages = msgData?.messages || [];
    const otherUser = msgData?.otherUser;
    const instructors = instructorsData?.instructors || [];

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-indigo-50/20">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-2xl shadow-lg shadow-cyan-200">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mesajlar</h1>
                            <p className="text-sm text-slate-400 mt-0.5">Eğitmenlerinizle mesajlaşın</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowNewMessage(!showNewMessage)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm"
                    >
                        <MessageCircle className="w-4 h-4 mr-2" /> Yeni Mesaj
                    </Button>
                </div>

                {/* Yeni mesaj - eğitmen seç */}
                {showNewMessage && (
                    <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-3">
                            <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
                            Eğitmen Seç
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {instructors.map((ins: any) => (
                                <button
                                    key={ins.user_id}
                                    onClick={() => { setSelectedUserId(ins.user_id); setShowNewMessage(false); }}
                                    className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium"
                                >
                                    <Avatar className="h-6 w-6 rounded-full">
                                        <AvatarImage src={ins.profile_image_path || ''} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] font-black">
                                            {ins.first_name?.[0]}{ins.last_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    {ins.first_name} {ins.last_name}
                                </button>
                            ))}
                            {instructors.length === 0 && (
                                <p className="text-sm text-slate-400">Henüz kayıtlı olduğunuz bir kurs yok. Bir kursa kaydolduktan sonra eğitmene mesaj atabilirsiniz.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Chat Layout */}
                <div className="flex gap-4 h-[600px]">

                    {/* Sol: Konuşmalar */}
                    <div className="w-80 shrink-0 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-50">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Konuşma ara..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 h-9 rounded-xl border-slate-200 text-xs font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {convLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <MessageCircle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400">Henüz mesaj yok</p>
                                    <p className="text-xs text-slate-300 mt-1">Yeni mesaj butonuna tıklayın</p>
                                </div>
                            ) : (
                                filteredConversations.map((c: Conversation) => (
                                    <button
                                        key={c.other_user_id}
                                        onClick={() => setSelectedUserId(c.other_user_id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left",
                                            selectedUserId === c.other_user_id && "bg-indigo-50 border-l-2 border-l-indigo-500"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar className="h-10 w-10 rounded-xl">
                                                <AvatarImage src={c.profile_image_path || ''} />
                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl">
                                                    {c.first_name?.[0]}{c.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            {c.unread_count > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] text-white font-black flex items-center justify-center">
                                                    {c.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-slate-900 truncate">{c.first_name} {c.last_name}</p>
                                                <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                                                    {new Date(c.last_message_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {c.role === 'instructor' && (
                                                    <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-black px-1 py-0">Eğitmen</Badge>
                                                )}
                                                <p className="text-[11px] text-slate-400 truncate">{c.last_message || '...'}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sağ: Mesajlar */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden">
                        {!selectedUserId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 text-indigo-300" />
                                </div>
                                <h3 className="text-base font-bold text-slate-700 mb-2">Bir konuşma seçin</h3>
                                <p className="text-sm text-slate-400">Sol taraftan bir konuşma seçin veya yeni mesaj başlatın</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                                    {otherUser && (
                                        <>
                                            <Avatar className="h-9 w-9 rounded-xl">
                                                <AvatarImage src={otherUser.profile_image_path || ''} />
                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl">
                                                    {otherUser.first_name?.[0]}{otherUser.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{otherUser.first_name} {otherUser.last_name}</p>
                                                <Badge className="bg-indigo-50 text-indigo-600 border-none text-[10px] font-bold px-2">
                                                    {otherUser.role === 'instructor' ? 'Eğitmen' : 'Öğrenci'}
                                                </Badge>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                                    {msgLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <MessageCircle className="w-8 h-8 text-slate-200 mb-3" />
                                            <p className="text-sm text-slate-400">Henüz mesaj yok. İlk mesajı gönder!</p>
                                        </div>
                                    ) : (
                                        messages.map((m: Message) => {
                                            const isMe = m.sender_id === currentUserId;
                                            return (
                                                <div key={m.message_id} className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}>
                                                    {!isMe && (
                                                        <Avatar className="h-7 w-7 rounded-lg shrink-0 mt-0.5">
                                                            <AvatarImage src={m.profile_image_path || ''} />
                                                            <AvatarFallback className="bg-slate-200 text-slate-600 text-[10px] font-black rounded-lg">
                                                                {m.first_name?.[0]}{m.last_name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div className={cn("max-w-[70%] space-y-1")}>
                                                        <div className={cn(
                                                            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                                            isMe
                                                                ? "bg-indigo-600 text-white rounded-tr-sm"
                                                                : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm"
                                                        )}>
                                                            {m.message_content}
                                                        </div>
                                                        <div className={cn("flex items-center gap-1 text-[10px] text-slate-400", isMe ? "justify-end" : "justify-start")}>
                                                            <Clock className="w-2.5 h-2.5" />
                                                            {new Date(m.sent_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                            {isMe && <CheckCheck className={cn("w-3 h-3", m.is_read ? "text-indigo-400" : "text-slate-300")} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t border-slate-50">
                                    <div className="flex gap-3 items-end">
                                        <Textarea
                                            placeholder="Mesajınızı yazın... (Enter ile gönder)"
                                            value={messageText}
                                            onChange={e => setMessageText(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="flex-1 min-h-[44px] max-h-[120px] rounded-xl border-slate-200 text-sm resize-none"
                                            rows={1}
                                        />
                                        <Button
                                            onClick={handleSend}
                                            disabled={!messageText.trim() || sendMutation.isPending}
                                            className="h-11 w-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 p-0"
                                        >
                                            {sendMutation.isPending
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Send className="w-4 h-4" />
                                            }
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
