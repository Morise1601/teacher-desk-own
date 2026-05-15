'use server';
import { supabase } from "@/lib/supabase";
import { encryptData, decryptData } from "@/lib/crypto";

/**
 * Fetch all qualifications
 */
export async function getQualificationsAction() {
  try {
    const { data, error } = await supabase
      .from('qualifications')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("❌ [DB ERROR qualifications]:", error);
      throw error;
    }

    return encryptData({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("❌ [ACTION ERROR getQualifications]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * Fetch specializations for a specific qualification
 */
export async function getSpecializationsAction(qualificationId: string) {
  try {
    const { data, error } = await supabase
      .from('specializations')
      .select('*')
      .eq('qualification_id', qualificationId)
      .order('name', { ascending: true });

    if (error) {
      console.error("❌ [DB ERROR specializations]:", error);
      throw error;
    }

    return encryptData({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("❌ [ACTION ERROR getSpecializations]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * Find or create a qualification and specialization
 */
export async function findOrCreateMetadataAction(encryptedPayload: string) {
  try {
    const { qualificationName, specializationName } = decryptData(encryptedPayload);

    if (!qualificationName) throw new Error("Qualification name is required");

    // 1. Find or create qualification
    let { data: qual, error: qualError } = await supabase
      .from('qualifications')
      .select('id')
      .ilike('name', qualificationName)
      .maybeSingle();

    if (qualError) throw qualError;

    if (!qual) {
      const { data: newQual, error: createQualError } = await supabase
        .from('qualifications')
        .insert([{ name: qualificationName }])
        .select('id')
        .single();

      if (createQualError) throw createQualError;
      qual = newQual;
    }

    // 2. Find or create specialization if provided
    let specId = null;
    if (specializationName) {
      let { data: spec, error: specError } = await supabase
        .from('specializations')
        .select('id')
        .eq('qualification_id', qual.id)
        .ilike('name', specializationName)
        .maybeSingle();

      if (specError) throw specError;

      if (!spec) {
        const { data: newSpec, error: createSpecError } = await supabase
          .from('specializations')
          .insert([{ qualification_id: qual.id, name: specializationName }])
          .select('id')
          .single();

        if (createSpecError) throw createSpecError;
        spec = newSpec;
      }
      specId = spec.id;
    }

    return encryptData({
      success: true,
      qualificationId: qual.id,
      specializationId: specId
    });
  } catch (error: any) {
    console.error("Error in findOrCreateMetadata:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}
