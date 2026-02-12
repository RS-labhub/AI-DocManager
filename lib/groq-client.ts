// Import OpenAI which can be used with Groq's API (they use compatible APIs)
import OpenAI from "openai"

// Initialize the client with Groq's API key and base URL
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

// Define the available models
const MODELS = {
  LLAMA3_8B: "llama3-8b-8192",
  LLAMA3_70B: "llama3-70b-8192",
  MIXTRAL: "mixtral-8x7b-32768",
}

// Function to generate content using Groq
export async function generateGroqResponse(
  prompt: string,
  systemPrompt = "",
  temperature = 0.7,
  maxTokens = 1000,
): Promise<string> {
  try {
    console.log("Generating Groq response with prompt:", prompt.substring(0, 100) + "...")

    const completion = await client.chat.completions.create({
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

    return completion.choices[0]?.message?.content || "No response generated"
  } catch (error) {
    console.error("Error generating Groq response:", error)
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Function to generate a document summary
export async function generateDocumentSummary(title: string, content: string): Promise<string> {
  const prompt = `Please provide a concise summary of the following document:
  
Title: ${title}

Content:
${content}

Your summary should capture the main points and key information in the document.`

  const systemPrompt = "You are an AI assistant that specializes in summarizing documents clearly and concisely."

  return generateGroqResponse(prompt, systemPrompt)
}

// Function to analyze a document
export async function analyzeDocument(title: string, content: string): Promise<string> {
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
export async function improveDocument(title: string, content: string): Promise<{ title: string; content: string }> {
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
}
