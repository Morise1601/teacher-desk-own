"use client";

import LoadingScreen from '@/components/ui/loading-screen';

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../shared/NavBar";
import { 
  Users, 
  Building2, 
  Search, 
  ChevronRight,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { encryptData, decryptData } from "@/lib/crypto";
import { 
  getInitialConnectionsDataAction,
  searchTeachersAction, 
  sendFriendRequestAction,
  acceptFriendRequestAction,
  rejectFriendRequestAction,
  cancelFriendRequestAction,
  followInstitutionAction,
  unfollowInstitutionAction
} from "@/app/actions/connections";
import TeacherCard from "./components/TeacherCard";
import InstitutionCard from "./components/InstitutionCard";
import RequestCard from "./components/RequestCard";
import { toast } from "react-hot-toast";
import { UserAvatar } from "@/components/ui/user-avatar";
import Link from "next/link";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { 
  Briefcase, 
  Library, 
  GraduationCap, 
  MapPin, 
  Mail, 
  Phone,
  Calendar,
  Award,
  Globe,
  UserPlus
} from "lucide-react";

type Tab = "discover" | "teachers" | "institutions" | "network";

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  // Data State
  const [summary, setSummary] = useState<any>({ friendsCount: 0, incomingRequests: [], sentRequests: [] });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        await fetchData(authUser.id);
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchData = async (userId: string) => {
    try {
      const res = decryptData(await getInitialConnectionsDataAction(userId) as string);
      if (res.success) {
          const { summary, teachers, institutions, friends } = res.data;
          setSummary(summary);
          setTeachers(teachers.filter((t: any) => t.auth_id !== userId));
          setInstitutions(institutions);
          setFriends(friends);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    startTransition(async () => {
      const res = decryptData(await searchTeachersAction(searchQuery) as string);
      if (res.success) {
        setTeachers(res.data.filter((t: any) => t.auth_id !== user?.id));
        // If searching, stay on current tab but results are filtered
        toast.success(`Found ${res.data.length} professionals`);
      }
    });
  };

  const onAddFriend = async (receiverId: string) => {
    const res = decryptData(await sendFriendRequestAction(encryptData({ senderId: user.id, receiverId })) as string);
    if (res.success) {
      toast.success("Request sent!");
      fetchData(user.id);
    } else {
      toast.error(res.message);
    }
  };

  const onAcceptRequest = async (requestId: string) => {
    const res = decryptData(await acceptFriendRequestAction(encryptData({ requestId, userId: user.id })) as string);
    if (res.success) {
      toast.success("Connection established!");
      fetchData(user.id);
    }
  };

  const onIgnoreRequest = async (requestId: string) => {
    const res = decryptData(await rejectFriendRequestAction(encryptData({ requestId, userId: user.id })) as string);
    if (res.success) {
      toast.success("Request ignored.");
      fetchData(user.id);
    }
  };

  const onCancelRequest = async (requestId: string) => {
    const res = decryptData(await cancelFriendRequestAction(encryptData({ requestId, userId: user.id })) as string);
    if (res.success) {
      toast.success("Request cancelled.");
      fetchData(user.id);
    }
  };

  const onToggleFollow = async (instId: string, shouldFollow: boolean) => {
    const payload = encryptData({ userId: user.id, institutionId: instId });
    const res = decryptData((shouldFollow ? await followInstitutionAction(payload) : await unfollowInstitutionAction(payload)) as string);
    if (res.success) {
      toast.success(shouldFollow ? "Followed!" : "Unfollowed");
      // Update local count/state
      setInstitutions(prev => prev.map(inst => 
        inst.id === instId 
          ? { ...inst, is_following: shouldFollow, follower_count: inst.follower_count + (shouldFollow ? 1 : -1) } 
          : inst
      ));
    }
  };

  const handleViewProfile = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsProfileSheetOpen(true);
  };

  if (loading) return <LoadingScreen message="Syncing professional network" icon={<Users className="text-white w-8 h-8" />} />;

  return (
    <div className="min-h-screen bg-[#f1f5f9] selection:bg-[var(--color-primary)] selection:text-white">
      <Navbar />

      {/* Hero Section - Immersive Background */}
      <div className="relative overflow-hidden bg-[var(--color-primary)] pt-20 pb-32 md:pt-24 md:pb-40">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#ffffff_1px,transparent_1px)] bg-[length:24px_24px]"></div>
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-white text-center md:text-left"
                >
                    <h1 className="text-3xl md:text-5xl font-bold oswald-font tracking-tight mb-3 leading-tight">
                        Forge Your <span className="text-indigo-400">Academic</span> Legacy
                    </h1>
                    <p className="text-sm md:text-base text-white/70 max-w-lg brcob-font leading-relaxed">
                        Connect with leading educators and institutions. Your network is your greatest asset.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full md:w-[450px]"
                >
                    <div className="bg-white/10 backdrop-blur-2xl p-1 rounded-lg border border-white/20 shadow-2xl overflow-hidden group">
                        <div className="bg-white rounded-lg p-1 flex items-center gap-2 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all duration-500">
                            <form onSubmit={handleSearch} className="flex-grow flex items-center pl-4 gap-2">
                                <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search professionals..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-xs py-3 text-gray-800 brcob-font placeholder:text-gray-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button 
                                    type="submit"
                                    className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg text-xs font-bold capitalize tracking-[0.15em] oswald-font shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Search
                                </button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-16 md:-mt-20 relative z-20 pb-20">
        {/* Innovative 2x2 Mobile Grid Tabs / Flex Desktop */}
        <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-lg shadow-lg border border-white w-full md:w-fit mx-auto md:mx-0">
                <div className="grid grid-cols-2 md:flex md:items-center gap-1.5">
                    {[
                        { id: 'discover', label: 'Discover', icon: Sparkles },
                        { id: 'teachers', label: 'Teachers', icon: Users },
                        { id: 'institutions', label: 'Institutions', icon: Building2 },
                        { id: 'network', label: 'Network', icon: ChevronRight }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`relative flex items-center justify-center md:justify-start gap-2.5 px-4 md:px-6 py-3 rounded-lg text-xs font-bold capitalize tracking-wide transition-all duration-300 oswald-font z-10 group ${
                                    isActive 
                                    ? 'text-white' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabBackground"
                                        className="absolute inset-0 bg-[var(--color-primary)] rounded-lg -z-10 shadow-md"
                                        transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                                    />
                                )}
                                
                                <tab.icon className={`w-4 h-4 transition-all duration-300 ${isActive ? 'scale-110' : ''}`} />
                                
                                <span className="relative flex items-center gap-1.5">
                                    {tab.label}
                                    {tab.id === 'network' && summary.incomingRequests.length > 0 && (
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-1 ring-white">
                                            {summary.incomingRequests.length}
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "discover" && (
            <motion.div
              key="discover-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              {/* Quick Stats Grid - More Premium */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Connections', value: summary.friendsCount, icon: Users, color: 'from-blue-600 to-indigo-600' },
                    { label: 'Active Invitations', value: summary.incomingRequests.length, icon: UserPlus, color: 'from-emerald-500 to-teal-600' },
                    { label: 'Following Organizations', value: institutions.filter(i => i.is_following).length, icon: Building2, color: 'from-amber-500 to-orange-600' }
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-500 group flex items-center justify-between"
                    >
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 brcob-font">{stat.label}</p>
                            <h4 className="text-2xl font-bold oswald-font text-gray-900">{stat.value}</h4>
                        </div>
                        <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </motion.div>
                ))}
              </div>

              {/* Invitations - If any */}
              {(summary.incomingRequests.length > 0 || summary.sentRequests.length > 0) && (
                <section className="space-y-8">
                    {summary.incomingRequests.length > 0 && (
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-10 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                                <h3 className="text-xl font-bold text-gray-900 oswald-font">Pending Invitations</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {summary.incomingRequests.map((req: any, i: number) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={req.id}
                                    >
                                        <RequestCard 
                                            request={{
                                                id: req.id,
                                                type: 'incoming',
                                                full_name: req.sender?.full_name || "Unknown",
                                                subject: req.sender?.specialization,
                                                institution: req.sender?.institution_name,
                                                profile_pic_url: req.sender?.profiles?.profile_pic_url,
                                                timestamp: new Date(req.created_at).toLocaleDateString()
                                            }}
                                            onAccept={onAcceptRequest}
                                            onIgnore={onIgnoreRequest}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {summary.sentRequests.length > 0 && (
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-10 w-1.5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                                <h3 className="text-xl font-bold text-gray-900 oswald-font">Sent Invitations</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {summary.sentRequests.map((req: any, i: number) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={req.id}
                                    >
                                        <RequestCard 
                                            request={{
                                                id: req.id,
                                                type: 'sent',
                                                full_name: req.receiver?.full_name || "Unknown Professional",
                                                subject: req.receiver?.specialization,
                                                institution: req.receiver?.institution_name,
                                                profile_pic_url: req.receiver?.profiles?.profile_pic_url,
                                                timestamp: new Date(req.created_at).toLocaleDateString()
                                            }}
                                            onCancel={onCancelRequest}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
              )}

              {/* Discovery Radar Section */}
              <section>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-1.5 bg-[var(--color-primary)] rounded-full shadow-[0_0_15px_rgba(20,60,100,0.3)]"></div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 oswald-font">Discovery Radar</h3>
                            <p className="text-xs text-gray-400 font-bold tracking-widest brcob-font uppercase mt-1">Suggested for your network</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActiveTab('teachers')} 
                        className="group flex items-center gap-2 bg-white px-5 py-2.5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all oswald-font"
                    >
                        <span className="text-xs font-bold capitalize tracking-widest">See all</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teachers.slice(0, 8).map((t: any, i: number) => (
                    <motion.div
                        key={t.auth_id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <TeacherCard 
                          teacher={t} 
                          onAddFriend={onAddFriend}
                          onViewProfile={handleViewProfile}
                          status={
                            friends.some((f: any) => f.auth_id === t.auth_id) ? 'accepted' :
                            summary.sentRequests.some((r: any) => r.receiver_id === t.auth_id) ? 'pending' : 'none'
                          }
                        />
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Institutions Spotlight */}
              <section className="relative overflow-hidden bg-white p-6 md:p-10 rounded-lg border border-gray-100 shadow-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 oswald-font mb-2">Institution Spotlight</h3>
                                <p className="text-sm text-gray-500 max-w-lg brcob-font">Connect with world-class academic institutions and stay updated.</p>
                            </div>
                            <button onClick={() => setActiveTab('institutions')} className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg text-xs font-bold capitalize tracking-widest oswald-font shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                                Browse all
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {institutions.slice(0, 3).map((inst: any, i: number) => (
                                <motion.div
                                    key={inst.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <InstitutionCard 
                                        institution={inst} 
                                        onToggleFollow={onToggleFollow}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
              </section>
            </motion.div>
          )}

          {activeTab === "teachers" && (
            <motion.div
              key="teachers-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-10"
            >
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 oswald-font">Professional Directory</h3>
                        <p className="text-gray-400 font-bold tracking-widest oswald-font uppercase text-[10px] mt-1">Showing {teachers.length} profiles</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-indigo-50 text-[var(--color-primary)] rounded-xl flex items-center justify-center">
                            <Search className="w-5 h-5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Filter directory..."
                            className="bg-transparent border-none focus:ring-0 text-sm oswald-font"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {teachers.map((t: any, i: number) => (
                    <motion.div
                        key={t.auth_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i % 12) * 0.03 }}
                    >
                        <TeacherCard 
                          teacher={t} 
                          onAddFriend={onAddFriend}
                          onViewProfile={handleViewProfile}
                          status={
                            friends.some((f: any) => f.auth_id === t.auth_id) ? 'accepted' :
                            summary.sentRequests.some((r: any) => r.receiver_id === t.auth_id) ? 'pending' : 'none'
                          }
                        />
                    </motion.div>
                 ))}
               </div>
            </motion.div>
          )}

          {activeTab === "institutions" && (
            <motion.div
              key="institutions-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-10"
            >
               <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 oswald-font">Educational Partners</h3>
                        <p className="text-gray-400 font-bold tracking-widest oswald-font uppercase text-[10px] mt-1">{institutions.length} Registered</p>
                    </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {institutions.map((inst: any, i: number) => (
                    <motion.div
                        key={inst.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i % 9) * 0.05 }}
                    >
                        <InstitutionCard 
                            institution={inst} 
                            onToggleFollow={onToggleFollow}
                        />
                    </motion.div>
                 ))}
               </div>
            </motion.div>
          )}

          {activeTab === "network" && (
             <motion.div
               key="network-tab"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="space-y-12"
             >
                <section>
                    <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 oswald-font mb-1">My Network Circle</h3>
                                <p className="text-sm text-gray-500 brcob-font max-w-md">Manage your professional relationships.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-[var(--color-primary)] oswald-font">{friends.length}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 brcob-font">Connections</p>
                                </div>
                                <div className="h-10 w-px bg-gray-200"></div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-amber-500 oswald-font">{summary.sentRequests.length}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 brcob-font">Sent</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {summary.incomingRequests.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                            <h3 className="text-2xl font-bold text-gray-900 oswald-font">Incoming Requests</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {summary.incomingRequests.map((req: any, i: number) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={req.id}
                                >
                                    <RequestCard 
                                        request={{
                                            id: req.id,
                                            type: 'incoming',
                                            full_name: req.sender?.full_name || "Unknown",
                                            subject: req.sender?.specialization,
                                            institution: req.sender?.institution_name,
                                            profile_pic_url: req.sender?.profiles?.profile_pic_url,
                                            timestamp: new Date(req.created_at).toLocaleDateString()
                                        }}
                                        onAccept={onAcceptRequest}
                                        onIgnore={onIgnoreRequest}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1.5 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
                        <h3 className="text-2xl font-bold text-gray-900 oswald-font">Connected Professionals</h3>
                    </div>
                    {friends.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {friends.map((friend: any, i: number) => (
                                <motion.div 
                                    key={friend.auth_id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                   <TeacherCard 
                                     teacher={friend} 
                                     onAddFriend={() => {}}
                                     onViewProfile={handleViewProfile}
                                     status="accepted"
                                   />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg p-10 text-center border border-dashed border-gray-200">
                            <Users className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold oswald-font uppercase tracking-widest text-xs mb-4">Your network is waiting</p>
                            <button 
                                onClick={() => setActiveTab('discover')} 
                                className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg text-xs font-bold capitalize tracking-widest oswald-font shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Start Discovering
                            </button>
                        </div>
                    )}
                </section>

                {summary.sentRequests.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-1.5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                            <h3 className="text-2xl font-bold text-gray-900 oswald-font">Sent Invitations</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {summary.sentRequests.map((req: any, i: number) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={req.id}
                                >
                                    <RequestCard 
                                        request={{
                                            id: req.id,
                                            type: 'sent',
                                            full_name: req.receiver?.full_name || "Unknown Professional",
                                            subject: req.receiver?.specialization,
                                            institution: req.receiver?.institution_name,
                                            profile_pic_url: req.receiver?.profiles?.profile_pic_url,
                                            timestamp: new Date(req.created_at).toLocaleDateString()
                                        }}
                                        onCancel={onCancelRequest}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}
              </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Teacher Profile Sheet */}
      <Sheet
        open={isProfileSheetOpen}
        onClose={() => setIsProfileSheetOpen(false)}
        title="Professional profile"
        description="Teacher information & background"
        width="max-w-md"
        footer={
          selectedTeacher && (
            <SheetFooter>
               {friends.some((f: any) => f.auth_id === selectedTeacher.auth_id) ? (
                 <Link 
                   href={`/messages?userId=${selectedTeacher.auth_id}`}
                   className="w-full py-3 bg-[var(--color-primary)] text-white text-center rounded-xl text-xs font-bold capitalize tracking-widest oswald-font shadow-lg"
                 >
                   Open conversation
                 </Link>
               ) : (
                 <button 
                   onClick={() => onAddFriend(selectedTeacher.auth_id)}
                   className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold capitalize tracking-widest oswald-font shadow-lg flex items-center justify-center gap-2"
                 >
                   <UserPlus className="w-4 h-4" />
                   Send connection request
                 </button>
               )}
            </SheetFooter>
          )
        }
      >
        {selectedTeacher && (
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center p-5 bg-gradient-to-br from-indigo-50 to-white rounded-lg border border-indigo-100 shadow-sm">
               <UserAvatar 
                 src={selectedTeacher.profile_pic_url} 
                 name={selectedTeacher.full_name} 
                 className="w-20 h-20 rounded-lg border-4 border-white shadow-md mb-3" 
               />
               <h3 className="text-lg font-bold text-gray-900 oswald-font tracking-tight">{selectedTeacher.full_name}</h3>
               <p className="text-xs font-bold text-[var(--color-primary)] capitalize tracking-widest oswald-font mt-1">{selectedTeacher.specialization || "Professional educator"}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400 font-bold capitalize tracking-widest brcob-font mb-1">Mutuals</p>
                  <p className="text-base font-bold text-gray-900 oswald-font">{selectedTeacher.mutual_connections || 0}</p>
               </div>
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400 font-bold capitalize tracking-widest brcob-font mb-1">Status</p>
                  <div className="flex items-center justify-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                     <p className="text-xs font-bold text-gray-700 oswald-font capitalize tracking-tight">Active</p>
                  </div>
               </div>
            </div>

            {/* Detailed Info */}
            <div className="space-y-6">
               <section>
                  <h4 className="text-xs font-bold text-gray-400 capitalize tracking-[0.2em] oswald-font mb-4 border-b border-gray-100 pb-2">Academic details</h4>
                  <div className="space-y-4">
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                           <GraduationCap className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <div>
                           <p className="text-[10px] text-gray-400 font-bold capitalize tracking-widest brcob-font">Qualification</p>
                           <p className="text-sm font-medium text-gray-800">{selectedTeacher.qualification || "Advanced degree"}</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                           <Library className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <div>
                           <p className="text-[10px] text-gray-400 font-bold capitalize tracking-widest brcob-font">Institution</p>
                           <p className="text-sm font-medium text-gray-800">{selectedTeacher.institution_name || "Academic institution"}</p>
                        </div>
                     </div>
                  </div>
               </section>

               <section>
                  <h4 className="text-xs font-bold text-gray-400 capitalize tracking-[0.2em] oswald-font mb-4 border-b border-gray-100 pb-2">Contact & bio</h4>
                  <div className="space-y-4">
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                           <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                           <p className="text-[10px] text-gray-400 font-bold capitalize tracking-widest brcob-font">Location</p>
                           <p className="text-sm font-medium text-gray-800">{selectedTeacher.location || "City, country"}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                           <Globe className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">Personal website</p>
                     </div>
                  </div>
               </section>
            </div>
          </div>
        )}
      </Sheet>

      {/* Floating Status Bar */}
      <AnimatePresence>
        {isPending && (
            <motion.div 
                initial={{ y: 100, x: "-50%" }}
                animate={{ y: 0, x: "-50%" }}
                exit={{ y: 100, x: "-50%" }}
                className="fixed bottom-8 left-1/2 z-[100]"
            >
                <div className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-md border border-white/10">
                    <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold capitalize tracking-widest oswald-font">Syncing network...</span>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
