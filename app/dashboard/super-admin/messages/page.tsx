'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Image as ImageIcon,
    FileText,
    Download,
    Smile as SmileIcon,
    Paperclip as PaperclipIcon,
    Send as SendIcon,
    Search,
    MoreVertical,
    ChevronLeft,
    User,
    Building2,
    ShieldAlert,
    Clock,
    X,
    CheckCircle2,
    Trash2,
    Reply,
    Paperclip,
    Send
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/crypto';
import {
    getAdminGlobalContactsAction,
    getMessagesAction,
    sendMessageAction,
    uploadAttachmentAction,
    deleteMessageAction
} from '@/app/actions/messages';
import { toast } from 'react-hot-toast';
import { UserAvatar } from '@/components/ui/user-avatar';
import { HiPaperClip } from 'react-icons/hi';
import { FaImage, FaFileAlt, FaRegSmile, FaStickyNote } from 'react-icons/fa';

const EMOJI_LIST = [
    { cat: 'Smileys', items: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
    { cat: 'Hearts', items: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
    { cat: 'Hands', items: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏'] },
    { cat: 'Activities', items: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋'] }
];

const STICKER_LIST = [
    { id: 's1', content: '🎓', label: 'Graduate' },
    { id: 's2', content: '📚', label: 'Study' },
    { id: 's3', content: '🌟', label: 'Star' },
    { id: 's4', content: '🔥', label: 'Fire' },
    { id: 's5', content: '💡', label: 'Idea' },
    { id: 's6', content: '✅', label: 'Done' },
    { id: 's7', content: '🏆', label: 'Winner' },
    { id: 's8', content: '✏️', label: 'Write' },
    { id: 's9', content: '🧬', label: 'Science' },
    { id: 's10', content: '🧪', label: 'Lab' },
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function AdminMessagingPage() {
    const [user, setUser] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'institution'>('all');
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [editingMessage, setEditingMessage] = useState<any>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [pickerTab, setPickerTab] = useState<'emojis' | 'stickers'>('emojis');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeChatRef = useRef(activeChat);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const scrollToBottom = (instant = false) => {
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({
                    top: scrollContainerRef.current.scrollHeight,
                    behavior: instant ? "auto" : "smooth"
                });
            }
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setUser(authUser);
                await fetchContacts(authUser.id);
            }
            setLoading(false);
        };
        init();
    }, []);

    // Real-time subscription - synchronized with main message center logic
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`admin_messages_sync`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                const activeId = activeChatRef.current?.id;
                if (!activeId) return;

                if (payload.eventType === 'INSERT') {
                    const newMsg = payload.new;
                    if ((newMsg.sender_id === user.id && newMsg.receiver_id === activeId) ||
                        (newMsg.sender_id === activeId && newMsg.receiver_id === user.id)) {
                        setMessages(prev => {
                            // Prevent duplicates: Check ID OR matching content/sender for recent optimistic messages
                            const isDuplicate = prev.some(m =>
                                m.id === newMsg.id ||
                                (m.id.startsWith('temp-') && m.content === newMsg.content && m.sender_id === newMsg.sender_id)
                            );
                            if (isDuplicate) {
                                // If it's our temp message, replace it with the real one to get the proper ID
                                return prev.map(m => (m.id.startsWith('temp-') && m.content === newMsg.content) ? newMsg : m);
                            }
                            return [...prev, newMsg];
                        });
                        scrollToBottom();
                    }
                    fetchContacts(user.id);
                } else if (payload.eventType === 'UPDATE') {
                    const updated = payload.new;
                    setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old.id;
                    setMessages(prev => prev.filter(m => m.id !== deletedId));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const fetchContacts = async (uid: string) => {
        try {
            const res = decryptData(await getAdminGlobalContactsAction(uid));
            if (res.success) {
                setContacts(res.data || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (contactId: string) => {
        if (!user) return;
        setMessagesLoading(true);
        try {
            const res = decryptData(await getMessagesAction(user.id, contactId));
            if (res.success) {
                setMessages(res.data || []);

                // Mark as read
                const { markMessagesAsReadAction } = await import('@/app/actions/messages');
                await markMessagesAsReadAction(user.id, contactId);
                fetchContacts(user.id);
            }
        } catch (err) {
            toast.error("Failed to load conversation");
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(f => {
            if (f.size > MAX_FILE_SIZE) {
                toast.error(`${f.name} exceeds 2MB limit`);
                return false;
            }
            return true;
        });
        setSelectedFiles(prev => [...prev, ...validFiles]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!inputText.trim() && selectedFiles.length === 0) || !activeChat || !user) return;

        if (editingMessage) {
            const msgId = editingMessage.id;
            const content = inputText.trim();
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content, is_edited: true } : m));
            setEditingMessage(null);
            setInputText('');

            try {
                const { editMessageAction } = await import('@/app/actions/messages');
                const res = decryptData(await editMessageAction(encryptData({ messageId: msgId, newContent: content, senderId: user.id })));
                if (!res.success) toast.error("Failed to edit");
            } catch (err) { toast.error("Edit error"); }
            return;
        }

        const tempId = 'temp-' + Date.now();
        const currentInput = inputText;
        const currentReply = replyingTo;
        const currentFiles = [...selectedFiles];

        // Optimistic update
        const tempMsg = {
            id: tempId,
            sender_id: user.id,
            receiver_id: activeChat.id,
            content: currentInput,
            created_at: new Date().toISOString(),
            reply_to: currentReply ? { content: currentReply.content, sender_id: currentReply.sender_id } : null,
            attachments: currentFiles.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                url: URL.createObjectURL(file)
            }))
        };

        setMessages(prev => [...prev, tempMsg]);
        setInputText('');
        setReplyingTo(null);
        setSelectedFiles([]);
        scrollToBottom();

        try {
            const uploadedAttachments = [];
            for (const file of currentFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('fileName', fileName);

                const res = await uploadAttachmentAction(formData);
                if (res.success) {
                    uploadedAttachments.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: res.url
                    });
                } else {
                    toast.error(`Failed to upload ${file.name}`);
                }
            }

            if (!currentInput.trim() && uploadedAttachments.length === 0) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                return;
            }

            const payload = encryptData({
                senderId: user.id,
                receiverId: activeChat.id,
                content: currentInput,
                replyToId: currentReply?.id,
                attachments: uploadedAttachments
            });
            const res = decryptData(await sendMessageAction(payload));
            if (res.success && res.data) {
                setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            } else if (!res.success) {
                toast.error("Failed to send");
                setMessages(prev => prev.filter(m => m.id !== tempId));
            }
        } catch (err) {
            toast.error("Network error");
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const handleSendSticker = async (content: string) => {
        if (!user || !activeChat) return;
        const tempId = 'temp-' + Date.now();
        const currentReply = replyingTo;
        setReplyingTo(null);

        const newMessage = {
            id: tempId,
            sender_id: user.id,
            receiver_id: activeChat.id,
            content,
            created_at: new Date().toISOString(),
            reply_to: currentReply ? { content: currentReply.content, sender_id: currentReply.sender_id } : null
        };

        setMessages(prev => [...prev, newMessage]);
        try {
            const payload = encryptData({
                senderId: user.id,
                receiverId: activeChat.id,
                content,
                replyToId: currentReply?.id
            });
            const res = decryptData(await sendMessageAction(payload));
            if (res.success && res.data) {
                setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            } else {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                toast.error("Error sending sticker");
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error("Error sending sticker");
        }
    };

    const filteredContacts = contacts.filter(c => {
        const matchesSearch = c.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || c.category === activeTab;
        return matchesSearch && matchesTab;
    });

    if (loading) return (
        <div className="h-[calc(100vh-160px)] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] min-h-[500px] flex overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-full md:w-80' : 'hidden md:flex md:w-20'} flex-col border-r border-gray-100 transition-all duration-300`}>
                <div className="p-4 border-b border-gray-50 bg-gray-50/30 space-y-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] outline-none transition-all"
                        />
                    </div>

                    {isSidebarOpen && (
                        <div className="flex p-1 bg-white border border-gray-200 rounded-lg">
                            {(['all', 'teacher', 'institution'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {tab}s
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                    {filteredContacts.map((contact) => (
                        <button
                            key={contact.id}
                            onClick={() => {
                                setActiveChat(contact);
                                fetchMessages(contact.id);
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all relative ${activeChat?.id === contact.id ? 'bg-[var(--color-primary)]/5 border-r-2 border-[var(--color-primary)]' : ''}`}
                        >
                            <div className="relative">
                                <UserAvatar name={contact.sender} className="w-10 h-10 rounded-lg" />
                                {contact.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                                )}
                                {contact.unread > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                        {contact.unread}
                                    </span>
                                )}
                            </div>
                            {isSidebarOpen && (
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-bold text-gray-800 truncate">{contact.sender}</h4>
                                        <span className="text-[10px] text-gray-400 font-medium">{contact.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{contact.lastMessage}</p>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col min-w-0 ${!isSidebarOpen || window.innerWidth >= 768 ? 'flex' : 'hidden'}`}>
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="relative">
                                    <UserAvatar name={activeChat.sender} className="w-10 h-10 rounded-lg" />
                                    {activeChat.isOnline && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800">{activeChat.sender}</h3>
                                    <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">{activeChat.role}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-white relative no-scrollbar"
                        >
                            {/* Branded Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] overflow-hidden select-none">
                                <div className="flex flex-col items-center rotate-[-10deg]">
                                    <h1 className="text-[50px] md:text-[80px] font-black oswald-font leading-none tracking-tighter">
                                        <span className="text-[var(--color-primary)]">Teacher</span>
                                        <br />
                                        <span className="text-[var(--color-secondary)] pl-6">Desk</span>
                                    </h1>
                                    <p className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mt-2 text-[var(--color-primary)]">Virtual Environment</p>
                                </div>
                            </div>
                            {messagesLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : messages.length > 0 ? (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === user?.id;
                                    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-start gap-2 max-w-[85%] group relative">
                                                {!isMe && <UserAvatar name={activeChat.sender} className="w-8 h-8 rounded-lg mt-1 hidden sm:flex" />}

                                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%] relative group`}>
                                                    <div className={`p-1.5 w-full rounded-xl shadow-sm relative ${isMe ? 'bg-[var(--color-primary)] text-white rounded-tr-none ml-10' : 'bg-white text-gray-800 rounded-tl-none mr-10 border border-gray-100 shadow-[0_2px_5px_rgba(0,0,0,0.05)]'}`}>
                                                        {/* Reply Preview */}
                                                        {msg.reply_to && (
                                                            <div className={`mb-2 p-2 rounded-lg text-[10px] border-l-4 ${isMe ? 'bg-white/10 border-white/40' : 'bg-gray-100 border-[var(--color-primary)]'}`}>
                                                                <p className="font-bold truncate">{msg.reply_to.sender_id === user?.id ? 'You' : activeChat.sender}</p>
                                                                <p className="opacity-80 truncate">{msg.reply_to.content}</p>
                                                            </div>
                                                        )}

                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className="flex flex-col gap-2 mb-2">
                                                                {msg.attachments.map((att: any, aIdx: number) => (
                                                                    <div key={aIdx} className="rounded-lg overflow-hidden border border-white/20 bg-white/5">
                                                                        {att.type.startsWith('image/') ? (
                                                                            <img src={att.url} alt="" className="max-w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(att.url, '_blank')} />
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 p-3 bg-white/10">
                                                                                <FileText size={20} className={isMe ? 'text-white' : 'text-[var(--color-primary)]'} />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-xs font-bold truncate">{att.name}</p>
                                                                                    <p className="text-[10px] opacity-70">{(att.size / 1024).toFixed(1)} KB</p>
                                                                                </div>
                                                                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                                                                                    <Download size={14} />
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {msg.content && <p className="text-sm font-medium leading-tight whitespace-pre-wrap pr-20 pb-2.5">{msg.content}</p>}
                                                        <div className="absolute bottom-1.5 right-2 flex items-center gap-1 opacity-60">
                                                            <span className="text-[10px] font-bold">{time}</span>
                                                            {isMe && <CheckCircle2 size={13} className={msg.is_read ? 'text-emerald-300' : 'text-white/30'} />}
                                                        </div>

                                                        {/* WhatsApp-Sleek Tail */}
                                                        <div
                                                            className={`absolute top-0 w-3 h-3 ${isMe ? '-right-1.5 bg-[var(--color-primary)]' : '-left-1.5 bg-white'}`}
                                                            style={{
                                                                clipPath: isMe
                                                                    ? 'polygon(0 0, 100% 0, 0 100%)'
                                                                    : 'polygon(0 0, 100% 0, 100% 100%)'
                                                            }}
                                                        />

                                                        {/* Context Menu Button */}
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                                                            className={`absolute top-2 ${isMe ? '-left-8' : '-right-8'} p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity`}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        <AnimatePresence>
                                                            {openMenuId === msg.id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                        className={`absolute bottom-full mb-2 ${isMe ? 'right-0' : 'left-0'} w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 overflow-hidden`}
                                                                    >
                                                                        <button
                                                                            onClick={() => { setReplyingTo(msg); setOpenMenuId(null); setInputText(''); }}
                                                                            className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                        >
                                                                            <Reply size={14} /> Reply
                                                                        </button>
                                                                        {isMe && (
                                                                            <button
                                                                                onClick={() => { setEditingMessage(msg); setInputText(msg.content); setOpenMenuId(null); }}
                                                                                className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50"
                                                                            >
                                                                                <Paperclip size={14} className="rotate-45" /> Edit
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (confirm("Delete message?")) {
                                                                                    const res = decryptData(await deleteMessageAction(encryptData({ messageId: msg.id, senderId: user.id })));
                                                                                    if (res.success) setMessages(prev => prev.filter(m => m.id !== msg.id));
                                                                                }
                                                                                setOpenMenuId(null);
                                                                            }}
                                                                            className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                                                        >
                                                                            <Trash2 size={14} /> Delete
                                                                        </button>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    {msg.is_edited && (
                                                        <span className={`text-[9px] italic opacity-40 mt-1 ${isMe ? 'mr-1' : 'ml-1'} text-gray-500`}>
                                                            edited
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <Clock size={40} className="text-gray-400 mb-2" />
                                    <p className="text-sm font-bold oswald-font uppercase tracking-widest text-gray-500">Start the conversation</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-50 bg-white">
                            <AnimatePresence>
                                {selectedFiles.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="mb-3 flex flex-wrap gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100"
                                    >
                                        {selectedFiles.map((file, idx) => (
                                            <div key={idx} className="relative group bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2 pr-8">
                                                <div className="w-8 h-8 rounded-md bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                                    {file.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                                                </div>
                                                <div className="flex flex-col min-w-0 max-w-[120px]">
                                                    <p className="text-[10px] font-bold text-gray-800 truncate">{file.name}</p>
                                                    <p className="text-[9px] text-gray-400 font-medium">{(file.size / 1024).toFixed(0)} KB</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                                {replyingTo && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="mb-2 p-3 bg-gray-50 rounded-xl border-l-4 border-[var(--color-primary)] flex justify-between items-center"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase">Replying to {replyingTo.sender_id === user.id ? 'yourself' : activeChat.sender}</p>
                                            <p className="text-xs text-gray-500 truncate">{replyingTo.content}</p>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                                    </motion.div>
                                )}
                                {editingMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="mb-2 p-3 bg-yellow-50 rounded-xl border-l-4 border-yellow-400 flex justify-between items-center"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-yellow-600 uppercase">Editing message</p>
                                            <p className="text-xs text-gray-500 truncate">{editingMessage.content}</p>
                                        </div>
                                        <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--color-primary)]/10 transition-all border border-transparent focus-within:border-[var(--color-primary)]/20">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    className="hidden"
                                />

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                                        className={`p-2 transition-colors rounded-full hover:bg-gray-100 ${showAttachMenu ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <PaperclipIcon size={20} />
                                    </button>

                                    <AnimatePresence>
                                        {showAttachMenu && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowAttachMenu(false); }} />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    className="absolute bottom-full left-0 mb-4 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 flex flex-col p-2 gap-1 min-w-[180px]"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (fileInputRef.current) {
                                                                fileInputRef.current.accept = "image/*,video/*";
                                                                fileInputRef.current.click();
                                                            }
                                                            setShowAttachMenu(false);
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl transition-all text-left group"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-500 flex items-center justify-center transition-colors">
                                                            <FaImage size={14} />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700">Photos & Videos</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (fileInputRef.current) {
                                                                fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt";
                                                                fileInputRef.current.click();
                                                            }
                                                            setShowAttachMenu(false);
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl transition-all text-left group"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-purple-50 group-hover:bg-purple-100 text-purple-500 flex items-center justify-center transition-colors">
                                                            <FaFileAlt size={14} />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700">Document</span>
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-sm py-2 font-medium"
                                />

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={`p-2 transition-colors rounded-full hover:bg-gray-100 ${showEmojiPicker ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <SmileIcon size={20} />
                                    </button>

                                    <AnimatePresence>
                                        {showEmojiPicker && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }} />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    className="absolute bottom-full right-0 mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 w-72 overflow-hidden flex flex-col"
                                                >
                                                    <div className="p-2 bg-gray-50 border-b border-gray-100 flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPickerTab('emojis')}
                                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${pickerTab === 'emojis' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
                                                        >
                                                            <FaRegSmile /> Emojis
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPickerTab('stickers')}
                                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${pickerTab === 'stickers' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
                                                        >
                                                            <FaStickyNote /> Stickers
                                                        </button>
                                                    </div>

                                                    <div className="max-h-60 overflow-y-auto p-3 sidebar-scroll">
                                                        {pickerTab === 'emojis' ? (
                                                            <div className="space-y-4">
                                                                {EMOJI_LIST.map((cat) => (
                                                                    <div key={cat.cat}>
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{cat.cat}</p>
                                                                        <div className="grid grid-cols-7 gap-1">
                                                                            {cat.items.map(emoji => (
                                                                                <button
                                                                                    key={emoji}
                                                                                    type="button"
                                                                                    onClick={() => setInputText(prev => prev + emoji)}
                                                                                    className="text-lg p-1 hover:bg-gray-100 rounded-lg transition-all hover:scale-120"
                                                                                >
                                                                                    {emoji}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {STICKER_LIST.map(sticker => (
                                                                    <button
                                                                        key={sticker.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleSendSticker(sticker.content);
                                                                            setShowEmojiPicker(false);
                                                                        }}
                                                                        className="aspect-square bg-gray-50 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-indigo-50 transition-all group"
                                                                    >
                                                                        <span className="text-3xl group-hover:scale-110 transition-transform">{sticker.content}</span>
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{sticker.label}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!inputText.trim() && selectedFiles.length === 0}
                                    className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-[var(--color-primary)]/20"
                                >
                                    <SendIcon size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 p-10 text-center">
                        <div className="w-20 h-20 bg-white rounded-[30px] shadow-xl flex items-center justify-center mb-6 border border-gray-100">
                            <Send size={32} className="text-[var(--color-primary)] translate-x-0.5 -translate-y-0.5" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 oswald-font tracking-tight capitalize">Your Direct Access</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-2 font-medium">Select any teacher or institution from the list to start a conversation. You have direct access to all active members.</p>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="mt-8 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-bold shadow-lg shadow-[var(--color-primary)]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            Open Contacts List <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
