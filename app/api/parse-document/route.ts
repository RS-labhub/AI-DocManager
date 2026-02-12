import { type NextRequest, NextResponse } from "next/server"

// We'll use dynamic imports instead of require
let mammoth: any = null
let pdfjs: any = null
let pptxjs: any = null

// Initialize libraries with dynamic imports
const initLibraries = async () => {
  try {
    mammoth = await import("mammoth")
    console.log("Mammoth library loaded successfully")
  } catch (e) {
    console.error("Failed to import mammoth:", e)
  }

  try {
    pdfjs = await import("pdfjs-dist")
    // Set up PDF.js worker if available
    if (pdfjs && pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
    }
    console.log("PDF.js library loaded successfully")
  } catch (e) {
    console.error("Failed to import pdfjs-dist:", e)
  }

  try {
    pptxjs = await import("pptx-parser")
    console.log("PPTX parser library loaded successfully")
  } catch (e) {
    console.error("Failed to import pptx-parser:", e)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Document parsing request received")

    // Initialize libraries first
    await initLibraries()

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
    if (!["docx", "pdf", "ppt", "pptx"].includes(fileType || "")) {
      console.error("Unsupported file type:", fileType)
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    // Get file buffer
    let buffer
    try {
      buffer = await file.arrayBuffer()
      console.log("File buffer obtained, size:", buffer.byteLength)
    } catch (bufferError) {
      console.error("Failed to get file buffer:", bufferError)
      return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
    }

    let content = ""

    try {
      // Process file based on type
      switch (fileType) {
        case "docx":
          if (!mammoth) {
            console.warn("Mammoth library not available, using mock parser")
            content = mockParse(file.name, buffer.byteLength)
          } else {
            console.log("Parsing DOCX file")
            content = await parseDocx(buffer)
          }
          break
        case "pdf":
          if (!pdfjs) {
            console.warn("PDF.js library not available, using mock parser")
            content = mockParse(file.name, buffer.byteLength)
          } else {
            console.log("Parsing PDF file")
            content = await parsePdf(buffer)
          }
          break
        case "ppt":
        case "pptx":
          if (!pptxjs) {
            console.warn("PPTX parser library not available, using mock parser")
            content = mockParse(file.name, buffer.byteLength)
          } else {
            console.log("Parsing PPT/PPTX file")
            content = await parsePptx(buffer)
          }
          break
        default:
          console.error("Unsupported file type (switch case):", fileType)
          return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
      }

      console.log("File parsed successfully, content length:", content.length)

      // Return the extracted content
      return NextResponse.json({ content })
    } catch (parsingError) {
      console.error(`Error parsing ${fileType} file:`, parsingError)

      // Use mock parser as fallback
      try {
        console.log("Using mock parser as fallback")
        content = mockParse(file.name, buffer.byteLength)
        return NextResponse.json({
          content,
          warning: `Used fallback parser due to error: ${parsingError instanceof Error ? parsingError.message : "Unknown error"}`,
        })
      } catch (mockError) {
        return NextResponse.json(
          {
            error: `Failed to parse ${fileType} file: ${parsingError instanceof Error ? parsingError.message : "Unknown error"}`,
          },
          { status: 500 },
        )
      }
    }
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

// Mock parser function for testing or when libraries fail
function mockParse(filename: string, size: number): string {
  console.log("Using mock parser for", filename)
  return (
    `This is mock content extracted from ${filename}.\n\n` +
    `The file size is approximately ${(size / 1024).toFixed(1)} KB.\n\n` +
    `This is a fallback parser used when the actual parsing libraries are not available or encounter errors.\n\n` +
    `In a production environment, you would see the actual content of your document here.\n\n` +
    `For testing purposes, this mock content is being generated to allow you to continue testing the application.`
  )
}

async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  if (!mammoth) {
    throw new Error("Mammoth library not available")
  }

  try {
    console.log("Parsing DOCX with mammoth")
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    console.log("DOCX parsing successful")
    return result.value
  } catch (error) {
    console.error("Error parsing DOCX:", error)
    throw new Error(`DOCX parsing error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  if (!pdfjs) {
    throw new Error("PDF.js library not available")
  }

  try {
    console.log("Loading PDF document")
    const pdf = await pdfjs.getDocument({ data: buffer }).promise
    console.log("PDF loaded, pages:", pdf.numPages)

    let text = ""

    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing PDF page ${i} of ${pdf.numPages}`)
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items.map((item: any) => item.str).join(" ")
      text += pageText + "\n\n"
    }

    console.log("PDF parsing successful")
    return text
  } catch (error) {
    console.error("Error parsing PDF:", error)
    throw new Error(`PDF parsing error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

async function parsePptx(buffer: ArrayBuffer): Promise<string> {
  if (!pptxjs) {
    throw new Error("PPTX parser library not available")
  }

  try {
    console.log("Parsing PPTX presentation")
    const presentation = await pptxjs.parse(buffer)
    console.log("PPTX parsed, slides:", presentation.slides.length)

    let text = ""

    presentation.slides.forEach((slide: any, index: number) => {
      console.log(`Processing slide ${index + 1}`)
      text += `## Slide ${index + 1}\n\n`

      slide.shapes.forEach((shape: any) => {
        if (shape.text) {
          text += shape.text + "\n\n"
        }
      })
    })

    console.log("PPTX parsing successful")
    return text
  } catch (error) {
    console.error("Error parsing PPTX:", error)
    throw new Error(`PPTX parsing error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
