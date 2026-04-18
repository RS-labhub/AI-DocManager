"use client"

/* ═══════════════════════════════════════════════════════════════
   BlockNote rich editor wrapper (Mantine theme).

   This component is intentionally self-contained:
   - creates an editor with the caller's initial JSON tree
   - debounces changes and hands them to the parent (`onChange`)
   - emits a lossy markdown cache alongside the JSON tree
   - honours `readOnly` for viewers/commenters

   Security note: the editor only renders what the server returns.
   We never interpolate HTML; BlockNote handles sanitisation.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core"
import "@blocknote/mantine/style.css"
import { useTheme } from "next-themes"
import {
  convertEmbedBlocks,
  enhanceCodeBlocks,
  enhanceFileBlocks,
  enhanceLinks,
} from "./page-editor-enhancers"

// The stock BlockNote toggleListItem block has a regression in this
// version that can lock up the browser tab when expanded with an
// empty child slot (it subscribes to editor.onChange inside the
// block's NodeView but never unsubscribes, and re-renders can fan
// out into a feedback loop). Strip it from the schema until upstream
// ships a fix. Everything else ships with the default behaviour.
//
// Code-block language picker: we tried wiring
// `createCodeBlockSpec({ supportedLanguages })` to get BlockNote's
// built-in language <select>, but that path makes the editor hang
// in this project (likely a dev-bundler interaction with the shiki
// highlighter plugin). Until upstream is fixed we fall back to the
// default code block — users can still type ``` + lang to set the
// language, it just isn't switchable from the UI.
const { toggleListItem: _removedToggleListItem, ...safeBlockSpecs } =
  defaultBlockSpecs
void _removedToggleListItem

const editorSchema = BlockNoteSchema.create({
  blockSpecs: safeBlockSpecs,
})

export type BlockTree = unknown[]

interface PageEditorProps {
  initialContent: BlockTree | null | undefined
  readOnly?: boolean
  onChange?: (payload: { content: BlockTree; markdown: string }) => void
  /** Debounce window before onChange fires, ms. */
  debounceMs?: number
}

export function PageEditor({
  initialContent,
  readOnly = false,
  onChange,
  debounceMs = 800,
}: PageEditorProps) {
  const { resolvedTheme } = useTheme()

  // BlockNote is picky about the initial value: it must be a non-empty
  // array or undefined. Empty arrays crash the editor, so we default.
  const initial = useMemo(() => {
    if (Array.isArray(initialContent) && initialContent.length > 0) {
      return initialContent as any
    }
    return undefined
  }, [initialContent])

  const editor = useCreateBlockNote({
    schema: editorSchema,
    initialContent: initial,
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const handleChange = useCallback(() => {
    if (!onChangeRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const content = editor.document as BlockTree
        // blocksToMarkdownLossy lives on the editor instance (DOM-backed).
        const markdown = await editor.blocksToMarkdownLossy(editor.document)
        onChangeRef.current?.({ content, markdown })
      } catch (err) {
        console.error("[PageEditor] serialize failed", err)
      }
    }, debounceMs)
  }, [editor, debounceMs])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // ── Post-render DOM enhancers ──────────────────────────────────
  //
  // These run AFTER BlockNote has painted its tree. We use a
  // MutationObserver to react to incremental changes instead of
  // forking the editor schema, which would risk the same kind of
  // hangs we saw with `createCodeBlockSpec`. Everything here is
  // scoped to `surfaceRef.current`, idempotent, and torn down on
  // unmount.
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Build/cache the link hover overlay once. It's a floating
  // toolbar that the enhancer repositions on mouseenter of any
  // anchor inside the editor.
  const getOverlay = useCallback(() => {
    if (overlayRef.current) return overlayRef.current
    const el = document.createElement("div")
    el.className = "bn-link-overlay"
    el.style.display = "none"
    el.innerHTML = `
      <a class="bn-link-overlay__url" target="_blank" rel="noopener noreferrer"></a>
      <button type="button" class="bn-link-overlay__btn" data-action="copy" title="Copy link">Copy</button>
      <button type="button" class="bn-link-overlay__btn bn-link-overlay__unlink" data-action="unlink" title="Remove link">Unlink</button>
    `
    const urlEl = el.querySelector<HTMLAnchorElement>(".bn-link-overlay__url")!
    const copyBtn = el.querySelector<HTMLButtonElement>('[data-action="copy"]')!
    const unlinkBtn = el.querySelector<HTMLButtonElement>(
      '[data-action="unlink"]'
    )!
    el.addEventListener("mouseleave", () => {
      el.style.display = "none"
    })
    copyBtn.addEventListener("click", async () => {
      const href = el.dataset.href ?? ""
      try {
        await navigator.clipboard.writeText(href)
        copyBtn.textContent = "Copied"
        window.setTimeout(() => (copyBtn.textContent = "Copy"), 900)
      } catch {
        /* clipboard blocked — fall through */
      }
    })
    unlinkBtn.addEventListener("click", () => {
      const target = (el as any)._target as HTMLAnchorElement | undefined
      const fn = (el as any)._onUnlink as
        | ((a: HTMLAnchorElement) => void)
        | undefined
      if (target && fn) fn(target)
      el.style.display = "none"
    })
    // Open-in-new-tab text is just the URL; we keep it as a link
    // so ctrl-click / middle-click work naturally.
    urlEl.addEventListener("mouseenter", () => {
      urlEl.textContent = el.dataset.href ?? ""
      urlEl.href = el.dataset.href ?? "#"
    })
    document.body.appendChild(el)
    overlayRef.current = el
    return el
  }, [])

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return

    const getFileUrl = (blockId: string): string | undefined => {
      try {
        const block = editor.getBlock(blockId)
        if (!block) return undefined
        const url = (block.props as { url?: string } | undefined)?.url
        return typeof url === "string" && url ? url : undefined
      } catch {
        return undefined
      }
    }

    const unlinkAnchor = (a: HTMLAnchorElement) => {
      // Replace the anchor with its own text content; BlockNote
      // will pick this up on the next document read.
      const text = document.createTextNode(a.textContent ?? "")
      a.replaceWith(text)
    }

    const run = () => {
      convertEmbedBlocks(surface)
      enhanceLinks(surface, {
        editable: !readOnly,
        getOverlay,
        onUnlink: unlinkAnchor,
      })
      enhanceCodeBlocks(surface)
      enhanceFileBlocks(surface, { getFileUrl })
    }

    // Initial pass once BlockNote has mounted its DOM.
    const initial = window.setTimeout(run, 0)

    // Debounced observer so batched edits don't re-enhance on every
    // keystroke.
    let mTimer: ReturnType<typeof setTimeout> | null = null
    const observer = new MutationObserver(() => {
      if (mTimer) clearTimeout(mTimer)
      mTimer = setTimeout(run, 150)
    })
    observer.observe(surface, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-content-type", "src", "href"],
    })

    return () => {
      window.clearTimeout(initial)
      if (mTimer) clearTimeout(mTimer)
      observer.disconnect()
    }
  }, [editor, readOnly, getOverlay])

  // Tear down the shared link overlay on unmount.
  useEffect(() => {
    return () => {
      if (overlayRef.current) {
        overlayRef.current.remove()
        overlayRef.current = null
      }
    }
  }, [])

  return (
    <div className="blocknote-surface" ref={surfaceRef}>
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        onChange={handleChange}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  )
}
