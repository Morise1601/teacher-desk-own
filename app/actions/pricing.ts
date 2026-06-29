'use server';

import { supabaseAdmin } from "@/lib/supabase";
import { encryptData, decryptData } from "@/lib/crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PricingPlan = {
  id: string;
  plan_key: string;
  name: string;
  description: string;
  price: number;
  period: string;
  discount_price: number;
  gst_percentage: number;
  gst_inclusive: boolean;
  is_active: boolean;
  allow_video_infrastructure: boolean;
  video_infrastructure_provider: string;
  allow_student_messaging: boolean;
  allow_resource_uploads: boolean;
  allow_analytics: boolean;
  allow_priority_support: boolean;
  allow_featured_listing: boolean;
  max_class_listings: number;
  created_at: string;
  updated_at: string;
};

// ─── Helper: Admin role check ────────────────────────────────────────────────

async function verifyAdminRole(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('super_admins')
    .select('role_type')
    .eq('auth_id', userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.role_type === 'super_admin' || data.role_type === 'admin';
}

// ─── GET all pricing plans ───────────────────────────────────────────────────

/**
 * Fetch all pricing plans ordered by price ascending.
 */
export async function getPricingPlansAction() {
  try {
    const { data, error } = await supabaseAdmin
      .from('pricing_plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;

    return encryptData({ success: true, plans: data || [] });
  } catch (err: any) {
    console.error("❌ [GET PRICING PLANS ERROR]:", err.message);
    return encryptData({ success: false, message: err.message, plans: [] });
  }
}

// ─── CREATE a pricing plan ───────────────────────────────────────────────────

/**
 * Create a new pricing plan.
 * Expects an encrypted payload with: userId + all plan fields.
 */
export async function createPricingPlanAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload?.userId) {
      return encryptData({ success: false, message: "Unauthorized: Missing identity metadata." });
    }

    if (!(await verifyAdminRole(payload.userId))) {
      console.warn(`⚠️ [SECURITY ALERT]: Unauthorized pricing create attempt by ${payload.userId}`);
      return encryptData({ success: false, message: "Security exception: Insufficient permissions." });
    }

    // ── Validations ──────────────────────────────────────────────────────────
    const planKey = payload.plan_key?.trim()?.toLowerCase() || '';
    if (!planKey || !/^[a-z0-9_]+$/.test(planKey)) {
      return encryptData({ success: false, message: "Validation: plan_key must be lowercase alphanumeric (underscores allowed)." });
    }

    const name = payload.name?.trim() || '';
    if (!name) return encryptData({ success: false, message: "Validation: Plan name is required." });

    const price = parseFloat(payload.price);
    if (isNaN(price) || price < 0) {
      return encryptData({ success: false, message: "Validation: Price must be a non-negative number." });
    }

    const discountPrice = parseFloat(payload.discount_price) || 0;
    if (discountPrice > price) {
      return encryptData({ success: false, message: "Validation: Discount price cannot exceed the base price." });
    }

    const gstPct = parseFloat(payload.gst_percentage) || 0;
    if (gstPct < 0 || gstPct > 100) {
      return encryptData({ success: false, message: "Validation: GST percentage must be between 0 and 100." });
    }

    const { error } = await supabaseAdmin
      .from('pricing_plans')
      .insert({
        plan_key: planKey,
        name,
        description: payload.description?.trim() || '',
        price,
        period: payload.period || 'month',
        discount_price: discountPrice,
        gst_percentage: gstPct,
        gst_inclusive: Boolean(payload.gst_inclusive),
        is_active: payload.is_active !== false,
        allow_video_infrastructure: Boolean(payload.allow_video_infrastructure),
        video_infrastructure_provider: payload.allow_video_infrastructure ? (payload.video_infrastructure_provider || 'jitsi') : 'jitsi',
        allow_student_messaging: Boolean(payload.allow_student_messaging),
        allow_resource_uploads: Boolean(payload.allow_resource_uploads),
        allow_analytics: Boolean(payload.allow_analytics),
        allow_priority_support: Boolean(payload.allow_priority_support),
        allow_featured_listing: Boolean(payload.allow_featured_listing),
        max_class_listings: parseInt(payload.max_class_listings) ?? -1,
      });

    if (error) {
      if (error.code === '23505') {
        return encryptData({ success: false, message: `A plan with key "${planKey}" already exists. Please use a unique key.` });
      }
      throw error;
    }

    console.log(`✅ [PRICING CREATE]: Plan "${name}" created by Admin ${payload.userId}`);
    return encryptData({ success: true, message: `Plan "${name}" created successfully!` });
  } catch (err: any) {
    console.error("❌ [CREATE PRICING PLAN ERROR]:", err.message);
    return encryptData({ success: false, message: `System error: ${err.message}` });
  }
}

// ─── UPDATE a pricing plan ───────────────────────────────────────────────────

/**
 * Update an existing pricing plan by id.
 */
export async function updatePricingPlanAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload?.userId) {
      return encryptData({ success: false, message: "Unauthorized: Missing identity metadata." });
    }

    if (!(await verifyAdminRole(payload.userId))) {
      console.warn(`⚠️ [SECURITY ALERT]: Unauthorized pricing update attempt by ${payload.userId}`);
      return encryptData({ success: false, message: "Security exception: Insufficient permissions." });
    }

    if (!payload.id) {
      return encryptData({ success: false, message: "Validation: Plan ID is required for update." });
    }

    // ── Validations ──────────────────────────────────────────────────────────
    const planKey = payload.plan_key?.trim()?.toLowerCase() || '';
    if (!planKey || !/^[a-z0-9_]+$/.test(planKey)) {
      return encryptData({ success: false, message: "Validation: plan_key must be lowercase alphanumeric (underscores allowed)." });
    }

    const name = payload.name?.trim() || '';
    if (!name) return encryptData({ success: false, message: "Validation: Plan name is required." });

    const price = parseFloat(payload.price);
    if (isNaN(price) || price < 0) {
      return encryptData({ success: false, message: "Validation: Price must be a non-negative number." });
    }

    const discountPrice = parseFloat(payload.discount_price) || 0;
    if (discountPrice > price) {
      return encryptData({ success: false, message: "Validation: Discount price cannot exceed the base price." });
    }

    const gstPct = parseFloat(payload.gst_percentage) || 0;
    if (gstPct < 0 || gstPct > 100) {
      return encryptData({ success: false, message: "Validation: GST percentage must be between 0 and 100." });
    }

    const { error } = await supabaseAdmin
      .from('pricing_plans')
      .update({
        plan_key: planKey,
        name,
        description: payload.description?.trim() || '',
        price,
        period: payload.period || 'month',
        discount_price: discountPrice,
        gst_percentage: gstPct,
        gst_inclusive: Boolean(payload.gst_inclusive),
        is_active: payload.is_active !== false,
        allow_video_infrastructure: Boolean(payload.allow_video_infrastructure),
        video_infrastructure_provider: payload.allow_video_infrastructure ? (payload.video_infrastructure_provider || 'jitsi') : 'jitsi',
        allow_student_messaging: Boolean(payload.allow_student_messaging),
        allow_resource_uploads: Boolean(payload.allow_resource_uploads),
        allow_analytics: Boolean(payload.allow_analytics),
        allow_priority_support: Boolean(payload.allow_priority_support),
        allow_featured_listing: Boolean(payload.allow_featured_listing),
        max_class_listings: parseInt(payload.max_class_listings) ?? -1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.id);

    if (error) {
      if (error.code === '23505') {
        return encryptData({ success: false, message: `A plan with key "${planKey}" already exists.` });
      }
      throw error;
    }

    console.log(`✅ [PRICING UPDATE]: Plan "${name}" updated by Admin ${payload.userId}`);
    return encryptData({ success: true, message: `Plan "${name}" updated successfully!` });
  } catch (err: any) {
    console.error("❌ [UPDATE PRICING PLAN ERROR]:", err.message);
    return encryptData({ success: false, message: `System error: ${err.message}` });
  }
}

// ─── DELETE a pricing plan ───────────────────────────────────────────────────

/**
 * Delete a pricing plan by id.
 */
export async function deletePricingPlanAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload?.userId) {
      return encryptData({ success: false, message: "Unauthorized: Missing identity metadata." });
    }

    if (!(await verifyAdminRole(payload.userId))) {
      console.warn(`⚠️ [SECURITY ALERT]: Unauthorized pricing delete attempt by ${payload.userId}`);
      return encryptData({ success: false, message: "Security exception: Insufficient permissions." });
    }

    if (!payload.id) {
      return encryptData({ success: false, message: "Validation: Plan ID is required for deletion." });
    }

    const { error } = await supabaseAdmin
      .from('pricing_plans')
      .delete()
      .eq('id', payload.id);

    if (error) throw error;

    console.log(`✅ [PRICING DELETE]: Plan ID "${payload.id}" deleted by Admin ${payload.userId}`);
    return encryptData({ success: true, message: "Plan deleted successfully." });
  } catch (err: any) {
    console.error("❌ [DELETE PRICING PLAN ERROR]:", err.message);
    return encryptData({ success: false, message: `System error: ${err.message}` });
  }
}
