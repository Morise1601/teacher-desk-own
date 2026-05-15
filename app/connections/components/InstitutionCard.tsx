"use client";
import { motion } from "framer-motion";
import { Building2, MapPin, Users, Bell, BellRing, Info, Globe, Calendar, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface InstitutionCardProps {
  institution: {
    id: string;
    name: string;
    location?: string;
    logo_url?: string;
    follower_count: number;
    is_following?: boolean;
    type?: string;
    description?: string;
    established?: string;
  };
  onToggleFollow: (institutionId: string, isFollowing: boolean) => void;
}

export default function InstitutionCard({ institution, onToggleFollow }: InstitutionCardProps) {
  const [isFollowing, setIsFollowing] = useState(institution.is_following);
  const [count, setCount] = useState(institution.follower_count);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isFollowing;
    onToggleFollow(institution.id, nextState);
    setIsFollowing(nextState);
    setCount(prev => nextState ? prev + 1 : prev - 1);
  };

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
        {/* FRONT SIDE - Landscape */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(0deg) translateZ(1px)' }}
        >
          <div className="h-full w-full bg-white rounded-2xl border border-gray-100 flex items-center p-4 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500/20" />
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-emerald-50/50 to-transparent" />

            {/* Logo Section - Left */}
            <div className="relative shrink-0 mr-5">
                <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center border-2 border-gray-100 shadow-md overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
                    {institution.logo_url ? (
                        <Image src={institution.logo_url} alt={institution.name} fill className="object-cover" />
                    ) : (
                        <Building2 className="w-10 h-10 text-gray-300" />
                    )}
                </div>
                <div className="absolute -top-2 -left-2 bg-emerald-500 text-white p-1 rounded-lg shadow-lg border border-white">
                    <ShieldCheck className="w-3 h-3" />
                </div>
            </div>

            {/* Content Section - Right */}
            <div className="flex-grow min-w-0 py-1">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1 oswald-font tracking-tight leading-tight">
                        {institution.name}
                    </h3>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                </div>
                
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg w-fit border border-gray-100">
                        <MapPin className="w-3 h-3 text-[var(--color-primary)]" />
                        <span className="text-[10px] font-bold text-gray-500 oswald-font uppercase tracking-tight line-clamp-1">
                            {institution.location || "Global Academic Hub"}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded oswald-font uppercase tracking-widest">
                            {institution.type || "School"}
                        </span>
                        <div className="flex items-center gap-1 text-emerald-600">
                            <Users className="w-3 h-3" />
                            <span className="text-[10px] font-bold oswald-font tracking-tight">{count} Followers</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE - Landscape Flip */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg) translateZ(1px)' }}
        >
          <div className="h-full w-full bg-gradient-to-br from-[#064e3b] to-[#065f46] rounded-2xl p-5 flex flex-col text-white shadow-2xl relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Building2 className="w-20 h-20" />
             </div>
             
             <div className="relative z-10 flex-grow grid grid-cols-2 gap-4 items-center">
                <div className="space-y-2 pr-4 border-r border-white/10">
                   <h4 className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1 oswald-font">Quick Info</h4>
                   <p className="text-[10px] text-white/80 line-clamp-3 leading-relaxed brcob-font opacity-90">
                     {institution.description || `Excellence in education and professional development within our global community.`}
                   </p>
                </div>

                <div className="space-y-2 pl-2">
                   <div className="flex items-center gap-2 mb-3">
                      <div className="bg-white/10 p-1.5 rounded-lg border border-white/10">
                         <Globe className="w-3 h-3 text-emerald-300" />
                      </div>
                      <span className="text-[9px] font-bold oswald-font uppercase tracking-widest opacity-70">Portal Active</span>
                   </div>
                   <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="w-full flex items-center justify-between py-2 px-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-[10px] font-bold uppercase tracking-widest oswald-font group/btn"
                    >
                      Explore <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>

             <button
               onClick={handleToggle}
               className={`relative z-10 w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg oswald-font mt-2 ${
                 isFollowing 
                   ? "bg-white/10 text-white border border-white/20" 
                   : "bg-white text-[#064e3b] hover:bg-emerald-50 shadow-emerald-900/20"
               }`}
             >
               {isFollowing ? (
                 <>
                   <BellRing className="w-3.5 h-3.5" /> Following
                 </>
               ) : (
                 <>
                   <Bell className="w-3.5 h-3.5" /> Follow Organization
                 </>
               )}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
