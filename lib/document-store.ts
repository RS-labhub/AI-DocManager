// This is a simple in-memory document store that persists across server restarts
// In a real application, this would be replaced with a database

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

// Define the document type
export interface Document {
  id: string
  title: string
  content: string
  ownerId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// Path to the JSON file where documents will be stored
const DATA_DIR = join(process.cwd(), ".data")
const DOCUMENTS_FILE = join(DATA_DIR, "documents.json")

// Initial documents
const initialDocuments: Document[] = [
  {
    id: "1",
    title: "Getting Started Guide",
    content: "This is a guide to help you get started with our document management system.",
    ownerId: "admin-id",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Security Policy",
    content: "This document outlines our security policies and procedures.",
    ownerId: "admin-id",
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "User Manual",
    content: "A comprehensive guide for users of our system.",
    ownerId: "user-id",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Ensure the data directory exists
try {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
} catch (error) {
  console.error("Failed to create data directory:", error)
}

// Initialize the documents file if it doesn't exist
try {
  if (!existsSync(DOCUMENTS_FILE)) {
    writeFileSync(DOCUMENTS_FILE, JSON.stringify(initialDocuments, null, 2))
  }
} catch (error) {
  console.error("Failed to initialize documents file:", error)
}

// Function to get all documents
export function getAllDocuments(): Document[] {
  try {
    const data = readFileSync(DOCUMENTS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Failed to read documents:", error)
    return initialDocuments
  }
}

// Function to save all documents
export function saveAllDocuments(documents: Document[]): void {
  try {
    writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2))
  } catch (error) {
    console.error("Failed to save documents:", error)
  }
}

// Function to get a document by ID
export function getDocumentById(id: string): Document | null {
  const documents = getAllDocuments()
  return documents.find((doc) => doc.id === id) || null
}

// Function to create a new document
export function createNewDocument(
  data: {
    title: string
    content: string
    isPublic: boolean
  },
  userId: string,
): Document {
  const documents = getAllDocuments()

  const newDocument: Document = {
    id: uuidv4(), // Generate a unique ID
    title: data.title.trim(),
    content: data.content.trim(),
    ownerId: userId,
    isPublic: data.isPublic,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  documents.push(newDocument)
  saveAllDocuments(documents)

  return newDocument
}

// Function to update a document
export function updateExistingDocument(
  id: string,
  data: { title: string; content: string; isPublic: boolean },
  userId: string,
): Document {
  const documents = getAllDocuments()
  const documentIndex = documents.findIndex((doc) => doc.id === id)

  if (documentIndex === -1) {
    throw new Error("Document not found")
  }

  const document = documents[documentIndex]

  // Check if user has permission to update this document
  const canUpdate = document.ownerId === userId || userId === "admin-id"

  if (!canUpdate) {
    throw new Error("You do not have permission to update this document")
  }

  const updatedDocument = {
    ...document,
    title: data.title,
    content: data.content,
    isPublic: data.isPublic,
    updatedAt: new Date().toISOString(),
  }

  documents[documentIndex] = updatedDocument
  saveAllDocuments(documents)

  return updatedDocument
}

// Function to delete a document
export function deleteExistingDocument(id: string, userId: string): { success: boolean; message: string } {
  const documents = getAllDocuments()
  const documentIndex = documents.findIndex((doc) => doc.id === id)

  if (documentIndex === -1) {
    throw new Error("Document not found")
  }

  const document = documents[documentIndex]

  // Admin can delete any document, owners can delete their own documents
  const canDelete = userId === "admin-id" || document.ownerId === userId

  if (!canDelete) {
    throw new Error("You do not have permission to delete this document")
  }

  documents.splice(documentIndex, 1)
  saveAllDocuments(documents)

  return { success: true, message: "Document deleted successfully" }
}

// Function to get documents accessible by a user
export function getDocumentsForUser(userId: string): Document[] {
  const documents = getAllDocuments()

  return documents.filter((doc) => {
    // If document is public, show it
    if (doc.isPublic) return true

    // If user is the owner, show it
    if (doc.ownerId === userId) return true

    // Otherwise, don't show private documents
    return false
  })
}
