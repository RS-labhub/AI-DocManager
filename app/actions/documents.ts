"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Document } from "@/lib/supabase/types";
import { checkPermission } from "@/lib/permit";

/* ─── Get documents for a user (org-scoped) ─────────────────── */

export async function getDocuments(userId: string, orgId: string): Promise<Document[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
    return [];
  }

  // Filter: show public docs + user's own private docs
  return (data || []).filter(
    (doc) => doc.is_public || doc.owner_id === userId
  );
}

/* ─── Get all documents in org (for admins) ─────────────────── */

export async function getAllOrgDocuments(orgId: string): Promise<Document[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching all org documents:", error);
    return [];
  }

  return data || [];
}

/* ─── Get all documents across all orgs (for god) ───────────── */

export async function getAllDocuments(): Promise<Document[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching all documents:", error);
    return [];
  }

  return data || [];
}

/* ─── Get single document ───────────────────────────────────── */

export async function getDocument(id: string): Promise<Document | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching document:", error);
    return null;
  }

  return data;
}

/* ─── Create document ───────────────────────────────────────── */

export async function createDocument(
  payload: { title: string; content: string; is_public: boolean; tags?: string[] },
  userId: string,
  orgId: string
): Promise<{ success: boolean; document?: Document; error?: string }> {
  const supabase = createServerClient();

  if (!payload.title.trim()) {
    return { success: false, error: "Title is required" };
  }

  // Check Permit.io policy
  const allowed = await checkPermission(userId, "create", "document");
  if (!allowed) {
    return { success: false, error: "You do not have permission to create documents" };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: payload.title.trim(),
      content: payload.content.trim(),
      is_public: payload.is_public,
      tags: payload.tags || [],
      owner_id: userId,
      org_id: orgId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating document:", error);
    return { success: false, error: error.message };
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "create",
    resource_type: "document",
    resource_id: data.id,
    details: { title: data.title },
    org_id: orgId,
  });

  revalidatePath("/dashboard/documents");
  return { success: true, document: data };
}

/* ─── Update document ───────────────────────────────────────── */

export async function updateDocument(
  id: string,
  payload: { title: string; content: string; is_public: boolean; tags?: string[] },
  userId: string
): Promise<{ success: boolean; document?: Document; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("documents")
    .update({
      title: payload.title.trim(),
      content: payload.content.trim(),
      is_public: payload.is_public,
      tags: payload.tags || [],
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating document:", error);
    return { success: false, error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "update",
    resource_type: "document",
    resource_id: id,
    details: { title: data.title },
    org_id: data.org_id,
  });

  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/${id}`);
  return { success: true, document: data };
}

/* ─── Delete document ───────────────────────────────────────── */

export async function deleteDocument(
  id: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  // Get doc first for audit
  const { data: doc } = await supabase
    .from("documents")
    .select("org_id, title")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: error.message };
  }

  if (doc) {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "delete",
      resource_type: "document",
      resource_id: id,
      details: { title: doc.title },
      org_id: doc.org_id,
    });
  }

  revalidatePath("/dashboard/documents");
  return { success: true };
}
