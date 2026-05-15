'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBuilding, FaGlobe, FaEnvelope, FaPhone, FaUser, FaLock, FaChevronRight, FaChevronLeft, FaMapMarkerAlt } from 'react-icons/fa';
import { AuthFormType } from '@/app/types/auth';
import { toast } from 'react-toastify';
import { validateEmail, validatePassword } from '@/app/utils/validation';
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { PasswordInput } from "@/components/ui/password-input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import MapPicker from '@/components/maps/MapPicker';
import { encryptData, decryptData } from "@/lib/crypto";
import { createInstitutionAction, checkInstitutionExistsAction, checkInstitutionByAddressAction } from "@/app/actions/institution";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type Props = { onSwitch: (form: AuthFormType) => void };

export default function InstitutionSignUpForm({ onSwitch }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    // Section 01: Identity (from public.institutions)
    name: '',
    type: '',
    address: '',
    // Section 02: Communication (from public.institutions)
    email: '',
    phone: '',
    website: '',
    // Section 03: Admin (credentials for account creation)
    adminName: '',
    adminEmail: '',
    password: '',
    existingId: null as string | null, // Track if we are claiming an existing stub
  });

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.name) { newErrors.name = true; isValid = false; }
      if (!formData.type) { newErrors.type = true; isValid = false; }
      if (!formData.address) { newErrors.address = true; isValid = false; }
    } else if (currentStep === 2) {
      if (!formData.email) { newErrors.email = true; isValid = false; }
      if (!formData.phone || formData.phone.length !== 10) { newErrors.phone = true; isValid = false; }
    } else if (currentStep === 3) {
      if (!formData.adminName) { newErrors.adminName = true; isValid = false; }
      if (!formData.adminEmail) { newErrors.adminEmail = true; isValid = false; }
      if (!formData.password) { newErrors.password = true; isValid = false; }
    }

    setErrors(newErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    } else {
      toast.error("Please fill all required fields correctly.");
    }
  };

  const prevStep = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    if (!validateEmail(formData.adminEmail)) {
      setErrors(prev => ({ ...prev, adminEmail: true }));
      return;
    }
    if (!validatePassword(formData.password)) {
      setErrors(prev => ({ ...prev, password: true }));
      return;
    }

    setLoading(true);
    try {
      // 1. SECURITY LAYER: Encrypt the formData on the client before sending
      const securePayload = encryptData(formData);

      // 2. ACTION: Submit via Next.js Server Action
      const encryptedResponse = await createInstitutionAction(securePayload);

      // 3. SECURITY LAYER: Decrypt the server response
      const response = decryptData(encryptedResponse);

      if (response && response.success) {
        toast.success(response.message || "Institution Registration successful!");
        // Redirect to login form after a delay to ensure toast is visible
        setTimeout(() => {
          onSwitch("login");
        }, 3000);
      } else {
        toast.error(response?.message || "Could not complete secure registration.");
      }
    } catch (error) {
       toast.error("A network security error occurred.");
       console.error("SECURE SUBMIT ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
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
            <p className="mt-4 text-[var(--color-primary)] font-bold oswald-font capitalize tracking-widest text-sm">Validating Institution...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">Institutional registration</h2>
        <p className="text-gray-400 mt-1 text-[11px] brcob-font">Empowering global academic excellence. Join 500+ institutions.</p>
        
        {/* Progress Stepper */}
        <div className="flex items-center gap-3 mt-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex flex-col gap-1.5">
              <div 
                className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-[var(--color-primary)] shadow-[0_0_8px_rgba(20,60,100,0.2)]' : 'bg-gray-100'}`}
              />
              <span className={`text-[9px] font-bold brcob-font tracking-widest capitalize ${step >= s ? 'text-[var(--color-primary)]' : 'text-gray-300'}`}>
                Step 0{s}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="authForms">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <div className="group space-y-1.5">
                <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.name ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                  Institution name * 
                  <InfoTooltip text="The official name of the institution such as school name, college name, or academy name." />
                </label>
                <div className="relative">
                  <FaBuilding className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.name ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                  <Input 
                    placeholder="Oxford University"
                    aria-invalid={errors.name}
                    className={`pl-11 h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm placeholder-gray-300 ${errors.name ? 'border-red-500 bg-red-50/30' : 'border-gray-100'}`}
                    value={formData.name}
                    onChange={e => {
                      const name = e.target.value;
                      setFormData({...formData, name});
                      if (errors.name) setErrors({...errors, name: false});
                      
                      // Simple manual debounce for duplicate check
                      const timer = (window as any)._instCheckTimer;
                      if (timer) clearTimeout(timer);
                      (window as any)._instCheckTimer = setTimeout(async () => {
                        if (name.length > 3) {
                          const encryptedResponse = await checkInstitutionExistsAction(name);
                          const response = decryptData(encryptedResponse);
                          if (response?.success && response.exists) {
                             toast.info(`Institution "${name}" already exists. Complete the form to claim this record.`);
                             const ext = response.data;
                             setFormData(p => ({
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
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.type ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Institution type * 
                    <InfoTooltip text="This field specifies the type of institution, for example school, college, university, or training institute." />
                  </label>
                  <Select 
                    value={formData.type} 
                    onValueChange={v => {
                      setFormData({...formData, type: v});
                      if (errors.type) setErrors({...errors, type: false});
                    }}
                  >
                    <SelectTrigger className={`h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm ${errors.type ? 'border-red-500' : 'border-gray-100'}`}>
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
                    <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.address ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                      Physical address * 
                      <InfoTooltip text="The physical address of the institution including building name, street, city, and postal code." />
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="text-[10px] text-[var(--color-primary)] hover:underline flex items-center gap-1 brcob-font font-medium"
                    >
                      <FaMapMarkerAlt size={10} /> Pick on map
                    </button>
                  </div>
                  <Input 
                    placeholder="City, Country"
                    aria-invalid={errors.address}
                    className={`h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm placeholder-gray-300 ${errors.address ? 'border-red-500 bg-red-50/30' : 'border-gray-100'}`}
                    value={formData.address}
                    onChange={e => {
                      setFormData({...formData, address: e.target.value});
                      if (errors.address) setErrors({...errors, address: false});
                    }}
                  />
                </div>
              </div>

              <motion.button 
                type="button" 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={nextStep}
                className="w-full h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300 mt-4 brcob-font capitalize text-xs tracking-widest"
              >
                Continue to contacts <FaChevronRight size={12} />
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <div className="group space-y-1.5">
                <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.email ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                  Official email * 
                  <InfoTooltip text="The official email address used for communication and account verification." />
                </label>
                <div className="relative">
                  <FaEnvelope className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                  <Input 
                    type="email"
                    placeholder="admin@institution.edu"
                    aria-invalid={errors.email}
                    className={`pl-11 h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm placeholder-gray-300 ${errors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-100'}`}
                    value={formData.email}
                    onChange={e => {
                      setFormData({...formData, email: e.target.value});
                      if (errors.email) setErrors({...errors, email: false});
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group space-y-1.5">
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.phone ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Phone number * 
                    <InfoTooltip text="The official phone number of the institution." />
                  </label>
                  <div className="relative">
                    <FaPhone className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.phone ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                    <PhoneInput 
                      placeholder="+91 xxxxx xxxxx"
                      aria-invalid={errors.phone}
                      error={errors.phone}
                      value={formData.phone}
                      onChange={val => {
                        setFormData({...formData, phone: val});
                        if (errors.phone && val.length === 10) setErrors({...errors, phone: false});
                      }}
                    />
                  </div>
                </div>

                <div className="group space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-500 brcob-font ml-0.5 transition-colors group-focus-within:text-[var(--color-primary)] flex items-center">
                    Website (Optional) 
                    <InfoTooltip text="The website URL of the institution if available." />
                  </label>
                  <div className="relative">
                    <FaGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[var(--color-primary)] transition-colors" size={12} />
                    <Input 
                      placeholder="https://..."
                      className="pl-11 h-10 bg-gray-50/50 border-gray-100 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm placeholder-gray-300"
                      value={formData.website}
                      onChange={e => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button 
                  type="button" 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={prevStep}
                  className="flex-1 h-10 border border-gray-100 text-gray-500 font-bold rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 brcob-font text-[10px] capitalize tracking-widest"
                >
                  <FaChevronLeft size={10} /> Back
                </motion.button>
                <motion.button 
                  type="button" 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={nextStep}
                  className="flex-[2] h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300 brcob-font capitalize text-[10px] tracking-widest"
                >
                  Admin info <FaChevronRight size={12} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <div className="group space-y-1.5">
                <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.adminName ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                  Admin full name * 
                  <InfoTooltip text="The name of the person responsible for managing the institution account on the platform." />
                </label>
                <div className="relative">
                  <FaUser className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.adminName ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                  <Input 
                    placeholder="John Doe"
                    aria-invalid={errors.adminName}
                    className={`pl-11 h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm placeholder-gray-300 ${errors.adminName ? 'border-red-500 bg-red-50/30' : 'border-gray-100'}`}
                    value={formData.adminName}
                    onChange={e => {
                      setFormData({...formData, adminName: e.target.value});
                      if (errors.adminName) setErrors({...errors, adminName: false});
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group space-y-1.5">
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.adminEmail ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Work email * 
                    <InfoTooltip text="The login email used by the institution administrator." />
                  </label>
                  <Input 
                    type="email"
                    placeholder="j.doe@institution.edu"
                    aria-invalid={errors.adminEmail}
                    className={`h-10 bg-gray-50/50 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm placeholder-gray-300 ${errors.adminEmail ? 'border-red-500 bg-red-50/30' : 'border-gray-100'}`}
                    value={formData.adminEmail}
                    onChange={e => {
                      setFormData({...formData, adminEmail: e.target.value});
                      if (errors.adminEmail) setErrors({...errors, adminEmail: false});
                    }}
                  />
                </div>

                <div className="group space-y-1.5">
                  <label className={`text-[11px] font-medium brcob-font ml-0.5 transition-colors flex items-center ${errors.password ? 'text-red-500' : 'text-gray-500 group-focus-within:text-[var(--color-primary)]'}`}>
                    Security password * 
                    <InfoTooltip text="The password used by the institution administrator to sign in to the system." />
                  </label>
                  <div className="relative">
                    <FaLock className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-300 group-focus-within:text-[var(--color-primary)]'}`} size={12} />
                    <PasswordInput 
                      placeholder="••••••••"
                      aria-invalid={errors.password}
                      error={errors.password}
                      className="pl-11"
                      value={formData.password}
                      onChange={e => {
                        setFormData({...formData, password: e.target.value});
                        if (errors.password) setErrors({...errors, password: false});
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button 
                  type="button" 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={prevStep}
                  className="flex-1 h-10 border border-gray-100 text-gray-500 font-bold rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 brcob-font text-[10px] capitalize tracking-widest"
                >
                  <FaChevronLeft size={10} /> Back
                </motion.button>
                <Button 
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="flex-[2] h-10 bg-[var(--color-primary)] text-white font-bold rounded-md flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300 brcob-font capitalize text-[10px] tracking-widest"
                >
                  Complete registration
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {showMap && (
          <MapPicker 
            onClose={() => setShowMap(false)}
            onLocationSelect={async (addr) => {
              setFormData(prev => ({ ...prev, address: addr }));
              if (errors.address) setErrors({...errors, address: false});
              
              // NEW: Check if this address already exists
              setLoading(true);
              try {
                const encryptedResponse = await checkInstitutionByAddressAction(addr);
                const response = decryptData(encryptedResponse);
                
                if (response?.success && response.exists) {
                  if (response.isClaimed) {
                    toast.error("An institution is already registered at this address. Please contact support if this is an error.");
                    setFormData(prev => ({ ...prev, address: '' }));
                  } else {
                    toast.info("Existing record found for this address. You can claim it by completing this registration.");
                    const ext = response.data;
                    setFormData(p => ({
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
                setLoading(false);
              }
            }}
          />
        )}
      </AnimatePresence>

      <div className="mt-6 pt-5 border-t border-gray-50 text-center">
        <button 
          onClick={() => onSwitch('signup')}
          className="text-[10px] text-gray-400 hover:text-[var(--color-primary)] transition-colors brcob-font flex items-center justify-center gap-1.5 mx-auto font-bold capitalize tracking-widest"
        >
          Change account type
        </button>
      </div>
    </div>
  );
}
