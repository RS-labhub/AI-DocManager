import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize the client with Groq's API key and base URL
let client: OpenAI | null = null

// Initialize the client lazily to avoid issues during server-side rendering
function getGroqClient() {
  if (client) return client

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set")
    return null
  }

  try {
    client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    })
    console.log("Groq client initialized successfully")
    return client
  } catch (error) {
    console.error("Failed to initialize Groq client:", error)
    return null
  }
}

// Define the available models
const MODELS = {
  LLAMA3_8B: "llama3-8b-8192",
  LLAMA3_70B: "llama3-70b-8192",
  MIXTRAL: "mixtral-8x7b-32768",
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { action, title, content } = requestBody

    if (!action || !title) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Log the request for debugging
    console.log(`Processing AI request: ${action} for document "${title}"`)
    console.log("GROQ_API_KEY is set:", !!process.env.GROQ_API_KEY)

    // Verify API key is available
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set")
      return NextResponse.json(
        {
          error: "API configuration error: Missing API key",
          result: generateFallbackContent(action, title, content || ""),
        },
        { status: 200 },
      ) // Return 200 with fallback content
    }

    // Get the Groq client
    const groqClient = getGroqClient()
    if (!groqClient) {
      console.error("Failed to initialize Groq client")
      return NextResponse.json(
        {
          error: "API configuration error: Failed to initialize client",
          result: generateFallbackContent(action, title, content || ""),
        },
        { status: 200 },
      ) // Return 200 with fallback content
    }

    let result

    try {
      switch (action) {
        case "summarize":
          result = await generateDocumentSummary(title, content || "")
          return NextResponse.json({ result })

        case "analyze":
          result = await analyzeDocument(title, content || "")
          return NextResponse.json({ result })

        case "improve":
          result = await improveDocument(title, content || "")
          // Make sure we're returning the result in the correct format
          return NextResponse.json({
            result: result,
          })

        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }
    } catch (actionError) {
      console.error(`Error processing ${action} action:`, actionError)

      // Return fallback content with error details
      return NextResponse.json(
        {
          error: `Error processing ${action} action: ${
            actionError instanceof Error ? actionError.message : "Unknown error"
          }`,
          result: generateFallbackContent(action, title, content || ""),
        },
        { status: 200 },
      ) // Return 200 with fallback content
    }
  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Function to generate fallback content when the API fails
function generateFallbackContent(action: string, title: string, content: string): string {
  console.log(`Generating fallback content for action: ${action}`)

  // Truncate content if it's too long
  const truncatedContent = content.length > 100 ? content.substring(0, 100) + "..." : content

  // Generate different responses based on action type
  switch (action) {
    case "summarize":
      return (
        `[API Fallback] Summary of "${title}"\n\n` +
        `This is a mock summary generated because the AI API call failed.\n\n` +
        `The document appears to be about ${title.toLowerCase()} and contains approximately ${content.length} characters.\n\n` +
        `For a real summary, please check the API configuration and try again.`
      )

    case "analyze":
      return (
        `[API Fallback] Analysis of "${title}"\n\n` +
        `Document Type: ${title.includes("Report") ? "Report" : title.includes("Policy") ? "Policy" : "General Document"}\n\n` +
        `Key Topics: ${title}\n\n` +
        `Structure: The document contains approximately ${content.length} characters.\n\n` +
        `This is a mock analysis generated because the AI API call failed.\n` +
        `For a real analysis, please check the API configuration and try again.`
      )

    default:
      return (
        `[API Fallback] The AI service encountered an error while processing your request.\n\n` +
        `This is a mock response for your document "${title}".\n\n` +
        `Please check the API configuration and try again.`
      )
  }
}

// Function to generate content using Groq
async function generateGroqResponse(
  prompt: string,
  systemPrompt = "",
  temperature = 0.7,
  maxTokens = 1000,
): Promise<string> {
  try {
    console.log("Generating Groq response with prompt:", prompt.substring(0, 100) + "...")

    // Get the client
    const groqClient = getGroqClient()
    if (!groqClient) {
      throw new Error("Groq client is not initialized")
    }

    // Make the API call with proper error handling
    try {
      const completion = await groqClient.chat.completions.create({
        model: MODELS.LLAMA3_8B,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      })

      if (!completion.choices || completion.choices.length === 0) {
        throw new Error("No response received from Groq API")
      }

      console.log("Received response from Groq API")
      return completion.choices[0]?.message?.content || "No response generated"
    } catch (apiError) {
      // Log the specific API error
      console.error("Groq API error:", apiError)

      // Check for specific error types
      if (typeof apiError === "object" && apiError !== null && "status" in apiError && (apiError as any).status === 401) {
        throw new Error("Authentication error: Invalid API key")
      } else if (typeof apiError === "object" && apiError !== null && "status" in apiError && (apiError as any).status === 429) {
        throw new Error("Rate limit exceeded: Too many requests")
      } else {
        if (apiError instanceof Error) {
          throw new Error(`Groq API error: ${apiError.message || "Unknown error"}`)
        } else {
          throw new Error("Groq API error: Unknown error")
        }
      }
    }
  } catch (error) {
    console.error("Error generating Groq response:", error)
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Function to generate a document summary
async function generateDocumentSummary(title: string, content: string): Promise<string> {
  const prompt = `Please provide a concise summary of the following document:
  
Title: ${title}

Content:
${content}

Your summary should capture the main points and key information in the document.`

  const systemPrompt = "You are an AI assistant that specializes in summarizing documents clearly and concisely."

  return generateGroqResponse(prompt, systemPrompt)
}

// Function to analyze a document
async function analyzeDocument(title: string, content: string): Promise<string> {
  const prompt = `Please analyze the following document:
  
Title: ${title}

Content:
${content}

Provide an analysis that includes:
1. Document type and purpose
2. Key topics and themes
3. Tone and style assessment
4. Structure evaluation
5. Recommendations for improvement`

  const systemPrompt = "You are an AI assistant that specializes in document analysis and content evaluation."

  return generateGroqResponse(prompt, systemPrompt)
}

// Function to improve a document
async function improveDocument(title: string, content: string): Promise<{ title: string; content: string }> {
  const prompt = `Please improve the following document:
  
Title: ${title}

Content:
${content}

Provide an improved version with:
1. Better clarity and readability
2. Enhanced structure
3. More professional tone (if appropriate)
4. Corrected grammar and style issues
5. Expanded content where needed

Return ONLY the improved title and content without any explanations or additional text.`

  const systemPrompt = "You are an AI assistant that specializes in improving document quality and readability."

  try {
    const response = await generateGroqResponse(prompt, systemPrompt)

    // Extract title and content from the response
    let improvedTitle = title
    let improvedContent = response

    // Try to extract a title if the response has a clear title format
    const titleMatch = response.match(/^#\s+(.+)$|^Title:\s*(.+)$/m)
    if (titleMatch) {
      improvedTitle = (titleMatch[1] || titleMatch[2]).trim()
      // Remove the title line from the content
      improvedContent = response.replace(/^#\s+.+$|^Title:\s*.+$/m, "").trim()
    }

    return {
      title: improvedTitle,
      content: improvedContent,
    }
  } catch (error) {
    console.error("Error improving document:", error)

    // Return a fallback improvement
    return {
      title: `Improved: ${title}`,
      content: `${content}\n\n[This document would be improved with better formatting and clarity. Due to an API error, the AI couldn't provide specific improvements.]`,
    }
  }
}
