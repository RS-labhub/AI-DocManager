/* ═══════════════════════════════════════════════════════════════
   Editor DOM enhancers
   ═══════════════════════════════════════════════════════════════
   BlockNote renders block contents via ProseMirror, which we don't
   want to fork — its schema is touchy and replacing core blocks
   destabilises the editor (see the toggleListItem regression).

   Instead, these helpers run AFTER BlockNote has produced the DOM
   for the editor, and non-invasively decorate it:

     • convertEmbedBlocks — swap `<video src=url>` for an <iframe>
       when the URL is a YouTube / Vimeo / Drive embed that the
       native <video> element cannot play.

     • enhanceLinks — give anchor tags a hover overlay with "copy"
       and (in edit mode) "unlink" buttons so users can inspect
       / adjust links without opening BlockNote's built-in
       link toolbar.

     • enhanceCodeBlocks — attach a small "Copy" button to every
       code block so viewers can grab the source without selecting
       text manually. We don't ship a language picker.

     • enhanceFileBlocks — add an "Open" link to generic file
       blocks so viewers can download / open the attachment in a
       new tab. Audio / video already expose a native link in
       BlockNote's side panel, so they're skipped.

   All enhancers are idempotent: they track which elements they've
   already touched with data-* flags, so running them repeatedly
   via a MutationObserver is safe and cheap.
   ═══════════════════════════════════════════════════════════════ */

/** Try to extract a YouTube video id from various URL forms. */
function youtubeId(url: string): string | null {
  // youtu.be/<id>
  const short = url.match(/youtu\.be\/([\w-]{6,})/i)
  if (short) return short[1]
  // youtube.com/watch?v=<id>
  const watch = url.match(/[?&]v=([\w-]{6,})/i)
  if (watch) return watch[1]
  // youtube.com/embed/<id>
  const emb = url.match(/youtube\.com\/embed\/([\w-]{6,})/i)
  if (emb) return emb[1]
  // youtube.com/shorts/<id>
  const sh = url.match(/youtube\.com\/shorts\/([\w-]{6,})/i)
  if (sh) return sh[1]
  return null
}

function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d{5,})/i)
  return m ? m[1] : null
}

function driveEmbedUrl(url: string): string | null {
  // https://drive.google.com/file/d/<id>/view?...
  const m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/i)
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  return null
}

function iframeEmbedFor(url: string): string | null {
  const yt = youtubeId(url)
  if (yt) return `https://www.youtube.com/embed/${yt}`
  const vi = vimeoId(url)
  if (vi) return `https://player.vimeo.com/video/${vi}`
  const gd = driveEmbedUrl(url)
  if (gd) return gd
  return null
}

/**
 * Replace <video src=url> / <audio src=url> with an <iframe> when
 * the URL points at a YouTube/Vimeo/Drive embed. We preserve the
 * surrounding BlockNote markup so the rest of the editor continues
 * to work.
 */
export function convertEmbedBlocks(root: HTMLElement) {
  const media = root.querySelectorAll<HTMLVideoElement | HTMLAudioElement>(
    'video[src]:not([data-embed-swapped]), audio[src]:not([data-embed-swapped])'
  )
  media.forEach((v) => {
    const src = v.getAttribute("src") ?? ""
    const embed = iframeEmbedFor(src)
    if (!embed) return

    const iframe = document.createElement("iframe")
    iframe.src = embed
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    iframe.allowFullscreen = true
    iframe.loading = "lazy"
    iframe.setAttribute("frameborder", "0")
    iframe.setAttribute("data-embed-swapped", "true")
    iframe.className = v.className

    v.setAttribute("data-embed-swapped", "true")
    v.replaceWith(iframe)
  })
}

/**
 * Wrap bare <a> tags inside the editor with our hover overlay so
 * users can see the target URL, copy it, or (when editable) detach
 * the link. The overlay itself is a single element reused across
 * all links to avoid DOM churn.
 */
export function enhanceLinks(
  root: HTMLElement,
  options: {
    editable: boolean
    getOverlay: () => HTMLElement
    onUnlink: (anchor: HTMLAnchorElement) => void
  }
) {
  const links = root.querySelectorAll<HTMLAnchorElement>(
    "a[href]:not([data-link-enhanced])"
  )
  links.forEach((a) => {
    a.setAttribute("data-link-enhanced", "true")
    a.setAttribute("target", a.getAttribute("target") ?? "_blank")
    a.setAttribute("rel", "noopener noreferrer")
    a.addEventListener("mouseenter", () => {
      const overlay = options.getOverlay()
      const rect = a.getBoundingClientRect()
      overlay.dataset.href = a.href
      overlay.dataset.editable = options.editable ? "1" : "0"
      overlay.style.top = `${rect.bottom + window.scrollY + 6}px`
      overlay.style.left = `${Math.max(8, rect.left + window.scrollX)}px`
      overlay.style.display = "flex"
      ;(overlay as any)._target = a
      ;(overlay as any)._onUnlink = options.onUnlink
    })
    a.addEventListener("mouseleave", (ev) => {
      const overlay = options.getOverlay()
      const next = ev.relatedTarget as Node | null
      if (next && overlay.contains(next)) return
      window.setTimeout(() => {
        if (!overlay.matches(":hover") && !a.matches(":hover")) {
          overlay.style.display = "none"
        }
      }, 120)
    })
  })
}

/**
 * Add a small "Copy" button to every code block so readers can
 * grab the source in one click. The button is attached to the
 * block's `.bn-block-outer` wrapper (not the ProseMirror-managed
 * content) so the view reconciler doesn't strip it, and it's
 * flagged idempotent with `data-copy-btn`.
 */
export function enhanceCodeBlocks(root: HTMLElement) {
  const outers = root.querySelectorAll<HTMLElement>(
    ".bn-block-outer:not([data-copy-btn])"
  )
  outers.forEach((outer) => {
    const content = outer.querySelector<HTMLElement>(
      '.bn-block-content[data-content-type="codeBlock"]'
    )
    if (!content) return

    outer.setAttribute("data-copy-btn", "true")
    outer.classList.add("bn-has-copy-btn")

    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "bn-code-copy"
    btn.setAttribute("contenteditable", "false")
    btn.setAttribute("aria-label", "Copy code to clipboard")
    btn.title = "Copy code"
    btn.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>'

    // Don't leak clicks into ProseMirror — it would try to place
    // the selection inside the code block and the user would lose
    // their current cursor.
    btn.addEventListener("mousedown", (ev) => ev.stopPropagation())
    btn.addEventListener("pointerdown", (ev) => ev.stopPropagation())
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation()
      ev.preventDefault()
      const code = content.querySelector<HTMLElement>("code")
      const text = code?.innerText ?? content.innerText ?? ""
      try {
        await navigator.clipboard.writeText(text)
        const label = btn.querySelector("span")
        if (label) {
          const prev = label.textContent
          label.textContent = "Copied"
          window.setTimeout(() => {
            label.textContent = prev ?? "Copy"
          }, 1000)
        }
      } catch {
        /* clipboard API blocked — fail silently */
      }
    })

    outer.appendChild(btn)
  })
}

/**
 * Add an "Open" link to generic file blocks that have a resolved
 * URL. BlockNote's default file block only shows the attachment's
 * name + icon, so viewers had no way to download or open the file
 * inline. The link lives inside the block content wrapper so it
 * moves with the block and is visible in both edit and read-only
 * modes.
 *
 * Audio / video / image blocks already expose a native action to
 * open the source in BlockNote's side panel, so we skip them to
 * avoid doubling up.
 */
export function enhanceFileBlocks(
  root: HTMLElement,
  options: {
    getFileUrl: (blockId: string) => string | undefined
  }
) {
  const blocks = root.querySelectorAll<HTMLElement>(
    '[data-file-block][data-content-type="file"]:not([data-open-link])'
  )
  blocks.forEach((block) => {
    const outer = block.closest<HTMLElement>(".bn-block-outer")
    const blockId = outer?.getAttribute("data-id") ?? ""
    const url = options.getFileUrl(blockId)
    if (!url) return

    const wrapper = block.querySelector<HTMLElement>(
      ".bn-file-block-content-wrapper"
    )
    if (!wrapper) return

    block.setAttribute("data-open-link", "true")

    const link = document.createElement("a")
    link.href = url
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.className = "bn-file-open-link"
    link.setAttribute("contenteditable", "false")
    link.title = "Open file in new tab"
    // Simple external-link glyph + label. We inline the SVG so the
    // enhancer has no CSS dependency — it renders correctly even
    // when the page-editor stylesheet loads after the enhancer
    // first fires.
    link.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg><span>Open</span>'
    // Clicking the link should not propagate into ProseMirror
    // selection logic (which would focus the block and cancel
    // navigation).
    link.addEventListener("mousedown", (ev) => ev.stopPropagation())
    link.addEventListener("click", (ev) => ev.stopPropagation())

    // Prefer to slot the link alongside the filename row so it
    // reads as part of the attachment card rather than a loose
    // footer. Fall back to appending to the wrapper if the row
    // isn't present (e.g. when a future BlockNote version changes
    // the DOM).
    const row = wrapper.querySelector<HTMLElement>(".bn-file-name-with-icon")
    if (row) {
      row.appendChild(link)
    } else {
      wrapper.appendChild(link)
    }
  })
}
