'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';
import LoadingScreen from '@/components/ui/loading-screen';
import { decryptData, encryptData } from '@/lib/crypto';
import { getUserRoleAction } from '@/app/actions/auth';
import { generateAIContentAction, saveAIHistoryAction, saveAIContentAction } from '@/app/actions/ai';
import { createPostAction } from '@/app/actions/posts';
import { 
  FiArrowLeft, FiCopy, FiDownload, 
  FiSave, FiEdit2, FiCheck, FiRefreshCw, 
  FiSend, FiShare2, FiUser, FiTv, FiMessageSquare 
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { z } from 'zod';

// Define Zod schemas for validation
const baseSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic or lesson focus is required"),
  grade: z.string().min(1, "Grade/Class level is required"),
});

const assignmentSchema = baseSchema.extend({
  numQuestions: z.coerce.number().min(1, "Must generate at least 1 question"),
  marks: z.coerce.number().min(1, "Marks must be greater than 0"),
  duration: z.string().min(1, "Duration description is required"),
});

const announcementSchema = z.object({
  topic: z.string().min(1, "Announcement topic is required"),
  purpose: z.string().min(1, "Announcement purpose is required"),
  tone: z.string(),
  audience: z.string(),
});

const summarySchema = z.object({
  content: z.string().min(10, "Provide content text to summarize (min 10 chars)"),
  length: z.string(),
});

export default function AIAssistantWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const featureType = searchParams.get('feature') || 'lesson_plan';
  const templateId = searchParams.get('template');
  const reuseId = searchParams.get('reuse');

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form fields
  const [formFields, setFormFields] = useState<any>({
    subject: '',
    topic: '',
    grade: '',
    duration: '45 mins',
    objectives: '',
    method: 'Interactive Lecture',
    difficulty: 'Intermediate',
    language: 'English',
    instructions: '',
    numQuestions: 5,
    assignmentType: 'Short Answer',
    marks: 50,
    tone: 'Professional',
    audience: 'Students and Parents',
    purpose: '',
    content: '',
    length: 'Medium'
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Output states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  
  // Chat refinement states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Classrooms selection popover state
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Loading progress message rotation
  const [progressMessage, setProgressMessage] = useState('Initializing AI model...');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getProgressMessages = (type: string) => {
    switch (type) {
      case 'lesson_plan':
        return ["Outlining lesson plan structural modules...", "Defining behavioral targets...", "Developing classroom discussions...", "Curating take-home tasks..."];
      case 'assignment':
        return ["Consulting question banks...", "Drafting instruction booklets...", "Setting point values...", "Formulating marking rubrics..."];
      case 'quiz':
        return ["Drafting quiz questions...", "Formulating multi-choice distractors...", "Structuring descriptions and explanations..."];
      case 'announcement':
        return ["Applying tone profiles...", "Formulating memo updates...", "Refining notification text..."];
      case 'summary':
        return ["Scanning article details...", "Highlighting major facts...", "Drafting revision briefs..."];
      case 'notes':
        return ["Structuring concepts...", "Writing key examples...", "Adding study guides..."];
      case 'study_material':
        return ["Structuring booklet guide...", "Writing conceptual theories...", "Preparing review practice items..."];
      default:
        return ["Processing inputs...", "Polishing text structures...", "Generating output elements..."];
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
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
          if (decRole && decRole.success) role = decRole.role;
        }

        if (role !== 'teacher') {
          toast.error("Restricted access.");
          router.push('/dashboard');
          return;
        }

        // Fetch classrooms teacher manages
        const { data: classes } = await supabase
          .from('classrooms')
          .select('id, name')
          .eq('teacher_id', user.id);
        
        if (classes) setClassrooms(classes);

        // Detect Sandbox fallback
        try {
          const res = await supabase.from('ai_history').select('id').limit(1);
          if (res.error && (res.error.code === '42P01' || res.error.message.includes('does not exist'))) {
            setIsSandboxMode(true);
          }
        } catch (e) {
          setIsSandboxMode(true);
        }

        // Preload template or reuse if parameter passed
        if (templateId) {
          const templateData = localStorage.getItem('prefilled_ai_template');
          if (templateData) {
            const parsed = JSON.parse(templateData);
            setFormFields((prev: any) => ({ ...prev, ...parsed.input_parameters }));
            localStorage.removeItem('prefilled_ai_template');
          }
        }

        if (reuseId) {
          const reusedData = localStorage.getItem('reused_ai_content');
          if (reusedData) {
            const parsed = JSON.parse(reusedData);
            setFormFields((prev: any) => ({ ...prev, ...parsed.input_parameters }));
            setGeneratedContent(parsed.generated_content);
            setEditedContent(parsed.generated_content);
            
            // Populate initial history for refinement chat
            setChatMessages([
              { role: 'user', content: `Generate educational material for: ${parsed.input_parameters?.topic || 'Topic'}` },
              { role: 'model', content: parsed.generated_content }
            ]);
            localStorage.removeItem('reused_ai_content');
          }
        }

      } catch (err) {
        console.error(err);
        router.push('/dashboard/ai-assistant');
      } finally {
        setLoading(false);
      }
    };
    checkAccess();
  }, [router, templateId, reuseId]);

  // Handle messages scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Loading progress message interval
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      const msgs = getProgressMessages(featureType);
      let idx = 0;
      setProgressMessage(msgs[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % msgs.length;
        setProgressMessage(msgs[idx]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, featureType]);

  const handleInputChange = (key: string, val: any) => {
    setFormFields((prev: any) => ({ ...prev, [key]: val }));
    if (formErrors[key]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  // Run Zod validation
  const validateForm = () => {
    try {
      if (featureType === 'announcement') {
        announcementSchema.parse(formFields);
      } else if (featureType === 'summary') {
        summarySchema.parse(formFields);
      } else if (featureType === 'assignment' || featureType === 'quiz') {
        assignmentSchema.parse(formFields);
      } else if (featureType !== 'chat') {
        baseSchema.parse(formFields);
      }
      setFormErrors({});
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) errors[e.path[0] as string] = e.message;
        });
        setFormErrors(errors);
        toast.error("Please verify all mandatory fields.");
      }
      return false;
    }
  };

  // Submit AI Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (featureType !== 'chat' && !validateForm()) return;
    if (!userId) return;

    setIsGenerating(true);
    setGeneratedContent('');
    setChatMessages([]);

    try {
      const payloadEnc = encryptData({
        userId,
        featureType,
        params: formFields
      });

      const resEnc = await generateAIContentAction(payloadEnc);
      const res = decryptData(resEnc);

      if (res && res.success) {
        setGeneratedContent(res.content);
        setEditedContent(res.content);
        
        // Add to Chat history
        const initialPrompt = featureType === 'chat' ? formFields.topic : `Prompt builder execution for ${featureType.replace('_', ' ')}`;
        setChatMessages([
          { role: 'user', content: initialPrompt },
          { role: 'model', content: res.content }
        ]);

        // Save history in background (fail-silent fallback)
        try {
          const histPayload = encryptData({
            userId,
            featureType,
            params: formFields,
            generatedContent: res.content
          });
          const saveEnc = await saveAIHistoryAction(histPayload);
          const saveRes = decryptData(saveEnc);
          if (saveRes && saveRes.isFallback) {
            // Local fallback
            const localHist = localStorage.getItem('ai_history');
            const list = localHist ? JSON.parse(localHist) : [];
            list.unshift({
              id: 'local-' + Date.now(),
              feature_type: featureType,
              input_parameters: formFields,
              generated_content: res.content,
              created_at: new Date().toISOString()
            });
            localStorage.setItem('ai_history', JSON.stringify(list));
          }
        } catch (e) {
          console.error("Save history fail-silent:", e);
        }

        toast.success("Content generated successfully!");
      } else {
        toast.error(res?.message || "Generation failed.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Refine Content via Conversation
  const handleRefineContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !userId || chatLoading) return;

    const userMsg = userInput.trim();
    setUserInput('');
    setChatLoading(true);

    const updatedHistory = [
      ...chatMessages,
      { role: 'user', content: userMsg }
    ];
    setChatMessages(updatedHistory);

    try {
      const payloadEnc = encryptData({
        userId,
        featureType,
        params: formFields,
        history: updatedHistory
      });

      const resEnc = await generateAIContentAction(payloadEnc);
      const res = decryptData(resEnc);

      if (res && res.success) {
        setGeneratedContent(res.content);
        setEditedContent(res.content);
        setChatMessages([
          ...updatedHistory,
          { role: 'model', content: res.content }
        ]);
        toast.success("Refinement completed!");
      } else {
        toast.error(res?.message || "Refinement failed.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Refinement failed.");
    } finally {
      setChatLoading(false);
    }
  };

  // Action: Save to Desk
  const handleSaveToDesk = async () => {
    if (!userId || !generatedContent) return;

    const defaultTitle = formFields.topic 
      ? `AI Generated ${featureType.replace('_', ' ')}: ${formFields.topic}`
      : `AI Generated ${featureType.replace('_', ' ')} - ${new Date().toLocaleDateString()}`;
    
    const title = prompt("Enter a title for this saved content:", defaultTitle);
    if (title === null) return; // Cancelled
    if (!title.trim()) {
      toast.warn("Title cannot be empty.");
      return;
    }

    try {
      const payloadEnc = encryptData({
        userId,
        title: title.trim(),
        featureType,
        content: isEditing ? editedContent : generatedContent,
        isFavorite: false
      });

      const resEnc = await saveAIContentAction(payloadEnc);
      const res = decryptData(resEnc);

      if (res && res.success) {
        if (res.isFallback) {
          const localSaved = localStorage.getItem('ai_saved_content');
          const list = localSaved ? JSON.parse(localSaved) : [];
          list.unshift({
            id: 'local-' + Date.now(),
            title: title.trim(),
            feature_type: featureType,
            content: isEditing ? editedContent : generatedContent,
            is_favorite: false,
            created_at: new Date().toISOString()
          });
          localStorage.setItem('ai_saved_content', JSON.stringify(list));
        }
        toast.success("Saved to your Desk successfully!");
      } else {
        toast.error("Failed to save content.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error occurred while saving.");
    }
  };

  // Action: Copy Content
  const handleCopy = () => {
    const text = isEditing ? editedContent : generatedContent;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Action: Download Text
  const handleDownloadText = () => {
    const text = isEditing ? editedContent : generatedContent;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai_${featureType}_${formFields.topic.replace(/\s+/g, '_') || 'document'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Action: Print/Download PDF
  const handlePrintPDF = () => {
    const text = isEditing ? editedContent : generatedContent;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>AI Generated ${featureType.replace('_', ' ').toUpperCase()}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              h1 { color: #143c64; border-bottom: 2px solid #143c64; padding-bottom: 10px; font-size: 24px; margin-bottom: 20px; text-transform: uppercase; }
              h2 { color: #12501b; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 18px; }
              ul, ol { padding-left: 20px; }
              li { margin-bottom: 6px; font-size: 14px; }
              p { font-size: 14px; }
              blockquote { border-left: 4px solid #ccc; padding-left: 15px; margin: 15px 0; color: #666; font-style: italic; }
              .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 10px; color: #777; text-align: center; }
            </style>
          </head>
          <body>
            <h1>${formFields.topic || 'AI Content Plan'}</h1>
            <div style="white-space: pre-wrap;">${text}</div>
            <div class="footer">Generated using TeacherDesk AI Assistant on ${new Date().toLocaleDateString()}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  // Action: Post to Classroom
  const handlePostToClassroom = async () => {
    if (!selectedClassroom || !userId) {
      toast.warn("Please select a classroom.");
      return;
    }

    setIsPosting(true);
    const contentToPost = isEditing ? editedContent : generatedContent;

    try {
      const payloadEnc = encryptData({
        userId,
        postType: 'text',
        content: `### AI Generated Resource\n\n${contentToPost}`,
        visibility: 'classroom',
        classroomId: selectedClassroom
      });

      const resEnc = await createPostAction(payloadEnc);
      const res = decryptData(resEnc);

      if (res && res.success) {
        toast.success("Successfully posted to Classroom Board!");
        setShowClassroomModal(false);
      } else {
        toast.error(res?.message || "Failed to post to classroom.");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "An error occurred.");
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading AI environment..." icon={<LuSparkles className="text-white w-8 h-8 animate-pulse" />} />;
  }

  return (
    <div className="min-h-screen bg-[#eeeeee] flex flex-col font-sans">
      <Navbar />

      {/* --- Subheader Navigation --- */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <button
          onClick={() => router.push('/dashboard/ai-assistant')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
        >
          <FiArrowLeft className="text-sm" /> Dashboard
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
            Workspace
          </span>
          <span className="text-xs font-bold text-gray-700 capitalize">
            {featureType.replace('_', ' ')} Builder
          </span>
        </div>
      </div>

      {/* --- Unified Workspace Grid --- */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-3 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Prompt Builder Form (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-xs p-5 h-fit">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
            <LuSparkles className="text-[var(--color-primary)] text-lg" />
            <h3 className="font-bold text-slate-800 text-sm tracking-wide oswald-font uppercase">
              Prompt Settings Builder
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Custom parameters depending on featureType */}
            {featureType !== 'announcement' && featureType !== 'summary' && featureType !== 'chat' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Subject / Course *</label>
                  <input
                    type="text"
                    value={formFields.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="e.g. Science, Algebra, Literature"
                    className={`w-full bg-slate-50 border ${formErrors.subject ? 'border-red-400' : 'border-gray-200'} rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white`}
                  />
                  {formErrors.subject && <p className="text-[10px] text-red-500 font-semibold mt-1">{formErrors.subject}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Grade / Class Level *</label>
                  <input
                    type="text"
                    value={formFields.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    placeholder="e.g. Grade 10, Class 8"
                    className={`w-full bg-slate-50 border ${formErrors.grade ? 'border-red-400' : 'border-gray-200'} rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white`}
                  />
                  {formErrors.grade && <p className="text-[10px] text-red-500 font-semibold mt-1">{formErrors.grade}</p>}
                </div>
              </>
            )}

            {/* Standard Topic field for almost all */}
            {featureType !== 'summary' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  {featureType === 'chat' ? 'Ask a question or topic *' : 'Topic / Core Concept *'}
                </label>
                <input
                  type="text"
                  value={formFields.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  placeholder={featureType === 'chat' ? "Describe your question..." : "e.g. Photosynthesis, Newton's Laws"}
                  className={`w-full bg-slate-50 border ${formErrors.topic ? 'border-red-400' : 'border-gray-200'} rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white`}
                />
                {formErrors.topic && <p className="text-[10px] text-red-500 font-semibold mt-1">{formErrors.topic}</p>}
              </div>
            )}

            {/* Specific fields: Lesson Plan */}
            {featureType === 'lesson_plan' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Duration</label>
                    <input
                      type="text"
                      value={formFields.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Methodology</label>
                    <input
                      type="text"
                      value={formFields.method}
                      onChange={(e) => handleInputChange('method', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Learning Objectives</label>
                  <textarea
                    rows={2}
                    value={formFields.objectives}
                    onChange={(e) => handleInputChange('objectives', e.target.value)}
                    placeholder="Separate multiple with commas (optional)"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>
              </>
            )}

            {/* Specific fields: Assignment */}
            {featureType === 'assignment' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Assignment Type</label>
                    <select
                      value={formFields.assignmentType}
                      onChange={(e) => handleInputChange('assignmentType', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                    >
                      <option value="Short Answer">Short Answer</option>
                      <option value="Long Answer">Long Answer</option>
                      <option value="MCQ">MCQ</option>
                      <option value="Fill in the Blanks">Fill in the Blanks</option>
                      <option value="True/False">True/False</option>
                      <option value="Case Study">Case Study</option>
                      <option value="Practical Questions">Practical Questions</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">No. of Questions *</label>
                    <input
                      type="number"
                      value={formFields.numQuestions}
                      onChange={(e) => handleInputChange('numQuestions', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Total Marks *</label>
                    <input
                      type="number"
                      value={formFields.marks}
                      onChange={(e) => handleInputChange('marks', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Time Limit *</label>
                    <input
                      type="text"
                      value={formFields.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Specific fields: Quiz */}
            {featureType === 'quiz' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Number of Questions *</label>
                <input
                  type="number"
                  value={formFields.numQuestions}
                  onChange={(e) => handleInputChange('numQuestions', e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                />
              </div>
            )}

            {/* Specific fields: Announcement */}
            {featureType === 'announcement' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Purpose *</label>
                  <input
                    type="text"
                    value={formFields.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    placeholder="e.g. Schedule parent conference, reminder"
                    className={`w-full bg-slate-50 border ${formErrors.purpose ? 'border-red-400' : 'border-gray-200'} rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white`}
                  />
                  {formErrors.purpose && <p className="text-[10px] text-red-500 font-semibold mt-1">{formErrors.purpose}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tone</label>
                    <select
                      value={formFields.tone}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Friendly">Friendly</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Inspiring">Inspiring</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Audience</label>
                    <select
                      value={formFields.audience}
                      onChange={(e) => handleInputChange('audience', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                    >
                      <option value="Students and Parents">Both</option>
                      <option value="Students Only">Students</option>
                      <option value="Parents Only">Parents</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Specific fields: Summary */}
            {featureType === 'summary' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Source Text to Distill *</label>
                  <textarea
                    rows={4}
                    value={formFields.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Paste your paragraphs, notes, or article content here..."
                    className={`w-full bg-slate-50 border ${formErrors.content ? 'border-red-400' : 'border-gray-200'} rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white`}
                  />
                  {formErrors.content && <p className="text-[10px] text-red-500 font-semibold mt-1">{formErrors.content}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Summary Length</label>
                  <select
                    value={formFields.length}
                    onChange={(e) => handleInputChange('length', e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Short">Short Summary</option>
                    <option value="Medium">Medium Summary</option>
                    <option value="Detailed">Detailed Summary</option>
                  </select>
                </div>
              </>
            )}

            {/* Shared dropdowns: Difficulty, Language, Instructions */}
            {featureType !== 'announcement' && featureType !== 'summary' && featureType !== 'chat' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Difficulty</label>
                    <select
                      value={formFields.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Language</label>
                    <input
                      type="text"
                      value={formFields.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Custom Guidelines</label>
                  <textarea
                    rows={2}
                    value={formFields.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    placeholder="e.g. Include vocabulary list, add 2 chemistry experiments..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>
              </>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full cursor-pointer bg-[var(--color-primary)] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <LuSparkles /> {isGenerating ? 'Generating Content...' : 'Generate with AI'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: AI Previewer & Refinement Panel (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Top Panel: Content Output Box */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs flex-grow flex flex-col min-h-[450px]">
            
            {/* Header & Output controls */}
            <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 rounded-t-2xl">
              <h4 className="font-bold text-slate-800 text-sm tracking-wide oswald-font uppercase">
                Generated Plan Preview
              </h4>
              
              {generatedContent && !isGenerating && (
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-1 text-[11px] font-bold py-1.5 px-3 rounded-lg border transition-colors cursor-pointer ${
                      isEditing 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {isEditing ? <><FiCheck className="text-xs" /> Done Editing</> : <><FiEdit2 className="text-xs" /> Edit</>}
                  </button>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-bold bg-white border border-gray-200 text-gray-600 py-1.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <FiCopy className="text-xs" /> Copy
                  </button>
                  <button 
                    onClick={handleSaveToDesk}
                    className="flex items-center gap-1 text-[11px] font-bold bg-white border border-gray-200 text-gray-600 py-1.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <FiSave className="text-xs" /> Save Desk
                  </button>
                  
                  {/* Share / Classroom Actions */}
                  {classrooms.length > 0 && (
                    <button 
                      onClick={() => setShowClassroomModal(true)}
                      className="flex items-center gap-1 text-[11px] font-bold bg-white border border-gray-200 text-gray-600 py-1.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <FiShare2 className="text-xs" /> Add Classroom
                    </button>
                  )}

                  {/* Export dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-1 text-[11px] font-bold bg-white border border-gray-200 text-gray-600 py-1.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <FiDownload className="text-xs" /> Export &darr;
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-lg w-28 hidden group-hover:block z-40">
                      <button 
                        onClick={handleDownloadText}
                        className="w-full text-left text-[11px] font-bold px-3 py-2 text-gray-600 hover:bg-slate-50 hover:text-black border-b"
                      >
                        TXT File
                      </button>
                      <button 
                        onClick={handlePrintPDF}
                        className="w-full text-left text-[11px] font-bold px-3 py-2 text-gray-600 hover:bg-slate-50 hover:text-black"
                      >
                        PDF Document
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Display Body */}
            <div className="p-6 flex-grow flex flex-col justify-center min-h-[350px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-3 border-gray-100 border-t-[var(--color-primary)] rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700 animate-pulse">{progressMessage}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Please wait, compiling educational prompt...</p>
                  </div>
                </div>
              ) : generatedContent ? (
                isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full flex-grow p-4 border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[350px]"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none text-slate-800 text-sm overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-medium min-h-[350px]">
                    {generatedContent}
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-gray-400 font-medium">
                  <LuSparkles className="text-4xl mx-auto mb-3 text-slate-300 animate-pulse" />
                  <p className="text-sm font-bold">Workspace Ready</p>
                  <p className="text-xs text-slate-400 mt-1">Adjust parameters on the left and click "Generate" to construct your AI content plan.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel: Refinement Chat Companion (only when content generated) */}
          {generatedContent && !isGenerating && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                <FiMessageSquare className="text-purple-600 text-lg" />
                <h4 className="font-bold text-slate-800 text-xs tracking-wider oswald-font uppercase">
                  AI Refinement Assistant
                </h4>
              </div>

              {/* Chat history list */}
              <div className="max-h-[220px] overflow-y-auto space-y-3.5 pr-2">
                {chatMessages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  // Skip displaying the raw builder prompt for cleaner chat UI
                  if (index === 0 && !isUser) return null;

                  return (
                    <div 
                      key={index} 
                      className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className={`p-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                        isUser 
                          ? 'bg-[var(--color-primary)] text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-800 rounded-tl-none'
                      }`}>
                        {msg.content.startsWith("Prompt builder execution") ? "Generated initial content plan." : msg.content}
                      </div>
                    </div>
                  );
                })}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold animate-pulse">
                    <FiRefreshCw className="animate-spin text-sm" /> AI Refinement Assistant is writing...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleRefineContent} className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="e.g. Make Question 2 harder, shorten the homework section..."
                  disabled={chatLoading}
                  className="flex-grow bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !userInput.trim()}
                  className="bg-[var(--color-primary)] text-white p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                >
                  <FiSend />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Classroom Posting Modal Dialog */}
      {showClassroomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <motion.div 
            className="bg-white rounded-2xl shadow-xl border p-6 max-w-md w-full"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="font-bold text-slate-800 text-base oswald-font uppercase mb-2">
              Post to Classroom Feed
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-4">
              Select which classroom board you want to publish this generated AI resource to.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Classroom</label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                >
                  <option value="">-- Choose Classroom --</option>
                  {classrooms.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-50 pt-4 mt-4">
                <button
                  onClick={() => setShowClassroomModal(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 py-2 px-4 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostToClassroom}
                  disabled={isPosting || !selectedClassroom}
                  className="bg-[var(--color-primary)] text-white font-bold text-xs py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                >
                  {isPosting ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
