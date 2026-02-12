import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Simple document parsing request received")

    // Parse the form data
    let formData
    try {
      formData = await request.formData()
      console.log("Form data parsed successfully")
    } catch (formError) {
      console.error("Failed to parse form data:", formError)
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }

    const file = formData.get("file") as File | null

    if (!file) {
      console.error("No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("File received:", file.name, "Size:", file.size, "Type:", file.type)

    const fileType = file.name.split(".").pop()?.toLowerCase()

    // Validate file type
    if (!["docx", "pdf", "ppt", "pptx", "txt"].includes(fileType || "")) {
      console.error("Unsupported file type:", fileType)
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    // For simplicity, we'll just use a mock parser for all file types
    // In a production environment, you would use proper parsing libraries
    const content = generateMockContent(file.name, file.size, fileType || "")

    console.log("Mock content generated, length:", content.length)

    // Return the extracted content
    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error processing document:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error processing document",
      },
      { status: 500 },
    )
  }
}

// Generate mock content based on file type
function generateMockContent(filename: string, size: number, fileType: string): string {
  console.log("Generating mock content for", filename)

  const fileTypeDescriptions = {
    docx: "Word document",
    pdf: "PDF document",
    ppt: "PowerPoint presentation",
    pptx: "PowerPoint presentation",
    txt: "text file",
  }

  const description = fileTypeDescriptions[fileType] || "document"

  return (
    `# ${filename}\n\n` +
    `This is mock content extracted from your ${description}.\n\n` +
    `The file size is approximately ${(size / 1024).toFixed(1)} KB.\n\n` +
    `File type: ${fileType.toUpperCase()}\n\n` +
    `In a production environment, you would see the actual content of your document here.\n\n` +
    `For testing purposes, this mock content is being generated to allow you to continue testing the application.\n\n` +
    `You can edit this content as needed before creating your document.`
  )
}
