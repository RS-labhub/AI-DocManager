/* ═══════════════════════════════════════════════════════════════
   BlockNote ↔ Markdown bridge (server-side, lightweight)
   ═══════════════════════════════════════════════════════════════
   BlockNote's own conversion APIs require a DOM, so we ship a
   small lossy bridge that handles the common subset used in
   Phase 1 (paragraph, heading 1-3, bullet/numbered list items,
   quote, code, image). Round-trip fidelity isn't perfect — that's
   why pages also store `markdown_cache` written from the client
   when available; this server helper is the safety net used for
   the import endpoint and as a backstop if the cache is stale.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";

interface InlineRun {
  type: "text";
  text: string;
  styles?: Record<string, boolean | string>;
}

interface BNBlock {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: InlineRun[] | string;
  children?: BNBlock[];
}

/* ─── blocks → markdown ─────────────────────────────────────── */

function inlineToMarkdown(content: BNBlock["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content
    .map((run) => {
      if (run.type !== "text") return "";
      let text = run.text ?? "";
      const s = run.styles ?? {};
      if (s.code) text = `\`${text}\``;
      if (s.bold) text = `**${text}**`;
      if (s.italic) text = `*${text}*`;
      if (s.strike) text = `~~${text}~~`;
      return text;
    })
    .join("");
}

function blockToMarkdown(block: BNBlock, indent = 0): string {
  const pad = "  ".repeat(indent);
  const inline = inlineToMarkdown(block.content);
  const renderChildren = () =>
    (block.children ?? [])
      .map((c) => blockToMarkdown(c, indent + 1))
      .join("\n");

  switch (block.type) {
    case "heading": {
      const level = Math.min(
        Math.max(
          Number((block.props as { level?: number } | undefined)?.level ?? 1),
          1
        ),
        3
      );
      return `${pad}${"#".repeat(level)} ${inline}`.trimEnd();
    }
    case "bulletListItem":
      return [`${pad}- ${inline}`, renderChildren()]
        .filter(Boolean)
        .join("\n");
    case "numberedListItem":
      return [`${pad}1. ${inline}`, renderChildren()]
        .filter(Boolean)
        .join("\n");
    case "checkListItem": {
      const checked = (block.props as { checked?: boolean } | undefined)
        ?.checked
        ? "x"
        : " ";
      return [`${pad}- [${checked}] ${inline}`, renderChildren()]
        .filter(Boolean)
        .join("\n");
    }
    case "quote":
      return inline
        .split("\n")
        .map((l) => `${pad}> ${l}`)
        .join("\n");
    case "codeBlock": {
      const lang =
        (block.props as { language?: string } | undefined)?.language ?? "";
      return `${pad}\`\`\`${lang}\n${inline}\n${pad}\`\`\``;
    }
    case "image": {
      const url = (block.props as { url?: string } | undefined)?.url ?? "";
      const caption = inline || "";
      return `${pad}![${caption}](${url})`;
    }
    case "paragraph":
    default:
      return `${pad}${inline}`.trimEnd();
  }
}

export function blocksToMarkdown(blocks: unknown[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return "";
  return blocks
    .filter((b): b is BNBlock => !!b && typeof b === "object")
    .map((b) => blockToMarkdown(b))
    .join("\n\n")
    .trim();
}

/* ─── markdown → blocks ─────────────────────────────────────── */

function plainText(text: string): InlineRun[] {
  if (!text) return [];
  return [{ type: "text", text, styles: {} }];
}

/**
 * Very small markdown-to-blocks converter — enough for `.md`
 * uploads to seed a usable starting page. Users can clean up the
 * structure inside the editor afterwards.
 */
export function markdownToBlocks(markdown: string): BNBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: BNBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const lang = fence[1] ?? "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      out.push({
        type: "codeBlock",
        props: { language: lang },
        content: buf.join("\n"),
      });
      continue;
    }

    // Heading 1-3
    const heading = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (heading) {
      out.push({
        type: "heading",
        props: { level: heading[1].length },
        content: plainText(heading[2]),
      });
      i++;
      continue;
    }

    // Bullet list item
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      out.push({ type: "bulletListItem", content: plainText(bullet[1]) });
      i++;
      continue;
    }

    // Numbered list item
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      out.push({ type: "numberedListItem", content: plainText(numbered[1]) });
      i++;
      continue;
    }

    // Block quote
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      const buf = [quote[1]];
      i++;
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push({ type: "quote", content: plainText(buf.join("\n")) });
      continue;
    }

    // Image
    const image = line.match(/^!\[(.*?)\]\((.+?)\)\s*$/);
    if (image) {
      out.push({
        type: "image",
        props: { url: image[2] },
        content: plainText(image[1]),
      });
      i++;
      continue;
    }

    // Blank line — skip
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph (collapse consecutive non-blank lines)
    const paraBuf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3})\s/.test(lines[i]) &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^```/.test(lines[i])
    ) {
      paraBuf.push(lines[i]);
      i++;
    }
    out.push({ type: "paragraph", content: plainText(paraBuf.join(" ")) });
  }

  if (out.length === 0) {
    out.push({ type: "paragraph", content: [] });
  }
  return out;
}
