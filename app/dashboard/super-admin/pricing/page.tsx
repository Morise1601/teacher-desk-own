'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  XCircle,
  Loader2,
  Video,
  MessageSquare,
  BarChart3,
  Upload,
  Headphones,
  Star,
  Users,
  Check,
  AlertCircle,
  RefreshCw,
  Infinity,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/crypto';
import {
  getPricingPlansAction,
  createPricingPlanAction,
  updatePricingPlanAction,
  deletePricingPlanAction,
} from '@/app/actions/pricing';
import type { PricingPlan } from '@/app/actions/pricing';
import { Sheet, SheetFooter } from '@/components/ui/sheet';

// ─── Blank form state ────────────────────────────────────────────────────────

const BLANK_FORM: Omit<PricingPlan, 'id' | 'created_at' | 'updated_at'> = {
  plan_key: '',
  name: '',
  description: '',
  price: 0,
  period: 'month',
  discount_price: 0,
  gst_percentage: 0,
  gst_inclusive: false,
  is_active: true,
  allow_video_infrastructure: false,
  video_infrastructure_provider: 'jitsi',
  allow_student_messaging: false,
  allow_resource_uploads: false,
  allow_analytics: false,
  allow_priority_support: false,
  allow_featured_listing: false,
  max_class_listings: -1,
};

// ─── Helper components ───────────────────────────────────────────────────────

const FeatureBadge = ({ allowed, label, icon }: { allowed: boolean; label: string; icon: React.ReactNode }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${allowed
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-gray-50 text-gray-400 border-gray-100 line-through'
      }`}
  >
    {icon}
    {label}
  </span>
);

const FormToggle = ({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <div className="space-y-0.5 pr-4">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {description && <p className="text-[11px] text-gray-400">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
        }`}
    >
      <span
        className={`${value ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
      />
    </button>
  </div>
);

// ─── Main page component ─────────────────────────────────────────────────────

export default function PricingManagementPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Data Fetching ────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const enc = await getPricingPlansAction();
      const res = decryptData(enc);
      if (res?.success) {
        setPlans(res.plans || []);
      } else {
        toast.error(res?.message || 'Failed to load pricing plans.');
      }
    } catch {
      toast.error('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      await fetchPlans();
    };
    init();
  }, [fetchPlans]);

  // ── Sheet helpers ────────────────────────────────────────────────────────

  const openCreateSheet = () => {
    setEditingPlan(null);
    setForm(BLANK_FORM);
    setSheetOpen(true);
  };

  const openEditSheet = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setForm({
      plan_key: plan.plan_key,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      period: plan.period,
      discount_price: plan.discount_price,
      gst_percentage: plan.gst_percentage,
      gst_inclusive: plan.gst_inclusive,
      is_active: plan.is_active,
      allow_video_infrastructure: plan.allow_video_infrastructure,
      video_infrastructure_provider: plan.video_infrastructure_provider,
      allow_student_messaging: plan.allow_student_messaging,
      allow_resource_uploads: plan.allow_resource_uploads,
      allow_analytics: plan.allow_analytics,
      allow_priority_support: plan.allow_priority_support,
      allow_featured_listing: plan.allow_featured_listing,
      max_class_listings: plan.max_class_listings,
    });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingPlan(null);
  };

  // ── Form field helpers ───────────────────────────────────────────────────

  const setField = (key: keyof typeof BLANK_FORM, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { userId, ...form, id: editingPlan?.id };
      const enc = encryptData(payload);
      const encRes = editingPlan
        ? await updatePricingPlanAction(enc)
        : await createPricingPlanAction(enc);
      const res = decryptData(encRes);

      if (res?.success) {
        toast.success(res.message);
        closeSheet();
        await fetchPlans();
      } else {
        toast.error(res?.message || 'Operation failed.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (planId: string) => {
    if (confirmDeleteId !== planId) {
      setConfirmDeleteId(planId);
      return;
    }
    setDeletingId(planId);
    setConfirmDeleteId(null);
    try {
      const enc = encryptData({ userId, id: planId });
      const encRes = await deletePricingPlanAction(enc);
      const res = decryptData(encRes);
      if (res?.success) {
        toast.success(res.message);
        await fetchPlans();
      } else {
        toast.error(res?.message || 'Delete failed.');
      }
    } catch {
      toast.error('Delete encountered a server error.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Plan card accent color ────────────────────────────────────────────────

  const planAccent = (key: string) => {
    if (key === 'free') return { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
    if (key === 'professional') return { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
    if (key === 'premium_classroom') return { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' };
    return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  };

  const formatPrice = (plan: PricingPlan) => {
    if (plan.price === 0) return 'Free';
    const effective = plan.discount_price > 0 ? plan.discount_price : plan.price;
    return `₹${effective.toLocaleString('en-IN')}/${plan.period}`;
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12 flex flex-col pt-4 px-2 select-none">
      {/* Premium Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-md bg-[var(--color-primary)] p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/30 blur-3xl rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-inner">
            <Tag size={12} className="text-amber-300" />
            <span className="text-[10px] font-bold tracking-widest capitalize">Subscription Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold oswald-font tracking-tight capitalize leading-none drop-shadow-lg">
            Pricing <span className="text-indigo-300">Plans</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-300 brcob-font max-w-xl font-light leading-relaxed">
            Configure subscription tiers, feature access, GST, discounts, and marketplace commission settings.
          </p>
        </div>

        <div className="relative z-10 flex gap-3">
          <button
            onClick={fetchPlans}
            className="h-10 w-10 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreateSheet}
            className="h-10 px-5 rounded-md bg-white text-[var(--color-primary)] font-bold text-xs tracking-wider flex items-center gap-2 shadow-md hover:bg-white/90 hover:shadow-xl transition-all"
          >
            <Plus size={16} />
            Add Plan
          </button>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <motion.div
        key="plans"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
              <Tag size={32} className="text-[var(--color-primary)]/50" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 oswald-font mb-2">No pricing plans yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              Click "Add Plan" to create your first subscription tier.
            </p>
            <button
              onClick={openCreateSheet}
              className="h-9 px-4 rounded-md bg-[var(--color-primary)] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[var(--color-primary)]/90 transition"
            >
              <Plus size={14} />
              Add First Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {plans.map((plan, i) => {
              const accent = planAccent(plan.plan_key);
              const isDeleting = deletingId === plan.id;
              const isConfirmingDelete = confirmDeleteId === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`relative group bg-white rounded-xl border ${accent.border} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col`}
                >
                  {/* Status bar */}
                  <div className={`h-1 w-full ${plan.is_active ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`} />

                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${accent.badge}`}>
                            {plan.plan_key}
                          </span>
                          {plan.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full uppercase">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full uppercase">
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              Inactive
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-800 oswald-font tracking-tight leading-tight">{plan.name}</h3>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-[var(--color-primary)] oswald-font">
                          {formatPrice(plan)}
                        </div>
                        {plan.discount_price > 0 && plan.price > 0 && (
                          <div className="text-[10px] text-gray-400 line-through">₹{plan.price.toLocaleString('en-IN')}</div>
                        )}
                        {plan.gst_percentage > 0 && (
                          <div className="text-[9px] text-gray-400">
                            {plan.gst_inclusive ? 'GST incl.' : `+${plan.gst_percentage}% GST`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {plan.description && (
                      <p className="text-xs text-gray-500 leading-relaxed brcob-font line-clamp-2">{plan.description}</p>
                    )}

                    {/* Max class listings */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Users size={12} className="text-gray-400" />
                      <span className="font-medium">
                        {plan.max_class_listings === -1 ? (
                          <span className="flex items-center gap-1">Unlimited <Infinity size={12} /></span>
                        ) : (
                          `${plan.max_class_listings} class listings`
                        )}
                      </span>
                    </div>

                    {/* Feature badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {plan.allow_video_infrastructure && (
                        <FeatureBadge
                          allowed={true}
                          label={`Video (${plan.video_infrastructure_provider})`}
                          icon={<Video size={10} />}
                        />
                      )}
                      <FeatureBadge allowed={plan.allow_student_messaging} label="Messaging" icon={<MessageSquare size={10} />} />
                      <FeatureBadge allowed={plan.allow_analytics} label="Analytics" icon={<BarChart3 size={10} />} />
                      <FeatureBadge allowed={plan.allow_resource_uploads} label="Uploads" icon={<Upload size={10} />} />
                      <FeatureBadge allowed={plan.allow_priority_support} label="Priority Support" icon={<Headphones size={10} />} />
                      <FeatureBadge allowed={plan.allow_featured_listing} label="Featured" icon={<Star size={10} />} />
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-2 bg-gray-50/50">
                    <button
                      onClick={() => openEditSheet(plan)}
                      className="flex-1 h-8 rounded-md bg-white border border-gray-200 text-gray-600 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      disabled={isDeleting}
                      className={`flex-1 h-8 rounded-md border transition-all text-xs font-semibold flex items-center justify-center gap-1.5 ${isConfirmingDelete
                          ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                          : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50'
                        }`}
                    >
                      {isDeleting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : isConfirmingDelete ? (
                        <>
                          <AlertCircle size={12} />
                          Confirm Delete
                        </>
                      ) : (
                        <>
                          <Trash2 size={12} />
                          Delete
                        </>
                      )}
                    </button>
                    {isConfirmingDelete && (
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-8 w-8 rounded-md bg-white border border-gray-200 text-gray-400 hover:text-gray-700 transition-all flex items-center justify-center"
                      >
                        <XCircle size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Add new plan card */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: plans.length * 0.07 }}
              onClick={openCreateSheet}
              className="group relative border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[220px] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/3 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/20 flex items-center justify-center transition-colors">
                <Plus size={24} className="text-[var(--color-primary)]/60 group-hover:text-[var(--color-primary)] transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 group-hover:text-[var(--color-primary)] transition-colors">Add New Plan</p>
                <p className="text-xs text-gray-400 mt-0.5">Create a custom subscription tier</p>
              </div>
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* ── CRUD Sheet (Create / Edit) ─────────────────────────────────────── */}
      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editingPlan ? 'Edit Pricing Plan' : 'Create New Plan'}
        description={editingPlan ? `Modifying: ${editingPlan.name}` : 'Configure your new subscription tier'}
        width="max-w-md"
        footer={
          <SheetFooter>
            <button
              type="button"
              onClick={closeSheet}
              className="flex-1 h-10 rounded-md bg-gray-100 text-gray-600 font-bold text-xs tracking-wider hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="pricing-form"
              disabled={submitting}
              className="flex-1 h-10 rounded-md bg-[var(--color-primary)] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/90 active:scale-[0.99] transition-all shadow-md"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Saving...</>
              ) : (
                <><Check size={14} /> {editingPlan ? 'Update Plan' : 'Create Plan'}</>
              )}
            </button>
          </SheetFooter>
        }
      >
        <form id="pricing-form" onSubmit={handleSubmit} className="space-y-5">

          {/* ── Identity ──────────────────────────────────────────────────── */}
          <div className="space-y-4 pb-4 border-b border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan Identity</p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                Plan Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. professional, premium_classroom"
                value={form.plan_key}
                onChange={e => setField('plan_key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                disabled={!!editingPlan}
                className="w-full h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-sm text-[var(--color-primary)] placeholder-gray-300 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-[9px] text-gray-400">Lowercase, alphanumeric, underscores only. Cannot be changed after creation.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">Plan Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Professional Plan"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                className="w-full h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-sm text-[var(--color-primary)] placeholder-gray-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">Description</label>
              <textarea
                rows={3}
                placeholder="Brief description shown to teachers on the pricing page..."
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                className="w-full rounded-md px-4 py-2.5 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-sm text-[var(--color-primary)] placeholder-gray-300 resize-none"
              />
            </div>
          </div>

          {/* ── Pricing ───────────────────────────────────────────────────── */}
          <div className="space-y-4 pb-4 border-b border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pricing & Billing</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500">Price (₹) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setField('price', parseFloat(e.target.value) || 0)}
                  className="w-full h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-sm text-[var(--color-primary)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500">Period</label>
                <select
                  value={form.period}
                  onChange={e => setField('period', e.target.value)}
                  className="w-full h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-sm text-[var(--color-primary)]"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500">Discount Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.discount_price}
                  onChange={e => setField('discount_price', parseFloat(e.target.value) || 0)}
                  className="w-full h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-sm text-[var(--color-primary)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500">GST (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="18"
                  value={form.gst_percentage}
                  onChange={e => setField('gst_percentage', parseFloat(e.target.value) || 0)}
                  className="w-full h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-sm text-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">Max Class Listings</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="-1"
                  step="1"
                  placeholder="-1 = Unlimited"
                  value={form.max_class_listings}
                  onChange={e => setField('max_class_listings', parseInt(e.target.value) || -1)}
                  className="flex-1 h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-sm text-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setField('max_class_listings', form.max_class_listings === -1 ? 5 : -1)}
                  className="h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Infinity size={12} />
                  {form.max_class_listings === -1 ? 'Set limit' : 'Unlimited'}
                </button>
              </div>
              <span className="text-[9px] text-gray-400">Set to -1 for unlimited listings.</span>
            </div>

            <FormToggle
              label="GST Inclusive"
              description="Price shown includes GST (not added on top)"
              value={form.gst_inclusive}
              onChange={v => setField('gst_inclusive', v)}
            />
          </div>

          {/* ── Features ──────────────────────────────────────────────────── */}
          <div className="space-y-1 pb-4 border-b border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Feature Access</p>

            <FormToggle
              label="Integrated Video Infrastructure"
              description="Jitsi/Zoom classroom built into the platform"
              value={form.allow_video_infrastructure}
              onChange={v => setField('allow_video_infrastructure', v)}
            />

            {form.allow_video_infrastructure && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 pl-4 border-l-2 border-[var(--color-primary)]/20 ml-2 py-1"
              >
                <label className="text-[11px] font-semibold text-gray-500">Video Provider</label>
                <select
                  value={form.video_infrastructure_provider}
                  onChange={e => setField('video_infrastructure_provider', e.target.value)}
                  className="w-full h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-sm text-[var(--color-primary)]"
                >
                  <option value="jitsi">Jitsi Meet (Free, Open Source)</option>
                  <option value="zoom">Zoom (Requires API Key)</option>
                  <option value="daily">Daily.co</option>
                  <option value="livekit">LiveKit</option>
                </select>
              </motion.div>
            )}

            <FormToggle
              label="Student Messaging"
              description="Direct messaging between teachers and students"
              value={form.allow_student_messaging}
              onChange={v => setField('allow_student_messaging', v)}
            />

            <FormToggle
              label="Resource Uploads"
              description="Upload study materials, PDFs, and documents"
              value={form.allow_resource_uploads}
              onChange={v => setField('allow_resource_uploads', v)}
            />

            <FormToggle
              label="Analytics Dashboard"
              description="Insights on enrollment, engagement, and revenue"
              value={form.allow_analytics}
              onChange={v => setField('allow_analytics', v)}
            />

            <FormToggle
              label="Priority Support"
              description="Faster response time from our support team"
              value={form.allow_priority_support}
              onChange={v => setField('allow_priority_support', v)}
            />

            <FormToggle
              label="Featured Listing"
              description="Higher search ranking and homepage placement"
              value={form.allow_featured_listing}
              onChange={v => setField('allow_featured_listing', v)}
            />
          </div>

          {/* ── Visibility ────────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Visibility</p>
            <FormToggle
              label="Plan is Active"
              description="Inactive plans are hidden from teachers on the pricing page"
              value={form.is_active}
              onChange={v => setField('is_active', v)}
            />
          </div>
        </form>
      </Sheet>
    </div>
  );
}
