// src/app/features/dashboard/UserFeedPost.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
// Removed duplicate FaUserTag import block
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { 
    likePostAction, 
    commentPostAction, 
    deleteCommentAction, 
    getPostCommentsAction, 
    savePostAction, 
    votePollAction,
    createPostAction,
    deletePostAction,
    getPostTagsAction,
    updatePostTagsAction,
    updatePostContentAction,
    updatePostAction,
    searchUsersAction,
    editCommentAction
} from '@/app/actions/posts';
import { decryptData, encryptData } from '@/lib/crypto';
import { getProfileByUserIdAction } from '@/app/actions/profile';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Modal from '@/app/shared/Modal';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaBookmark, FaRegBookmark, FaRetweet, FaTrash, FaDownload, FaFilePdf, FaClock, FaUserTag, FaEllipsisV, FaTimes, FaWhatsapp, FaTwitter, FaEnvelope, FaInstagram, FaCopy, FaCheck, FaEdit, FaPlusCircle } from 'react-icons/fa';

interface UserFeedPostProps {
    id: string;
    user_id: string;
    post_type: 'text' | 'image' | 'resource' | 'poll' | 'repost';
    content: string;
    visibility: 'public' | 'network' | 'institution' | 'classroom';
    classroom_id?: string | null;
    repost_post_id?: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author_profile: {
        user_id: string;
        headline: string;
        profile_pic_url: string;
        role: string;
        fullName: string;
    };
    media: Array<{
        id: string;
        file_url: string;
        file_type: string;
        file_name: string;
    }>;
    poll?: {
        id: string;
        question: string;
        allow_multiple: boolean;
        expires_at: string;
        options: Array<{
            id: string;
            option_text: string;
            votes_count: number;
            user_voted: boolean;
        }>;
    } | null;
    original_post?: {
        id: string;
        content: string;
        post_type: 'text' | 'image' | 'resource' | 'poll';
        created_at: string;
        author_profile: {
            user_id: string;
            headline: string;
            profile_pic_url: string;
            role: string;
            fullName: string;
        };
        media: Array<{
            id: string;
            file_url: string;
            file_type: string;
            file_name: string;
        }>;
    } | null;
    is_liked: boolean;
    is_saved: boolean;
    currentUserId: string; // Passed from parent (logged-in user)
}

export default function UserFeedPost({
    id,
    user_id,
    post_type,
    content,
    visibility,
    likes_count,
    comments_count,
    created_at,
    author_profile,
    media,
    poll,
    original_post,
    is_liked,
    is_saved,
    currentUserId
}: UserFeedPostProps) {
    const [likes, setLikes] = useState(likes_count);
    const [liked, setLiked] = useState(is_liked);
    const [saved, setSaved] = useState(is_saved);

    // Comments Tray state
    const [showComments, setShowComments] = useState(false);
    const [commentsList, setCommentsList] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSavingComment, setIsSavingComment] = useState(false);
    const [totalComments, setTotalComments] = useState(comments_count);

    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSavingReply, setIsSavingReply] = useState(false);

    const commentInputRef = useRef<HTMLInputElement>(null);

    const handleCommentEmojiSelect = (emoji: string) => {
        if (commentInputRef.current) {
            const input = commentInputRef.current;
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const text = input.value;
            const nextComment = text.substring(0, start) + emoji + text.substring(end);
            setNewComment(nextComment);
            
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + emoji.length, start + emoji.length);
            }, 0);
        } else {
            setNewComment(prev => prev + emoji);
        }
    };

    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
    const [isDeletingComment, setIsDeletingComment] = useState(false);
    const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);

    const editInputRef = useRef<HTMLInputElement>(null);

    const handleEditEmojiSelect = (emoji: string) => {
        if (editInputRef.current) {
            const input = editInputRef.current;
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const text = input.value;
            const nextEdit = text.substring(0, start) + emoji + text.substring(end);
            setEditingText(nextEdit);
            
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + emoji.length, start + emoji.length);
            }, 0);
        } else {
            setEditingText(prev => prev + emoji);
        }
    };

    const editPostTextareaRef = useRef<HTMLTextAreaElement>(null);

    const handleEditPostEmojiSelect = (emoji: string) => {
        if (editPostTextareaRef.current) {
            const textarea = editPostTextareaRef.current;
            const start = textarea.selectionStart || 0;
            const end = textarea.selectionEnd || 0;
            const text = textarea.value;
            const nextContent = text.substring(0, start) + emoji + text.substring(end);
            setEditedContent(nextContent);
            
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + emoji.length, start + emoji.length);
            }, 0);
        } else {
            setEditedContent(prev => prev + emoji);
        }
    };

    // Logged-in user profile cache for comments author preview
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (showComments && !profile && currentUserId) {
            const fetchProfile = async () => {
                const res = decryptData(await getProfileByUserIdAction(currentUserId));
                if (res?.success) {
                    setProfile(res.profile || res.data);
                }
            };
            fetchProfile();
        }
    }, [showComments, profile, currentUserId]);

    const name = profile?.fullName || profile?.name || "Member";

    // Poll State
    const [pollState, setPollState] = useState<any>(poll || null);

    // Repost Modal State
    const [showRepostModal, setShowRepostModal] = useState(false);
    const [repostCommentary, setRepostCommentary] = useState('');
    const [isReposting, setIsReposting] = useState(false);

    // View More state for content
    const [isExpanded, setIsExpanded] = useState(false);

    // Share modal states
    const [showShareModal, setShowShareModal] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // Post Tags state
    const [tagsList, setTagsList] = useState<any[]>([]);
    const [showTags, setShowTags] = useState(false);

    // Tag Editing states
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [editTagsList, setEditTagsList] = useState<any[]>([]);
    const [editActiveImageIdx, setEditActiveImageIdx] = useState<number>(0);
    const [editPendingCoord, setEditPendingCoord] = useState<{ x: number, y: number } | null>(null);
    const [editSearchQuery, setEditSearchQuery] = useState('');
    const [editSearchResults, setEditSearchResults] = useState<any[]>([]);
    const [editSearching, setEditSearching] = useState(false);
    const [isSavingTags, setIsSavingTags] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editedContent, setEditedContent] = useState(content || '');
    const [isSavingPost, setIsSavingPost] = useState(false);

    // Post Media Editing states
    const [editExistingMedia, setEditExistingMedia] = useState<any[]>([]);
    const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);
    const [editNewFiles, setEditNewFiles] = useState<Array<{ base64: string, name: string, type?: string }>>([]);
    const [editNewImagePreviews, setEditNewImagePreviews] = useState<string[]>([]);
    const editImageInputRef = useRef<HTMLInputElement>(null);
    const editPdfInputRef = useRef<HTMLInputElement>(null);

    const hasImages = editExistingMedia.some(m => m.file_type?.startsWith('image/')) || 
                      editNewFiles.some(f => f.type?.startsWith('image/'));

    const hasPdf = editExistingMedia.some(m => m.file_type === 'application/pdf') || 
                    editNewFiles.some(f => f.type === 'application/pdf');

    const replyInputRef = useRef<HTMLInputElement>(null);
    const postRef = useRef<HTMLDivElement>(null);

    const [commentMentionResults, setCommentMentionResults] = useState<any[]>([]);
    const [selectedMentions, setSelectedMentions] = useState<Array<{ fullName: string, user_id: string }>>([]);

    const handleCommentChange = async (val: string) => {
        setNewComment(val);
        const caretPos = commentInputRef.current?.selectionStart || 0;
        const textBeforeCaret = val.substring(0, caretPos);
        const lastAtIdx = textBeforeCaret.lastIndexOf('@');
        
        if (lastAtIdx !== -1 && !textBeforeCaret.substring(lastAtIdx).includes(' ')) {
            const query = textBeforeCaret.substring(lastAtIdx + 1);
            try {
                const payload = encryptData({ query });
                const res = decryptData(await searchUsersAction(payload));
                if (res.success && res.data) {
                    setCommentMentionResults(res.data);
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            setCommentMentionResults([]);
        }
    };

    const handleReplyChange = async (val: string) => {
        setReplyText(val);
        const caretPos = replyInputRef.current?.selectionStart || 0;
        const textBeforeCaret = val.substring(0, caretPos);
        const lastAtIdx = textBeforeCaret.lastIndexOf('@');
        
        if (lastAtIdx !== -1 && !textBeforeCaret.substring(lastAtIdx).includes(' ')) {
            const query = textBeforeCaret.substring(lastAtIdx + 1);
            try {
                const payload = encryptData({ query });
                const res = decryptData(await searchUsersAction(payload));
                if (res.success && res.data) {
                    setCommentMentionResults(res.data);
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            setCommentMentionResults([]);
        }
    };

    const handleSelectMentionUser = (user: any, isReply = false) => {
        const input = isReply ? replyInputRef.current : commentInputRef.current;
        if (!input) return;
        
        const val = isReply ? replyText : newComment;
        const caretPos = input.selectionStart || 0;
        const textBeforeCaret = val.substring(0, caretPos);
        const textAfterCaret = val.substring(caretPos);
        const lastAtIdx = textBeforeCaret.lastIndexOf('@');
        
        if (lastAtIdx !== -1) {
            const beforeMention = textBeforeCaret.substring(0, lastAtIdx);
            const formattedTag = `@${user.fullName} `;
            const newVal = beforeMention + formattedTag + textAfterCaret;
            
            if (isReply) {
                setReplyText(newVal);
            } else {
                setNewComment(newVal);
            }
            
            setSelectedMentions(prev => {
                if (prev.some(m => m.user_id === user.user_id)) return prev;
                return [...prev, { fullName: user.fullName, user_id: user.user_id }];
            });
            
            setCommentMentionResults([]);
            
            setTimeout(() => {
                input.focus();
                const newCaretPos = lastAtIdx + formattedTag.length;
                input.setSelectionRange(newCaretPos, newCaretPos);
            }, 50);
        }
    };

    const renderCommentText = (text: string) => {
        if (!text) return "";
        
        const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const parts: any[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const matchIndex = match.index;
            
            if (matchIndex > lastIndex) {
                parts.push(text.substring(lastIndex, matchIndex));
            }
            
            const fullName = match[1];
            const userId = match[2];
            
            parts.push(
                <span 
                    key={matchIndex} 
                    className="font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-100/30 px-2 py-0.5 rounded-full text-[11px] transition-all"
                >
                    @{fullName}
                </span>
            );
            
            lastIndex = regex.lastIndex;
        }
        
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        
        return parts.length > 0 ? parts : text;
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const targetPostId = params.get('post');
            if (targetPostId && targetPostId === id) {
                setTimeout(() => {
                    postRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setShowComments(true);
                    fetchComments();
                }, 300);
            }
        }
    }, [id]);

    useEffect(() => {
        const fetchTags = async () => {
            if (id) {
                try {
                    const res = decryptData(await getPostTagsAction(id));
                    if (res.success && res.data) {
                        setTagsList(res.data);
                    }
                } catch (err) {
                    console.error("Error fetching post tags:", err);
                }
            }
        };
        fetchTags();
    }, [id]);

    const getTagsForMedia = (mediaId: string) => {
        return tagsList.filter((tag: any) => tag.post_media_id === mediaId);
    };

    const hasTagsForMedia = (mediaId: string) => {
        return tagsList.some((tag: any) => tag.post_media_id === mediaId);
    };

    const openEditTagsModal = () => {
        // Map current tags list to edit list format
        const initialEditTags = tagsList.map((tag: any) => ({
            id: tag.id,
            post_id: tag.post_id,
            post_media_id: tag.post_media_id,
            tagged_user_id: tag.tagged_user_id,
            fullName: tag.tagged_user_profile?.fullName || "Member",
            x: tag.x,
            y: tag.y,
            profile_pic_url: tag.tagged_user_profile?.profile_pic_url,
            headline: tag.tagged_user_profile?.headline
        }));
        setEditTagsList(initialEditTags);
        setEditActiveImageIdx(0);
        setEditPendingCoord(null);
        setEditSearchQuery('');
        setEditSearchResults([]);
        setIsEditingTags(true);
    };

    const handleEditSearchUser = async (val: string) => {
        setEditSearchQuery(val);
        if (val.trim().length === 0) {
            setEditSearchResults([]);
            return;
        }
        setEditSearching(true);
        try {
            const payload = encryptData({ query: val });
            const res = decryptData(await searchUsersAction(payload));
            if (res.success && res.data) {
                setEditSearchResults(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setEditSearching(false);
        }
    };

    const addEditTag = (user: any) => {
        // If it's an image post, check coordinate and media association
        let postMediaId = null;
        if (post_type === 'image' && media && media[editActiveImageIdx]) {
            postMediaId = media[editActiveImageIdx].id;
        }

        if (post_type === 'image' && !editPendingCoord) return;

        // Check if user is already tagged
        const isAlreadyTagged = editTagsList.some(
            t => t.tagged_user_id === user.user_id && t.post_media_id === postMediaId
        );
        if (isAlreadyTagged) {
            toast.warning("This user is already tagged.");
            return;
        }

        const newTag = {
            post_id: id,
            post_media_id: postMediaId,
            tagged_user_id: user.user_id,
            fullName: user.fullName,
            x: post_type === 'image' ? editPendingCoord!.x : null,
            y: post_type === 'image' ? editPendingCoord!.y : null,
            profile_pic_url: user.profile_pic_url,
            headline: user.headline
        };

        setEditTagsList(prev => [...prev, newTag]);
        setEditPendingCoord(null);
        setEditSearchQuery('');
        setEditSearchResults([]);
    };

    const removeEditTag = (tIdx: number) => {
        setEditTagsList(prev => prev.filter((_, i) => i !== tIdx));
    };

    const handleEditImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('.pointer-events-auto')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;
        
        setEditPendingCoord({ x: clickX, y: clickY });
        setEditSearchQuery('');
        setEditSearchResults([]);
    };

    const handleSaveTags = async () => {
        setIsSavingTags(true);
        try {
            const payload = encryptData({
                userId: currentUserId,
                postId: id,
                tags: editTagsList.map(t => ({
                    post_media_id: t.post_media_id,
                    tagged_user_id: t.tagged_user_id,
                    x: t.x,
                    y: t.y
                }))
            });

            const res = decryptData(await updatePostTagsAction(payload));
            if (res.success) {
                toast.success("Tags updated successfully!");
                
                // Map the editTagsList back to the local tags format for rendering
                const updatedTags = editTagsList.map(t => ({
                    id: t.id || Math.random().toString(),
                    post_id: id,
                    post_media_id: t.post_media_id,
                    tagged_user_id: t.tagged_user_id,
                    x: t.x,
                    y: t.y,
                    tagged_user_profile: {
                        user_id: t.tagged_user_id,
                        fullName: t.fullName,
                        profile_pic_url: t.profile_pic_url,
                        headline: t.headline
                    }
                }));

                setTagsList(updatedTags);
                setIsEditingTags(false);
            } else {
                toast.error(res.message || "Failed to update tags.");
            }
        } catch (err) {
            toast.error("An error occurred while saving tags.");
        } finally {
            setIsSavingTags(false);
        }
    };

    // Keep state updated if props change
    useEffect(() => {
        setLikes(likes_count);
        setLiked(is_liked);
        setSaved(is_saved);
        setTotalComments(comments_count);
        setPollState(poll);
    }, [likes_count, is_liked, is_saved, comments_count, poll]);

    const handleLike = async () => {
        // Optimistic Update
        const nextLiked = !liked;
        setLiked(nextLiked);
        setLikes(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

        try {
            const res = decryptData(await likePostAction(encryptData({ userId: currentUserId, postId: id })));
            if (!res.success) {
                // Rollback on failure
                setLiked(!nextLiked);
                setLikes(prev => !nextLiked ? prev + 1 : Math.max(0, prev - 1));
                toast.error("Failed to register like.");
            }
        } catch (err) {
            setLiked(!nextLiked);
            setLikes(prev => !nextLiked ? prev + 1 : Math.max(0, prev - 1));
        }
    };

    const handleSave = async () => {
        const nextSaved = !saved;
        setSaved(nextSaved);
        toast.info(nextSaved ? "Post saved to library" : "Post unsaved");

        try {
            const res = decryptData(await savePostAction(encryptData({ userId: currentUserId, postId: id })));
            if (!res.success) {
                setSaved(!nextSaved);
                toast.error("Failed to save post.");
            }
        } catch (err) {
            setSaved(!nextSaved);
        }
    };

    const handleShare = () => {
        setShowShareModal(true);
        setCopiedLink(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedLink(true);
            toast.success("Link copied!");
            setTimeout(() => setCopiedLink(false), 2000);
        }).catch(() => {
            toast.error("Failed to copy link.");
        });
    };

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = decryptData(await getPostCommentsAction(id));
            if (res.success && res.data) {
                setCommentsList(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    };

    const toggleComments = () => {
        const nextOpen = !showComments;
        setShowComments(nextOpen);
        if (nextOpen) {
            fetchComments();
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        let finalCommentText = newComment.trim();
        selectedMentions.forEach(mention => {
            const tagToReplace = `@${mention.fullName}`;
            finalCommentText = finalCommentText.split(tagToReplace).join(`@[${mention.fullName}](${mention.user_id})`);
        });

        setIsSavingComment(true);
        try {
            const payload = encryptData({
                userId: currentUserId,
                postId: id,
                commentText: finalCommentText
            });
            const res = decryptData(await commentPostAction(payload));
            if (res.success && res.data) {
                setCommentsList(prev => [...prev, res.data]);
                setNewComment('');
                setSelectedMentions([]);
                setTotalComments(prev => prev + 1);
                toast.success("Comment added.");
            } else {
                toast.error(res.message || "Failed to add comment.");
            }
        } catch (err) {
            toast.error("An error occurred.");
        } finally {
            setIsSavingComment(false);
        }
    };

    const handleAddReply = async (e: React.FormEvent, parentId: string) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        let finalReplyText = replyText.trim();
        selectedMentions.forEach(mention => {
            const tagToReplace = `@${mention.fullName}`;
            finalReplyText = finalReplyText.split(tagToReplace).join(`@[${mention.fullName}](${mention.user_id})`);
        });

        setIsSavingReply(true);
        try {
            const payload = encryptData({
                userId: currentUserId,
                postId: id,
                commentText: finalReplyText,
                parentCommentId: parentId
            });
            const res = decryptData(await commentPostAction(payload));
            if (res.success && res.data) {
                setCommentsList(prev => [...prev, res.data]);
                setReplyText('');
                setSelectedMentions([]);
                setReplyingToId(null);
                setTotalComments(prev => prev + 1);
                toast.success("Reply added.");
            } else {
                toast.error(res.message || "Failed to add reply.");
            }
        } catch (err) {
            toast.error("An error occurred.");
        } finally {
            setIsSavingReply(false);
        }
    };

    const handleEditComment = async (e: React.FormEvent, commentId: string) => {
        e.preventDefault();
        if (!editingText.trim()) return;

        let finalEditText = editingText.trim();
        selectedMentions.forEach(mention => {
            const tagToReplace = `@${mention.fullName}`;
            finalEditText = finalEditText.split(tagToReplace).join(`@[${mention.fullName}](${mention.user_id})`);
        });

        setIsSavingEdit(true);
        try {
            const payload = encryptData({
                userId: currentUserId,
                commentId,
                commentText: finalEditText
            });
            const res = decryptData(await editCommentAction(payload));
            if (res.success && res.data) {
                setCommentsList(prev => prev.map(c => c.id === commentId ? { ...c, comment_text: res.data.comment_text, updated_at: res.data.updated_at } : c));
                setEditingCommentId(null);
                setEditingText('');
                toast.success("Comment updated.");
            } else {
                toast.error(res.message || "Failed to update comment.");
            }
        } catch (err) {
            toast.error("An error occurred.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDeleteCommentClick = (commentId: string) => {
        setCommentToDelete(commentId);
    };

    const executeDeleteComment = async (commentId: string) => {
        try {
            const res = decryptData(await deleteCommentAction(encryptData({ userId: currentUserId, commentId })));
            if (res.success) {
                setCommentsList(prev => prev.filter(c => c.id !== commentId));
                setTotalComments(prev => Math.max(0, prev - 1));
                toast.success("Comment deleted.");
            } else {
                toast.error(res.message || "Failed to delete comment.");
            }
        } catch (err) {
            toast.error("An error occurred.");
        }
    };

    const executeDeletePost = async () => {
        try {
            const res = decryptData(await deletePostAction(encryptData({ userId: currentUserId, postId: id })));
            if (res.success) {
                toast.success("Post deleted.");
                window.dispatchEvent(new CustomEvent('feed:reload'));
            } else {
                toast.error(res.message || "Failed to delete post.");
            }
        } catch (err) {
            toast.error("An error occurred.");
        }
    };

    const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const currentTotal = editExistingMedia.length + editNewFiles.length;
        if (currentTotal + files.length > 5) {
            toast.error("A maximum of 5 images are allowed per post.");
            return;
        }

        Array.from(files).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} exceeds the 5MB size limit.`);
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
                toast.error(`${file.name} is not a supported image format.`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setEditNewFiles(prev => [...prev, { base64, name: file.name, type: file.type }]);
                setEditNewImagePreviews(prev => [...prev, base64]);
            };
            reader.readAsDataURL(file);
        });

        if (editImageInputRef.current) editImageInputRef.current.value = '';
    };

    const handleRemoveExistingImage = (mediaId: string) => {
        setEditExistingMedia(prev => prev.filter(m => m.id !== mediaId));
        setDeletedMediaIds(prev => [...prev, mediaId]);
    };

    const handleRemoveNewImage = (index: number) => {
        setEditNewFiles(prev => prev.filter((_, i) => i !== index));
        setEditNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleEditPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        if (file.type !== 'application/pdf') {
            toast.error("Only PDF files are supported.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("PDF exceeds the 10MB size limit.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setEditNewFiles([{ base64: reader.result as string, name: file.name, type: file.type }]);
            // If there's an existing PDF, mark it as deleted
            if (editExistingMedia.length > 0) {
                setDeletedMediaIds([editExistingMedia[0].id]);
                setEditExistingMedia([]);
            }
        };
        reader.readAsDataURL(file);

        if (editPdfInputRef.current) editPdfInputRef.current.value = '';
    };

    const handleRemoveExistingPdf = (mediaId: string) => {
        setEditExistingMedia([]);
        setDeletedMediaIds([mediaId]);
    };

    const handleRemoveNewPdf = () => {
        setEditNewFiles([]);
    };

    const handleUpdatePostContent = async () => {
        if (!editedContent.trim()) {
            toast.error("Post content cannot be empty.");
            return;
        }

        if (hasImages && hasPdf) {
            toast.error("A post cannot contain both images and a PDF resource.");
            return;
        }

        let calculatedPostType: 'text' | 'image' | 'resource' = 'text';
        if (hasImages) {
            calculatedPostType = 'image';
        } else if (hasPdf) {
            calculatedPostType = 'resource';
        }

        setIsSavingPost(true);
        try {
            const res = decryptData(await updatePostAction(encryptData({
                userId: currentUserId,
                postId: id,
                content: editedContent,
                postType: calculatedPostType,
                deletedMediaIds,
                newFiles: editNewFiles
            })));

            if (res.success) {
                toast.success("Post updated successfully!");
                setIsEditingPost(false);
                window.dispatchEvent(new CustomEvent('feed:reload'));
            } else {
                toast.error(res.message || "Failed to update post.");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred while saving.");
        } finally {
            setIsSavingPost(false);
        }
    };

    const handleVote = async (optionId: string) => {
        if (!pollState) return;

        // Check expiration
        const expired = new Date() > new Date(pollState.expires_at);
        if (expired) {
            toast.error("This poll has expired.");
            return;
        }

        // Check if already voted (and multiple votes not allowed)
        const hasVotedAny = pollState.options.some((o: any) => o.user_voted);
        if (hasVotedAny && !pollState.allow_multiple) {
            toast.warning("You have already voted in this poll.");
            return;
        }

        // Optimistic vote update
        const updatedOptions = pollState.options.map((opt: any) => {
            if (opt.id === optionId) {
                return {
                    ...opt,
                    votes_count: opt.votes_count + 1,
                    user_voted: true
                };
            }
            return opt;
        });

        setPollState((prev: any) => ({
            ...prev,
            options: updatedOptions
        }));

        try {
            const res = decryptData(await votePollAction(encryptData({ userId: currentUserId, pollOptionId: optionId })));
            if (!res.success) {
                // Revert
                setPollState(poll);
                toast.error(res.message || "Failed to register vote.");
            } else {
                toast.success("Vote registered.");
            }
        } catch (err) {
            setPollState(poll);
        }
    };

    const handleRepostSubmit = async () => {
        setIsReposting(true);
        try {
            const payload = encryptData({
                userId: currentUserId,
                postType: 'repost',
                content: repostCommentary.trim(),
                visibility: 'public', // Default to public visibility for reposts
                repostPostId: id
            });

            const res = decryptData(await createPostAction(payload));
            if (res.success) {
                toast.success("Reposted successfully!");
                setShowRepostModal(false);
                setRepostCommentary('');
                window.dispatchEvent(new CustomEvent('feed:reload'));
            } else {
                toast.error(res.message || "Failed to repost.");
            }
        } catch (err) {
            toast.error("An error occurred while reposting.");
        } finally {
            setIsReposting(false);
        }
    };

    // Calculate total poll votes
    const totalVotes = pollState?.options.reduce((sum: number, opt: any) => sum + opt.votes_count, 0) || 0;
    const hasUserVoted = pollState?.options.some((opt: any) => opt.user_voted) || false;
    const isPollExpired = pollState ? new Date() > new Date(pollState.expires_at) : false;

    // Relative date formatting
    const timeText = formatDistanceToNow(new Date(created_at), { addSuffix: true });

    return (
        <motion.div
            ref={postRef}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 group/card relative"
            whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}
            transition={{ duration: 0.2 }}
        >
            {/* Header section (Author name & actions) */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <UserAvatar 
                        src={author_profile?.profile_pic_url} 
                        name={author_profile?.fullName || "Member"}
                        className="w-11 h-11 rounded-full border border-gray-100 shadow-sm"
                    />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-800 text-sm">{author_profile?.fullName || "Member"}</span>
                            {author_profile?.role === 'super_admin' && (
                                <span className="text-[9px] bg-red-50 text-red-500 font-bold px-1.5 py-0.5 rounded uppercase">Staff</span>
                            )}
                            {visibility === 'classroom' && (
                                <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded uppercase">Classroom</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 leading-tight truncate max-w-[200px] sm:max-w-[300px]">
                            {author_profile?.headline || author_profile?.role || "Educator"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{timeText}</p>
                    </div>
                </div>

                {/* Right controls (Options Dropdown) */}
                {(user_id === currentUserId || author_profile?.role === 'super_admin') && (
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowOptionsMenu(!showOptionsMenu);
                            }}
                            title="Post Options"
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-50 transition-all opacity-0 group-hover/card:opacity-100 focus:opacity-100"
                        >
                            <FaEllipsisV className="text-xs" />
                        </button>
                        
                        <AnimatePresence>
                            {showOptionsMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-20 pointer-events-auto" 
                                        onClick={() => setShowOptionsMenu(false)} 
                                    />
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-1 w-32 text-xs flex flex-col pointer-events-auto"
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowOptionsMenu(false);
                                                openEditTagsModal();
                                            }}
                                            className="flex items-center gap-2 px-3.5 py-2 hover:bg-gray-50 text-left text-gray-700 font-bold"
                                        >
                                            <FaUserTag className="text-teal-500" />
                                            <span>Edit Tags</span>
                                        </button>
                                        
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowOptionsMenu(false);
                                                setEditedContent(content || '');
                                                setEditExistingMedia(media || []);
                                                setDeletedMediaIds([]);
                                                setEditNewFiles([]);
                                                setEditNewImagePreviews([]);
                                                setIsEditingPost(true);
                                            }}
                                            className="flex items-center gap-2 px-3.5 py-2 hover:bg-gray-50 text-left text-gray-700 font-bold border-t border-gray-50"
                                        >
                                            <FaEdit className="text-blue-500" />
                                            <span>Edit Post</span>
                                        </button>
                                        
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowOptionsMenu(false);
                                                setShowDeletePostConfirm(true);
                                            }}
                                            className="flex items-center gap-2 px-3.5 py-2 hover:bg-red-50 hover:text-red-600 text-left text-gray-700 font-bold border-t border-gray-50"
                                        >
                                            <FaTrash className="text-red-500" />
                                            <span>Delete Post</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Post Content Body */}
            {content && (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content.length > 300 && !isExpanded ? (
                        <>
                            {content.slice(0, 300)}...
                            <button 
                                onClick={() => setIsExpanded(true)}
                                className="text-[var(--color-primary)] hover:underline font-bold text-xs ml-1 focus:outline-none"
                            >
                                view more
                            </button>
                        </>
                    ) : (
                        <>
                            {content}
                            {content.length > 300 && (
                                <button 
                                    onClick={() => setIsExpanded(false)}
                                    className="text-[var(--color-primary)] hover:underline font-bold text-xs ml-1 focus:outline-none"
                                >
                                    collapse
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
            {/* General Tagged users row */}
            {tagsList && tagsList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                    <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">With:</span>
                    {tagsList.map((tag: any) => (
                        <a 
                            key={tag.id}
                            href={`/profile?id=${tag.tagged_user_id}`}
                            onClick={(e) => {
                                if (tag.tagged_user_id === currentUserId) {
                                    // Navigate to own profile
                                } else {
                                    e.preventDefault();
                                    toast.info(`${tag.tagged_user_profile?.fullName || "Member"} (${tag.tagged_user_profile?.role || "user"})`);
                                }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-gray-100 hover:bg-teal-50 hover:border-teal-100 rounded-full text-[9px] font-bold text-gray-600 transition-all shadow-sm"
                        >
                            <UserAvatar 
                                src={tag.tagged_user_profile?.profile_pic_url} 
                                name={tag.tagged_user_profile?.fullName} 
                                className="w-3.5 h-3.5 rounded-full object-cover" 
                            />
                            <span>{tag.tagged_user_profile?.fullName || "Member"}</span>
                        </a>
                    ))}
                </div>
            )}

            {/* Rendering IMAGE posts */}
            {post_type === 'image' && media && media.length > 0 && (
                <div className={`mt-1 rounded-xl overflow-hidden border border-gray-100 grid gap-1.5 ${
                    media.length === 1 ? 'grid-cols-1' : media.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                }`}>
                    {media.map((item) => (
                        <div 
                            key={item.id} 
                            className="relative aspect-video bg-gray-50 select-none cursor-pointer"
                            onClick={() => {
                                if (hasTagsForMedia(item.id)) {
                                    setShowTags(!showTags);
                                }
                            }}
                        >
                            <img 
                                src={item.file_url} 
                                alt={item.file_name} 
                                className="w-full h-full object-cover hover:opacity-95 transition-opacity pointer-events-none"
                                loading="lazy"
                            />

                            {/* Tag indicator overlay (Instagram-style tag icon in bottom-left corner) */}
                            {hasTagsForMedia(item.id) && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTags(!showTags);
                                    }}
                                    className="absolute bottom-2 left-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-all shadow z-10"
                                    title="Tagged people"
                                >
                                    <FaUserTag className="text-[10px]" />
                                </button>
                            )}

                            {/* Overlaid tooltips */}
                            {showTags && getTagsForMedia(item.id).map((tag: any) => (
                                <div
                                    key={tag.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${tag.x}%`,
                                        top: `${tag.y}%`,
                                        transform: 'translate(-50%, -100%)',
                                        zIndex: 20
                                    }}
                                    className="pointer-events-auto"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <a 
                                        href={`/profile?id=${tag.tagged_user_id}`}
                                        className="relative group/tag cursor-pointer block"
                                        onClick={(e) => {
                                            if (tag.tagged_user_id === currentUserId) {
                                                // Default navigation to own profile
                                            } else {
                                                e.preventDefault();
                                                toast.info(`${tag.tagged_user_profile?.fullName || "Member"} is tagged here! (${tag.tagged_user_profile?.role || "user"})`);
                                            }
                                        }}
                                    >
                                        <div className="relative">
                                            {/* Instagram Style Tooltip */}
                                            <div className="bg-black/85 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg flex flex-col items-center select-none animate-fade-in relative transition-all hover:scale-105">
                                                <span className="whitespace-nowrap">{tag.tagged_user_profile?.fullName || "Member"}</span>
                                                {tag.tagged_user_profile?.headline && (
                                                    <span className="text-[8px] text-gray-300 font-normal leading-none max-w-[120px] truncate mt-0.5">
                                                        {tag.tagged_user_profile.headline}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Small tooltip pointer/caret */}
                                            <div className="w-1.5 h-1.5 bg-black/85 rotate-45 mx-auto -mt-0.5 shadow-md"></div>
                                        </div>
                                    </a>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Rendering PDF resources */}
            {post_type === 'resource' && media && media.length === 1 && (
                <div className="mt-1 p-3.5 bg-gray-50 hover:bg-gray-100/70 border border-gray-200/60 rounded-xl flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center font-bold text-lg">
                            <FaFilePdf />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-xs text-gray-800 truncate">{media[0].file_name}</h4>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Educational Resource</p>
                        </div>
                    </div>
                    <a 
                        href={media[0].file_url} 
                        download={media[0].file_name} 
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white border border-gray-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <FaDownload className="text-[10px]" /> Download
                    </a>
                </div>
            )}

            {/* Rendering POLL posts */}
            {post_type === 'poll' && pollState && (
                <div className="mt-1 p-4 bg-purple-50/20 border border-purple-100/50 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between text-[11px] text-purple-700 font-bold uppercase tracking-wider">
                        <span>poll discussion</span>
                        <span className="flex items-center gap-1">
                            <FaClock /> 
                            {isPollExpired ? 'ended' : 'active'}
                        </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-800">{pollState.question}</h4>

                    <div className="flex flex-col gap-2.5">
                        {pollState.options.map((opt: any) => {
                            const percent = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0;
                            const showResult = hasUserVoted || isPollExpired;

                            return (
                                <div 
                                    key={opt.id} 
                                    onClick={() => !showResult && handleVote(opt.id)}
                                    className={`relative rounded-lg overflow-hidden border transition-all ${
                                        showResult 
                                            ? 'border-gray-200 bg-gray-50/30' 
                                            : 'border-purple-200 hover:border-purple-400 bg-white cursor-pointer'
                                    }`}
                                >
                                    {/* Vote Percentage Progress Bar fill */}
                                    {showResult && (
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className={`absolute left-0 top-0 bottom-0 ${opt.user_voted ? 'bg-purple-100/60' : 'bg-gray-100/50'}`}
                                        />
                                    )}

                                    <div className="relative p-3 flex items-center justify-between text-xs font-semibold">
                                        <div className="flex items-center gap-2 min-w-0 pr-3">
                                            {opt.user_voted && <span className="text-purple-600 text-xs">✓</span>}
                                            <span className={`${opt.user_voted ? 'text-purple-700 font-bold' : 'text-gray-700'} truncate`}>
                                                {opt.option_text}
                                            </span>
                                        </div>
                                        {showResult && (
                                            <span className="text-gray-500 font-bold text-xs">{percent}%</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-[11px] text-gray-400 font-medium">{totalVotes} votes</p>
                </div>
            )}

            {/* Rendering REPOSTS */}
            {post_type === 'repost' && original_post && (
                <div className="mt-1 p-3.5 border border-gray-100 bg-gray-50/30 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <UserAvatar 
                            src={original_post.author_profile?.profile_pic_url} 
                            name={original_post.author_profile?.fullName || "Member"}
                            className="w-8 h-8 rounded-full border border-white shadow-sm"
                        />
                        <div>
                            <p className="font-bold text-xs text-gray-700 leading-none">
                                {original_post.author_profile?.fullName || "Member"}
                            </p>
                            <p className="text-[9px] text-gray-400 leading-none mt-1">
                                {original_post.author_profile?.headline || "Educator"}
                            </p>
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap pl-1">
                        {original_post.content}
                    </p>

                    {original_post.post_type === 'image' && original_post.media && original_post.media.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden border border-gray-100 mt-1">
                            {original_post.media.slice(0, 2).map((item) => (
                                <img 
                                    key={item.id} 
                                    src={item.file_url} 
                                    alt="repost preview" 
                                    className="w-full h-24 object-cover"
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Interactive Actions Row */}
            <div className="flex items-center justify-between border-t border-gray-100 mt-2 pt-3.5 text-gray-500 text-xs font-bold">
                <div className="flex items-center gap-4">
                    {/* Like button */}
                    <button 
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${liked ? 'text-red-500' : ''}`}
                    >
                        {liked ? <FaHeart className="scale-110" /> : <FaRegHeart />}
                        <span>{likes}</span>
                    </button>

                    {/* Comment button */}
                    <button 
                        onClick={toggleComments}
                        className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
                    >
                        <FaComment />
                        <span>{totalComments}</span>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Save Bookmark button */}
                    <button 
                        onClick={handleSave}
                        className={`flex items-center gap-1.5 hover:text-yellow-500 transition-colors ${saved ? 'text-yellow-500' : ''}`}
                    >
                        {saved ? <FaBookmark /> : <FaRegBookmark />}
                        <span>Save</span>
                    </button>

                    {/* Repost button */}
                    <button 
                        onClick={() => setShowRepostModal(true)}
                        className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                    >
                        <FaRetweet />
                        <span>Repost</span>
                    </button>

                    {/* Share Link button */}
                    <button 
                        onClick={handleShare}
                        className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
                    >
                        <FaShare />
                        <span>Share</span>
                    </button>
                </div>
            </div>

            {/* Repost Commentary Modal */}
            <Modal
                isOpen={showRepostModal}
                onClose={() => setShowRepostModal(false)}
                title="Repost this update"
            >
                <div className="flex flex-col gap-4">
                    <textarea 
                        value={repostCommentary}
                        onChange={(e) => setRepostCommentary(e.target.value)}
                        placeholder="Add your educational commentary... (optional)"
                        rows={3}
                        className="w-full text-sm text-gray-700 outline-none border border-gray-200 p-2.5 rounded-lg focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-none"
                    />

                    {/* Nested referenced post preview card */}
                    <div className="p-3 border border-gray-100 rounded-lg bg-gray-50 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <UserAvatar 
                                src={author_profile?.profile_pic_url} 
                                name={author_profile?.fullName || "Member"}
                                className="w-7 h-7 rounded-full border border-white"
                            />
                            <div>
                                <h5 className="font-bold text-xs text-gray-700">{author_profile?.fullName || "Member"}</h5>
                                <p className="text-[9px] text-gray-400 mt-0.5">{author_profile?.headline}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-3">{content}</p>
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                        <button 
                            disabled={isReposting}
                            onClick={() => setShowRepostModal(false)}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-bold text-xs transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={isReposting}
                            onClick={handleRepostSubmit}
                            className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-lg font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
                        >
                            {isReposting ? 'Reposting...' : 'Repost Now'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Comments Expandable Tray */}
            <AnimatePresence>
                {showComments && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-gray-50 mt-3 pt-3.5 flex flex-col gap-4"
                    >
                        {/* New Comment Submission Form */}
                        <form onSubmit={handleAddComment} className="flex gap-2.5">
                            <UserAvatar 
                                src={profile?.profile_pic_url} 
                                name={name}
                                className="w-8 h-8 rounded-full border border-gray-100"
                            />
                            <div className="flex-grow relative">
                                <input
                                    ref={commentInputRef}
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => handleCommentChange(e.target.value)}
                                    placeholder="Add a comment... (Type @ to tag someone)"
                                    className="w-full text-xs text-gray-700 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-full pl-4 pr-20 py-2.5 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    required
                                    maxLength={500}
                                />
                                {commentMentionResults.length > 0 && !replyingToId && (
                                    <div className="absolute top-11 left-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 w-64 max-h-48 overflow-y-auto">
                                        {commentMentionResults.map((user, idx) => (
                                            <button
                                                key={`${user.user_id || 'user'}-${idx}`}
                                                type="button"
                                                onClick={() => handleSelectMentionUser(user, false)}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left transition-colors"
                                            >
                                                <UserAvatar src={user.profile_pic_url} name={user.fullName} className="w-6 h-6 rounded-full border" />
                                                <div className="min-w-0 flex-grow">
                                                    <div className="text-xs font-bold text-gray-800 truncate">{user.fullName}</div>
                                                    <div className="text-[10px] text-gray-400 truncate">{user.headline || 'Educator'}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                    <EmojiPicker onEmojiSelect={handleCommentEmojiSelect} align="right" buttonClassName="hover:bg-gray-100 p-1 rounded-full" />
                                    <button
                                        type="submit"
                                        disabled={isSavingComment || !newComment.trim()}
                                        className="text-[var(--color-primary)] hover:text-blue-700 disabled:opacity-40 font-bold text-xs"
                                    >
                                        {isSavingComment ? 'Sending...' : 'Post'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Comments List */}
                        <div className="flex flex-col gap-3.5 max-h-80 overflow-y-auto pr-1 sidebar-scroll">
                            {loadingComments ? (
                                <div className="flex justify-center py-4">
                                    <span className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
                                </div>
                            ) : commentsList.length > 0 ? (
                                (() => {
                                    const rootComments = commentsList.filter(c => !c.parent_comment_id);
                                    return rootComments.map((c) => {
                                        const replies = commentsList.filter(reply => reply.parent_comment_id === c.id);
                                        return (
                                            <div key={c.id} className="flex flex-col gap-1.5">
                                                <div className="flex gap-2.5 items-start group/comment">
                                                    <UserAvatar 
                                                        src={c.author_profile?.profile_pic_url} 
                                                        name={c.author_profile?.fullName || "Member"}
                                                        className="w-8 h-8 rounded-full border border-gray-100 mt-0.5"
                                                    />
                                                    <div className="flex-grow bg-gray-50 rounded-2xl p-3 max-w-[85%]">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div>
                                                                <h5 className="font-bold text-xs text-gray-800 leading-none">
                                                                    {c.author_profile?.fullName || "Member"}
                                                                </h5>
                                                                <p className="text-[9px] text-gray-400 mt-1">
                                                                    {c.author_profile?.headline || "Educator"}
                                                                </p>
                                                            </div>
                                                            <span className="text-[9px] text-gray-400 font-medium">
                                                                {formatDistanceToNow(new Date(c.created_at), { addSuffix: false })}
                                                            </span>
                                                        </div>

                                                        {editingCommentId === c.id ? (
                                                            <form onSubmit={(e) => handleEditComment(e, c.id)} className="flex items-center gap-2 mt-1">
                                                                <div className="relative flex-grow flex items-center">
                                                                    <input
                                                                        ref={editInputRef}
                                                                        type="text"
                                                                        value={editingText}
                                                                        onChange={(e) => setEditingText(e.target.value)}
                                                                        className="w-full text-xs text-gray-700 border border-gray-200 bg-white rounded-full pl-3 pr-16 py-1.5 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                                                        required
                                                                        maxLength={500}
                                                                        autoFocus
                                                                    />
                                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                                        <EmojiPicker onEmojiSelect={handleEditEmojiSelect} align="right" buttonClassName="hover:bg-gray-100 p-0.5 rounded-full" />
                                                                        <button
                                                                            type="submit"
                                                                            disabled={isSavingEdit || !editingText.trim()}
                                                                            className="text-[var(--color-primary)] hover:text-blue-700 disabled:opacity-40 font-bold text-[10px] pr-1"
                                                                        >
                                                                            {isSavingEdit ? '...' : 'Save'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => {
                                                                        setEditingCommentId(null);
                                                                        setEditingText('');
                                                                    }}
                                                                    className="text-[10px] text-gray-400 hover:text-gray-600 font-bold px-1"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </form>
                                                        ) : (
                                                            <>
                                                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap mb-1">{renderCommentText(c.comment_text)}</p>
                                                                {/* Reply Action Button */}
                                                                <div className="flex items-center gap-3.5 mt-1 pt-0.5">
                                                                    <button 
                                                                        onClick={() => {
                                                                            setReplyingToId(replyingToId === c.id ? null : c.id);
                                                                            setReplyText('');
                                                                            setEditingCommentId(null);
                                                                        }}
                                                                        className="text-[10px] font-bold text-gray-500 hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                                                                    >
                                                                        Reply
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Action buttons on comment hover */}
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/comment:opacity-100 transition-opacity self-center">
                                                        {c.user_id === currentUserId && (
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingCommentId(c.id);
                                                                    const plainText = c.comment_text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
                                                                    setEditingText(plainText);
                                                                    setReplyingToId(null);
                                                                }}
                                                                className="text-gray-300 hover:text-blue-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                                                title="Edit comment"
                                                            >
                                                                <FaEdit className="text-[10px]" />
                                                            </button>
                                                        )}
                                                        {(c.user_id === currentUserId || author_profile?.role === 'super_admin') && (
                                                            <button 
                                                                onClick={() => handleDeleteCommentClick(c.id)}
                                                                className="text-gray-300 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                                                title="Delete comment"
                                                            >
                                                                <FaTrash className="text-[10px]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Reply Submission Form */}
                                                {replyingToId === c.id && (
                                                    <form onSubmit={(e) => handleAddReply(e, c.id)} className="flex gap-2.5 ml-10 mt-1">
                                                        <UserAvatar 
                                                            src={profile?.profile_pic_url} 
                                                            name={name}
                                                            className="w-8 h-8 rounded-full border border-gray-100"
                                                        />
                                                        <div className="flex-grow relative flex items-center">
                                                            <input
                                                                ref={replyInputRef}
                                                                type="text"
                                                                value={replyText}
                                                                onChange={(e) => handleReplyChange(e.target.value)}
                                                                placeholder={`Reply to ${c.author_profile?.fullName || "Member"}... (Type @ to tag)`}
                                                                className="w-full text-xs text-gray-700 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-full pl-3 pr-16 py-1.5 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                                                required
                                                                maxLength={500}
                                                                autoFocus
                                                            />
                                                            {commentMentionResults.length > 0 && replyingToId === c.id && (
                                                                <div className="absolute top-10 left-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 w-64 max-h-48 overflow-y-auto">
                                                                    {commentMentionResults.map((user, idx) => (
                                                                        <button
                                                                            key={`${user.user_id || 'user'}-${idx}`}
                                                                            type="button"
                                                                            onClick={() => handleSelectMentionUser(user, true)}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left transition-colors"
                                                                        >
                                                                            <UserAvatar src={user.profile_pic_url} name={user.fullName} className="w-6 h-6 rounded-full border" />
                                                                            <div className="min-w-0 flex-grow">
                                                                                <div className="text-xs font-bold text-gray-800 truncate">{user.fullName}</div>
                                                                                <div className="text-[10px] text-gray-400 truncate">{user.headline || 'Educator'}</div>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                                <EmojiPicker onEmojiSelect={(emoji) => setReplyText(prev => prev + emoji)} align="right" buttonClassName="hover:bg-gray-100 p-0.5 rounded-full" />
                                                                <button
                                                                    type="submit"
                                                                    disabled={isSavingReply || !replyText.trim()}
                                                                    className="text-[var(--color-primary)] hover:text-blue-700 disabled:opacity-40 font-bold text-[10px] pr-1"
                                                                >
                                                                    {isSavingReply ? '...' : 'Reply'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setReplyingToId(null)}
                                                            className="text-[10px] text-gray-400 hover:text-gray-600 font-bold self-center px-1"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </form>
                                                )}

                                                {/* Nested Replies List */}
                                                {replies.length > 0 && (
                                                    <div className="pl-6 border-l border-gray-150 ml-6 mt-1 flex flex-col gap-2.5">
                                                        {replies.map(reply => (
                                                            <div key={reply.id} className="flex gap-2.5 items-start group/reply">
                                                                <UserAvatar 
                                                                    src={reply.author_profile?.profile_pic_url} 
                                                                    name={reply.author_profile?.fullName || "Member"}
                                                                    className="w-8 h-8 rounded-full border border-gray-100 mt-0.5"
                                                                />
                                                                <div className="flex-grow bg-gray-50 rounded-2xl p-3 max-w-[85%]">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <div>
                                                                            <h5 className="font-bold text-xs text-gray-800 leading-none">
                                                                                {reply.author_profile?.fullName || "Member"}
                                                                            </h5>
                                                                            <p className="text-[9px] text-gray-400 mt-1">
                                                                                {reply.author_profile?.headline || "Educator"}
                                                                            </p>
                                                                        </div>
                                                                        <span className="text-[9px] text-gray-400 font-medium">
                                                                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: false })}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    {editingCommentId === reply.id ? (
                                                                        <form onSubmit={(e) => handleEditComment(e, reply.id)} className="flex items-center gap-2 mt-1">
                                                                            <div className="relative flex-grow flex items-center">
                                                                                <input
                                                                                    ref={editInputRef}
                                                                                    type="text"
                                                                                    value={editingText}
                                                                                    onChange={(e) => setEditingText(e.target.value)}
                                                                                    className="w-full text-xs text-gray-700 border border-gray-200 bg-white rounded-full pl-3 pr-16 py-1.5 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                                                                    required
                                                                                    maxLength={500}
                                                                                    autoFocus
                                                                                />
                                                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                                                    <EmojiPicker onEmojiSelect={handleEditEmojiSelect} align="right" buttonClassName="hover:bg-gray-100 p-0.5 rounded-full" />
                                                                                    <button
                                                                                        type="submit"
                                                                                        disabled={isSavingEdit || !editingText.trim()}
                                                                                        className="text-[var(--color-primary)] hover:text-blue-700 disabled:opacity-40 font-bold text-[10px] pr-1"
                                                                                    >
                                                                                        {isSavingEdit ? '...' : 'Save'}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => {
                                                                                    setEditingCommentId(null);
                                                                                    setEditingText('');
                                                                                }}
                                                                                className="text-[10px] text-gray-400 hover:text-gray-600 font-bold px-1"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </form>
                                                                    ) : (
                                                                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{renderCommentText(reply.comment_text)}</p>
                                                                    )}
                                                                </div>

                                                                {/* Action buttons on reply hover */}
                                                                <div className="flex items-center gap-0.5 opacity-0 group-hover/reply:opacity-100 transition-opacity self-center">
                                                                    {reply.user_id === currentUserId && (
                                                                        <button 
                                                                            onClick={() => {
                                                                                setEditingCommentId(reply.id);
                                                                                const plainText = reply.comment_text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
                                                                                setEditingText(plainText);
                                                                                setReplyingToId(null);
                                                                            }}
                                                                            className="text-gray-300 hover:text-blue-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                                                            title="Edit reply"
                                                                        >
                                                                            <FaEdit className="text-[9px]" />
                                                                        </button>
                                                                    )}
                                                                    {(reply.user_id === currentUserId || author_profile?.role === 'super_admin') && (
                                                                        <button 
                                                                            onClick={() => handleDeleteCommentClick(reply.id)}
                                                                            className="text-gray-300 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                                                            title="Delete reply"
                                                                        >
                                                                            <FaTrash className="text-[9px]" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                <p className="text-center py-4 text-xs font-semibold text-gray-400">Be the first to share your thoughts!</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Tags Modal */}
            <AnimatePresence>
                {isEditingTags && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 p-4">
                                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                    <span>👥</span> Edit Post Tags
                                    {post_type === 'image' && media && media.length > 0 && (
                                        <span className="text-xs text-gray-400 font-semibold">(Image {editActiveImageIdx + 1} of {media.length})</span>
                                    )}
                                </h3>
                                <button
                                    onClick={() => setIsEditingTags(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                                {/* Left/Center Container */}
                                <div className="md:col-span-2 flex flex-col gap-3">
                                    {post_type === 'image' && media && media[editActiveImageIdx] ? (
                                        <>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Click on the photo to tag people</p>
                                            <div 
                                                className="relative bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-crosshair aspect-video flex items-center justify-center select-none"
                                                onClick={handleEditImageClick}
                                            >
                                                <img 
                                                    src={media[editActiveImageIdx].file_url} 
                                                    alt="Tagging preview" 
                                                    className="max-w-full max-h-[60vh] object-contain pointer-events-none"
                                                />

                                                {/* Existing tags on this image */}
                                                {editTagsList.filter(t => t.post_media_id === media[editActiveImageIdx].id).map((tag) => {
                                                    const realIdx = editTagsList.indexOf(tag);
                                                    return (
                                                        <div
                                                            key={realIdx}
                                                            style={{
                                                                position: 'absolute',
                                                                left: `${tag.x}%`,
                                                                top: `${tag.y}%`,
                                                                transform: 'translate(-50%, -100%)',
                                                            }}
                                                            className="bg-black/85 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow flex items-center gap-1 pointer-events-auto"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <span>{tag.fullName}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEditTag(realIdx)}
                                                                className="text-gray-400 hover:text-red-400 ml-1 font-bold text-xs"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    );
                                                })}

                                                {/* Pending tag search popup */}
                                                {editPendingCoord && (
                                                    <div 
                                                        style={{ 
                                                            position: 'absolute', 
                                                            left: `${editPendingCoord.x}%`, 
                                                            top: `${editPendingCoord.y}%`,
                                                            transform: 'translate(-50%, 8px)',
                                                            zIndex: 50
                                                        }}
                                                        className="bg-white rounded-lg shadow-xl border border-gray-200 p-2.5 w-52 flex flex-col gap-1.5 pointer-events-auto"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input 
                                                            type="text"
                                                            placeholder="Who is this?"
                                                            value={editSearchQuery}
                                                            onChange={(e) => handleEditSearchUser(e.target.value)}
                                                            className="text-xs p-1.5 border border-gray-200 rounded focus:outline-none w-full font-semibold focus:ring-1 focus:ring-blue-400"
                                                            autoFocus
                                                        />
                                                        {editSearching && <span className="text-[10px] text-gray-400 animate-pulse">Searching...</span>}
                                                        {!editSearching && editSearchResults.length > 0 && (
                                                            <div className="max-h-28 overflow-y-auto flex flex-col border border-gray-100 rounded">
                                                                {editSearchResults.map((user: any) => (
                                                                    <button
                                                                        key={user.user_id}
                                                                        type="button"
                                                                        onClick={() => addEditTag(user)}
                                                                        className="flex items-center gap-2 p-1.5 hover:bg-slate-50 text-left w-full text-xs transition-colors"
                                                                    >
                                                                        <UserAvatar 
                                                                            src={user.profile_pic_url} 
                                                                            name={user.fullName} 
                                                                            className="w-5 h-5 rounded-full" 
                                                                        />
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate font-semibold text-gray-700 text-[11px]">{user.fullName}</p>
                                                                            <p className="truncate text-gray-400 text-[9px]">{user.headline || user.role}</p>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {!editSearching && editSearchQuery.trim().length > 0 && editSearchResults.length === 0 && (
                                                            <span className="text-[10px] text-red-500">No users found.</span>
                                                        )}
                                                        <button 
                                                            type="button"
                                                            onClick={() => setEditPendingCoord(null)}
                                                            className="text-[10px] text-gray-400 hover:text-red-500 font-bold self-end"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        // Non-image post tagging (list-based)
                                        <div className="relative bg-gray-50 border border-gray-200/60 rounded-xl p-6 flex flex-col gap-4 min-h-[320px] justify-center items-center">
                                            <div className="text-center space-y-1 max-w-sm">
                                                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xl mx-auto font-bold">👥</div>
                                                <h4 className="font-bold text-gray-800 text-sm">Tag People on Post</h4>
                                                <p className="text-xs text-gray-400">Search and select teachers or institutions to tag them globally on this post.</p>
                                            </div>

                                            <div className="w-full max-w-md relative pointer-events-auto">
                                                <input 
                                                    type="text"
                                                    placeholder="Search name to tag..."
                                                    value={editSearchQuery}
                                                    onChange={(e) => handleEditSearchUser(e.target.value)}
                                                    className="text-xs p-2.5 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-full shadow-sm"
                                                    autoFocus
                                                />
                                                {editSearching && <span className="absolute right-3 top-3 text-[10px] text-gray-400 animate-pulse">Searching...</span>}
                                                
                                                {!editSearching && editSearchResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto flex flex-col z-50 p-1">
                                                        {editSearchResults.map((user: any) => (
                                                            <button
                                                                key={user.user_id}
                                                                type="button"
                                                                onClick={() => addEditTag(user)}
                                                                className="flex items-center gap-2.5 p-2 hover:bg-teal-50/50 text-left w-full text-xs transition-colors rounded-lg"
                                                            >
                                                                <UserAvatar 
                                                                    src={user.profile_pic_url} 
                                                                    name={user.fullName} 
                                                                    className="w-6 h-6 rounded-full" 
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate font-bold text-gray-700 text-xs">{user.fullName}</p>
                                                                    <p className="truncate text-gray-400 text-[10px]">{user.headline || user.role}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {!editSearching && editSearchQuery.trim().length > 0 && editSearchResults.length === 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-center text-[11px] text-red-500 z-50">
                                                        No users found.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar list */}
                                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col gap-4">
                                    <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Tagged People</h4>
                                    <div className="flex-1 flex flex-col gap-2 max-h-[35vh] md:max-h-none overflow-y-auto">
                                        {/* Filter list for images to only show tags on the current active image */}
                                        {editTagsList.filter(t => post_type !== 'image' || t.post_media_id === media[editActiveImageIdx]?.id).length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">No one tagged yet.</p>
                                        ) : (
                                            editTagsList
                                                .filter(t => post_type !== 'image' || t.post_media_id === media[editActiveImageIdx]?.id)
                                                .map((tag) => {
                                                    const realIdx = editTagsList.indexOf(tag);
                                                    return (
                                                        <div key={realIdx} className="flex items-center justify-between p-2 hover:bg-gray-50 border border-gray-100 rounded-lg transition-colors">
                                                            <span className="text-xs font-semibold text-gray-700">{tag.fullName}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEditTag(realIdx)}
                                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-all"
                                                            >
                                                                <FaTimes className="text-[10px]" />
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
                                {post_type === 'image' && media && editActiveImageIdx > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditActiveImageIdx(prev => prev - 1);
                                            setEditPendingCoord(null);
                                        }}
                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                    >
                                        Previous Image
                                    </button>
                                )}
                                {post_type === 'image' && media && editActiveImageIdx < media.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditActiveImageIdx(prev => prev + 1);
                                            setEditPendingCoord(null);
                                        }}
                                        className="bg-[var(--color-primary)] text-white hover:opacity-90 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                    >
                                        Next Image
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsEditingTags(false)}
                                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isSavingTags}
                                    onClick={handleSaveTags}
                                    className="bg-gray-800 text-white hover:bg-gray-900 px-6 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                                >
                                    {isSavingTags ? 'Saving...' : 'Save Tags'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interactive & Innovative Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white/95 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-gray-100/50 p-5 bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">🔗</span>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Share this Post</h3>
                                        <p className="text-[10px] text-gray-400 font-semibold">Spread knowledge with your network</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
                                {/* Left Side: Innovative QR Card */}
                                <div className="md:col-span-2 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100/30 rounded-2xl p-4 text-center group/qr relative overflow-hidden select-none">
                                    {/* Glassmorphic overlay reflection */}
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/qr:opacity-100 transition-opacity pointer-events-none" />
                                    
                                    <div className="bg-white p-3.5 rounded-2xl shadow-md border border-indigo-100/50 relative z-10 transition-transform duration-300 group-hover/qr:scale-105">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`${window.location.origin}/dashboard?post=${id}`)}`} 
                                            alt="Post QR Code"
                                            className="w-28 h-28 object-contain"
                                        />
                                    </div>
                                    <div className="mt-3.5 relative z-10">
                                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wide">Scan & Share</span>
                                        <p className="text-[9px] text-gray-400 mt-1 font-semibold">Scan with phone camera to view</p>
                                    </div>
                                </div>

                                {/* Right Side: Share Channels & Link Copier */}
                                <div className="md:col-span-3 flex flex-col justify-between gap-5">
                                    {/* Link Copier Row */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Post Link</label>
                                        <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200/80 rounded-xl">
                                            <input 
                                                type="text"
                                                readOnly
                                                value={`${window.location.origin}/dashboard?post=${id}`}
                                                className="bg-transparent text-xs text-gray-600 outline-none flex-1 px-1.5 font-medium truncate"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(`${window.location.origin}/dashboard?post=${id}`)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                                    copiedLink 
                                                        ? 'bg-emerald-500 text-white shadow-emerald-100' 
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                                }`}
                                            >
                                                {copiedLink ? (
                                                    <>
                                                        <FaCheck />
                                                        <span>Copied</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCopy />
                                                        <span>Copy</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Share Channels Grid */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Share directly to</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* WhatsApp */}
                                            <a 
                                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this post on Teacher Desk: ${window.location.origin}/dashboard?post=${id}`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center justify-center gap-1.5 p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100/50 rounded-xl transition-all group/btn"
                                            >
                                                <FaWhatsapp className="text-xl text-emerald-600 transition-transform group-hover/btn:scale-110" />
                                                <span className="text-[9px] font-bold text-emerald-700">WhatsApp</span>
                                            </a>

                                            {/* Twitter */}
                                            <a 
                                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/dashboard?post=${id}`)}&text=${encodeURIComponent('Check out this post on Teacher Desk!')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center justify-center gap-1.5 p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl transition-all group/btn"
                                            >
                                                <FaTwitter className="text-xl text-gray-800 transition-transform group-hover/btn:scale-110" />
                                                <span className="text-[9px] font-bold text-gray-700">Twitter</span>
                                            </a>

                                            {/* Email */}
                                            <a 
                                                href={`mailto:?subject=${encodeURIComponent('Teacher Desk Post')}&body=${encodeURIComponent(`Hi, check out this educational update on Teacher Desk: ${window.location.origin}/dashboard?post=${id}`)}`}
                                                className="flex flex-col items-center justify-center gap-1.5 p-2.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-100/50 rounded-xl transition-all group/btn"
                                            >
                                                <FaEnvelope className="text-xl text-blue-600 transition-transform group-hover/btn:scale-110" />
                                                <span className="text-[9px] font-bold text-blue-700">Email</span>
                                            </a>
                                        </div>
                                    </div>

                                    {/* Instagram Sticker Help Card */}
                                    <div className="flex items-start gap-2.5 bg-amber-50/40 border border-amber-100/50 rounded-2xl p-3">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-pink-500 text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
                                            <FaInstagram />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-[10px] font-bold text-amber-800">Share to Instagram</h4>
                                            <p className="text-[9px] text-amber-700 mt-0.5 leading-relaxed font-semibold">
                                                Copy the link, open Instagram, and paste it using the **Link Sticker** on your Story or update your Bio!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Post Modal */}
            <AnimatePresence>
                {isEditingPost && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">📝</span>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Edit Post</h3>
                                        <p className="text-[10px] text-gray-400 font-semibold">Update your update or announcement</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsEditingPost(false)}
                                    className="text-gray-400 hover:text-red-500 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                                >
                                    <FaTimes size={14} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                                <textarea
                                    ref={editPostTextareaRef}
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    placeholder="What's on your mind?"
                                    rows={6}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-[var(--color-primary)] transition duration-200 resize-none leading-relaxed"
                                />

                                {/* Hidden Inputs for Uploads */}
                                <input
                                    type="file"
                                    ref={editImageInputRef}
                                    onChange={handleEditImageUpload}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                />
                                <input
                                    type="file"
                                    ref={editPdfInputRef}
                                    onChange={handleEditPdfUpload}
                                    accept="application/pdf"
                                    className="hidden"
                                />

                                {/* Image Attachments Editing */}
                                {hasImages && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Images (Max 5)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {/* Render existing images */}
                                            {editExistingMedia.map((m) => (
                                                <div key={m.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={m.file_url} alt="existing attachment" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveExistingImage(m.id)}
                                                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                                                    >
                                                        <FaTimes size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                            {/* Render new images */}
                                            {editNewImagePreviews.map((preview, idx) => (
                                                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={preview} alt="new attachment" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveNewImage(idx)}
                                                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                                                    >
                                                        <FaTimes size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                            {/* Add button */}
                                            {editExistingMedia.length + editNewFiles.length < 5 && (
                                                <button
                                                    type="button"
                                                    onClick={() => editImageInputRef.current?.click()}
                                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition"
                                                >
                                                    <FaPlusCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* PDF Attachment Editing */}
                                {hasPdf && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resource PDF</label>
                                        
                                        {/* Render existing resource */}
                                        {editExistingMedia.length > 0 && (
                                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <div className="flex items-center gap-2 truncate">
                                                    <FaFilePdf className="text-red-500 flex-shrink-0" size={16} />
                                                    <span className="text-xs text-gray-600 truncate font-semibold">
                                                        {editExistingMedia[0].file_name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingPdf(editExistingMedia[0].id)}
                                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Render new resource */}
                                        {editNewFiles.length > 0 && (
                                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <div className="flex items-center gap-2 truncate">
                                                    <FaFilePdf className="text-red-500 flex-shrink-0" size={16} />
                                                    <span className="text-xs text-gray-600 truncate font-semibold">
                                                        {editNewFiles[0].name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveNewPdf}
                                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* If no media is attached, show options for both images and PDF */}
                                {!hasImages && !hasPdf && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add Attachments</label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => editImageInputRef.current?.click()}
                                                className="flex-1 py-3 border border-dashed border-gray-200 hover:border-blue-500 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-500 transition"
                                            >
                                                📷 Add Image
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => editPdfInputRef.current?.click()}
                                                className="flex-1 py-3 border border-dashed border-gray-200 hover:border-red-500 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-red-500 transition"
                                            >
                                                📄 Add PDF Resource
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-gray-100">
                                <div>
                                    <EmojiPicker onEmojiSelect={handleEditPostEmojiSelect} align="left" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsEditingPost(false)}
                                        className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdatePostContent}
                                        disabled={isSavingPost}
                                        className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition duration-200 shadow-md disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {isSavingPost ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom confirmation dialog for deleting a comment */}
            <ConfirmDialog
                isOpen={commentToDelete !== null}
                onClose={() => setCommentToDelete(null)}
                onConfirm={async () => {
                    if (!commentToDelete) return;
                    setIsDeletingComment(true);
                    try {
                        await executeDeleteComment(commentToDelete);
                    } finally {
                        setIsDeletingComment(false);
                        setCommentToDelete(null);
                    }
                }}
                title="Delete Comment"
                message="Are you sure you want to permanently delete this comment? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={isDeletingComment}
            />

            {/* Custom confirmation dialog for deleting a post */}
            <ConfirmDialog
                isOpen={showDeletePostConfirm}
                onClose={() => setShowDeletePostConfirm(false)}
                onConfirm={async () => {
                    setShowDeletePostConfirm(false);
                    await executeDeletePost();
                }}
                title="Delete Post"
                message="Are you sure you want to delete this post? This cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </motion.div>
    );
}
