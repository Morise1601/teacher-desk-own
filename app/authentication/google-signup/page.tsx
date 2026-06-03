'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserGraduate, FaUniversity, FaChevronRight, FaChevronLeft,
  FaUser, FaEnvelope, FaPhone, FaVenusMars, FaCalendarAlt,
  FaGraduationCap, FaBriefcase, FaMapMarkedAlt, FaGlobe, FaBuilding
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { registerGoogleTeacherAction, registerGoogleInstitutionAction } from '@/app/actions/auth';
import { getQualificationsAction, getSpecializationsAction, findOrCreateMetadataAction } from '@/app/actions/metadata';
import { getInstitutionsAction, findOrCreateInstitutionAction, checkInstitutionExistsAction, checkInstitutionByAddressAction } from '@/app/actions/institution';
import { decryptData, encryptData } from '@/lib/crypto';
import { toast } from 'react-toastify';
import { Loader2, ArrowRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MapPicker from '@/components/maps/MapPicker';
import { Button } from "@/components/ui/button";

export default function GoogleSignupPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [role, setRole] = useState<'teacher' | 'institution' | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Qualifications/Specializations/Institutions Lists
  const [qualifications, setQualifications] = useState<{id: string, name: string}[]>([]);
  const [specializations, setSpecializations] = useState<{id: string, name: string}[]>([]);
  const [institutions, setInstitutions] = useState<{id: string, name: string}[]>([]);
  const [isNewQual, setIsNewQual] = useState(false);
  const [isNewSpec, setIsNewSpec] = useState(false);
  const [customQual, setCustomQual] = useState('');
  const [customSpec, setCustomSpec] = useState('');
  const [showMap, setShowMap] = useState(false);
  
  // Form States
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  // Teacher Form Data (Pre-fill name and email later)
  const [teacherData, setTeacherData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    qualification: '',
    specialization: '',
    experience: '',
    institutionId: '',
    referedBy: ''
  });

  // Institution Form Data
  const [instData, setInstData] = useState({
    name: '',
    type: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    adminName: '',
    adminEmail: '',
    existingId: null as string | null
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          toast.error("Google session expired or invalid. Please sign in again.");
          router.push('/');
          return;
        }

        setSessionUser(user);
        
        // Prefill forms with verified Google info
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const email = user.email || '';

        setTeacherData(prev => ({
          ...prev,
          fullName,
          email
        }));

        setInstData(prev => ({
          ...prev,
          adminName: fullName,
          adminEmail: email,
          email: email // Default institution email to Google verified email
        }));

        // Fetch meta lists
        await Promise.all([
          fetchQualificationsList(),
          fetchInstitutionsList()
        ]);

      } catch (err) {
        toast.error("Failed to authenticate session.");
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [router]);

  const fetchQualificationsList = async () => {
    try {
      const encrypted = await getQualificationsAction();
      const response = decryptData(encrypted);
      if (response?.success) {
        setQualifications(response.data || []);
      }
    } catch (err) {
      console.error("Failed to load qualifications", err);
    }
  };

  const fetchSpecializationsList = async (qualId: string) => {
    if (!qualId || qualId === 'other') {
      setSpecializations([]);
      return;
    }
    try {
      const encrypted = await getSpecializationsAction(qualId);
      const response = decryptData(encrypted);
      if (response?.success) {
        setSpecializations(response.data || []);
      }
    } catch (err) {
      console.error("Failed to load specializations", err);
    }
  };

  const fetchInstitutionsList = async () => {
    try {
      const encrypted = await getInstitutionsAction();
      const response = decryptData(encrypted);
      if (response?.success) {
        setInstitutions(response.data || []);
      }
    } catch (err) {
      console.error("Failed to load institutions", err);
    }
  };

  const handleTeacherMapSelect = async (data: { name: string; address: string }) => {
    setRegistering(true);
    setShowMap(false);
    try {
      const securePayload = encryptData(data);
      const encryptedResponse = await findOrCreateInstitutionAction(securePayload);
      const response = decryptData(encryptedResponse);

      if (response && response.success) {
        if (response.isNew) {
          toast.success(`Registered new institution: ${response.data.name}`);
        } else {
          toast.info(`Linked to existing institution: ${response.data.name}`);
        }
        setTeacherData(prev => ({ ...prev, institutionId: response.data.id }));
        await fetchInstitutionsList();
      } else {
        toast.error(response?.message || "Failed to process institution selection.");
      }
    } catch (err) {
      toast.error("Map selection security error.");
    } finally {
      setRegistering(false);
    }
  };

  const handleInstitutionMapSelect = async (addr: string) => {
    setInstData(prev => ({ ...prev, address: addr }));
    if (errors.address) setErrors(prev => ({ ...prev, address: false }));
    
    setRegistering(true);
    try {
      const encryptedResponse = await checkInstitutionByAddressAction(addr);
      const response = decryptData(encryptedResponse);
      
      if (response?.success && response.exists) {
        if (response.isClaimed) {
          toast.error("An institution is already registered at this address.");
          setInstData(prev => ({ ...prev, address: '' }));
        } else {
          toast.info("Existing unclaimed stub found. You will claim this record.");
          const ext = response.data;
          setInstData(p => ({
            ...p,
            existingId: ext.id,
            name: ext.name || p.name,
            type: ext.type || p.type,
            email: ext.email || p.email,
            phone: ext.phone || p.phone,
            website: ext.website || p.website,
          }));
        }
      }
    } catch (err) {
      console.error("Map Address Check Error:", err);
    } finally {
      setRegistering(false);
    }
  };

  // STEP VALIDATIONS
  const validateTeacherStep = (currentStep: number) => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!teacherData.phone || teacherData.phone.length !== 10) { newErrors.phone = true; isValid = false; }
      if (!teacherData.gender) { newErrors.gender = true; isValid = false; }
      if (!teacherData.dob) { newErrors.dob = true; isValid = false; }
    } else if (currentStep === 2) {
      if (!teacherData.qualification || (teacherData.qualification === 'other' && !customQual)) { newErrors.qualification = true; isValid = false; }
      if (!teacherData.specialization || (teacherData.specialization === 'other' && !customSpec)) { newErrors.specialization = true; isValid = false; }
      if (!teacherData.experience) { newErrors.experience = true; isValid = false; }
    }

    setErrors(newErrors);
    if (!isValid) toast.error("Please fill all required fields correctly.");
    return isValid;
  };

  const validateInstStep = (currentStep: number) => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!instData.name) { newErrors.name = true; isValid = false; }
      if (!instData.type) { newErrors.type = true; isValid = false; }
      if (!instData.address) { newErrors.address = true; isValid = false; }
    } else if (currentStep === 2) {
      if (!instData.email) { newErrors.email = true; isValid = false; }
      if (!instData.phone || instData.phone.length !== 10) { newErrors.phone = true; isValid = false; }
    } else if (currentStep === 3) {
      if (!instData.adminName) { newErrors.adminName = true; isValid = false; }
      if (!instData.adminEmail) { newErrors.adminEmail = true; isValid = false; }
    }

    setErrors(newErrors);
    if (!isValid) toast.error("Please fill all required fields correctly.");
    return isValid;
  };

  const nextTeacherStep = () => {
    if (validateTeacherStep(step)) setStep(s => s + 1);
  };
  const prevTeacherStep = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  const nextInstStep = () => {
    if (validateInstStep(step)) setStep(s => s + 1);
  };
  const prevInstStep = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  // TEACHER SUBMISSION
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTeacherStep(2)) return;

    setRegistering(true);
    try {
      const qualName = teacherData.qualification === 'other' ? customQual : qualifications.find(q => q.id === teacherData.qualification)?.name || teacherData.qualification;
      const specName = teacherData.specialization === 'other' ? customSpec : specializations.find(s => s.id === teacherData.specialization)?.name || teacherData.specialization;

      // Seed qualification metadata
      const metadataResEnc = await findOrCreateMetadataAction(encryptData({
        qualificationName: qualName,
        specializationName: specName
      }));
      const metadataRes = decryptData(metadataResEnc);

      if (!metadataRes?.success) {
        toast.error("Academic metadata registry failed.");
        setRegistering(false);
        return;
      }

      const submission = {
        ...teacherData,
        qualification: qualName,
        specialization: specName,
        authId: sessionUser.id,
        googleId: sessionUser.user_metadata?.sub || '',
        avatarUrl: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || ''
      };

      const encrypted = encryptData(submission);
      const resEnc = await registerGoogleTeacherAction(encrypted);
      const response = decryptData(resEnc);

      if (response && response.success) {
        // Update Supabase Auth metadata role to match
        await supabase.auth.updateUser({
          data: { role: 'teacher' }
        });

        toast.success("Registration complete! Setting up your TeacherDesk...");
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        toast.error(response?.message || "Teacher registration failed.");
        setRegistering(false);
      }
    } catch (err) {
      toast.error("A network security failure occurred.");
      setRegistering(false);
    }
  };

  // INSTITUTION SUBMISSION
  const handleInstitutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInstStep(3)) return;

    setRegistering(true);
    try {
      const submission = {
        ...instData,
        authId: sessionUser.id,
        googleId: sessionUser.user_metadata?.sub || '',
        avatarUrl: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || ''
      };

      const encrypted = encryptData(submission);
      const resEnc = await registerGoogleInstitutionAction(encrypted);
      const response = decryptData(resEnc);

      if (response && response.success) {
        // Update role metadata
        await supabase.auth.updateUser({
          data: { role: 'institution_admin' }
        });

        toast.success("Institution registered successfully!");
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        toast.error(response?.message || "Institution registration failed.");
        setRegistering(false);
      }
    } catch (err) {
      toast.error("A database synchronization exception occurred.");
      setRegistering(false);
    }
  };

  const handleSelectRole = (r: 'teacher' | 'institution') => {
    setRole(r);
    setStep(1);
    setErrors({});
  };

  const handleBackToRoles = () => {
    setRole(null);
    setStep(1);
    setErrors({});
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex relative overflow-hidden select-none">
      <div className="absolute top-0 left-0 w-1/2 h-full bg-[#17116114] transform skew-x-12 origin-bottom-left z-1 hidden md:block" />

      {/* Main Container */}
      <div className="w-full relative z-10 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Role Selection */}
          {role === null && (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-md border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 md:p-10"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">
                  Welcome to TeacherDesk
                </h2>
                <p className="text-gray-400 mt-2 text-xs brcob-font max-w-sm mx-auto">
                  Verify your account type to proceed with password-free authentication.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teacher Card */}
                <motion.div
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectRole('teacher')}
                  className="group cursor-pointer bg-white border border-gray-100 hover:border-[var(--color-primary)] p-6 rounded-md shadow-sm transition-all duration-300 flex flex-col"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center mb-5 group-hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors">
                    <FaUserGraduate size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-primary)] oswald-font mb-2">Educator Profile</h3>
                  <p className="text-gray-400 text-xs mb-6 brcob-font leading-relaxed">
                    Build your global reputation, manage digital classrooms, and access premium research networks.
                  </p>
                  <div className="mt-auto flex items-center gap-1.5 text-[var(--color-primary)] font-bold text-[10px] tracking-wider uppercase brcob-font group-hover:gap-2.5 transition-all">
                    Register Educator <ArrowRight size={10} />
                  </div>
                </motion.div>

                {/* Institution Card */}
                <motion.div
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectRole('institution')}
                  className="group cursor-pointer bg-white border border-gray-100 hover:border-[var(--color-primary)] p-6 rounded-md shadow-sm transition-all duration-300 flex flex-col"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center mb-5 group-hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors">
                    <FaUniversity size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-primary)] oswald-font mb-2">Institution Entity</h3>
                  <p className="text-gray-400 text-xs mb-6 brcob-font leading-relaxed">
                    Digitize your campus, manage staff workflows, and scale academic impact globally.
                  </p>
                  <div className="mt-auto flex items-center gap-1.5 text-[var(--color-primary)] font-bold text-[10px] tracking-wider uppercase brcob-font group-hover:gap-2.5 transition-all">
                    Register Institution <ArrowRight size={10} />
                  </div>
                </motion.div>
              </div>

              <div className="text-center mt-8 pt-6 border-t border-gray-50">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/');
                  }}
                  className="text-xs text-red-500 font-semibold hover:underline"
                >
                  Sign out and exit
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2A: Teacher Registration Form (Multi-Step) */}
          {role === 'teacher' && (
            <motion.div
              key="teacher-registration"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-xl bg-white rounded-md border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 relative"
            >
              <AnimatePresence>
                {registering && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-md">
                    <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
                    <p className="mt-4 text-[var(--color-primary)] font-bold oswald-font tracking-wider text-xs uppercase">
                      Registering educator...
                    </p>
                  </div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mb-5 pb-2 border-b border-gray-50">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight">Complete Educator Desk</h3>
                  <p className="text-gray-400 text-[10px] brcob-font">Pre-filled with verified Google identity metadata.</p>
                </div>
                <button
                  onClick={handleBackToRoles}
                  className="p-2 text-gray-400 hover:text-[var(--color-primary)] rounded-full hover:bg-gray-50 transition-colors"
                >
                  <FaChevronLeft size={14} />
                </button>
              </div>

              {/* Progress Stepper for Teacher */}
              <div className="flex items-center gap-3 mt-4 mb-6">
                {[1, 2].map((s) => (
                  <div key={s} className="flex-1 flex flex-col gap-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-[var(--color-primary)] shadow-[0_0_8px_rgba(20,60,100,0.2)]' : 'bg-gray-100'}`} />
                    <span className={`text-[9px] font-bold brcob-font tracking-widest capitalize ${step >= s ? 'text-[var(--color-primary)]' : 'text-gray-300'}`}>Step 0{s}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleTeacherSubmit} className="authForms">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="teacher-step1" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                      {/* Pre-filled read-only Google data */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-gray-400 brcob-font">Full Name (from Google)</label>
                          <input
                            type="text"
                            disabled
                            value={teacherData.fullName}
                            className="w-full h-10 rounded-md px-4 bg-gray-100 border border-gray-100 text-sm text-gray-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-gray-400 brcob-font">Verified Email (from Google)</label>
                          <input
                            type="text"
                            disabled
                            value={teacherData.email}
                            className="w-full h-10 rounded-md px-4 bg-gray-100 border border-gray-100 text-sm text-gray-500 font-semibold"
                          />
                        </div>
                      </div>

                      {/* Step 1 Inputs */}
                      <div className="group space-y-1.5">
                        <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.phone ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                          Mobile Number *
                        </label>
                        <div className="relative">
                          <FaPhone className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 ${errors.phone ? 'text-red-400' : 'text-gray-300'}`} size={11} />
                          <PhoneInput 
                            value={teacherData.phone}
                            error={errors.phone}
                            onChange={v => {
                              setTeacherData({ ...teacherData, phone: v });
                              if (errors.phone && v.length === 10) setErrors(prev => ({ ...prev, phone: false }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="group space-y-1.5">
                          <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.gender ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                            Gender *
                          </label>
                          <div className="relative">
                            <FaVenusMars className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10" size={12} />
                            <Select
                              value={teacherData.gender}
                              onValueChange={v => {
                                setTeacherData({ ...teacherData, gender: v });
                                if (errors.gender) setErrors(prev => ({ ...prev, gender: false }));
                              }}
                            >
                              <SelectTrigger className={`pl-11 h-10 transition-all ${errors.gender ? 'border-red-500 bg-red-50/20' : 'border-gray-100 bg-gray-50/50'}`}>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="group space-y-1.5">
                          <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.dob ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                            Date of Birth *
                          </label>
                          <div className="relative">
                            <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                            <Input
                              type="date"
                              value={teacherData.dob}
                              className={`pl-11 h-10 bg-gray-50/50 ${errors.dob ? 'border-red-500 bg-red-50/20' : 'border-gray-100'}`}
                              onChange={e => {
                                setTeacherData({ ...teacherData, dob: e.target.value });
                                if (errors.dob) setErrors(prev => ({ ...prev, dob: false }));
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <motion.button 
                        type="button" 
                        whileHover={{ scale: 1.01 }} 
                        whileTap={{ scale: 0.99 }} 
                        onClick={nextTeacherStep} 
                        className="w-full h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 mt-4 brcob-font capitalize text-xs tracking-widest"
                      >
                        Continue to profile <FaChevronRight size={10} />
                      </motion.button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="teacher-step2" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                      {/* Step 2 Inputs */}
                      <div className="group space-y-1.5">
                        <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.qualification ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                          Academic Qualification *
                        </label>
                        <div className="relative space-y-2">
                          <div className="relative">
                            <FaGraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10" size={12} />
                            <Select
                              value={teacherData.qualification}
                              onValueChange={v => {
                                setTeacherData({ ...teacherData, qualification: v, specialization: '' });
                                setIsNewQual(v === 'other');
                                if (v !== 'other') fetchSpecializationsList(v);
                                if (errors.qualification) setErrors(prev => ({ ...prev, qualification: false }));
                              }}
                            >
                              <SelectTrigger className={`pl-11 h-10 transition-all ${errors.qualification ? 'border-red-500 bg-red-50/20' : 'border-gray-100 bg-gray-50/50'}`}>
                                <SelectValue placeholder="Select Qualification" />
                              </SelectTrigger>
                              <SelectContent>
                                {qualifications.map(q => (
                                  <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                                ))}
                                <SelectItem value="other" className="font-bold text-[var(--color-primary)]">+ Add Custom Qualification</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {isNewQual && (
                            <Input 
                              placeholder="Enter your qualification (e.g. Master of Arts)"
                              className="h-10 bg-white border-[var(--color-primary)] text-sm"
                              value={customQual}
                              onChange={e => {
                                setCustomQual(e.target.value);
                                if (errors.qualification) setErrors(prev => ({ ...prev, qualification: false }));
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="group space-y-1.5">
                          <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.specialization ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                            Specialization *
                          </label>
                          <div className="relative space-y-2">
                            <div className="relative">
                              <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10" size={12} />
                              <Select
                                value={teacherData.specialization}
                                disabled={!teacherData.qualification || (teacherData.qualification === 'other' && !isNewQual)}
                                onValueChange={v => {
                                  setTeacherData({ ...teacherData, specialization: v });
                                  setIsNewSpec(v === 'other');
                                  if (errors.specialization) setErrors(prev => ({ ...prev, specialization: false }));
                                }}
                              >
                                <SelectTrigger className={`pl-11 h-10 transition-all ${errors.specialization ? 'border-red-500 bg-red-50/20' : 'border-gray-100 bg-gray-50/50'}`}>
                                  <SelectValue placeholder="Select Specialization" />
                                </SelectTrigger>
                                <SelectContent>
                                  {specializations.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                  ))}
                                  <SelectItem value="other" className="font-bold text-[var(--color-primary)]">+ Add Custom Specialization</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {isNewSpec && (
                              <Input
                                placeholder="Enter specialization (e.g. Applied Linguistics)"
                                className="h-10 bg-white border-[var(--color-primary)] text-sm"
                                value={customSpec}
                                onChange={e => {
                                  setCustomSpec(e.target.value);
                                  if (errors.specialization) setErrors(prev => ({ ...prev, specialization: false }));
                                }}
                              />
                            )}
                          </div>
                        </div>

                        <div className="group space-y-1.5">
                          <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.experience ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                            Years of Experience *
                          </label>
                          <Input
                            type="number"
                            placeholder="e.g. 5"
                            value={teacherData.experience}
                            className={`h-10 bg-gray-50/50 ${errors.experience ? 'border-red-500 bg-red-50/20' : 'border-gray-100'}`}
                            onChange={e => {
                              setTeacherData({ ...teacherData, experience: e.target.value });
                              if (errors.experience) setErrors(prev => ({ ...prev, experience: false }));
                            }}
                          />
                        </div>
                      </div>

                      {/* Institution lookup */}
                      <div className="group space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-semibold text-gray-500 brcob-font">Institution Selection</label>
                          <button
                            type="button"
                            onClick={() => setShowMap(true)}
                            className="text-[10px] text-[var(--color-primary)] font-bold flex items-center gap-1 hover:underline"
                          >
                            <FaMapMarkedAlt size={10} /> Pick on map
                          </button>
                        </div>
                        <div className="relative">
                          <FaUniversity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10" size={12} />
                          <Select
                            value={teacherData.institutionId}
                            onValueChange={v => setTeacherData({ ...teacherData, institutionId: v })}
                          >
                            <SelectTrigger className="pl-11 h-10 border-gray-100 bg-gray-50/50">
                              <SelectValue placeholder="Search and select institution" />
                            </SelectTrigger>
                            <SelectContent>
                              {institutions.map(inst => (
                                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {showMap && (
                        <MapPicker 
                          onLocationSelect={() => {}}
                          onSelect={handleTeacherMapSelect}
                          onClose={() => setShowMap(false)}
                        />
                      )}

                      <div className="flex gap-3 mt-6">
                        <motion.button 
                          type="button" 
                          whileHover={{ scale: 1.01 }} 
                          whileTap={{ scale: 0.99 }} 
                          onClick={prevTeacherStep} 
                          className="flex-1 h-10 border border-gray-100 text-gray-400 font-bold rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 brcob-font text-[10px] capitalize tracking-widest"
                        >
                           Back
                        </motion.button>
                        <Button 
                           type="submit" 
                           disabled={registering} 
                           className="flex-[2] h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 brcob-font capitalize text-[10px] tracking-widest"
                           loading={registering}
                        >
                          Complete Registration
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          )}

          {/* STEP 2B: Institution Registration Form (Multi-Step) */}
          {role === 'institution' && (
            <motion.div
              key="institution-registration"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-xl bg-white rounded-md border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 relative"
            >
              <AnimatePresence>
                {registering && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-md">
                    <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
                    <p className="mt-4 text-[var(--color-primary)] font-bold oswald-font tracking-wider text-xs uppercase">
                      Registering institution...
                    </p>
                  </div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mb-5 pb-2 border-b border-gray-50">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight">Register Institution Desk</h3>
                  <p className="text-gray-400 text-[10px] brcob-font">Pre-filled with verified Google identity metadata.</p>
                </div>
                <button
                  onClick={handleBackToRoles}
                  className="p-2 text-gray-400 hover:text-[var(--color-primary)] rounded-full hover:bg-gray-50 transition-colors"
                >
                  <FaChevronLeft size={14} />
                </button>
              </div>

              {/* Progress Stepper for Institution */}
              <div className="flex items-center gap-3 mt-4 mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1 flex flex-col gap-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-[var(--color-primary)] shadow-[0_0_8px_rgba(20,60,100,0.2)]' : 'bg-gray-100'}`} />
                    <span className={`text-[9px] font-bold brcob-font tracking-widest capitalize ${step >= s ? 'text-[var(--color-primary)]' : 'text-gray-300'}`}>Step 0{s}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleInstitutionSubmit} className="authForms">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="inst-step1" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                      {/* Step 1: Identity */}
                      <div className="group space-y-1.5">
                        <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.name ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                          Institution Name *
                        </label>
                        <div className="relative">
                          <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10" size={12} />
                          <Input
                            placeholder="e.g. Stanford University"
                            value={instData.name}
                            className={`pl-11 h-10 bg-gray-50/50 ${errors.name ? 'border-red-500 bg-red-50/20' : 'border-gray-100'}`}
                            onChange={e => {
                              const name = e.target.value;
                              setInstData({ ...instData, name });
                              if (errors.name) setErrors(prev => ({ ...prev, name: false }));

                              // Debounce duplicate check
                              const timer = (window as any)._googleInstCheckTimer;
                              if (timer) clearTimeout(timer);
                              (window as any)._googleInstCheckTimer = setTimeout(async () => {
                                if (name.length > 3) {
                                  const encryptedResponse = await checkInstitutionExistsAction(name);
                                  const response = decryptData(encryptedResponse);
                                  if (response?.success && response.exists) {
                                    toast.info(`Institution "${name}" already exists. Complete the registration to claim it.`);
                                    const ext = response.data;
                                    setInstData(p => ({
                                      ...p,
                                      existingId: ext.id,
                                      type: ext.type || p.type,
                                      address: ext.address || p.address,
                                      email: ext.email || p.email,
                                      phone: ext.phone || p.phone,
                                      website: ext.website || p.website,
                                    }));
                                  }
                                }
                              }, 1000);
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group space-y-1.5">
                          <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.type ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                            Institution Type *
                          </label>
                          <Select
                            value={instData.type}
                            onValueChange={v => {
                              setInstData({ ...instData, type: v });
                              if (errors.type) setErrors(prev => ({ ...prev, type: false }));
                            }}
                          >
                            <SelectTrigger className={`h-10 bg-gray-50/50 ${errors.type ? 'border-red-500' : 'border-gray-100'}`}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="university">University</SelectItem>
                              <SelectItem value="college">College</SelectItem>
                              <SelectItem value="school">K-12 School</SelectItem>
                              <SelectItem value="institute">Vocational Institute</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="group space-y-1.5">
                          <div className="flex justify-between items-center pr-1">
                            <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.address ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                              Physical Address *
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowMap(true)}
                              className="text-[10px] text-[var(--color-primary)] font-semibold flex items-center gap-1 hover:underline"
                            >
                              <FaMapMarkedAlt size={10} /> Pick on map
                            </button>
                          </div>
                          <Input
                            placeholder="Physical Address"
                            value={instData.address}
                            className={`h-10 bg-gray-50/50 ${errors.address ? 'border-red-500 bg-red-50/20' : 'border-gray-100'}`}
                            onChange={e => {
                              setInstData({ ...instData, address: e.target.value });
                              if (errors.address) setErrors(prev => ({ ...prev, address: false }));
                            }}
                          />
                        </div>
                      </div>

                      {showMap && (
                        <MapPicker 
                          onClose={() => setShowMap(false)}
                          onLocationSelect={handleInstitutionMapSelect}
                        />
                      )}

                      <motion.button 
                        type="button" 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={nextInstStep}
                        className="w-full h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300 mt-4 brcob-font capitalize text-xs tracking-widest"
                      >
                        Continue to contacts <FaChevronRight size={12} />
                      </motion.button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="inst-step2" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                      {/* Step 2: Communication */}
                      <div className="group space-y-1.5">
                        <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.email ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                          Official Email *
                        </label>
                        <div className="relative">
                          <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10" size={12} />
                          <Input
                            type="email"
                            placeholder="e.g. admin@stanford.edu"
                            value={instData.email}
                            className={`pl-11 h-10 bg-gray-50/50 ${errors.email ? 'border-red-500 bg-red-50/20' : 'border-gray-100'}`}
                            onChange={e => {
                              setInstData({ ...instData, email: e.target.value });
                              if (errors.email) setErrors(prev => ({ ...prev, email: false }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group space-y-1.5">
                          <label className={`text-[10px] font-semibold brcob-font flex items-center ${errors.phone ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                            Contact Phone *
                          </label>
                          <div className="relative">
                            <FaPhone className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 ${errors.phone ? 'text-red-400' : 'text-gray-300'}`} size={11} />
                            <PhoneInput 
                              placeholder="+91 xxxxx xxxxx"
                              value={instData.phone}
                              error={errors.phone}
                              onChange={v => {
                                setInstData({ ...instData, phone: v });
                                if (errors.phone && v.length === 10) setErrors(prev => ({ ...prev, phone: false }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="group space-y-1.5">
                          <label className="text-[10px] font-semibold text-gray-500 brcob-font flex items-center">
                            Website (Optional)
                          </label>
                          <div className="relative">
                            <FaGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10" size={12} />
                            <Input
                              placeholder="https://..."
                              value={instData.website}
                              className="pl-11 h-10 border-gray-100 bg-gray-50/50"
                              onChange={e => setInstData({ ...instData, website: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <motion.button 
                          type="button" 
                          whileHover={{ scale: 1.01 }} 
                          whileTap={{ scale: 0.99 }} 
                          onClick={prevInstStep}
                          className="flex-1 h-10 border border-gray-100 text-gray-500 font-bold rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 brcob-font text-[10px] capitalize tracking-widest"
                        >
                          <FaChevronLeft size={10} /> Back
                        </motion.button>
                        <motion.button 
                          type="button" 
                          whileHover={{ scale: 1.01 }} 
                          whileTap={{ scale: 0.99 }} 
                          onClick={nextInstStep}
                          className="flex-[2] h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300 brcob-font capitalize text-[10px] tracking-widest"
                        >
                          Admin info <FaChevronRight size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="inst-step3" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                      {/* Step 3: Admin Review */}
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-gray-400 brcob-font">Administrator Name (Google)</label>
                          <input
                            type="text"
                            disabled
                            value={instData.adminName}
                            className="w-full h-10 rounded-md px-4 bg-gray-100 border border-gray-100 text-sm text-gray-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-gray-400 brcob-font">Verified Work Email (Google)</label>
                          <input
                            type="text"
                            disabled
                            value={instData.adminEmail}
                            className="w-full h-10 rounded-md px-4 bg-gray-100 border border-gray-100 text-sm text-gray-500 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <motion.button 
                          type="button" 
                          whileHover={{ scale: 1.01 }} 
                          whileTap={{ scale: 0.99 }} 
                          onClick={prevInstStep}
                          className="flex-1 h-10 border border-gray-100 text-gray-500 font-bold rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 brcob-font text-[10px] capitalize tracking-widest"
                        >
                          <FaChevronLeft size={10} /> Back
                        </motion.button>
                        <Button 
                          type="submit"
                          disabled={registering}
                          loading={registering}
                          className="flex-[2] h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300 brcob-font capitalize text-[10px] tracking-widest"
                        >
                          Complete registration
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
