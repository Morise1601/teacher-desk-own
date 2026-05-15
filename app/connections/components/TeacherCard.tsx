"use client";
import { UserAvatar } from "@/components/ui/user-avatar";
import { motion } from "framer-motion";
import { UserPlus, Check, Briefcase, Library, GraduationCap, Users2, MessageSquare, ExternalLink, Lock, Sparkles, MapPin, ChevronRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface TeacherCardProps {
  teacher: {
    id: string;
    auth_id: string;
    full_name: string;
    specialization?: string;
    qualification?: string;
    institution_name?: string;
    profile_pic_url?: string;
    mutual_connections?: number;
    profiles?: {
      profile_pic_url?: string;
      location?: string;
    };
  };
  onAddFriend: (teacherId: string) => void;
  onViewProfile: (teacher: any) => void;
  status?: 'none' | 'pending' | 'accepted' | 'rejected';
}

export default function TeacherCard({ teacher, onAddFriend, onViewProfile, status = 'none' }: TeacherCardProps) {
  const [internalStatus, setInternalStatus] = useState(status);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (internalStatus === 'none') {
      onAddFriend(teacher.auth_id);
      setInternalStatus('pending');
    }
  };

  const profilePic = teacher.profiles?.profile_pic_url || teacher.profile_pic_url;

  return (
    <div 
      className="perspective-1000 w-full h-[160px] cursor-pointer group"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateX: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100, damping: 20 }}
        className="relative w-full h-full preserve-3d"
      >
        {/* FRONT SIDE - Landscape Layout */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(0deg) translateZ(1px)' }}
        >
          <div className="h-full w-full bg-white rounded-2xl border border-gray-100 flex items-center p-4 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
            {/* Design Accents */}
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-indigo-50/30 to-transparent" />
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[var(--color-primary)] opacity-[0.03] rounded-full" />

            {/* Profile Image - Left Side */}
            <div className="relative z-10 shrink-0 mr-5">
              <div className="absolute inset-0 bg-[var(--color-primary)] rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <UserAvatar
                src={profilePic}
                name={teacher.full_name}
                className="relative w-24 h-24 rounded-2xl shadow-lg border-2 border-white z-10 object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute -bottom-1 -right-1 bg-[var(--color-primary)] text-white p-1 rounded-lg shadow-lg border border-white z-20">
                  <GraduationCap className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* Content - Right Side */}
            <div className="flex-grow min-w-0 z-10 py-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-gray-900 oswald-font tracking-tight line-clamp-1 truncate">
                        {teacher.full_name}
                    </h3>
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                </div>
                
                <div className="flex items-center gap-1.5 mb-3">
                    <div className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Briefcase className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-bold uppercase tracking-widest oswald-font line-clamp-1">
                            {teacher.specialization || "Educator"}
                        </span>
                    </div>
                </div>

                <div className="space-y-1.5 mb-2">
                    <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-3 h-3 text-[var(--color-primary)] opacity-60" />
                        <span className="text-[10px] font-bold oswald-font truncate capitalize opacity-80">
                            {teacher.profiles?.location || "Global Network"}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Users2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-bold text-gray-900 oswald-font">{teacher.mutual_connections || 0} Mutuals</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end text-[var(--color-primary)] font-bold text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Flip for details <ChevronRight className="w-3 h-3" />
                </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE - Landscape Flip (rotateX) */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg) translateZ(1px)' }}
        >
          <div className="h-full w-full bg-gradient-to-br from-[var(--color-primary)] to-[#1e1b4b] rounded-2xl p-5 flex flex-col text-white shadow-2xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 blur-sm" />
            
            <div className="relative z-10 grid grid-cols-2 gap-4 flex-grow items-center">
                <div className="space-y-3">
                   <div className="flex items-start gap-3">
                      <Library className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                         <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest oswald-font">Works At</p>
                         <p className="text-[10px] font-bold opacity-90 oswald-font line-clamp-2">{teacher.institution_name || "Academic Partner"}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <GraduationCap className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                         <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest oswald-font">Degree</p>
                         <p className="text-[10px] font-bold opacity-90 oswald-font line-clamp-1">{teacher.qualification || "Educational Degree"}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-2 pl-4 border-l border-white/10">
                   <button 
                     className="w-full flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-[10px] font-bold uppercase tracking-widest oswald-font"
                     onClick={(e) => { e.stopPropagation(); onViewProfile(teacher); }}
                   >
                     <ExternalLink className="w-3 h-3" /> Info
                   </button>

                   {status === 'accepted' ? (
                     <Link 
                       href={`/messages?userId=${teacher.auth_id}`}
                       className="flex items-center justify-center gap-2 py-2 bg-white text-[var(--color-primary)] hover:bg-gray-100 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest oswald-font"
                       onClick={(e) => e.stopPropagation()}
                     >
                       <MessageSquare className="w-3.5 h-3.5" /> Chat
                     </Link>
                   ) : (
                     <div className="flex items-center justify-center gap-2 py-2 bg-white/5 text-white/20 rounded-xl border border-white/10 cursor-not-allowed">
                       <Lock className="w-3.5 h-3.5" /> Locked
                     </div>
                   )}
                </div>
            </div>

            <button
               onClick={handleAction}
               disabled={internalStatus !== 'none'}
               className={`relative z-10 w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 oswald-font mt-2 shadow-lg ${
                 internalStatus === 'none'
                   ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-indigo-500/20"
                   : internalStatus === 'pending'
                   ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                   : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
               }`}
            >
               {internalStatus === 'none' ? (
                 <>
                   <UserPlus className="w-3.5 h-3.5" /> Send Request
                 </>
               ) : (
                 <>
                   {internalStatus === 'pending' ? <Check className="w-3.5 h-3.5" /> : <Users2 className="w-3.5 h-3.5" />}
                   {internalStatus === 'pending' ? 'Request Sent' : 'Connected'}
                 </>
               )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
