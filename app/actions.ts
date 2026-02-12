"use server"

import { revalidatePath } from "next/cache"
import {
  getDocumentById,
  createNewDocument,
  updateExistingDocument,
  deleteExistingDocument,
  getDocumentsForUser,
  type Document,
} from "@/lib/document-store"

export async function getDocuments(userId: string): Promise<Document[]> {
  console.log(`Getting documents for user ${userId}`)
  return getDocumentsForUser(userId)
}

export async function getDocument(id: string, userId: string): Promise<Document | null> {
  console.log(`Getting document ${id} for user ${userId}`)
  const document = getDocumentById(id)

  if (!document) {
    console.log(`Document ${id} not found`)
    return null
  }

  // Check if user has access to this document
  const hasAccess = document.isPublic || document.ownerId === userId

  if (!hasAccess) {
    console.log(`User ${userId} does not have access to document ${id}`)
    return null
  }

  return document
}

export async function createDocument(
  data: { title: string; content: string; isPublic: boolean },
  userId: string,
): Promise<{ success: boolean; document: Document }> {
  console.log("=== CREATE DOCUMENT START ===")
  console.log("Creating document with data:", data)
  console.log("User ID:", userId)

  // Validate user ID
  if (!userId) {
    console.error("User ID is required")
    throw new Error("User ID is required")
  }

  // Validate title
  if (!data.title || data.title.trim() === "") {
    console.error("Title is required")
    throw new Error("Title is required")
  }

  try {
    const newDocument = createNewDocument(data, userId)

    console.log("New document created:", newDocument)

    // Revalidate the documents path to update the UI
    revalidatePath("/documents")

    console.log("=== CREATE DOCUMENT SUCCESS ===")
    return { success: true, document: newDocument }
  } catch (error) {
    console.error("=== CREATE DOCUMENT ERROR ===")
    console.error(`Error creating document: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export async function updateDocument(
  id: string,
  data: { title: string; content: string; isPublic: boolean },
  userId: string,
): Promise<Document> {
  console.log(`Updating document ${id} by user ${userId}`)
  console.log("Update data:", data)

  try {
    const updatedDocument = updateExistingDocument(id, data, userId)

    console.log("Document updated successfully:", updatedDocument)

    revalidatePath("/documents")
    revalidatePath(`/documents/${id}`)

    return updatedDocument
  } catch (error) {
    console.error(`Error updating document: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export async function deleteDocument(id: string, userId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Attempting to delete document ${id} by user ${userId}`)

  try {
    const result = deleteExistingDocument(id, userId)

    console.log("Document deleted successfully")

    revalidatePath("/documents")

    return result
  } catch (error) {
    console.error(`Error deleting document: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}
