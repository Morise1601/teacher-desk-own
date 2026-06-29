// src/app/features/dashboard/UserFeedPost.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaBookmark, FaRegBookmark, FaRetweet, FaTrash, FaDownload, FaFilePdf, FaClock } from 'react-icons/fa';
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
    deletePostAction
} from '@/app/actions/posts';
import { decryptData, encryptData } from '@/lib/crypto';
import { getProfileByUserIdAction } from '@/app/actions/profile';
import Modal from '@/app/shared/Modal';

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
        const url = `${window.location.origin}/dashboard?post=${id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success("Post link copied to clipboard!");
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

        setIsSavingComment(true);
        try {
            const payload = encryptData({
                userId: currentUserId,
                postId: id,
                commentText: newComment.trim()
            });
            const res = decryptData(await commentPostAction(payload));
            if (res.success && res.data) {
                setCommentsList(prev => [...prev, res.data]);
                setNewComment('');
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

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

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

    const handleDeletePost = async () => {
        if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

        try {
            const res = decryptData(await deletePostAction(encryptData({ userId: currentUserId, postId: id })));
            if (res.success) {
                toast.success("Post deleted.");
                // Reload feed
                window.dispatchEvent(new CustomEvent('feed:reload'));
            } else {
                toast.error(res.message || "Failed to delete post.");
            }
        } catch (err) {
            toast.error("An error occurred.");
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

                {/* Right controls (Delete own post) */}
                {(user_id === currentUserId || author_profile?.role === 'super_admin') && (
                    <button 
                        onClick={handleDeletePost}
                        title="Delete Post"
                        className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-gray-50 transition-all opacity-0 group-hover/card:opacity-100"
                    >
                        <FaTrash className="text-sm" />
                    </button>
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

            {/* Rendering IMAGE posts */}
            {post_type === 'image' && media && media.length > 0 && (
                <div className={`mt-1 rounded-xl overflow-hidden border border-gray-100 grid gap-1.5 ${
                    media.length === 1 ? 'grid-cols-1' : media.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                }`}>
                    {media.map((item) => (
                        <div key={item.id} className="relative aspect-video bg-gray-50">
                            <img 
                                src={item.file_url} 
                                alt={item.file_name} 
                                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                loading="lazy"
                            />
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
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="w-full text-xs text-gray-700 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-full px-4 py-2.5 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    required
                                    maxLength={500}
                                />
                                <button
                                    type="submit"
                                    disabled={isSavingComment || !newComment.trim()}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)] hover:text-blue-700 disabled:opacity-40 font-bold text-xs"
                                >
                                    {isSavingComment ? 'Sending...' : 'Post'}
                                </button>
                            </div>
                        </form>

                        {/* Comments List */}
                        <div className="flex flex-col gap-3.5 max-h-80 overflow-y-auto pr-1 sidebar-scroll">
                            {loadingComments ? (
                                <div className="flex justify-center py-4">
                                    <span className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
                                </div>
                            ) : commentsList.length > 0 ? (
                                commentsList.map((c) => (
                                    <div key={c.id} className="flex gap-2.5 items-start group/comment">
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
                                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{c.comment_text}</p>
                                        </div>

                                        {/* Action buttons on comment hover (e.g. Delete own comment) */}
                                        {(c.user_id === currentUserId || author_profile?.role === 'super_admin') && (
                                            <button 
                                                onClick={() => handleDeleteComment(c.id)}
                                                className="text-gray-300 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover/comment:opacity-100 self-center"
                                            >
                                                <FaTrash className="text-[10px]" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-xs font-semibold text-gray-400">Be the first to share your thoughts!</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
