'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiDotsVertical, HiPaperClip, HiX, HiChevronDown } from 'react-icons/hi';
import { FaPaperPlane, FaPhoneAlt, FaVideo, FaInfoCircle, FaRegSmile, FaChevronLeft, FaUser, FaEnvelope, FaStickyNote, FaDownload, FaFileAlt, FaImage, FaPen, FaTrash } from 'react-icons/fa';
import { IoCheckmarkDone, IoSettingsOutline } from 'react-icons/io5';
import { RiForward5Line } from 'react-icons/ri';
import { HiReply, HiOutlineExclamationCircle } from 'react-icons/hi';
import { MdOutlineReportProblem } from 'react-icons/md';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/crypto';
import { getChatContactsAction, getMessagesAction, sendMessageAction, uploadAttachmentAction, editMessageAction, deleteMessageAction } from '@/app/actions/messages';
import { createReportAction } from '@/app/actions/reports';
import { toast } from 'react-hot-toast';
import LoadingScreen from '@/components/ui/loading-screen';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';

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

export default function MessageCenter() {
    const [user, setUser] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState<any>(null); // New state for WhatsApp-style reply
    const [editingMessage, setEditingMessage] = useState<any>(null);
    const [forwardingMessage, setForwardingMessage] = useState<any>(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [pickerTab, setPickerTab] = useState<'emojis' | 'stickers'>('emojis');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [deletingMessage, setDeletingMessage] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportingMessage, setReportingMessage] = useState<any>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [isReporting, setIsReporting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('userId');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
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

    // Handle deep linking from URL
    useEffect(() => {
        if (targetUserId && contacts.length > 0) {
            const target = contacts.find(c => c.id === targetUserId);
            if (target) {
                setActiveChat(target);
            }
        }
    }, [targetUserId, contacts]);

    // Refresh contacts every time a message is sent/received or on intervals
    const fetchContacts = async (userId: string) => {
        try {
            const res = decryptData(await getChatContactsAction(userId));
            if (res.success) {
                setContacts(res.data);
                // If no active chat, maybe pick the first one
                if (!activeChat && res.data.length > 0) {
                    // Don't auto-set to avoid accidental read marks if needed
                }
            }
        } catch (err) {
            console.error("Contacts Load Error:", err);
        }
    };

    // Load messages for active chat
    useEffect(() => {
        if (activeChat && user) {
            loadMessages(activeChat.id);
            setIsSidebarOpen(false); // Close sidebar on mobile when chat selected
        }
    }, [activeChat, user]);

    const loadMessages = async (contactId: string) => {
        try {
            setMessagesLoading(true);
            const res = decryptData(await getMessagesAction(user.id, contactId));
            if (res.success) {
                setMessages(res.data);
            }
        } catch (err) {
            console.error("Messages Load Error:", err);
        } finally {
            setMessagesLoading(false);
        }
    };

    const activeChatRef = useRef(activeChat);
    useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

    // Real-time synchronization
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('message_center_main')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                (payload) => {
                    const currentChat = activeChatRef.current;

                    if (payload.eventType === 'INSERT') {
                        const newMsg = payload.new;
                        if (currentChat && (
                            (newMsg.sender_id === user.id && newMsg.receiver_id === currentChat.id) ||
                            (newMsg.sender_id === currentChat.id && newMsg.receiver_id === user.id)
                        )) {
                            setMessages(prev => {
                                if (prev.some(m => m.id === newMsg.id)) return prev;

                                // Enrich with reply content for real-time visual consistency
                                if (newMsg.reply_to_id) {
                                    const original = prev.find(m => m.id === newMsg.reply_to_id);
                                    if (original) {
                                        newMsg.reply_to = {
                                            content: original.content,
                                            sender_id: original.sender_id
                                        };
                                    }
                                }

                                return [...prev, newMsg];
                            });
                        }
                        fetchContacts(user.id);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedMsg = payload.new;
                        if (currentChat && (
                            (updatedMsg.sender_id === user.id && updatedMsg.receiver_id === currentChat.id) ||
                            (updatedMsg.sender_id === currentChat.id && updatedMsg.receiver_id === user.id)
                        )) {
                            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, content: updatedMsg.content, is_edited: updatedMsg.is_edited } : m));
                        }
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    // Send Message
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputText.trim() && selectedFiles.length === 0) || !user || !activeChat) return;

        if (editingMessage) {
            const tempId = editingMessage.id;
            const originalContent = editingMessage.content;
            const content = inputText.trim();

            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content, is_edited: true } : m));
            setInputText('');
            setEditingMessage(null);

            try {
                const payload = encryptData({
                    messageId: tempId,
                    newContent: content,
                    senderId: user.id
                });
                const res = decryptData(await editMessageAction(payload));
                if (!res.success) {
                    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: originalContent, is_edited: editingMessage.is_edited } : m));
                    toast.error("Failed to edit message");
                }
            } catch (err) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: originalContent, is_edited: editingMessage.is_edited } : m));
                toast.error("Error editing message");
            }
            return;
        }

        const tempId = Date.now().toString();
        const currentInput = inputText;
        const currentReply = replyingTo;
        const currentFiles = [...selectedFiles];

        const baseMessageContent = {
            id: tempId,
            sender_id: user.id,
            receiver_id: activeChat.id,
            content: currentInput,
            created_at: new Date().toISOString(),
            is_read: false,
            reply_to: currentReply ? { content: currentReply.content, sender_id: currentReply.sender_id } : null,
            attachments: currentFiles.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                url: URL.createObjectURL(file)
            }))
        };

        // Optimistic Update
        setMessages(prev => [...prev, baseMessageContent]);
        setInputText('');
        setReplyingTo(null);
        setSelectedFiles([]);

        try {
            const uploadedAttachments = [];
            for (const file of currentFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const formData = new FormData();
                formData.append('file', file);
                formData.append('fileName', fileName);

                const res = await uploadAttachmentAction(formData);
                if (!res.success) {
                    toast.error(`Failed to upload ${file.name}`);
                    continue;
                }

                uploadedAttachments.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: res.url
                });
            }

            // Block sending of purely empty messages if upload fails entirely
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
            if (!res.success) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                toast.error("Failed to send message");
            } else {
                setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error("Error sending message");
        }
    };


    const handleSendSticker = async (content: string) => {
        if (!user || !activeChat) return;
        const tempId = Date.now().toString();
        const currentReply = replyingTo;
        setReplyingTo(null);

        const newMessage = {
            id: tempId,
            sender_id: user.id,
            receiver_id: activeChat.id,
            content,
            created_at: new Date().toISOString(),
            is_read: false,
            reply_to: currentReply ? {
                content: currentReply.content,
                sender_id: currentReply.sender_id
            } : null
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
            if (res.success) {
                setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error("Error sending sticker");
        }
    };

    const handleForward = async (recipientId: string) => {
        if (!forwardingMessage || !user) return;

        try {
            // Optimistic update if forwarding to active chat
            if (activeChat && recipientId === activeChat.id) {
                const tempId = Date.now().toString();
                const newMessage = {
                    id: tempId,
                    sender_id: user.id,
                    receiver_id: recipientId,
                    content: forwardingMessage.content,
                    created_at: new Date().toISOString(),
                    is_read: false,
                    is_forwarded: true,
                    attachments: forwardingMessage.attachments || []
                };
                setMessages(prev => [...prev, newMessage]);
            }

            const payload = encryptData({
                senderId: user.id,
                receiverId: recipientId,
                content: forwardingMessage.content,
                isForwarded: true,
                attachments: forwardingMessage.attachments || []
            });

            await sendMessageAction(payload);
            toast.success("Message forwarded");
        } catch (err) {
            console.error("Forward Error:", err);
            toast.error("Failed to forward");
        } finally {
            setShowForwardModal(false);
            setForwardingMessage(null);
        }
    };

    const handleDelete = async (deleteType: 'me' | 'everyone') => {
        if (!deletingMessage || !user) return;

        try {
            const payload = encryptData({
                messageId: deletingMessage.id,
                userId: user.id,
                deleteType
            });

            const res = decryptData(await deleteMessageAction(payload));
            if (res.success) {
                if (deleteType === 'me') {
                    setMessages(prev => prev.filter(m => m.id !== deletingMessage.id));
                    toast.success("Message deleted for you");
                } else {
                    setMessages(prev => prev.map(m => m.id === deletingMessage.id ? {
                        ...m,
                        content: "This message was deleted",
                        is_deleted_for_everyone: true,
                        attachments: []
                    } : m));
                    toast.success("Message deleted for everyone");
                }
            } else {
                toast.error(res.message || "Failed to delete");
            }
        } catch (err) {
            console.error("Delete Error:", err);
            toast.error("An error occurred");
        } finally {
            setShowDeleteModal(false);
            setDeletingMessage(null);
        }
    };

    const handleReport = async () => {
        if (!reportingMessage || !user || !reportReason) return;

        try {
            setIsReporting(true);
            const payload = encryptData({
                messageId: reportingMessage.id,
                reporterId: user.id,
                reportedId: reportingMessage.sender_id,
                reason: reportReason,
                description: reportDescription
            });

            const res = decryptData(await createReportAction(payload));
            if (res.success) {
                toast.success("Message reported successfully");
                setShowReportModal(false);
                setReportingMessage(null);
                setReportReason('');
                setReportDescription('');
            } else {
                toast.error(res.message || "Failed to report message");
            }
        } catch (err) {
            console.error("Report Error:", err);
            toast.error("An error occurred");
        } finally {
            setIsReporting(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.sender.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <LoadingScreen message="Synchronizing Communications" icon={<FaEnvelope className="text-white w-8 h-8" />} />;
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <Navbar />

            <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col p-0 md:p-4 lg:py-6">
                <div className="flex-1 bg-white/70 backdrop-blur-xl md:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex overflow-hidden relative min-h-[75vh] max-h-[85vh]">

                    {/* ── Sidebar (Chat List) ── */}
                    <div className={`absolute md:relative inset-0 md:inset-auto z-20 md:z-0 w-full md:w-[280px] lg:w-[350px] xl:w-[380px] bg-white md:bg-white/40 border-r border-gray-100 flex flex-col transition-transform duration-300 ${!isSidebarOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>

                        {/* Header */}
                        <div className="p-5 pb-3">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold oswald-font text-[var(--color-primary)]">Messages</h2>
                                <button className="text-gray-400 hover:text-[var(--color-secondary)] transition-colors">
                                    <HiDotsVertical className="text-xl" />
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <HiOutlineSearch className="text-gray-400 group-focus-within:text-[var(--color-secondary)] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/30 focus:border-transparent transition-all text-xs font-medium shadow-sm"
                                    placeholder="Search connections..."
                                />
                            </div>
                        </div>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 pb-4">
                            <AnimatePresence>
                                {filteredContacts.length > 0 ? (
                                    filteredContacts.map((chat, idx) => {
                                        const isActive = activeChat?.id === chat.id;
                                        return (
                                            <motion.div
                                                key={chat.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => setActiveChat(chat)}
                                                className={`relative p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-4 group ${isActive
                                                    ? 'bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-secondary)]/10 shadow-sm border border-[var(--color-secondary)]/20'
                                                    : 'hover:bg-white/60 border border-transparent'
                                                    }`}
                                            >
                                                <div className="relative">
                                                    {chat.avatar ? (
                                                        <img
                                                            src={chat.avatar}
                                                            alt=""
                                                            className="w-12 h-12 rounded-lg object-cover shadow-sm"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm ${chat.avatar ? 'hidden' : ''}`}>
                                                        {chat.sender.charAt(0).toUpperCase()}
                                                    </div>
                                                    {chat.isOnline && (
                                                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-[var(--color-primary)]' : 'text-gray-800'}`}>
                                                            {chat.sender}
                                                        </h3>
                                                    </div>
                                                    <p className={`text-xs truncate ${chat.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                        {chat.lastMessage}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-end justify-between self-stretch py-1 flex-shrink-0">
                                                    <span className={`text-xs font-medium whitespace-nowrap ${chat.unread > 0 ? 'text-[var(--color-secondary)]' : 'text-gray-400'}`}>
                                                        {chat.time}
                                                    </span>
                                                    {chat.unread > 0 && (
                                                        <div className="bg-[var(--color-secondary)] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full shadow-sm shadow-[var(--color-secondary)]/20">
                                                            {chat.unread}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-xs capitalize font-bold text-gray-400 oswald-font tracking-widest">No connections found</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── Main Chat Area ── */}
                    <div className="flex-1 flex flex-col bg-white/40 w-full min-w-0 relative overflow-hidden">

                        {/* Branded Watermark - Fixed in background */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] overflow-hidden select-none z-0">
                            <div className="flex flex-col items-center rotate-[-10deg]">
                                <h1 className="text-[50px] md:text-[80px] font-black oswald-font leading-none tracking-tighter">
                                    <span className="text-[var(--color-primary)]">Teacher</span>
                                    <br />
                                    <span className="text-[var(--color-secondary)] pl-8">Desk</span>
                                </h1>
                                <p className="text-xs md:text-sm font-bold tracking-[0.4em] uppercase mt-2 text-[var(--color-primary)]">Virtual Environment</p>
                            </div>
                        </div>


                        {activeChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="h-[76px] px-6 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                    <div className="flex items-center gap-2 md:gap-4">
                                        <button
                                            className="md:hidden p-2 -ml-2 text-gray-400 hover:text-[var(--color-primary)] rounded-full hover:bg-gray-100 transition-colors"
                                            onClick={() => setIsSidebarOpen(true)}
                                        >
                                            <FaChevronLeft className="w-4 h-4" />
                                        </button>

                                        <div className="relative">
                                            {activeChat.avatar ? (
                                                <img
                                                    src={activeChat.avatar}
                                                    alt=""
                                                    className="w-10 h-10 rounded-lg object-cover shadow-sm"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ${activeChat.avatar ? 'hidden' : ''}`}>
                                                {activeChat.sender.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-[var(--color-primary)] text-base truncate">{activeChat.sender}</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${activeChat.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span className="text-xs text-gray-500 font-medium truncate">{activeChat.isOnline ? 'Online' : 'Offline'} • {activeChat.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 md:gap-2">
                                        <button className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-primary)]/5 text-[var(--color-primary)] transition-colors">
                                            <FaPhoneAlt className="text-xs md:text-sm" />
                                        </button>
                                        <button className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-primary)]/5 text-[var(--color-primary)] transition-colors">
                                            <FaVideo className="text-xs md:text-sm" />
                                        </button>
                                        <div className="hidden sm:block w-px h-5 bg-gray-200 mx-1"></div>
                                        <button className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-[var(--color-primary)]/5 text-gray-500 transition-colors">
                                            <FaInfoCircle className="text-lg" />
                                        </button>
                                    </div>
                                </div>

                                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 sidebar-scroll bg-white/10 relative z-10">
                                    <AnimatePresence>
                                        {messagesLoading && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
                                                    <p className="text-xs font-bold oswald-font text-[var(--color-primary)] capitalize tracking-widest">Loading conversation...</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {messages.length === 0 && !messagesLoading && (
                                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                                            <div className="w-16 h-16 bg-gray-100 rounded-[20px] flex items-center justify-center mb-4">
                                                <FaPaperPlane className="text-gray-300" />
                                            </div>
                                            <p className="text-xs font-bold capitalize tracking-[0.2em] oswald-font text-gray-500">No messages yet. Say hi!</p>
                                        </div>
                                    )}

                                    {messages.map((msg, index) => {
                                        const isMe = msg.sender_id === user?.id;
                                        const isConsecutive = index > 0 && messages[index - 1].sender_id === msg.sender_id;
                                        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                onDoubleClick={() => setReplyingTo(msg)}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'} group cursor-pointer`}
                                            >
                                                {(() => {
                                                    const isSticker = STICKER_LIST.some(s => s.content === msg.content);

                                                    if (isSticker) {
                                                        return (
                                                            <div className={`relative group/bubble flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                                {/* Hover Action Menu Chevron for Sticker */}
                                                                <div className="absolute top-0 right-0 z-30 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                                                                        }}
                                                                        className="p-1 bg-white/80 rounded-full shadow-sm hover:scale-110 active:scale-95"
                                                                    >
                                                                        <HiChevronDown className="text-gray-400 text-lg" />
                                                                    </button>
                                                                    <AnimatePresence>
                                                                        {openMenuId === msg.id && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, scale: 0.95, y: index >= messages.length - 2 ? 10 : -10 }}
                                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                                    exit={{ opacity: 0, scale: 0.95, y: index >= messages.length - 2 ? 10 : -10 }}
                                                                                    className={`absolute ${index >= messages.length - 2 ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 overflow-hidden`}
                                                                                >
                                                                                    <button
                                                                                        onClick={() => { setForwardingMessage(msg); setShowForwardModal(true); setOpenMenuId(null); }}
                                                                                        className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                                    >
                                                                                        <RiForward5Line className="text-gray-400" /> Forward
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => { setReportingMessage(msg); setShowReportModal(true); setOpenMenuId(null); }}
                                                                                        className="w-full px-4 py-2 text-left text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-2 border-t border-gray-50"
                                                                                    >
                                                                                        <MdOutlineReportProblem className="text-orange-400" /> Report
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => { setDeletingMessage(msg); setShowDeleteModal(true); setOpenMenuId(null); }}
                                                                                        className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                                                                    >
                                                                                        <FaTrash className="text-red-400" /> Delete
                                                                                    </button>
                                                                                </motion.div>
                                                                            </>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>

                                                                <motion.span
                                                                    initial={{ scale: 0.5, rotate: -10 }}
                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                    className="text-7xl drop-shadow-xl select-none"
                                                                >
                                                                    {msg.content}
                                                                </motion.span>

                                                                <div className="flex items-center gap-1.5 mt-1 px-1">
                                                                    <span className="text-[10px] font-bold text-gray-400">
                                                                        {time}
                                                                    </span>
                                                                    {isMe && (
                                                                        <IoCheckmarkDone className={`text-[13px] ${msg.is_read ? 'text-green-400' : 'text-gray-300'}`} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                                            <div className={`relative w-full p-1 shadow-sm group/bubble
                                                            ${isMe
                                                                    ? 'bg-[var(--color-primary)] text-white rounded-xl rounded-tr-none ml-10'
                                                                    : 'bg-white text-gray-800 rounded-xl rounded-tl-none mr-10 border border-gray-100 shadow-[0_2px_5px_rgba(0,0,0,0.05)]'
                                                                }`}
                                                            >
                                                                {/* Forwarded Label */}
                                                                {msg.is_forwarded && (
                                                                    <div className="flex items-center gap-1 mb-1 opacity-60 italic text-xs capitalize tracking-wider">
                                                                        <RiForward5Line className="text-xs" />
                                                                        <span>Forwarded</span>
                                                                    </div>
                                                                )}

                                                                {/* Hover Action Menu Chevron */}
                                                                <div className="absolute top-1 right-2 z-30">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                                                                        }}
                                                                        className={`opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 bg-inherit rounded-full shadow-sm hover:scale-110 active:scale-95`}
                                                                    >
                                                                        <HiChevronDown className={`${isMe ? 'text-white' : 'text-gray-400'} text-lg`} />
                                                                    </button>

                                                                    <AnimatePresence>
                                                                        {openMenuId === msg.id && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, scale: 0.95, y: index >= messages.length - 2 ? 10 : -10 }}
                                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                                    exit={{ opacity: 0, scale: 0.95, y: index >= messages.length - 2 ? 10 : -10 }}
                                                                                    className={`absolute ${index >= messages.length - 2 ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 overflow-hidden`}
                                                                                >
                                                                                    <button
                                                                                        onClick={() => { setReplyingTo(msg); setOpenMenuId(null); }}
                                                                                        className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                                    >
                                                                                        <HiReply className="text-gray-400" /> Reply
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => { setForwardingMessage(msg); setShowForwardModal(true); setOpenMenuId(null); }}
                                                                                        className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50"
                                                                                    >
                                                                                        <RiForward5Line className="text-gray-400" /> Forward
                                                                                    </button>
                                                                                    {!isMe && (
                                                                                        <button
                                                                                            onClick={() => { setReportingMessage(msg); setShowReportModal(true); setOpenMenuId(null); }}
                                                                                            className="w-full px-4 py-2 text-left text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-2 border-t border-gray-50"
                                                                                        >
                                                                                            <MdOutlineReportProblem className="text-orange-400" /> Report
                                                                                        </button>
                                                                                    )}
                                                                                    {isMe && (
                                                                                        <button
                                                                                            onClick={() => { setEditingMessage(msg); setInputText(msg.content); setOpenMenuId(null); }}
                                                                                            className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50"
                                                                                        >
                                                                                            <FaPen className="text-gray-400" /> Edit
                                                                                        </button>
                                                                                    )}
                                                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                msg.attachments.forEach((file: any) => {
                                                                                                    const link = document.createElement('a');
                                                                                                    link.href = file.url;
                                                                                                    link.download = file.name;
                                                                                                    link.target = '_blank';
                                                                                                    document.body.appendChild(link);
                                                                                                    link.click();
                                                                                                    document.body.removeChild(link);
                                                                                                });
                                                                                                setOpenMenuId(null);
                                                                                            }}
                                                                                            className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50"
                                                                                        >
                                                                                            <FaDownload className="text-gray-400" /> Download
                                                                                        </button>
                                                                                    )}
                                                                                    <button
                                                                                        onClick={() => { setDeletingMessage(msg); setShowDeleteModal(true); setOpenMenuId(null); }}
                                                                                        className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                                                                    >
                                                                                        <FaTrash className="text-red-400" /> Delete
                                                                                    </button>
                                                                                </motion.div>
                                                                            </>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>

                                                                {/* Replied Message Preview inside Bubble */}
                                                                {msg.reply_to && (
                                                                    <div className={`mb-2 p-2 rounded-lg text-xs border-l-4 overflow-hidden
                                                                    ${isMe ? 'bg-white/10 border-white/40' : 'bg-gray-100 border-[var(--color-primary)]'}
                                                                `}>
                                                                        <p className="font-bold mb-0.5 truncate">
                                                                            {msg.reply_to.sender_id === user?.id ? 'You' : activeChat?.sender}
                                                                        </p>
                                                                        <p className="opacity-80 truncate">{msg.reply_to.content}</p>
                                                                    </div>
                                                                )}

                                                                {/* Attachments Preview */}
                                                                {msg.attachments && msg.attachments.length > 0 && (
                                                                    <div className="mb-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                                                                        {msg.attachments.map((file: any, i: number) => (
                                                                            <div key={i} className="relative bg-black/5 rounded-lg overflow-hidden border border-black/10 group/att block">
                                                                                {file.type.startsWith('image/') ? (
                                                                                    <a href={file.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                                                                        <img src={file.url} alt={file.name} className="w-full h-24 object-cover" />
                                                                                    </a>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-2 p-2">
                                                                                        <FaFileAlt className="text-xl opacity-70" />
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-xs font-bold truncate">{file.name}</p>
                                                                                            <p className="text-xs opacity-70">{(file.size / 1024).toFixed(1)} KB</p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <p className={`text-sm font-medium leading-tight whitespace-pre-wrap pr-20 pb-2.5 ${msg.is_deleted_for_everyone ? 'italic opacity-60 flex items-center gap-1.5' : ''}`}>
                                                                    {msg.is_deleted_for_everyone && <span className="text-xs">🚫</span>}
                                                                    {msg.content}
                                                                </p>

                                                                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                                                    <span className={`text-[10px] font-bold ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                                                                        {time}
                                                                    </span>
                                                                    {isMe && (
                                                                        <IoCheckmarkDone className={`text-[13px] ${msg.is_read ? 'text-green-400' : 'text-white/30'}`} />
                                                                    )}
                                                                </div>

                                                                {/* WhatsApp-Sleek Tail */}
                                                                {!isConsecutive && (
                                                                    <div
                                                                        className={`absolute top-0 w-3 h-3 ${isMe ? '-right-1.5 bg-[var(--color-primary)]' : '-left-1.5 bg-white'}`}
                                                                        style={{
                                                                            clipPath: isMe
                                                                                ? 'polygon(0 0, 100% 0, 0 100%)'
                                                                                : 'polygon(0 0, 100% 0, 100% 100%)'
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                            {msg.is_edited && (
                                                                <span className={`text-[9px] italic opacity-40 mt-1 ${isMe ? 'mr-1' : 'ml-1'} text-gray-500`}>
                                                                    edited
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </motion.div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white/60 backdrop-blur-md border-t border-gray-100 relative z-20">
                                    {/* Reply Preview Bar */}
                                    <AnimatePresence>
                                        {replyingTo && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="max-w-4xl mx-auto mb-2 bg-gray-100 rounded-lg p-3 flex border-l-4 border-[var(--color-primary)] shadow-sm relative overflow-hidden"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-[var(--color-primary)] oswald-font capitalize tracking-widest mb-0.5">
                                                        Replying to {replyingTo.sender_id === user?.id ? 'Yourself' : activeChat?.sender}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{replyingTo.content}</p>
                                                </div>
                                                <button
                                                    onClick={() => setReplyingTo(null)}
                                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors self-center"
                                                >
                                                    <HiX className="text-gray-400" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Edit Preview Bar */}
                                    <AnimatePresence>
                                        {editingMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="max-w-4xl mx-auto mb-2 bg-gray-100 rounded-lg p-3 flex border-l-4 border-yellow-400 shadow-sm relative overflow-hidden"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-yellow-600 oswald-font capitalize tracking-widest mb-0.5 flex items-center gap-1">
                                                        <FaPen className="text-xs" /> Edit message
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{editingMessage.content}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setEditingMessage(null); setInputText(''); }}
                                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors self-center"
                                                >
                                                    <HiX className="text-gray-400" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="max-w-4xl mx-auto w-full flex flex-col">
                                        {/* Selected Files Preview */}
                                        {selectedFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-white/80 rounded-lg border border-gray-100 shadow-sm backdrop-blur-sm">
                                                {selectedFiles.map((file, idx) => (
                                                    <div key={idx} className="relative flex items-center p-2 bg-white rounded shadow-sm border border-gray-200">
                                                        {file.type.startsWith('image/') ? (
                                                            <FaImage className="text-[var(--color-primary)] mr-2 text-xl" />
                                                        ) : (
                                                            <FaFileAlt className="text-pink-500 mr-2 text-xl" />
                                                        )}
                                                        <div className="flex flex-col pr-6 max-w-[120px]">
                                                            <span className="text-xs font-bold text-gray-700 truncate">{file.name}</span>
                                                            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                            className="absolute top-1 right-1 p-0.5 bg-gray-100 hover:bg-gray-200 rounded-full"
                                                        >
                                                            <HiX className="text-gray-500 text-xs" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <form onSubmit={handleSend} className="flex flex-col gap-2 w-full">
                                            <div className="flex items-end gap-2 w-full">
                                                <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center px-2 py-1 focus-within:ring-2 focus-within:ring-[var(--color-secondary)]/30 focus-within:border-transparent transition-all">

                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => {
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
                                                        }}
                                                    />
                                                    <div className="relative z-30">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                                                            className={`p-2 transition-colors rounded-full hover:bg-gray-100 ${showAttachMenu ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
                                                        >
                                                            <HiPaperClip className="text-xl" />
                                                        </button>
                                                        <AnimatePresence>
                                                            {showAttachMenu && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                        className="absolute bottom-full left-0 mb-4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 flex flex-col p-2 gap-1 min-w-[200px]"
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
                                                                            <div className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-500 flex items-center justify-center transition-colors shadow-sm">
                                                                                <FaImage className="text-lg" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-bold text-gray-800">Photos & Videos</span>
                                                                            </div>
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
                                                                            <div className="w-10 h-10 rounded-full bg-purple-50 group-hover:bg-purple-100 text-purple-500 flex items-center justify-center transition-colors shadow-sm">
                                                                                <FaFileAlt className="text-lg" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-bold text-gray-800">Document</span>
                                                                            </div>
                                                                        </button>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    <textarea
                                                        value={inputText}
                                                        onChange={(e) => setInputText(e.target.value)}
                                                        placeholder={`Message ${activeChat.sender}...`}
                                                        className="flex-1 max-h-32 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-sm font-medium text-gray-700 outline-none scrollbar-hide"
                                                        rows={1}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSend(e);
                                                            }
                                                        }}
                                                    />

                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                            className={`p-2 transition-colors rounded-full hover:bg-gray-100 ${showEmojiPicker ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
                                                        >
                                                            <FaRegSmile className="text-lg" />
                                                        </button>

                                                        <AnimatePresence>
                                                            {showEmojiPicker && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                        className="absolute bottom-full right-0 mb-4 w-72 h-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden"
                                                                    >
                                                                        {/* Tabs */}
                                                                        <div className="flex border-b border-gray-50 flex-shrink-0 bg-gray-50/50">
                                                                            <button
                                                                                onClick={() => setPickerTab('emojis')}
                                                                                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all ${pickerTab === 'emojis' ? 'text-[var(--color-primary)] bg-white shadow-[0_-2px_0_inset_var(--color-primary)]' : 'text-gray-400'}`}
                                                                            >
                                                                                <FaRegSmile className="text-sm" /> Emojis
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setPickerTab('stickers')}
                                                                                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all ${pickerTab === 'stickers' ? 'text-[var(--color-primary)] bg-white shadow-[0_-2px_0_inset_var(--color-primary)]' : 'text-gray-400'}`}
                                                                            >
                                                                                <FaStickyNote className="text-sm" /> Stickers
                                                                            </button>
                                                                        </div>

                                                                        {/* Content */}
                                                                        <div className="flex-1 overflow-y-auto p-3 sidebar-scroll">
                                                                            {pickerTab === 'emojis' ? (
                                                                                <div className="space-y-4">
                                                                                    {EMOJI_LIST.map(cat => (
                                                                                        <div key={cat.cat}>
                                                                                            <p className="text-xs capitalize tracking-widest font-bold text-gray-400 mb-2">{cat.cat}</p>
                                                                                            <div className="grid grid-cols-6 gap-1">
                                                                                                {cat.items.map(emoji => (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        key={emoji}
                                                                                                        onClick={() => {
                                                                                                            setInputText(prev => prev + emoji);
                                                                                                        }}
                                                                                                        className="text-xl p-1.5 hover:bg-gray-100 rounded-lg transition-all hover:scale-125"
                                                                                                    >
                                                                                                        {emoji}
                                                                                                    </button>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="grid grid-cols-2 gap-3 p-1">
                                                                                    {STICKER_LIST.map(sticker => (
                                                                                        <button
                                                                                            type="button"
                                                                                            key={sticker.id}
                                                                                            onClick={() => {
                                                                                                handleSendSticker(sticker.content);
                                                                                                setShowEmojiPicker(false);
                                                                                            }}
                                                                                            className="aspect-square bg-gray-50 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-indigo-50 hover:scale-105 transition-all group"
                                                                                        >
                                                                                            <span className="text-4xl group-hover:drop-shadow-lg">{sticker.content}</span>
                                                                                            <span className="text-xs font-bold text-gray-400 capitalize tracking-tighter">{sticker.label}</span>
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
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={!inputText.trim() && selectedFiles.length === 0}
                                                    className={`h-[46px] w-[46px] rounded-full flex items-center justify-center flex-shrink-0 transition-all ${inputText.trim() || selectedFiles.length > 0
                                                        ? 'bg-[var(--color-secondary)] text-white shadow-md hover:bg-[#0f4216] cursor-pointer'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <FaPaperPlane className="text-sm ml-1" />
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/10">
                                <div className="w-20 h-20 bg-white shadow-xl shadow-gray-200/50 rounded-[30px] flex items-center justify-center mb-6 text-[var(--color-primary)]">
                                    <FaPaperPlane className="w-8 h-8 opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 oswald-font mb-2">Your Conversations</h3>
                                <p className="text-gray-400 brcob-font text-sm max-w-md">Select a connection from the left to start messaging. Your academic network is just a message away.</p>
                            </div>
                        )}

                    </div>

                    {/* ── Context Sidebar ── */}
                    {activeChat && (
                        <div className="hidden xl:flex w-[260px] bg-white/40 border-l border-gray-100 flex-col py-6 items-center">
                            <div className="relative mb-4">
                                {activeChat.avatar ? (
                                    <img
                                        src={activeChat.avatar}
                                        alt=""
                                        className="w-24 h-24 rounded-[30px] shadow-lg object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`w-24 h-24 rounded-[30px] shadow-lg bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white text-3xl font-bold ${activeChat.avatar ? 'hidden' : ''}`}>
                                    {activeChat.sender.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <h2 className="text-lg font-bold text-[var(--color-primary)] text-center px-4 truncate w-full">{activeChat.sender}</h2>
                            <p className="text-sm font-semibold text-[var(--color-secondary)] mb-6 text-center px-4 line-clamp-1">{activeChat.role}</p>

                            <div className="w-full px-6 space-y-4">
                                <div className="bg-white/80 rounded-lg p-4 shadow-sm border border-gray-50 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                        <HiPaperClip className="text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Shared Files</p>
                                        <p className="text-xs text-gray-500 font-medium">Coming soon</p>
                                    </div>
                                </div>

                                <div className="bg-white/80 rounded-lg p-4 shadow-sm border border-gray-50 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                                        <IoSettingsOutline className="text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Settings</p>
                                        <p className="text-xs text-gray-500 font-medium">Chat Options</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Forward Message Modal */}
                <AnimatePresence>
                    {showForwardModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
                            >
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                    <h3 className="text-xs font-bold text-[var(--color-primary)] oswald-font capitalize tracking-widest">
                                        Forward message
                                    </h3>
                                    <button
                                        onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }}
                                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <HiX className="text-gray-400" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2 sidebar-scroll">
                                    {contacts.map(contact => (
                                        <div
                                            key={contact.id}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                                    {contact.sender.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{contact.sender}</p>
                                                    <p className="text-xs text-gray-400">{contact.role}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleForward(contact.id)}
                                                className="px-4 py-1.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors oswald-font capitalize tracking-wide"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="text-xs font-bold text-[var(--color-primary)] oswald-font capitalize tracking-widest">
                                    Delete message?
                                </h3>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <HiX className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-4 space-y-3">
                                {deletingMessage?.sender_id === user?.id && !deletingMessage?.is_deleted_for_everyone && (
                                    <button
                                        onClick={() => handleDelete('everyone')}
                                        className="w-full py-2.5 px-4 bg-red-600 text-white rounded-xl text-xs font-bold capitalize tracking-widest hover:bg-red-700 transition-all shadow-sm"
                                    >
                                        Delete for Everyone
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete('me')}
                                    className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold capitalize tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Delete for Me
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full py-2.5 px-4 text-gray-400 text-xs font-bold capitalize tracking-widest hover:text-gray-600 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowReportModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[var(--color-primary)]/5">
                                <div className="flex items-center gap-2 text-[var(--color-primary)]">
                                    <HiOutlineExclamationCircle className="text-xl" />
                                    <span className="font-bold text-sm uppercase tracking-wider oswald-font">Report Message</span>
                                </div>
                                <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-white rounded-full transition-colors">
                                    <HiX className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-5 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Reason for reporting</label>
                                    <select
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
                                    >
                                        <option value="">Select a reason</option>
                                        <option value="Spam">Spam</option>
                                        <option value="Harassment">Harassment</option>
                                        <option value="Inappropriate Content">Inappropriate Content</option>
                                        <option value="Hate Speech">Hate Speech</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Details (Optional)</label>
                                    <textarea
                                        value={reportDescription}
                                        onChange={(e) => setReportDescription(e.target.value)}
                                        placeholder="Provide more information about the issue..."
                                        rows={3}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        disabled={!reportReason || isReporting}
                                        className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-primary)]/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isReporting ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : 'Submit Report'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <Footer />
        </div>
    );
}