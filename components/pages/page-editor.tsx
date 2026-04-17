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
import "@blocknote/mantine/style.css"
import { useTheme } from "next-themes"

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

  return (
    <div className="blocknote-surface">
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        onChange={handleChange}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  )
}
