// src/app/features/dashboard/PostJobCreator.tsx
'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import { supabase } from '@/lib/supabase';
import { getProfileByUserIdAction } from '@/app/actions/profile';
import { getInstitutionProfileAction } from '@/app/actions/institution';
import { createPostAction, getClassroomsAction, searchUsersAction } from '@/app/actions/posts';
import { decryptData, encryptData } from '@/lib/crypto';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { FaPaperclip, FaImage, FaPoll, FaChevronDown, FaTimes, FaGlobe, FaUsers, FaBuilding, FaGraduationCap, FaUserTag } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { EmojiPicker } from '@/components/ui/EmojiPicker';

export default function PostJobCreator() {
    const [profile, setProfile] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Inputs state
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'network' | 'institution' | 'classroom'>('public');
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState('');
    const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

    // Image upload state
    const [selectedImages, setSelectedImages] = useState<{ base64: string; name: string }[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // PDF resource state
    const [selectedPDF, setSelectedPDF] = useState<{ base64: string; name: string } | null>(null);
    const [resourceTitle, setResourceTitle] = useState('');
    const [resourceCategory, setResourceCategory] = useState('Lesson Plan');
    const pdfInputRef = useRef<HTMLInputElement>(null);

    // Poll state
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
    const [pollExpiresAt, setPollExpiresAt] = useState('');
    const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

    // Loading & UI states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const handleEmojiSelect = (emoji: string) => {
        if (contentRef.current) {
            const input = contentRef.current;
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const text = input.value;
            const nextContent = text.substring(0, start) + emoji + text.substring(end);
            setContent(nextContent);
            
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + emoji.length, start + emoji.length);
            }, 0);
        } else {
            setContent(prev => prev + emoji);
        }
    };

    // Tagging state
    const [imageTags, setImageTags] = useState<{ [imageIndex: number]: Array<{ tagged_user_id: string; fullName: string; x: number | null; y: number | null }> }>({});
    const [activeTaggingImageIndex, setActiveTaggingImageIndex] = useState<number | null>(null);
    const [pendingTagCoord, setPendingTagCoord] = useState<{ x: number; y: number } | null>(null);
    
    // Tagging search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            const role = user.user_metadata?.role;
            let res;
            if (role === 'teacher') res = decryptData(await getProfileByUserIdAction(user.id));
            else if (role === 'institution' || role === 'institution_admin') res = decryptData(await getInstitutionProfileAction(user.id));
            
            if (res?.success) setProfile(res.profile || res.data);
        };
        fetchProfile();
    }, []);

    // Set default poll expiry date (7 days from now) on load
    useEffect(() => {
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 7);
        setPollExpiresAt(defaultExpiry.toISOString().slice(0, 16));
    }, []);

    // Load classrooms when user selects classroom visibility
    useEffect(() => {
        if (visibility === 'classroom' && userId && classrooms.length === 0) {
            const fetchClassrooms = async () => {
                try {
                    const res = decryptData(await getClassroomsAction(userId));
                    if (res.success && res.classrooms) {
                        setClassrooms(res.classrooms);
                        if (res.classrooms.length > 0) {
                            setSelectedClassroomId(res.classrooms[0].id);
                        }
                    }
                } catch (err) {
                    console.error("Error loading classrooms", err);
                }
            };
            fetchClassrooms();
        }
    }, [visibility, userId, classrooms.length]);

    const name = profile?.fullName || profile?.name || "Member";

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const currentCount = selectedImages.length;
        if (currentCount + files.length > 5) {
            toast.error("You can upload a maximum of 5 images.");
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
                setSelectedImages(prev => [...prev, { base64, name: file.name }]);
                setImagePreviews(prev => [...prev, base64]);
            };
            reader.readAsDataURL(file);
        });

        // Reset file input
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        
        // Clean up or adjust tags
        setImageTags(prev => {
            const next = { ...prev };
            delete next[index];
            // Shift indices of subsequent images
            const shifted: { [key: number]: any } = {};
            Object.keys(next).forEach(k => {
                const keyNum = parseInt(k);
                if (keyNum > index) {
                    shifted[keyNum - 1] = next[keyNum];
                } else {
                    shifted[keyNum] = next[keyNum];
                }
            });
            return shifted;
        });
    };

    const getTagsCountForImage = (idx: number) => {
        return imageTags[idx]?.length || 0;
    };

    const openTaggingModal = (index: number) => {
        setActiveTaggingImageIndex(index);
        setPendingTagCoord(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSearchUser = async (val: string) => {
        setSearchQuery(val);
        if (val.trim().length === 0) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const payload = encryptData({ query: val });
            const res = decryptData(await searchUsersAction(payload));
            if (res.success && res.data) {
                setSearchResults(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const addTag = (user: any) => {
        if (activeTaggingImageIndex === null) return;
        if (activeTaggingImageIndex !== -1 && !pendingTagCoord) return;
        
        // Check if user is already tagged on this image/post
        const currentTags = imageTags[activeTaggingImageIndex] || [];
        const isAlreadyTagged = currentTags.some(t => t.tagged_user_id === user.user_id);
        if (isAlreadyTagged) {
            toast.warning(activeTaggingImageIndex === -1 ? "This user is already tagged on this post." : "This user is already tagged on this image.");
            return;
        }

        const newTag = {
            tagged_user_id: user.user_id,
            fullName: user.fullName,
            x: activeTaggingImageIndex === -1 ? null : pendingTagCoord!.x,
            y: activeTaggingImageIndex === -1 ? null : pendingTagCoord!.y
        };

        setImageTags(prev => ({
            ...prev,
            [activeTaggingImageIndex]: [...(prev[activeTaggingImageIndex] || []), newTag]
        }));
        
        setPendingTagCoord(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeTagAtIndex = (idx: number) => {
        if (activeTaggingImageIndex === null) return;
        setImageTags(prev => ({
            ...prev,
            [activeTaggingImageIndex]: (prev[activeTaggingImageIndex] || []).filter((_, i) => i !== idx)
        }));
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent click if we click a tag close button or pending dialog
        if ((e.target as HTMLElement).closest('.pointer-events-auto')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;
        
        setPendingTagCoord({ x: clickX, y: clickY });
        setSearchQuery('');
        setSearchResults([]);
    };

    const handlePDFSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setSelectedPDF({ base64: reader.result as string, name: file.name });
            setResourceTitle(file.name.replace(/\.[^/.]+$/, ""));
        };
        reader.readAsDataURL(file);

        // Reset file input
        if (pdfInputRef.current) pdfInputRef.current.value = '';
    };

    const handleRemovePDF = () => {
        setSelectedPDF(null);
    };

    const handleAddPollOption = () => {
        if (pollOptions.length >= 5) {
            toast.error("You can add a maximum of 5 options.");
            return;
        }
        setPollOptions([...pollOptions, '']);
    };

    const handleRemovePollOption = (index: number) => {
        if (pollOptions.length <= 2) {
            toast.error("A poll requires a minimum of 2 options.");
            return;
        }
        setPollOptions(pollOptions.filter((_, i) => i !== index));
    };

    const handlePollOptionChange = (value: string, index: number) => {
        const updated = [...pollOptions];
        updated[index] = value;
        setPollOptions(updated);
    };

    const handlePublishPost = async () => {
        if (!userId) {
            toast.error("You must be logged in to create posts.");
            return;
        }

        let postType: 'text' | 'image' | 'resource' | 'poll' = 'text';
        if (selectedImages.length > 0) {
            postType = 'image';
        } else if (selectedPDF) {
            postType = 'resource';
        } else if (showPollCreator) {
            postType = 'poll';
        }

        // Validations
        if (postType === 'text' && !content.trim()) {
            toast.error("Please enter some content for your post.");
            return;
        }
        if (postType === 'poll') {
            if (!pollQuestion.trim()) {
                toast.error("Please enter a poll question.");
                return;
            }
            const cleanOptions = pollOptions.filter(o => o.trim() !== '');
            if (cleanOptions.length < 2) {
                toast.error("Please provide at least 2 non-empty poll options.");
                return;
            }
            if (!pollExpiresAt) {
                toast.error("Please set a poll expiry date.");
                return;
            }
        }
        if (postType === 'resource' && !resourceTitle.trim()) {
            toast.error("Please enter a title for your shared resource.");
            return;
        }
        if (visibility === 'classroom' && !selectedClassroomId) {
            toast.error("Please select a classroom.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Flatten the tags object to an array of { imageIndex: number, tagged_user_id: string, x: number, y: number }
            const flattenedTags: any[] = [];
            Object.keys(imageTags).forEach((imgIdxStr) => {
                const imgIdx = parseInt(imgIdxStr);
                const tagsForImg = imageTags[imgIdx] || [];
                tagsForImg.forEach((tag) => {
                    flattenedTags.push({
                        imageIndex: imgIdx,
                        tagged_user_id: tag.tagged_user_id,
                        x: tag.x !== null && tag.x !== undefined ? parseFloat(tag.x.toFixed(2)) : null,
                        y: tag.y !== null && tag.y !== undefined ? parseFloat(tag.y.toFixed(2)) : null
                    });
                });
            });

            const payload = {
                userId,
                postType,
                content: content.trim(),
                visibility,
                classroomId: visibility === 'classroom' ? selectedClassroomId : null,
                institutionId: profile?.role === 'institution' ? profile.id : null,
                files: postType === 'image' ? selectedImages : (postType === 'resource' && selectedPDF ? [selectedPDF] : []),
                poll: postType === 'poll' ? {
                    question: pollQuestion.trim(),
                    options: pollOptions.filter(o => o.trim() !== ''),
                    expiresAt: new Date(pollExpiresAt).toISOString(),
                    allowMultiple: pollAllowMultiple
                } : null,
                tags: flattenedTags
            };

            const encryptedPayload = encryptData(payload);
            const resEncrypted = await createPostAction(encryptedPayload);
            const res = decryptData(resEncrypted);

            if (res.success) {
                toast.success("Post published successfully!");
                // Reset form fields
                setContent('');
                setSelectedImages([]);
                setImagePreviews([]);
                setImageTags({}); // Reset tags
                setSelectedPDF(null);
                setShowPollCreator(false);
                setPollQuestion('');
                setPollOptions(['', '']);
                // Trigger feed reload event if defined
                window.dispatchEvent(new CustomEvent('feed:reload'));
            } else {
                toast.error(res.message || "Failed to publish post.");
            }
        } catch (err: any) {
            toast.error("An error occurred while publishing.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getVisibilityLabel = () => {
        switch (visibility) {
            case 'public': return { text: 'Public', icon: <FaGlobe className="text-gray-500 text-xs" /> };
            case 'network': return { text: 'Network Only', icon: <FaUsers className="text-gray-500 text-xs" /> };
            case 'institution': return { text: 'Institution Only', icon: <FaBuilding className="text-gray-500 text-xs" /> };
            case 'classroom': return { text: 'Classroom Only', icon: <FaGraduationCap className="text-gray-500 text-xs" /> };
        }
    };

    return (
        <motion.div
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"
            layout
        >
            {/* Header info / Avatar & visibility selection */}
            <div className="flex items-center gap-3 mb-4">
                <UserAvatar 
                    src={profile?.profile_pic_url} 
                    name={name}
                    className="w-10 h-10 rounded-full border border-gray-100 shadow-sm"
                />
                <div className="flex flex-col items-start gap-1">
                    <p className="font-semibold text-gray-800 text-sm">{name}</p>
                    
                    {/* Visibility Dropdown Selector */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                            className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 px-2.5 py-1 rounded-full text-xs font-bold text-gray-600 transition-colors"
                        >
                            {getVisibilityLabel().icon}
                            <span>{getVisibilityLabel().text}</span>
                            <FaChevronDown className="text-[10px] text-gray-400" />
                        </button>

                        <AnimatePresence>
                            {showVisibilityMenu && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute left-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1.5 overflow-hidden"
                                >
                                    <button 
                                        onClick={() => { setVisibility('public'); setShowVisibilityMenu(false); }}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-semibold flex items-center gap-2"
                                    >
                                        <FaGlobe className="text-gray-400" /> Public (Everyone)
                                    </button>
                                    <button 
                                        onClick={() => { setVisibility('network'); setShowVisibilityMenu(false); }}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-semibold flex items-center gap-2"
                                    >
                                        <FaUsers className="text-gray-400" /> My Network Only
                                    </button>
                                    {(profile?.role === 'institution' || profile?.role === 'institution_admin') && (
                                        <button 
                                            onClick={() => { setVisibility('institution'); setShowVisibilityMenu(false); }}
                                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-semibold flex items-center gap-2"
                                        >
                                            <FaBuilding className="text-gray-400" /> Followers Only
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => { setVisibility('classroom'); setShowVisibilityMenu(false); }}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-semibold flex items-center gap-2"
                                    >
                                        <FaGraduationCap className="text-gray-400" /> Classroom Specific
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Classroom specific selection detail */}
            {visibility === 'classroom' && classrooms.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Select target classroom:</span>
                    <select 
                        value={selectedClassroomId}
                        onChange={(e) => setSelectedClassroomId(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-200 bg-white rounded-md text-gray-700 focus:outline-none"
                    >
                        {classrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Classroom specific notice if empty */}
            {visibility === 'classroom' && classrooms.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs font-semibold text-yellow-600">
                    You aren't active in any classrooms. Create a classroom or join one first.
                </div>
            )}

            {/* Post content textarea */}
            <div className="mb-4">
                <textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Share something educational, ${name.split(' ')[0]}?`}
                    rows={3}
                    className="w-full text-sm text-gray-700 outline-none resize-none border-0 p-1 placeholder-gray-400 focus:ring-0"
                />
            </div>

            {/* Render selected attachment previews */}
            {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 group">
                            <img src={preview} alt="upload preview" className="w-full h-full object-cover" />
                            
                            {/* Tag people button overlay */}
                            <button
                                type="button"
                                onClick={() => openTaggingModal(index)}
                                className="absolute bottom-1 left-1 bg-black/60 text-white rounded px-2 py-0.5 text-[9px] hover:bg-black transition-all font-bold flex items-center gap-1 shadow-sm"
                            >
                                <FaUserTag className="text-[10px]" />
                                <span>{getTagsCountForImage(index) > 0 ? `${getTagsCountForImage(index)} Tagged` : 'Tag People'}</span>
                            </button>

                            <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                            >
                                <FaTimes className="text-xs" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* PDF File attachment preview */}
            {selectedPDF && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded flex items-center justify-center font-bold text-xs uppercase">
                            pdf
                        </div>
                        <div className="min-w-0">
                            <input 
                                type="text"
                                value={resourceTitle}
                                onChange={(e) => setResourceTitle(e.target.value)}
                                placeholder="Resource Title"
                                className="font-bold text-xs text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:outline-none w-full"
                            />
                            <p className="text-[10px] text-gray-400 mt-1 truncate">{selectedPDF.name}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <select
                            value={resourceCategory}
                            onChange={(e) => setResourceCategory(e.target.value)}
                            className="text-[11px] p-1 bg-white border border-gray-200 rounded text-gray-600 focus:outline-none font-bold"
                        >
                            <option value="Lesson Plan">Lesson Plan</option>
                            <option value="Worksheet">Worksheet</option>
                            <option value="Syllabus">Syllabus</option>
                            <option value="Template">Template</option>
                        </select>
                        <button
                            onClick={handleRemovePDF}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}

            {/* Interactive Poll Creator Widget */}
            {showPollCreator && (
                <div className="mb-4 p-4 bg-purple-50/30 border border-purple-100 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Create poll details</span>
                        <button 
                            onClick={() => setShowPollCreator(false)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <Input 
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="What is your poll question?"
                        className="bg-white border-gray-200 text-xs"
                    />

                    <div className="flex flex-col gap-2">
                        {pollOptions.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Input 
                                    value={opt}
                                    onChange={(e) => handlePollOptionChange(e.target.value, i)}
                                    placeholder={`Option ${i + 1}`}
                                    className="bg-white border-gray-200 text-xs flex-1"
                                />
                                {pollOptions.length > 2 && (
                                    <button 
                                        onClick={() => handleRemovePollOption(i)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {pollOptions.length < 5 && (
                        <button
                            onClick={handleAddPollOption}
                            className="text-left text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors w-fit"
                        >
                            + Add Option
                        </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5 pt-3 border-t border-purple-100">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-500">Expires At:</span>
                            <input 
                                type="datetime-local"
                                value={pollExpiresAt}
                                onChange={(e) => setPollExpiresAt(e.target.value)}
                                className="p-1.5 text-xs bg-white border border-gray-200 rounded text-gray-600 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 self-end pb-2">
                            <input 
                                type="checkbox"
                                id="pollAllowMultiple"
                                checked={pollAllowMultiple}
                                onChange={(e) => setPollAllowMultiple(e.target.checked)}
                                className="w-3.5 h-3.5 border-gray-200 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                            />
                            <label htmlFor="pollAllowMultiple" className="text-xs font-semibold text-gray-600 cursor-pointer">
                                Allow Multiple Selection
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex flex-wrap items-center justify-between border-t border-gray-50 pt-3.5 gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    {/* Hide buttons when they aren't compatible with current selection */}
                    {!selectedPDF && !showPollCreator && (
                        <>
                            <button 
                                onClick={() => imageInputRef.current?.click()}
                                className="flex items-center gap-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-all text-xs font-bold"
                            >
                                <FaImage className="text-blue-500 text-sm" /> <span>Photo</span>
                            </button>
                            <input 
                                type="file"
                                ref={imageInputRef}
                                onChange={handleImageSelect}
                                multiple
                                accept="image/*"
                                className="hidden"
                            />
                        </>
                    )}

                    {!selectedImages.length && !showPollCreator && (
                        <>
                            <button 
                                onClick={() => pdfInputRef.current?.click()}
                                className="flex items-center gap-1.5 hover:bg-orange-50 text-gray-500 hover:text-orange-600 px-3 py-1.5 rounded-lg transition-all text-xs font-bold"
                            >
                                <FaPaperclip className="text-orange-500 text-sm" /> <span>Resource PDF</span>
                            </button>
                            <input 
                                type="file"
                                ref={pdfInputRef}
                                onChange={handlePDFSelect}
                                accept="application/pdf"
                                className="hidden"
                            />
                        </>
                    )}

                    {!selectedImages.length && !selectedPDF && (
                        <button 
                            onClick={() => setShowPollCreator(true)}
                            className="flex items-center gap-1.5 hover:bg-purple-50 text-gray-500 hover:text-purple-600 px-3 py-1.5 rounded-lg transition-all text-xs font-bold"
                        >
                            <FaPoll className="text-purple-500 text-sm" /> <span>Poll</span>
                        </button>
                    )}

                    {/* Tag button for non-image posts */}
                    {!selectedImages.length && (
                        <button 
                            type="button"
                            onClick={() => openTaggingModal(-1)}
                            className="flex items-center gap-1.5 hover:bg-teal-50 text-gray-500 hover:text-teal-600 px-3 py-1.5 rounded-lg transition-all text-xs font-bold"
                        >
                            <span className="text-teal-500 text-sm">👥</span> 
                            <span>{getTagsCountForImage(-1) > 0 ? `${getTagsCountForImage(-1)} Tagged` : 'Tag People'}</span>
                        </button>
                    )}
                </div>

                <button 
                    disabled={isSubmitting || (visibility === 'classroom' && classrooms.length === 0)}
                    onClick={handlePublishPost}
                    className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 transition-all font-bold text-xs tracking-wider shadow-sm flex items-center gap-1.5"
                >
                    {isSubmitting ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Posting...</span>
                        </>
                    ) : (
                        <span>Publish Post</span>
                    )}
                </button>
            </div>

            {/* Tagging Modal Overlay */}
            <AnimatePresence>
                {activeTaggingImageIndex !== null && (
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
                            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 p-4">
                                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                    <span>👥</span> Tag People
                                    {activeTaggingImageIndex !== -1 && (
                                        <span className="text-xs text-gray-400 font-semibold">(Image {activeTaggingImageIndex + 1} of {imagePreviews.length})</span>
                                    )}
                                </h3>
                                <button
                                    onClick={() => setActiveTaggingImageIndex(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                                {/* Image Container or Global Search Box (Left/Center) */}
                                <div className="md:col-span-2 flex flex-col gap-3">
                                    {activeTaggingImageIndex === -1 ? (
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
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearchUser(e.target.value)}
                                                    className="text-xs p-2.5 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-full shadow-sm"
                                                    autoFocus
                                                />
                                                {searching && <span className="absolute right-3 top-3 text-[10px] text-gray-400 animate-pulse">Searching...</span>}
                                                
                                                {!searching && searchResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto flex flex-col z-50 p-1">
                                                        {searchResults.map((user: any) => (
                                                            <button
                                                                key={user.user_id}
                                                                type="button"
                                                                onClick={() => addTag(user)}
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
                                                {!searching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-center text-[11px] text-red-500 z-50">
                                                        No users found.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Click on the photo to tag people</p>
                                            <div 
                                                className="relative bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-crosshair aspect-video flex items-center justify-center select-none"
                                                onClick={handleImageClick}
                                            >
                                                <img 
                                                    src={imagePreviews[activeTaggingImageIndex]} 
                                                    alt="Tagging preview" 
                                                    className="max-w-full max-h-[60vh] object-contain pointer-events-none"
                                                />

                                                {/* Existing tags on this image */}
                                                {(imageTags[activeTaggingImageIndex] || []).map((tag, tIdx) => (
                                                    <div
                                                        key={tIdx}
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
                                                            onClick={() => removeTagAtIndex(tIdx)}
                                                            className="text-gray-400 hover:text-red-400 ml-1 font-bold text-xs"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Pending Tag coordinate popup */}
                                                {pendingTagCoord && (
                                                    <div 
                                                        style={{ 
                                                            position: 'absolute', 
                                                            left: `${pendingTagCoord.x}%`, 
                                                            top: `${pendingTagCoord.y}%`,
                                                            transform: 'translate(-50%, 8px)',
                                                            zIndex: 50
                                                        }}
                                                        className="bg-white rounded-lg shadow-xl border border-gray-200 p-2.5 w-52 flex flex-col gap-1.5 pointer-events-auto"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input 
                                                            type="text"
                                                            placeholder="Who is this?"
                                                            value={searchQuery}
                                                            onChange={(e) => handleSearchUser(e.target.value)}
                                                            className="text-xs p-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 w-full"
                                                            autoFocus
                                                        />
                                                        {searching && <span className="text-[10px] text-gray-400 animate-pulse">Searching users...</span>}
                                                        {!searching && searchResults.length > 0 && (
                                                            <div className="max-h-28 overflow-y-auto flex flex-col border border-gray-100 rounded">
                                                                {searchResults.map((user: any) => (
                                                                    <button
                                                                        key={user.user_id}
                                                                        type="button"
                                                                        onClick={() => addTag(user)}
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
                                                        {!searching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                                                            <span className="text-[10px] text-red-500">No users found.</span>
                                                        )}
                                                        <button 
                                                            type="button"
                                                            onClick={() => setPendingTagCoord(null)}
                                                            className="text-[10px] text-gray-400 hover:text-red-500 font-bold self-end"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Tagged List / Sidebar (Right) */}
                                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col gap-4">
                                    <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Tagged People</h4>
                                    <div className="flex-1 flex flex-col gap-2 max-h-[35vh] md:max-h-none overflow-y-auto">
                                        {(imageTags[activeTaggingImageIndex] || []).length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">No one tagged yet.</p>
                                        ) : (
                                            (imageTags[activeTaggingImageIndex] || []).map((tag, tIdx) => (
                                                <div key={tIdx} className="flex items-center justify-between p-2 hover:bg-gray-50 border border-gray-100 rounded-lg transition-colors">
                                                    <span className="text-xs font-semibold text-gray-700">{tag.fullName}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTagAtIndex(tIdx)}
                                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-all"
                                                    >
                                                        <FaTimes className="text-[10px]" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
                                {activeTaggingImageIndex !== -1 && activeTaggingImageIndex > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => openTaggingModal(activeTaggingImageIndex - 1)}
                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                    >
                                        Previous Image
                                    </button>
                                )}
                                {activeTaggingImageIndex !== -1 && activeTaggingImageIndex < imagePreviews.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => openTaggingModal(activeTaggingImageIndex + 1)}
                                        className="bg-[var(--color-primary)] text-white hover:opacity-90 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                    >
                                        Next Image
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setActiveTaggingImageIndex(null)}
                                    className="bg-gray-800 text-white hover:bg-gray-900 px-6 py-2 rounded-lg text-xs font-bold transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
