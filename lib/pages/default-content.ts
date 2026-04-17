/* ═══════════════════════════════════════════════════════════════
   Default BlockNote content used when a new page is created.
   Ships a small template up top followed by ~75 empty paragraph
   blocks so the editor opens with plenty of room to write —
   similar to how Notion pre-allocates room on a fresh page.
   ═══════════════════════════════════════════════════════════════ */

/**
 * BlockNote generates stable block IDs on the client. For server
 * inserts we let BlockNote re-ID on first render by omitting `id`.
 */
export function buildDefaultPageContent(): unknown[] {
  const blocks: unknown[] = [];

  // Headline row so the page feels intentional rather than empty.
  blocks.push({
    type: "heading",
    props: { level: 2 },
    content: [{ type: "text", text: "Getting started", styles: {} }],
  });
  blocks.push({
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "Type ",
        styles: {},
      },
      {
        type: "text",
        text: "/",
        styles: { code: true },
      },
      {
        type: "text",
        text: " to open the command menu and insert headings, lists, quotes, images, and more.",
        styles: {},
      },
    ],
  });
  blocks.push({ type: "paragraph", content: [] });
  blocks.push({ type: "paragraph", content: [] });

  // Pre-allocate ~75 empty paragraph blocks so the canvas feels roomy.
  for (let i = 0; i < 75; i++) {
    blocks.push({ type: "paragraph", content: [] });
  }
  return blocks;
}

/** Plain-text markdown cache corresponding to the default content. */
export function defaultPageMarkdown(): string {
  return [
    "## Getting started",
    "",
    "Type `/` to open the command menu and insert headings, lists, quotes, images, and more.",
    "",
  ].join("\n");
}
