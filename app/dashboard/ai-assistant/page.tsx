'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';
import LoadingScreen from '@/components/ui/loading-screen';
import { decryptData, encryptData } from '@/lib/crypto';
import { getUserRoleAction } from '@/app/actions/auth';
import { 
  getAIHistoryAction, 
  deleteAIHistoryAction, 
  getAISavedContentAction, 
  deleteAISavedContentAction, 
  toggleAIFavoriteAction,
  getAITemplatesAction 
} from '@/app/actions/ai';
import { 
  FiBookOpen, FiFileText, FiCheckSquare, 
  FiClipboard, FiEdit3, FiBook, 
  FiMessageSquare, FiStar, FiClock, FiGrid, 
  FiTrash2, FiSearch, FiCopy, FiDownload, 
  FiShare2, FiHeart, FiFolder, FiExternalLink 
} from 'react-icons/fi';
import { LuSparkles, LuMegaphone } from 'react-icons/lu';
import { toast } from 'react-toastify';

export default function AIAssistantDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // States for tabs & search
  const [activeTab, setActiveTab] = useState<'generators' | 'templates' | 'saved' | 'history'>('generators');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [history, setHistory] = useState<any[]>([]);
  const [savedContent, setSavedContent] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/');
          return;
        }

        setUserId(user.id);

        let role = user.user_metadata?.role;
        if (!role) {
          const encRole = await getUserRoleAction(user.id);
          const decRole = decryptData(encRole);
          if (decRole && decRole.success) {
            role = decRole.role;
          }
        }

        if (role !== 'teacher') {
          toast.error("Access Denied: AI Content Assistant is restricted to Teachers.");
          router.push('/dashboard');
          return;
        }

        setIsTeacher(true);
        await loadDashboardData(user.id);
      } catch (err) {
        console.error("Access verification error:", err);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [router]);

  const loadDashboardData = async (uid: string) => {
    const encryptedPayload = encryptData({ userId: uid });

    // 1. Fetch History
    try {
      const resEnc = await getAIHistoryAction(encryptedPayload);
      const res = decryptData(resEnc);
      if (res && res.success) {
        if (res.isFallback) {
          setIsSandboxMode(true);
          const localHist = localStorage.getItem('ai_history');
          setHistory(localHist ? JSON.parse(localHist) : []);
        } else {
          setHistory(res.data || []);
        }
      }
    } catch (e) {
      console.error("Error loading AI history:", e);
    }

    // 2. Fetch Saved Content
    try {
      const resEnc = await getAISavedContentAction(encryptedPayload);
      const res = decryptData(resEnc);
      if (res && res.success) {
        if (res.isFallback) {
          setIsSandboxMode(true);
          const localSaved = localStorage.getItem('ai_saved_content');
          setSavedContent(localSaved ? JSON.parse(localSaved) : []);
        } else {
          setSavedContent(res.data || []);
        }
      }
    } catch (e) {
      console.error("Error loading saved content:", e);
    }

    // 3. Fetch Templates
    try {
      const resEnc = await getAITemplatesAction(encryptedPayload);
      const res = decryptData(resEnc);
      if (res && res.success) {
        if (res.isFallback) {
          setIsSandboxMode(true);
          // Templates fallback handled by server action return
          setTemplates(res.data || []);
        } else {
          setTemplates(res.data || []);
        }
      }
    } catch (e) {
      console.error("Error loading templates:", e);
    }
  };

  // Content generators modules configuration
  const aiModules = [
    {
      id: 'lesson_plan',
      title: 'Generate Lesson Plan',
      description: 'Prepare detailed classroom guides, learning objectives, required materials, activities, and assignments.',
      icon: <FiBookOpen className="text-blue-600 text-2xl" />,
      bgColor: 'bg-blue-50 border-blue-100 hover:border-blue-300',
    },
    {
      id: 'assignment',
      title: 'Generate Assignment',
      description: 'Build homework handouts, questions, instructions, answer guidelines, and customizable grading criteria.',
      icon: <FiFileText className="text-emerald-600 text-2xl" />,
      bgColor: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300',
    },
    {
      id: 'quiz',
      title: 'Generate Quiz',
      description: 'Formulate randomized multiple-choice or short-answer quizzes with correct answer keys and descriptions.',
      icon: <FiCheckSquare className="text-purple-600 text-2xl" />,
      bgColor: 'bg-purple-50 border-purple-100 hover:border-purple-300',
    },
    {
      id: 'announcement',
      title: 'Class Announcement',
      description: 'Draft polished reminders, event notifications, exam alerts, and announcements for students and parents.',
      icon: <LuMegaphone className="text-amber-600 text-2xl" />,
      bgColor: 'bg-amber-50 border-amber-100 hover:border-amber-300',
    },
    {
      id: 'summary',
      title: 'Educational Summary',
      description: 'Summarize textbooks, long essays, or notes into key bullet points, concepts, timelines, and study definitions.',
      icon: <FiClipboard className="text-rose-600 text-2xl" />,
      bgColor: 'bg-rose-50 border-rose-100 hover:border-rose-300',
    },
    {
      id: 'notes',
      title: 'Generate Notes',
      description: 'Produce clear, structured student notes with concise headings, real-world examples, and revision outlines.',
      icon: <FiEdit3 className="text-teal-600 text-2xl" />,
      bgColor: 'bg-teal-50 border-teal-100 hover:border-teal-300',
    },
    {
      id: 'study_material',
      title: 'Study Material Guide',
      description: 'Generate high-quality textbooks templates complete with worked exercises, diagrams, and study suggestions.',
      icon: <FiBook className="text-indigo-600 text-2xl" />,
      bgColor: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300',
    },
    {
      id: 'chat',
      title: 'AI Teaching Companion',
      description: 'Engage in open dialog, brainstorm teaching methodologies, outline curricula, or clarify complex topics.',
      icon: <FiMessageSquare className="text-violet-600 text-2xl" />,
      bgColor: 'bg-violet-50 border-violet-100 hover:border-violet-300',
    }
  ];

  // Action: Launch Generator
  const handleLaunchModule = (moduleId: string) => {
    router.push(`/dashboard/ai-assistant/workspace?feature=${moduleId}`);
  };

  // Action: Launch Template
  const handleLaunchTemplate = (template: any) => {
    localStorage.setItem('prefilled_ai_template', JSON.stringify(template));
    router.push(`/dashboard/ai-assistant/workspace?feature=${template.feature_type}&template=${template.id}`);
  };

  // Action: Toggle Favorite
  const handleToggleFavorite = async (item: any) => {
    if (!userId) return;
    const newFavStatus = !item.is_favorite;

    try {
      if (isSandboxMode) {
        const localSaved = localStorage.getItem('ai_saved_content');
        const list = localSaved ? JSON.parse(localSaved) : [];
        const idx = list.findIndex((x: any) => x.id === item.id);
        if (idx !== -1) {
          list[idx].is_favorite = newFavStatus;
          localStorage.setItem('ai_saved_content', JSON.stringify(list));
          setSavedContent(list);
          toast.success(newFavStatus ? "Added to Favorites" : "Removed from Favorites");
        }
        return;
      }

      const encrypted = encryptData({
        userId,
        id: item.id,
        isFavorite: newFavStatus
      });
      const resEnc = await toggleAIFavoriteAction(encrypted);
      const res = decryptData(resEnc);
      if (res && res.success) {
        setSavedContent(prev => 
          prev.map(x => x.id === item.id ? { ...x, is_favorite: newFavStatus } : x)
        );
        toast.success(newFavStatus ? "Added to Favorites" : "Removed from Favorites");
      } else {
        toast.error("Failed to update favorite status.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    }
  };

  // Action: Delete Saved Content
  const handleDeleteSaved = async (id: string) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this saved content?")) return;

    try {
      if (isSandboxMode) {
        const localSaved = localStorage.getItem('ai_saved_content');
        let list = localSaved ? JSON.parse(localSaved) : [];
        list = list.filter((x: any) => x.id !== id);
        localStorage.setItem('ai_saved_content', JSON.stringify(list));
        setSavedContent(list);
        toast.success("Saved content deleted.");
        return;
      }

      const encrypted = encryptData({ userId, id });
      const resEnc = await deleteAISavedContentAction(encrypted);
      const res = decryptData(resEnc);
      if (res && res.success) {
        setSavedContent(prev => prev.filter(x => x.id !== id));
        toast.success("Saved content deleted.");
      } else {
        toast.error("Failed to delete content.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    }
  };

  // Action: Delete History Record
  const handleDeleteHistory = async (id: string) => {
    if (!userId) return;
    if (!confirm("Remove this entry from history?")) return;

    try {
      if (isSandboxMode) {
        const localHist = localStorage.getItem('ai_history');
        let list = localHist ? JSON.parse(localHist) : [];
        list = list.filter((x: any) => x.id !== id);
        localStorage.setItem('ai_history', JSON.stringify(list));
        setHistory(list);
        toast.success("History entry removed.");
        return;
      }

      const encrypted = encryptData({ userId, id });
      const resEnc = await deleteAIHistoryAction(encrypted);
      const res = decryptData(resEnc);
      if (res && res.success) {
        setHistory(prev => prev.filter(x => x.id !== id));
        toast.success("History entry removed.");
      } else {
        toast.error("Failed to delete entry.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Copy Content to Clipboard
  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Action: Open in Workspace
  const handleReuseHistory = (item: any) => {
    localStorage.setItem('reused_ai_content', JSON.stringify(item));
    router.push(`/dashboard/ai-assistant/workspace?feature=${item.feature_type}&reuse=${item.id}`);
  };

  if (loading) {
    return <LoadingScreen message="Loading AI Environment..." icon={<LuSparkles className="text-white w-8 h-8 animate-pulse" />} />;
  }

  // Filter lists based on search
  const filteredHistory = history.filter(item => {
    const term = searchQuery.toLowerCase();
    const typeLabel = item.feature_type.replace('_', ' ');
    return (
      typeLabel.toLowerCase().includes(term) ||
      (item.input_parameters && JSON.stringify(item.input_parameters).toLowerCase().includes(term)) ||
      (item.generated_content && item.generated_content.toLowerCase().includes(term))
    );
  });

  const filteredSaved = savedContent.filter(item => {
    const term = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.content.toLowerCase().includes(term) ||
      item.feature_type.toLowerCase().includes(term)
    );
  });

  const filteredTemplates = templates.filter(item => {
    const term = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-[#eeeeee] flex flex-col font-sans">
      <Navbar />

      {/* --- Page Banner --- */}
      <motion.div 
        className="bg-gradient-to-r from-[var(--color-primary)] via-[#193d62] to-[var(--color-secondary)] text-white px-4 py-8 md:py-10 shadow-sm relative overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold oswald-font tracking-wide flex items-center gap-2.5">
              <LuSparkles className="text-yellow-300 animate-pulse text-3xl" />
              AI CONTENT ASSISTANT
            </h1>
            <p className="text-white/80 text-sm mt-1 max-w-xl">
              Collaborate with advanced teaching models to produce syllabi, exams, quizzes, revision resources, and announcements in minutes.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center min-w-[100px] backdrop-blur-xs">
              <p className="text-xl font-bold">{history.length}</p>
              <p className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">Generations</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center min-w-[100px] backdrop-blur-xs">
              <p className="text-xl font-bold">{savedContent.length}</p>
              <p className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">Saved Items</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center min-w-[100px] backdrop-blur-xs">
              <p className="text-xl font-bold">{savedContent.filter(x => x.is_favorite).length}</p>
              <p className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">Favorites</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- Main Workspace Layout --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 py-6 md:py-8">
        
        {/* Sandbox Warning Banner */}
        {isSandboxMode && (
          <motion.div 
            className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-xl mb-6 shadow-xs flex justify-between items-center text-amber-800 text-xs font-medium"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div>
              <span className="font-bold">⚠️ Offline Sandbox Active:</span> Database tables do not exist on your Supabase instance. AI features are running in <span className="font-bold underline">Local Storage mode</span> (all content is saved inside your browser cache). To persist content permanently, execute the database migration file at:
              <span className="block font-mono bg-amber-100/80 p-1.5 rounded-lg mt-1 text-[11px] select-all border border-amber-200">
                supabase/migrations/20260629_create_ai_tables.sql
              </span>
            </div>
          </motion.div>
        )}

        {/* Tab Controls and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-2 border-b border-gray-200">
          <div className="flex overflow-x-auto gap-1 pb-1">
            <button
              onClick={() => setActiveTab('generators')}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs rounded-xl tracking-wider uppercase border transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'generators' 
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiGrid /> Generators
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs rounded-xl tracking-wider uppercase border transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'templates' 
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiFolder /> AI Templates
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs rounded-xl tracking-wider uppercase border transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'saved' 
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiStar /> Saved & Favs
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs rounded-xl tracking-wider uppercase border transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history' 
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiClock /> Generation History
            </button>
          </div>

          {activeTab !== 'generators' && (
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          )}
        </div>

        {/* --- Tab Content --- */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Generators */}
          {activeTab === 'generators' && (
            <motion.div
              key="generators-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {aiModules.map((mod, i) => (
                <motion.div
                  key={mod.id}
                  className={`bg-white rounded-2xl shadow-xs border p-5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all duration-300 ${mod.bgColor}`}
                  whileHover={{ y: -4 }}
                  onClick={() => handleLaunchModule(mod.id)}
                >
                  <div>
                    <div className="p-3 bg-white w-fit rounded-2xl shadow-xs mb-4">
                      {mod.icon}
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm oswald-font tracking-wide uppercase mb-2">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500/80 font-medium leading-relaxed mb-4">
                      {mod.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mt-2">
                    Open Generator &rarr;
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* TAB 2: Templates */}
          {activeTab === 'templates' && (
            <motion.div
              key="templates-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((tpl) => (
                  <div 
                    key={tpl.id}
                    className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                    onClick={() => handleLaunchTemplate(tpl)}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] bg-slate-100 border text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {tpl.feature_type.replace('_', ' ')}
                        </span>
                        {tpl.is_system && (
                          <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            System Preset
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm oswald-font tracking-wide uppercase mb-1">
                        {tpl.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                        {tpl.description || 'Custom template parameters for AI prompts.'}
                      </p>
                    </div>
                    <div className="border-t border-slate-50 pt-3 flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-semibold">
                        Subject: {tpl.input_parameters?.subject || 'N/A'}
                      </span>
                      <span className="text-xs font-bold text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform">
                        Customize &rarr;
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-white rounded-2xl border p-12 text-center text-gray-400 font-medium">
                  No templates matching search found.
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: Saved & Favorites */}
          {activeTab === 'saved' && (
            <motion.div
              key="saved-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {filteredSaved.length > 0 ? (
                filteredSaved.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {item.feature_type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          Created {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm oswald-font tracking-wide uppercase truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-xl">
                        {item.content.substring(0, 150)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                      <button 
                        onClick={() => handleToggleFavorite(item)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          item.is_favorite 
                            ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' 
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title={item.is_favorite ? "Remove from Favorites" : "Mark as Favorite"}
                      >
                        <FiHeart className={item.is_favorite ? "fill-rose-600" : ""} />
                      </button>
                      <button 
                        onClick={() => handleReuseHistory(item)}
                        className="flex items-center gap-1 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                      >
                        <FiExternalLink /> Open
                      </button>
                      <button 
                        onClick={() => handleCopyContent(item.content)}
                        className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
                        title="Copy Content"
                      >
                        <FiCopy />
                      </button>
                      <button 
                        onClick={() => handleDeleteSaved(item.id)}
                        className="p-2 bg-red-50 border border-red-100 text-red-600 hover:text-red-700 rounded-xl hover:bg-red-100 cursor-pointer"
                        title="Delete Content"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl border p-12 text-center text-gray-400 font-medium">
                  {searchQuery ? "No saved items match your criteria." : "You have not saved any generated content yet."}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: History Log */}
          {activeTab === 'history' && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => {
                  const paramsSummary = Object.entries(item.input_parameters || {})
                    .filter(([k, v]) => ['topic', 'subject', 'grade', 'length'].includes(k))
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' | ');

                  return (
                    <div 
                      key={item.id}
                      className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {item.feature_type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                            <FiClock /> {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm oswald-font tracking-wide uppercase truncate">
                          {item.input_parameters?.topic || 'Untitled'}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium truncate capitalize">
                          {paramsSummary || 'Custom prompt settings'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                        <button 
                          onClick={() => handleReuseHistory(item)}
                          className="flex items-center gap-1 text-xs font-bold bg-[var(--color-primary)] text-white py-2 px-4 rounded-xl hover:opacity-90 cursor-pointer"
                        >
                          <FiExternalLink /> View & Refine
                        </button>
                        <button 
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-2 bg-red-50 border border-red-100 text-red-600 hover:text-red-700 rounded-xl hover:bg-red-100 cursor-pointer"
                          title="Delete History Record"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-2xl border p-12 text-center text-gray-400 font-medium">
                  {searchQuery ? "No history entries matches search query." : "Your content generation history is empty."}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      <Footer />
    </div>
  );
}
