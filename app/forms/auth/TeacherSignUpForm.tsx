'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaPhone, FaVenusMars, FaCalendarAlt, 
  FaGraduationCap, FaBriefcase, FaUniversity, FaLock, 
  FaChevronRight, FaChevronLeft, FaMapMarkedAlt 
} from 'react-icons/fa';
import { AuthFormType } from '@/app/types/auth';
import { toast } from 'react-toastify';
import { validateEmail, validatePassword } from '@/app/utils/validation';
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { PasswordInput } from "@/components/ui/password-input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { encryptData, decryptData } from "@/lib/crypto";
import { createTeacherAction } from "@/app/actions/teacher";
import { getInstitutionsAction, findOrCreateInstitutionAction } from "@/app/actions/institution";
import MapPicker from "@/components/maps/MapPicker";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getQualificationsAction, getSpecializationsAction, findOrCreateMetadataAction } from "@/app/actions/metadata";

type Props = { 
  onSwitch: (form: AuthFormType) => void;
  referralId?: string | null;
};

export default function TeacherSignUpForm({ onSwitch, referralId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [institutions, setInstitutions] = useState<{id: string, name: string}[]>([]);
  const [qualifications, setQualifications] = useState<{id: string, name: string}[]>([]);
  const [specializations, setSpecializations] = useState<{id: string, name: string}[]>([]);
  const [isNewQual, setIsNewQual] = useState(false);
  const [isNewSpec, setIsNewSpec] = useState(false);
  const [customQual, setCustomQual] = useState('');
  const [customSpec, setCustomSpec] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    qualification: '',
    specialization: '',
    experience: '',
    institutionId: '',
    password: '',
    referedBy: referralId || '',
  });

  // Update referedBy if referralId prop changes
  useEffect(() => {
    if (referralId) {
      setFormData(prev => ({ ...prev, referedBy: referralId }));
    }
  }, [referralId]);

  const fetchInstitutions = async () => {
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

  const fetchQualifications = async () => {
    try {
      const encrypted = await getQualificationsAction();
      const response = decryptData(encrypted);
      console.log("✅ Qualifications Response:", response);
      if (response?.success) {
        setQualifications(response.data || []);
      }
    } catch (err) {
      console.error("❌ Failed to load qualifications", err);
    }
  };

  const fetchSpecializations = async (qualId: string) => {
    if (!qualId || qualId === 'other') {
      setSpecializations([]);
      return;
    }
    try {
      const encrypted = await getSpecializationsAction(qualId);
      const response = decryptData(encrypted);
      console.log("✅ Specializations Response:", response);
      if (response?.success) {
        setSpecializations(response.data || []);
      }
    } catch (err) {
      console.error("❌ Failed to load specializations", err);
    }
  };

  // Fetch available institutions and qualifications on mount
  useEffect(() => {
    fetchInstitutions();
    fetchQualifications();
  }, []);

  const handleMapSelect = async (data: { name: string; address: string }) => {
    setLoading(true);
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
        
        // Update local state
        setFormData(prev => ({ ...prev, institutionId: response.data.id }));
        
        // Refresh institutions list to include the new one (if created)
        await fetchInstitutions();
      } else {
        toast.error(response?.message || "Failed to process institution selection.");
      }
    } catch (err) {
      toast.error("Map selection security error.");
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (currentStep: number) => {
    let newErrors: Record<string, boolean> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.fullName) { newErrors.fullName = true; isValid = false; }
      if (!formData.email) { newErrors.email = true; isValid = false; }
      if (!formData.phone || formData.phone.length !== 10) { newErrors.phone = true; isValid = false; }
      if (!formData.gender) { newErrors.gender = true; isValid = false; }
      if (!formData.dob) { newErrors.dob = true; isValid = false; }
    } else if (currentStep === 2) {
      if (!formData.qualification || (formData.qualification === 'other' && !isNewQual)) { newErrors.qualification = true; isValid = false; }
      if (!formData.specialization || (formData.specialization === 'other' && !isNewSpec)) { newErrors.specialization = true; isValid = false; }
      if (!formData.experience) { newErrors.experience = true; isValid = false; }
    } else if (currentStep === 3) {
      if (!formData.password) { newErrors.password = true; isValid = false; }
    }

    setErrors(newErrors);
    if (!isValid) toast.error("Please fill all required fields correctly.");
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    if (!validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: true }));
      return;
    }
    if (!validatePassword(formData.password)) {
      setErrors(prev => ({ ...prev, password: true }));
      return;
    }

    setLoading(true);
    try {
      // 1. Handle Metadata (Find or Create)
      let finalQualification = formData.qualification;
      let finalSpecialization = formData.specialization;

      if (formData.qualification === 'other' || formData.specialization === 'other') {
        const metadataPayload = encryptData({
          qualificationName: formData.qualification === 'other' ? (isNewQual ? formData.qualification : '') : qualifications.find(q => q.id === formData.qualification)?.name,
          specializationName: formData.specialization === 'other' ? (isNewSpec ? formData.specialization : '') : specializations.find(s => s.id === formData.specialization)?.name
        });
        
        // Actually, it's easier to just pass the names if they are new
        const namesPayload = encryptData({
          qualificationName: formData.qualification === 'other' ? (typeof formData.qualification === 'string' ? formData.qualification : '') : qualifications.find(q => q.id === formData.qualification)?.name,
          specializationName: formData.specialization === 'other' ? (typeof formData.specialization === 'string' ? formData.specialization : '') : specializations.find(s => s.id === formData.specialization)?.name
        });
        // This part needs careful handling of what's in formData.qualification
      }

      // Simplified approach: Resolve IDs to Names before sending to createTeacherAction
      const qualName = formData.qualification === 'other' ? customQual : qualifications.find(q => q.id === formData.qualification)?.name || formData.qualification;
      const specName = formData.specialization === 'other' ? customSpec : specializations.find(s => s.id === formData.specialization)?.name || formData.specialization;

      // Ensure they are added to metadata tables so they show up next time
      const metadataResEnc = await findOrCreateMetadataAction(encryptData({
        qualificationName: qualName,
        specializationName: specName
      }));
      const metadataRes = decryptData(metadataResEnc);

      if (!metadataRes?.success) {
        toast.error("Failed to process academic metadata.");
        setLoading(false);
        return;
      }

      const submissionData = {
        ...formData,
        qualification: qualName,
        specialization: specName
      };

      const securePayload = encryptData(submissionData);
      const encryptedResponse = await createTeacherAction(securePayload);
      const response = decryptData(encryptedResponse);
      
      if (response && response.success) {
        toast.success(response.message || "Teacher account created successfully!");
        // Redirect to login form after a delay to ensure toast is visible
        setTimeout(() => {
          onSwitch("login");
        }, 3000);
      } else {
        toast.error(response?.message || "Registration failed.");
      }
    } catch (error) {
      toast.error("Network security error.");
    } finally {
      setLoading(false);
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 relative">
      {/* Full page loader overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl"
          >
            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--color-primary)] font-bold oswald-font capitalize tracking-widest text-sm">Securing Registration...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">Academic registration</h2>
        <p className="text-gray-400 mt-1 text-[11px] brcob-font">Join the specialized network for researchers and educators.</p>

        <div className="flex items-center gap-3 mt-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex flex-col gap-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-[var(--color-primary)] shadow-[0_0_8px_rgba(20,60,100,0.2)]' : 'bg-gray-100'}`} />
              <span className={`text-[9px] font-bold brcob-font tracking-widest capitalize ${step >= s ? 'text-[var(--color-primary)]' : 'text-gray-300'}`}>Step 0{s}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="authForms">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4" >
              <div className="group space-y-1.5">
                <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.fullName ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                  Full Name * <InfoTooltip text="The teacher’s complete name." />
                </label>
                <div className="relative">
                  <FaUser className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.fullName ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                  <Input 
                    placeholder="John Doe" 
                    className={`pl-11 h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] focus:bg-white transition-all duration-300 text-[var(--color-primary)] text-sm ${errors.fullName ? 'border-red-500 bg-red-50/30' : 'border-gray-100'}`}
                    value={formData.fullName}
                    onChange={e => { setFormData({...formData, fullName: e.target.value}); if (errors.fullName) setErrors({...errors, fullName: false}); }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group space-y-1.5">
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.email ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Email Address * <InfoTooltip text="The teacher’s email address used for login and communication." />
                  </label>
                  <div className="relative">
                    <FaEnvelope className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                    <Input 
                      type="email" 
                      placeholder="j.doe@example.com" 
                      className={`pl-11 h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] focus:bg-white transition-all duration-300 text-[var(--color-primary)] text-sm ${errors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-100'}`}
                      value={formData.email}
                      onChange={e => { setFormData({...formData, email: e.target.value}); if (errors.email) setErrors({...errors, email: false}); }}
                    />
                  </div>
                </div>

                <div className="group space-y-1.5">
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.phone ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Mobile Number * <InfoTooltip text="Contact number used for communication and verification." />
                  </label>
                  <div className="relative">
                    <FaPhone className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 transition-colors ${errors.phone ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                    <PhoneInput 
                      value={formData.phone}
                      error={errors.phone}
                      onChange={val => { setFormData({...formData, phone: val}); if (errors.phone && val.length === 10) setErrors({...errors, phone: false}); }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group space-y-1.5">
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.gender ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Gender * <InfoTooltip text="Gender of the teacher." />
                  </label>
                  <div className="relative">
                    <FaVenusMars className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.gender ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                    <Select value={formData.gender} onValueChange={v => { setFormData({...formData, gender: v}); if (errors.gender) setErrors({...errors, gender: false}); }}>
                      <SelectTrigger className={`pl-11 h-10 transition-all duration-300 ${errors.gender ? 'border-red-500 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
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
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.dob ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Date of Birth * <InfoTooltip text="The birth date of the teacher." />
                  </label>
                  <div className="relative">
                    <FaCalendarAlt className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.dob ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                    <Input 
                      type="date" 
                      className={`pl-11 h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] transition-all duration-300 text-[var(--color-primary)] text-sm ${errors.dob ? 'border-red-500 bg-red-50/30' : 'border-gray-100'}`}
                      value={formData.dob}
                      onChange={e => { setFormData({...formData, dob: e.target.value}); if (errors.dob) setErrors({...errors, dob: false}); }}
                    />
                  </div>
                </div>
              </div>

              <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={nextStep} className="w-full h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 mt-4 brcob-font capitalize text-xs tracking-widest" >
                Continue to profile <FaChevronRight size={10} />
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4" >
              <div className="group space-y-1.5">
                <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.qualification ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                  Academic Qualification * <InfoTooltip text="The academic qualifications of the teacher." />
                </label>
                <div className="relative space-y-2">
                  <div className="relative">
                    <FaGraduationCap className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.qualification ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                    <Select 
                      value={formData.qualification} 
                      onValueChange={v => { 
                        setFormData({...formData, qualification: v, specialization: ''}); 
                        setIsNewQual(v === 'other');
                        if (v !== 'other') fetchSpecializations(v);
                        if (errors.qualification) setErrors({...errors, qualification: false}); 
                      }}
                    >
                      <SelectTrigger className={`pl-11 h-10 transition-all duration-300 ${errors.qualification ? 'border-red-500 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                        <SelectValue placeholder="Select Qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        {qualifications.map(q => (
                          <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                        ))}
                        <SelectItem value="other" className="font-bold text-[var(--color-primary)]">+ Add New Qualification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {isNewQual && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <Input 
                        placeholder="Enter your qualification (e.g. M.Sc. Physics)" 
                        className="h-10 bg-white border-[var(--color-primary)] text-sm"
                        value={customQual}
                        onChange={(e) => { 
                          setCustomQual(e.target.value);
                          if (errors.qualification) setErrors({...errors, qualification: false}); 
                        }}
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group space-y-1.5">
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.specialization ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Specialization / Subject * <InfoTooltip text="The subject or area of expertise the teacher teaches." />
                  </label>
                  <div className="relative space-y-2">
                    <div className="relative">
                      <FaBriefcase className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.specialization ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                      <Select 
                        value={formData.specialization} 
                        disabled={!formData.qualification || (formData.qualification === 'other' && !isNewQual)}
                        onValueChange={v => { 
                          setFormData({...formData, specialization: v}); 
                          setIsNewSpec(v === 'other');
                          if (errors.specialization) setErrors({...errors, specialization: false}); 
                        }}
                      >
                        <SelectTrigger className={`pl-11 h-10 transition-all duration-300 ${errors.specialization ? 'border-red-500 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                          <SelectValue placeholder="Select Specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {specializations.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                          <SelectItem value="other" className="font-bold text-[var(--color-primary)]">+ Add New Specialization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isNewSpec && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <Input 
                          placeholder="Enter specialization (e.g. Quantum Mechanics)" 
                          className="h-10 bg-white border-[var(--color-primary)] text-sm"
                          value={customSpec}
                          onChange={(e) => { 
                            setCustomSpec(e.target.value);
                            if (errors.specialization) setErrors({...errors, specialization: false}); 
                          }}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="group space-y-1.5">
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.experience ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Years of Experience * <InfoTooltip text="Total years of teaching experience." />
                  </label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 10" 
                    className={`h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] transition-all duration-300 text-[var(--color-primary)] text-sm ${errors.experience ? 'border-red-500 bg-red-50/30' : 'border-gray-100'}`}
                    value={formData.experience}
                    onChange={e => { setFormData({...formData, experience: e.target.value}); if (errors.experience) setErrors({...errors, experience: false}); }}
                  />
                </div>
              </div>

              <div className="group space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-medium text-gray-500 brcob-font ml-0.5 transition-colors flex items-center">
                    Institution Selection (Optional) <InfoTooltip text="Select the institution you belong to from the registered platform list." />
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowMap(true)}
                    className="text-[10px] text-[var(--color-primary)] font-bold brcob-font flex items-center gap-1 hover:underline"
                  >
                    <FaMapMarkedAlt size={10} /> Find on Map
                  </button>
                </div>
                <div className="relative">
                  <FaUniversity className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.institutionId ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                  <Select value={formData.institutionId} onValueChange={v => { setFormData({...formData, institutionId: v}); if (errors.institutionId) setErrors({...errors, institutionId: false}); }}>
                    <SelectTrigger className={`pl-11 h-10 transition-all duration-300 ${errors.institutionId ? 'border-red-500 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
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
                  onLocationSelect={() => {}} // We use onSelect for structured data
                  onSelect={handleMapSelect} 
                  onClose={() => setShowMap(false)} 
                />
              )}

              <div className="flex gap-3 mt-6">
                <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={prevStep} className="flex-1 h-10 border border-gray-100 text-gray-400 font-bold rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 brcob-font text-[10px] capitalize tracking-widest" >
                   Back
                </motion.button>
                <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={nextStep} className="flex-[2] h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 brcob-font capitalize text-[10px] tracking-widest" >
                  Set security <FaChevronRight size={10} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4" >
              <div className="group space-y-1.5">
                <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.password ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                  Login Password * <InfoTooltip text="Password used to log in after approval." />
                </label>
                <div className="relative">
                  <FaLock className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                  <PasswordInput 
                    placeholder="••••••••" 
                    className="pl-11"
                    error={errors.password}
                    value={formData.password}
                    onChange={e => { setFormData({...formData, password: e.target.value}); if (errors.password) setErrors({...errors, password: false}); }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={prevStep} className="flex-1 h-10 border border-gray-100 text-gray-400 font-bold rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 brcob-font text-[10px] capitalize tracking-widest" >
                   Back
                </motion.button>
                <Button 
                   type="submit" 
                   disabled={loading} 
                   className="flex-[2] h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 brcob-font capitalize text-[10px] tracking-widest"
                   loading={loading}
                >
                  Complete Registration
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-50 text-center">
        <button onClick={() => onSwitch('signup')} className="text-[10px] text-gray-400 hover:text-[var(--color-primary)] transition-colors brcob-font flex items-center justify-center gap-1.5 mx-auto font-bold capitalize tracking-widest" >
          Change account type
        </button>
      </div>
    </div>
  );
}
