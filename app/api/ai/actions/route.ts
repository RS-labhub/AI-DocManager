import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { decryptApiKey } from "@/lib/encryption";
import { withAuth, getClientIp } from "@/lib/auth/require";
import { aiActionSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { ZodError } from "zod";
import OpenAI from "openai";

export const runtime = "nodejs";

const PROVIDER_CONFIG: Record<string, { baseURL: string; defaultModel: string }> = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama3-8b-8192",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-3.5-turbo",
  },
  anthropic: {
    baseURL: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-haiku-20240307",
  },
};

export const POST = withAuth(async (authed, req: NextRequest) => {
  try {
    // Rate-limit per-user: 30 AI calls / 5 minutes.
    const rl = await checkRateLimit("ai-actions", authed.id, 30, 300);
    if (rl) return rl;

    const raw = await req.json();
    const { action, title, content, provider, question } = aiActionSchema.parse(raw);

    const selectedProvider = provider;
    const supabase = await createServerClient();

    // Caller's own key only — never anyone else's.
    const { data: keyData } = await supabase
      .from("ai_api_keys")
      .select("encrypted_key, iv, auth_tag")
      .eq("user_id", authed.id)
      .eq("provider", selectedProvider)
      .eq("is_active", true)
      .maybeSingle();

    if (!keyData) {
      return NextResponse.json(
        { error: `No active ${selectedProvider} API key. Add one in Settings.` },
        { status: 404 }
      );
    }

    let apiKey: string;
    try {
      apiKey = decryptApiKey({
        encrypted_key: keyData.encrypted_key,
        iv: keyData.iv,
        auth_tag: keyData.auth_tag,
      });
    } catch (err) {
      console.error("[ai/actions] decrypt failed", err);
      return NextResponse.json({ error: "Stored key is invalid — please re-enter it" }, { status: 500 });
    }

    const config = PROVIDER_CONFIG[selectedProvider];
    if (!config) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey, baseURL: config.baseURL });
    const { systemPrompt, userPrompt } = buildPrompts(action, title ?? "", content ?? "", question);

    const completion = await client.chat.completions.create({
      model: config.defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content || "No response generated";

    await supabase.from("audit_logs").insert({
      user_id: authed.id,
      action: "ai_action",
      resource_type: "ai_action",
      details: { action, provider: selectedProvider },
      org_id: authed.profile.org_id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("[ai/actions] error:", err);
    return NextResponse.json({ error: "AI action failed" }, { status: 500 });
  }
});

function buildPrompts(
  action: string,
  title: string,
  content: string,
  question?: string
): { systemPrompt: string; userPrompt: string } {
  switch (action) {
    case "summarize":
      return {
        systemPrompt: "You are an expert document summarizer. Provide concise, accurate summaries.",
        userPrompt: `Summarize this document:\n\nTitle: ${title}\n\nContent:\n${content}`,
      };
    case "analyze":
      return {
        systemPrompt: "You are a document analyst. Provide structured analysis including themes, tone, and recommendations.",
        userPrompt: `Analyze this document:\n\nTitle: ${title}\n\nContent:\n${content}\n\nProvide:\n1. Document type and purpose\n2. Key topics\n3. Tone assessment\n4. Recommendations`,
      };
    case "improve":
      return {
        systemPrompt: "You are a professional editor. Improve the document while keeping the original intent.",
        userPrompt: `Improve this document:\n\nTitle: ${title}\n\nContent:\n${content}\n\nProvide improved title and content with better clarity and structure.`,
      };
    case "generate":
      return {
        systemPrompt: "You are a content generator. Create professional document content based on the given topic.",
        userPrompt: `Generate document content about: ${title}\n\nContext: ${content}`,
      };
    case "extract_keywords":
      return {
        systemPrompt: "You are a keyword extraction specialist. Identify the most important terms, phrases, and concepts.",
        userPrompt: `Extract the key terms and phrases from this document:\n\nTitle: ${title}\n\nContent:\n${content}\n\nProvide:\n1. Primary keywords (most important)\n2. Secondary keywords\n3. Named entities (people, places, organizations)\n4. Technical terms`,
      };
    case "translate":
      return {
        systemPrompt: "You are a professional translator. Translate the document accurately while preserving meaning and tone.",
        userPrompt: `Translate this document to Spanish (or the language requested in the content):\n\nTitle: ${title}\n\nContent:\n${content}`,
      };
    case "qa":
      return {
        systemPrompt: "You are a document Q&A expert. Answer questions about the document accurately based only on its content. If the answer is not in the document, say so.",
        userPrompt: `Document Title: ${title}\n\nDocument Content:\n${content}\n\nQuestion: ${question || "What is this document about?"}`,
      };
    default:
      return {
        systemPrompt: "You are a helpful AI assistant for document management.",
        userPrompt: `${action}: ${title}\n\n${content}`,
      };
  }
}
