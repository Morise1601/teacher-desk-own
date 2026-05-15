'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPen, FaPaperPlane, FaUser, FaRegSmile, FaStickyNote, FaDownload, FaFileAlt, FaImage, FaTrash } from 'react-icons/fa';
import { HiOutlineSearch, HiDotsHorizontal, HiChevronUp, HiChevronDown, HiX, HiReply, HiPaperClip, HiOutlineExclamationCircle } from 'react-icons/hi';
import { IoCheckmarkDone } from 'react-icons/io5';
import { MdOutlineReportProblem } from 'react-icons/md';

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
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/crypto';
import { getChatContactsAction, getAdminGlobalContactsAction, getMessagesAction, sendMessageAction, uploadAttachmentAction, editMessageAction, deleteMessageAction } from '@/app/actions/messages';
import { getUserRoleAction } from '@/app/actions/auth';
import { createReportAction } from '@/app/actions/reports';
import { toast } from 'react-hot-toast';
import { RiForward5Line } from 'react-icons/ri';

export default function MessagePopup() {
    const [user, setUser] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [contacts, setContacts] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [editingMessage, setEditingMessage] = useState<any>(null);
    const [forwardingMessage, setForwardingMessage] = useState<any>(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
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
    const [typingStatus, setTypingStatus] = useState<{ [key: string]: boolean }>({});
    const typingTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const toggleExpanded = () => setIsExpanded(!isExpanded);

    const fetchContacts = async (userId: string) => {
        if (!userId) return;
        try {
            // First check user role
            const roleRes = decryptData(await getUserRoleAction(userId));
            const isAdmin = roleRes.success && (roleRes.role === 'super_admin' || roleRes.role === 'admin');

            let res;
            if (isAdmin) {
                // Admins see everyone
                res = decryptData(await getAdminGlobalContactsAction(userId));
            } else {
                // Regular users see friends/followed inst
                res = decryptData(await getChatContactsAction(userId));
            }

            if (res.success) {
                setContacts(res.data || []);
                const unreadCount = res.data?.reduce((sum: number, c: any) => sum + (c.unread || 0), 0) || 0;
                setTotalUnread(unreadCount);
            }
        } catch (err) {
            console.error("Error fetching contacts:", err);
        }
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setUser(authUser);
                fetchContacts(authUser.id);
            }
        };
        init();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    fetchContacts(session.user.id);
                } else {
                    setUser(null);
                }
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);


    const activeChatRef = useRef(activeChat);
    useEffect(() => {
        activeChatRef.current = activeChat;
        if (activeChat && user) {
            loadMessages(activeChat.id);
        }
    }, [activeChat, user]);

    // Realtime subscription
    useEffect(() => {
        if (!user) return;
        const channel = supabase.channel('popup_messages').on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages'
        }, (payload) => {
            const currentChat = activeChatRef.current;
            if (payload.eventType === 'INSERT') {
                const newMsg = payload.new;
                if (currentChat && (
                    (newMsg.sender_id === user.id && newMsg.receiver_id === currentChat.id) ||
                    (newMsg.sender_id === currentChat.id && newMsg.receiver_id === user.id)
                )) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;

                        // Enrich reply context
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
                    setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, content: updatedMsg.content, is_edited: updatedMsg.is_edited, is_deleted_for_everyone: updatedMsg.is_deleted_for_everyone } : m));
                }
                fetchContacts(user.id);
            }
        }).on('broadcast', { event: 'typing' }, (payload) => {
            const { userId, isTyping } = payload.payload;
            setTypingStatus(prev => ({ ...prev, [userId]: isTyping }));

            if (typingTimeoutRef.current[userId]) clearTimeout(typingTimeoutRef.current[userId]);
            if (isTyping) {
                typingTimeoutRef.current[userId] = setTimeout(() => {
                    setTypingStatus(prev => ({ ...prev, [userId]: false }));
                }, 3000);
            }
        }).subscribe();
        return () => {
            Object.values(typingTimeoutRef.current).forEach(clearTimeout);
            supabase.removeChannel(channel);
        };
    }, [user]);

    const loadMessages = async (contactId: string) => {
        const res = decryptData(await getMessagesAction(user.id, contactId));
        if (res.success) {
            setMessages(res.data);

            // Mark as read
            const { markMessagesAsReadAction } = await import('@/app/actions/messages');
            await markMessagesAsReadAction(user.id, contactId);
            fetchContacts(user.id);
        }
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = messageInput.trim();
        if ((!content && selectedFiles.length === 0) || !activeChat || !user) return;

        if (editingMessage) {
            const tempId = editingMessage.id;
            const originalContent = editingMessage.content;

            // Optimistic update
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content, is_edited: true } : m));
            setMessageInput('');
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
                    toast.error("Failed to edit");
                }
            } catch (err) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: originalContent, is_edited: editingMessage.is_edited } : m));
                toast.error("Error editing message");
            }
            return;
        }

        const tempId = Date.now().toString();
        const currentInput = content;
        const currentReply = replyingTo;
        const currentFiles = [...selectedFiles];

        const optimisticMsg = {
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

        setMessages(prev => [...prev, optimisticMsg]);
        setMessageInput('');
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
                toast.error("Failed to send");
            } else {
                setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error("Error sending");
        }
    };

    const sendTypingStatus = (isTyping: boolean) => {
        if (!user || !activeChat) return;
        const channel = supabase.channel('popup_messages');
        channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id, isTyping }
        });
    };

    useEffect(() => {
        if (messageInput.length > 0) {
            sendTypingStatus(true);
        } else {
            sendTypingStatus(false);
        }
    }, [messageInput]);

    const handleForward = async (recipientId: string) => {
        if (!forwardingMessage || !user) return;

        try {
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
            toast.success("Forwarded");
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

    const filteredContacts = contacts.filter(c => c.sender.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!user) return null;

    return (
        <div className="fixed bottom-0 right-0 md:right-8 z-[60] flex flex-col md:flex-row-reverse items-end gap-2 md:gap-3 pointer-events-none w-full md:w-auto px-4 md:px-0">

            {/* ── Main List Bubble ── */}
            <div className="pointer-events-auto">
                <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? 'calc(80vh)' : '48px' }}
                    className="w-full md:w-72 bg-white rounded-t-xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border border-gray-200 overflow-hidden flex flex-col md:max-h-[460px]"
                >
                    {/* Header */}
                    <div
                        onClick={toggleExpanded}
                        className="h-12 px-4 flex items-center justify-between cursor-pointer bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">
                                    {user?.email?.charAt(0).toUpperCase() || 'M'}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                            <span className="font-bold text-sm text-[var(--color-primary)]">Messaging</span>
                            {totalUnread > 0 && (
                                <span className="bg-red-500 text-white text-[10px] min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full font-bold">
                                    {totalUnread}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <button className="p-1 hover:text-gray-600 rounded-md">
                                <HiDotsHorizontal />
                            </button>
                            <button className="p-1 hover:text-gray-600 rounded-md">
                                <FaPen className="text-xs" />
                            </button>
                            <button className="p-1">
                                {isExpanded ? <HiChevronDown className="text-xl" /> : <HiChevronUp className="text-xl" />}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col overflow-hidden"
                            >
                                {/* Search */}
                                <div className="p-2 border-b border-gray-100">
                                    <div className="relative">
                                        <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search messages"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-md py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-[var(--color-secondary)] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Chat List */}
                                <div className="flex-1 overflow-y-auto sidebar-scroll">
                                    <AnimatePresence mode="popLayout">
                                        {filteredContacts.map((chat) => (
                                            <motion.div
                                                key={chat.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setActiveChat(chat)}
                                                className={`p-3 flex gap-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${activeChat?.id === chat.id ? 'bg-indigo-50/50' : ''}`}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    {chat.avatar ? (
                                                        <img
                                                            src={chat.avatar}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                            alt=""
                                                            onError={(e) => {
                                                                (e.target as any).style.display = 'none';
                                                                (e.target as any).nextElementSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm"
                                                        style={{ display: chat.avatar ? 'none' : 'flex' }}
                                                    >
                                                        {chat.sender.charAt(0).toUpperCase()}
                                                    </div>
                                                    {chat.isOnline && (
                                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <h4 className={`text-xs truncate mb-0.5 ${chat.unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>{chat.sender}</h4>
                                                    <p className={`text-[11px] truncate ${chat.unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                                                        {chat.lastMessage}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={`text-[10px] whitespace-nowrap ${chat.unread > 0 ? 'font-bold text-[var(--color-secondary)]' : 'text-gray-400'}`}>
                                                        {chat.time}
                                                    </span>
                                                    {chat.unread > 0 && (
                                                        <span className="bg-[var(--color-secondary)] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                                                            {chat.unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {filteredContacts.length === 0 && (
                                        <div className="p-8 text-center text-gray-400 text-xs font-bold oswald-font capitalize tracking-widest opacity-40">
                                            No connections found
                                        </div>
                                    )}
                                </div>

                                {/* Footer Link */}
                                <div className="p-2 text-center border-t border-gray-100">
                                    <Link href="/messages" className="text-xs font-bold text-[var(--color-primary)] hover:underline">
                                        View all in Message Center
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ── Individual Chat Windows ── */}
            <AnimatePresence>
                {activeChat && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="w-full md:w-80 h-[100vh] md:h-[400px] max-h-[80vh] md:max-h-[400px] bg-white rounded-t-xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border border-gray-200 flex flex-col pointer-events-auto overflow-hidden relative"
                    >
                        {/* Chat Header */}
                        <div className="h-12 px-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-sm z-10">
                            <div className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80">
                                <div className="relative">
                                    {activeChat.avatar ? (
                                        <img
                                            src={activeChat.avatar}
                                            className="w-7 h-7 rounded-full object-cover"
                                            alt=""
                                            onError={(e) => {
                                                (e.target as any).style.display = 'none';
                                                (e.target as any).nextElementSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm"
                                        style={{ display: activeChat.avatar ? 'none' : 'flex' }}
                                    >
                                        {activeChat.sender.charAt(0).toUpperCase()}
                                    </div>
                                    {activeChat.isOnline && (
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-800 leading-tight">
                                        {activeChat.sender}
                                    </span>
                                    <span className={`text-[10px] font-bold ${activeChat.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                        {typingStatus[activeChat.id] ? (
                                            <span className="text-[var(--color-secondary)] font-bold animate-pulse">Typing...</span>
                                        ) : (
                                            <>{activeChat.isOnline ? 'Online' : 'Offline'}</>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                    <HiDotsHorizontal className="text-sm" />
                                </button>
                                <button
                                    onClick={() => setActiveChat(null)}
                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                >
                                    <HiX className="text-sm" />
                                </button>
                            </div>
                        </div>

                        {/* Fixed Branded Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
                            <div className="flex flex-col items-center rotate-[-10deg] opacity-[0.1]">
                                <h1 className="text-[40px] font-black oswald-font leading-none tracking-tighter">
                                    <span className="text-[var(--color-primary)]">Teacher</span>
                                    <br />
                                    <span className="text-[var(--color-secondary)] pl-4">Desk</span>
                                </h1>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 bg-transparent p-3 overflow-y-auto sidebar-scroll flex flex-col gap-2 relative z-10">
                            {messages.length === 0 && (
                                <p className="text-xs text-center text-gray-400 mt-4 font-bold capitalize tracking-widest oswald-font">No messages yet</p>
                            )}
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_id === user?.id;
                                const isConsecutive = idx > 0 && messages[idx - 1].sender_id === msg.sender_id;
                                const isSticker = STICKER_LIST.some(s => s.content === msg.content);

                                if (isSticker) {
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-0.5' : 'mt-2.5'} px-2 relative group/sticker`}>
                                            {/* Hover Action Menu Chevron for Sticker */}
                                            <div className="absolute top-0 right-1 z-20 opacity-0 group-hover/sticker:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                                                    }}
                                                    className="p-0.5 bg-white/80 rounded-full shadow-sm"
                                                >
                                                    <HiChevronDown className="text-gray-400 text-sm" />
                                                </button>
                                                <AnimatePresence>
                                                    {openMenuId === msg.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: idx >= messages.length - 2 ? 5 : -5 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: idx >= messages.length - 2 ? 5 : -5 }}
                                                                className={`absolute ${idx >= messages.length - 2 ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 w-32 bg-white rounded shadow-lg border border-gray-100 z-40 py-1 overflow-hidden`}
                                                            >
                                                                <button
                                                                    onClick={() => { setForwardingMessage(msg); setShowForwardModal(true); setOpenMenuId(null); }}
                                                                    className="w-full px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                                                                >
                                                                    <RiForward5Line className="text-gray-400" /> Forward
                                                                </button>
                                                                <button
                                                                    onClick={() => { setReportingMessage(msg); setShowReportModal(true); setOpenMenuId(null); }}
                                                                    className="w-full px-2 py-1.5 text-left text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-1.5 border-t border-gray-50"
                                                                >
                                                                    <MdOutlineReportProblem className="text-orange-400" /> Report
                                                                </button>
                                                                <button
                                                                    onClick={() => { setDeletingMessage(msg); setShowDeleteModal(true); setOpenMenuId(null); }}
                                                                    className="w-full px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 border-t border-gray-50"
                                                                >
                                                                    <FaTrash className="text-red-400" /> Delete
                                                                </button>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <motion.span
                                                initial={{ scale: 0.5 }}
                                                animate={{ scale: 1 }}
                                                className="text-5xl drop-shadow-lg select-none py-1"
                                            >
                                                {msg.content}
                                            </motion.span>
                                            <div className="flex items-center gap-1 mt-0.5 px-0.5">
                                                <span className="text-[10px] font-bold text-gray-400 capitalize">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && (
                                                    <IoCheckmarkDone className={`text-xs ${msg.is_read ? 'text-green-400' : 'text-gray-300'}`} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-0.5' : 'mt-2.5'}`}>
                                        <div
                                            onDoubleClick={() => !msg.is_deleted_for_everyone && setReplyingTo(msg)}
                                            className={`relative ${isMe ? 'self-end bg-[var(--color-primary)] text-white rounded-lg rounded-tr-none' : 'self-start bg-white border border-gray-100 text-gray-800 rounded-lg rounded-tl-none'} max-w-[85%] p-1 text-xs shadow-sm flex flex-col items-start cursor-pointer group/msg ${msg.is_deleted_for_everyone ? 'bg-gray-100 border-gray-200 text-gray-500 italic' : ''}`}
                                        >
                                            {/* Forwarded Label */}
                                            {msg.is_forwarded && (
                                                <div className="flex items-center gap-1 mb-1 opacity-60 italic text-xs capitalize">
                                                    <RiForward5Line className="text-xs" />
                                                    <span>Forwarded</span>
                                                </div>
                                            )}

                                            {/* Hover Action Menu Chevron */}
                                            <div className="absolute top-1 right-1 z-20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                                                    }}
                                                    className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-0.5 bg-inherit rounded-full"
                                                >
                                                    <HiChevronDown className={`${isMe ? 'text-white' : 'text-gray-400'} text-sm`} />
                                                </button>

                                                <AnimatePresence>
                                                    {openMenuId === msg.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: idx >= messages.length - 2 ? 5 : -5 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: idx >= messages.length - 2 ? 5 : -5 }}
                                                                className={`absolute ${idx >= messages.length - 2 ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 w-32 bg-white rounded shadow-lg border border-gray-100 z-40 py-1 overflow-hidden`}
                                                            >
                                                                {!msg.is_deleted_for_everyone && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => { setReplyingTo(msg); setOpenMenuId(null); }}
                                                                            className="w-full px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                                                                        >
                                                                            <HiReply className="text-gray-400" /> Reply
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setForwardingMessage(msg); setShowForwardModal(true); setOpenMenuId(null); }}
                                                                            className="w-full px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 border-t border-gray-50"
                                                                        >
                                                                            <RiForward5Line className="text-gray-400" /> Forward
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setReportingMessage(msg); setShowReportModal(true); setOpenMenuId(null); }}
                                                                            className="w-full px-2 py-1.5 text-left text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-1.5 border-t border-gray-50"
                                                                        >
                                                                            <MdOutlineReportProblem className="text-orange-400" /> Report
                                                                        </button>
                                                                        {isMe && (
                                                                            <button
                                                                                onClick={() => { setEditingMessage(msg); setMessageInput(msg.content); setOpenMenuId(null); }}
                                                                                className="w-full px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 border-t border-gray-50"
                                                                            >
                                                                                <FaPen className="text-gray-400" /> Edit
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => { setDeletingMessage(msg); setShowDeleteModal(true); setOpenMenuId(null); }}
                                                                    className="w-full px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 border-t border-gray-50"
                                                                >
                                                                    <FaTrash className="text-red-400" /> Delete
                                                                </button>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Reply block inside bubble */}
                                            {msg.reply_to && (
                                                <div className={`mb-1.5 p-1.5 rounded text-xs border-l-2 max-w-full overflow-hidden truncate
                                                    ${isMe ? 'bg-white/10 border-white/40' : 'bg-gray-50 border-[var(--color-primary)]'}
                                                `}>
                                                    <p className="font-bold mb-0.5 truncate text-xs">
                                                        {msg.reply_to.sender_id === user?.id ? 'You' : activeChat.sender}
                                                    </p>
                                                    <p className="opacity-70 truncate">{msg.reply_to.content}</p>
                                                </div>
                                            )}

                                            {/* Attachments Preview */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mb-1 grid gap-1 mt-1 grid-cols-1">
                                                    {msg.attachments.map((file: any, i: number) => (
                                                        <div key={i} className="relative bg-black/5 rounded flex-col overflow-hidden border border-black/10 group/att flex w-[140px]">
                                                            {file.type.startsWith('image/') ? (
                                                                <a href={file.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-full">
                                                                    <img src={file.url} alt={file.name} className="w-full h-20 object-cover" />
                                                                </a>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 p-1.5 w-full">
                                                                    <FaFileAlt className="text-sm opacity-70" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-bold truncate">{file.name}</p>
                                                                        <p className="text-[10px] opacity-70">{(file.size / 1024).toFixed(1)} KB</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <p className={`font-medium leading-tight whitespace-pre-wrap pr-16 pb-2 ${msg.is_deleted_for_everyone ? 'italic opacity-60 flex items-center gap-1.5' : ''}`}>
                                                {msg.is_deleted_for_everyone && <span className="text-[9px]">🚫</span>}
                                                {msg.content}
                                            </p>

                                            <div className={`text-[10px] absolute bottom-1 right-2 font-bold capitalize flex items-center gap-1 ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>

                                            {/* Tail */}
                                            {!isConsecutive && (
                                                <div
                                                    className={`absolute top-0 w-2.5 h-2.5 ${isMe ? '-right-1.2 bg-[var(--color-primary)]' : '-left-1.2 bg-white'}`}
                                                    style={{
                                                        clipPath: isMe
                                                            ? 'polygon(0 0, 100% 0, 0 100%)'
                                                            : 'polygon(0 0, 100% 0, 100% 100%)'
                                                    }}
                                                />
                                            )}
                                            </div>
                                            {msg.is_edited && (
                                                <span className={`text-[9px] italic opacity-40 mt-0.5 ${isMe ? 'mr-1' : 'ml-1'} text-gray-500`}>
                                                    edited
                                                </span>
                                            )}
                                        </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-2.5 border-t border-gray-100 bg-white relative">
                            {/* Reply Preview */}
                            <AnimatePresence>
                                {replyingTo && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="mb-2 bg-gray-50 border-l-2 border-[var(--color-primary)] p-2 flex justify-between items-center rounded-r shadow-sm"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[var(--color-primary)] oswald-font capitalize tracking-wider mb-0.5">
                                                Replying to {replyingTo.sender_id === user?.id ? 'You' : activeChat.sender}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{replyingTo.content}</p>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                            <HiX className="text-[10px] text-gray-400" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Edit Preview */}
                            <AnimatePresence>
                                {editingMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="mb-2 bg-gray-50 border-l-2 border-yellow-400 p-2 flex justify-between items-center rounded-r shadow-sm"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-yellow-600 oswald-font capitalize tracking-wider mb-0.5 flex items-center gap-1">
                                                <FaPen className="text-xs" /> Edit message
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{editingMessage.content}</p>
                                        </div>
                                        <button onClick={() => { setEditingMessage(null); setMessageInput(''); }} className="p-1 hover:bg-gray-100 rounded-full">
                                            <HiX className="text-[10px] text-gray-400" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex flex-col gap-1 w-full relative">
                                {/* Preview Selected Files */}
                                {selectedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1 p-1.5 bg-gray-50 rounded-lg border border-gray-100 max-h-24 overflow-y-auto mb-1">
                                        {selectedFiles.map((file, idx) => (
                                            <div key={idx} className="relative flex items-center p-1.5 bg-white rounded shadow-sm border border-gray-200">
                                                {file.type.startsWith('image/') ? (
                                                    <FaImage className="text-blue-500 mr-1.5 text-sm" />
                                                ) : (
                                                    <FaFileAlt className="text-red-500 mr-1.5 text-sm" />
                                                )}
                                                <div className="flex flex-col pr-4 max-w-[80px]">
                                                    <span className="text-xs font-bold text-gray-700 truncate">{file.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-0.5 right-0.5 p-0.5 bg-gray-100 hover:bg-gray-200 rounded-full"
                                                >
                                                    <HiX className="text-gray-500 text-[8px]" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={handleSend} className="flex items-end gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100 focus-within:ring-1 focus-within:ring-[var(--color-secondary)]/30 transition-all w-full">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className={`p-1 transition-colors rounded-full ${showEmojiPicker ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            <FaRegSmile className="text-sm" />
                                        </button>

                                        <AnimatePresence>
                                            {showEmojiPicker && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        className="absolute bottom-full left-0 mb-2 w-56 h-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col overflow-hidden"
                                                    >
                                                        {/* Tabs */}
                                                        <div className="flex border-b border-gray-50 flex-shrink-0 bg-gray-50/50">
                                                            <button
                                                                onClick={() => setPickerTab('emojis')}
                                                                className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition-all ${pickerTab === 'emojis' ? 'text-[var(--color-primary)] bg-white shadow-[0_-2px_0_inset_var(--color-primary)]' : 'text-gray-400'}`}
                                                            >
                                                                <FaRegSmile className="text-xs" /> Emojis
                                                            </button>
                                                            <button
                                                                onClick={() => setPickerTab('stickers')}
                                                                className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition-all ${pickerTab === 'stickers' ? 'text-[var(--color-primary)] bg-white shadow-[0_-2px_0_inset_var(--color-primary)]' : 'text-gray-400'}`}
                                                            >
                                                                <FaStickyNote className="text-xs" /> Stickers
                                                            </button>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 overflow-y-auto p-2 sidebar-scroll">
                                                            {pickerTab === 'emojis' ? (
                                                                <div className="space-y-3">
                                                                    {EMOJI_LIST.map(cat => (
                                                                        <div key={cat.cat}>
                                                                            <p className="text-xs capitalize tracking-widest font-bold text-gray-400 mb-1">{cat.cat}</p>
                                                                            <div className="grid grid-cols-5 gap-1">
                                                                                {cat.items.map(emoji => (
                                                                                    <button
                                                                                        type="button"
                                                                                        key={emoji}
                                                                                        onClick={() => {
                                                                                            setMessageInput(prev => prev + emoji);
                                                                                        }}
                                                                                        className="text-lg p-1 hover:bg-gray-100 rounded-lg transition-all"
                                                                                    >
                                                                                        {emoji}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-2 gap-2 p-1">
                                                                    {STICKER_LIST.map(sticker => (
                                                                        <button
                                                                            type="button"
                                                                            key={sticker.id}
                                                                            onClick={() => {
                                                                                handleSendSticker(sticker.content);
                                                                                setShowEmojiPicker(false);
                                                                            }}
                                                                            className="aspect-square bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-0.5 hover:bg-indigo-50 hover:scale-105 transition-all group"
                                                                        >
                                                                            <span className="text-3xl group-hover:drop-shadow-lg">{sticker.content}</span>
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
                                    <div className="relative">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                const validFiles = files.filter(f => {
                                                    if (f.size > MAX_FILE_SIZE) {
                                                        toast.error(`${f.name} too large (Max 2MB)`);
                                                        return false;
                                                    }
                                                    return true;
                                                });
                                                setSelectedFiles(prev => [...prev, ...validFiles]);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                                            className={`p-1 transition-colors rounded-full mb-0.5 ${showAttachMenu ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            <HiPaperClip className="text-[13px]" />
                                        </button>

                                        <AnimatePresence>
                                            {showAttachMenu && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col p-1.5 gap-1 min-w-[160px]"
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
                                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-all text-left group"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-500 flex items-center justify-center transition-colors shadow-sm">
                                                                <FaImage className="text-sm" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-gray-800">Photos & Videos</span>
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
                                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-all text-left group"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-purple-50 group-hover:bg-purple-100 text-purple-500 flex items-center justify-center transition-colors shadow-sm">
                                                                <FaFileAlt className="text-sm" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-gray-800">Document</span>
                                                            </div>
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <textarea
                                        placeholder="Write a message..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-medium resize-none max-h-24 py-1"
                                        rows={1}
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim() && selectedFiles.length === 0}
                                        className={`p-1.5 rounded-full transition-colors ${messageInput.trim() || selectedFiles.length > 0 ? 'text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10' : 'text-gray-300'}`}
                                    >
                                        <FaPaperPlane className="text-xs" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Forward Modal */}
            <AnimatePresence>
                {/* ... existing forward modal ... */}
                {showForwardModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col max-h-[60vh]"
                        >
                            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="text-xs font-bold text-[var(--color-primary)] oswald-font capitalize tracking-widest">
                                    Forward
                                </h3>
                                <button
                                    onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }}
                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <HiX className="text-xs text-gray-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-1 sidebar-scroll">
                                {contacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                                {contact.sender.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate w-32">{contact.sender}</p>
                                                <p className="text-xs text-gray-400 truncate">{contact.role}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleForward(contact.id)}
                                            className="px-3 py-1 bg-[var(--color-primary)] text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors oswald-font capitalize tracking-wide"
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

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-[240px] overflow-hidden flex flex-col"
                        >
                            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="text-xs font-bold text-[var(--color-primary)] oswald-font capitalize tracking-widest">
                                    Delete message?
                                </h3>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <HiX className="text-xs text-gray-400" />
                                </button>
                            </div>

                            <div className="p-3 space-y-2">
                                {deletingMessage?.sender_id === user?.id && !deletingMessage?.is_deleted_for_everyone && (
                                    <button
                                        onClick={() => handleDelete('everyone')}
                                        className="w-full py-2 px-4 bg-red-600 text-white rounded-lg text-[10px] font-bold capitalize tracking-widest hover:bg-red-700 transition-all shadow-sm"
                                    >
                                        Delete for Everyone
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete('me')}
                                    className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold capitalize tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Delete for Me
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full py-2 px-4 text-gray-400 text-[9px] font-bold capitalize tracking-widest hover:text-gray-600 transition-all"
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
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
        </div>
    );
}
