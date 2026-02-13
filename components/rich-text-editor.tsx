"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Link2, Image, Quote, Heading1, Heading2, Heading3,
  Eye, PenLine, Minus, Table, CheckSquare,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

type EditorMode = "write" | "preview" | "split"

interface ToolbarAction {
  icon: React.ReactNode
  label: string
  action: (text: string, start: number, end: number) => { text: string; cursor: number }
  separator?: boolean
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = "350px" }: RichTextEditorProps) {
  const [mode, setMode] = useState<EditorMode>("write")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormatting = useCallback(
    (action: ToolbarAction["action"]) => {
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const result = action(value, start, end)
      onChange(result.text)
      // Restore cursor
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(result.cursor, result.cursor)
      })
    },
    [value, onChange]
  )

  const wrapSelection = (prefix: string, suffix: string) => (text: string, start: number, end: number) => {
    const selected = text.slice(start, end)
    const before = text.slice(0, start)
    const after = text.slice(end)
    const newText = `${before}${prefix}${selected || "text"}${suffix}${after}`
    return { text: newText, cursor: start + prefix.length + (selected ? selected.length : 4) + suffix.length }
  }

  const insertAtLine = (prefix: string) => (text: string, start: number, end: number) => {
    const before = text.slice(0, start)
    const after = text.slice(start)
    const needsNewline = before.length > 0 && !before.endsWith("\n") ? "\n" : ""
    const newText = `${before}${needsNewline}${prefix}`
    return { text: newText + after, cursor: newText.length }
  }

  const toolbarActions: ToolbarAction[] = [
    { icon: <Heading1 className="h-3.5 w-3.5" />, label: "Heading 1", action: insertAtLine("# ") },
    { icon: <Heading2 className="h-3.5 w-3.5" />, label: "Heading 2", action: insertAtLine("## ") },
    { icon: <Heading3 className="h-3.5 w-3.5" />, label: "Heading 3", action: insertAtLine("### ") },
    { icon: <Bold className="h-3.5 w-3.5" />, label: "Bold", action: wrapSelection("**", "**"), separator: true },
    { icon: <Italic className="h-3.5 w-3.5" />, label: "Italic", action: wrapSelection("_", "_") },
    { icon: <Strikethrough className="h-3.5 w-3.5" />, label: "Strikethrough", action: wrapSelection("~~", "~~") },
    { icon: <Code className="h-3.5 w-3.5" />, label: "Inline Code", action: wrapSelection("`", "`"), separator: true },
    { icon: <Quote className="h-3.5 w-3.5" />, label: "Blockquote", action: insertAtLine("> ") },
    { icon: <List className="h-3.5 w-3.5" />, label: "Bullet List", action: insertAtLine("- ") },
    { icon: <ListOrdered className="h-3.5 w-3.5" />, label: "Numbered List", action: insertAtLine("1. "), separator: true },
    { icon: <CheckSquare className="h-3.5 w-3.5" />, label: "Task List", action: insertAtLine("- [ ] ") },
    { icon: <Minus className="h-3.5 w-3.5" />, label: "Divider", action: insertAtLine("\n---\n"), separator: true },
    {
      icon: <Link2 className="h-3.5 w-3.5" />,
      label: "Link",
      action: (text, start, end) => {
        const selected = text.slice(start, end)
        const before = text.slice(0, start)
        const after = text.slice(end)
        const link = `[${selected || "link text"}](url)`
        return { text: `${before}${link}${after}`, cursor: before.length + link.length }
      },
    },
    {
      icon: <Image className="h-3.5 w-3.5" />,
      label: "Image",
      action: (text, start) => {
        const before = text.slice(0, start)
        const after = text.slice(start)
        const img = "![alt text](image-url)"
        return { text: `${before}${img}${after}`, cursor: before.length + img.length }
      },
    },
    {
      icon: <Table className="h-3.5 w-3.5" />,
      label: "Table",
      action: (text, start) => {
        const before = text.slice(0, start)
        const after = text.slice(start)
        const nl = before.length > 0 && !before.endsWith("\n") ? "\n" : ""
        const table = `${nl}| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |\n`
        return { text: `${before}${table}${after}`, cursor: before.length + table.length }
      },
      separator: true,
    },
    {
      icon: <Code className="h-3.5 w-3.5" />,
      label: "Code Block",
      action: (text, start, end) => {
        const selected = text.slice(start, end)
        const before = text.slice(0, start)
        const after = text.slice(end)
        const nl = before.length > 0 && !before.endsWith("\n") ? "\n" : ""
        const block = `${nl}\`\`\`javascript\n${selected || "// your code here"}\n\`\`\`\n`
        return { text: `${before}${block}${after}`, cursor: before.length + block.length }
      },
    },
  ]

  const wordCount = value.split(/\s+/).filter(Boolean).length
  const lineCount = value.split("\n").length

  return (
    <div className="border-0 sm:border rounded-none sm:rounded-lg overflow-hidden bg-background">
      {/* Mode switcher + Toolbar */}
      <div className="border-b bg-muted/30">
        {/* Mode switcher row */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50">
          <div className="flex items-center gap-1">
            <Button type="button" variant={mode === "write" ? "secondary" : "ghost"} size="sm"
              className="h-7 text-[11px] gap-1 px-2.5" onClick={() => setMode("write")}>
              <PenLine className="h-3 w-3" /> Write
            </Button>
            <Button type="button" variant={mode === "preview" ? "secondary" : "ghost"} size="sm"
              className="h-7 text-[11px] gap-1 px-2.5" onClick={() => setMode("preview")}>
              <Eye className="h-3 w-3" /> Preview
            </Button>
            <Button type="button" variant={mode === "split" ? "secondary" : "ghost"} size="sm"
              className="h-7 text-[11px] gap-1 px-2.5 hidden sm:inline-flex" onClick={() => setMode("split")}>
              Split
            </Button>
          </div>
          <Badge variant="outline" className="text-[9px] font-normal hidden sm:inline-flex">Markdown</Badge>
        </div>
        {/* Formatting toolbar — only shown in write/split modes */}
        {(mode === "write" || mode === "split") && (
          <div className="flex items-center gap-0.5 px-2 py-1 overflow-x-auto scrollbar-thin">
            {toolbarActions.map((action, i) => (
              <React.Fragment key={i}>
                {action.separator && i > 0 && <Separator orientation="vertical" className="h-5 mx-0.5 shrink-0" />}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  title={action.label}
                  onClick={() => insertFormatting(action.action)}
                >
                  {action.icon}
                </Button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className={mode === "split" ? "grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-y sm:divide-y-0" : ""}>
        {(mode === "write" || mode === "split") && (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Write your content using Markdown..."}
            className="border-0 rounded-none focus-visible:ring-0 resize-y font-mono text-sm min-h-[200px] sm:min-h-[350px]"
            style={{ minHeight: undefined }}
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div
            className="prose prose-sm dark:prose-invert max-w-none p-4 overflow-y-auto min-h-[200px] sm:min-h-[350px]"
          >
            {value ? (
              <MarkdownPreview content={value} />
            ) : (
              <p className="text-muted-foreground italic">Nothing to preview yet...</p>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/30 text-[10px] text-muted-foreground">
        <span className="hidden sm:inline">Markdown &bull; Use toolbar or type formatting directly</span>
        <span className="sm:hidden">Markdown</span>
        <div className="flex items-center gap-2 sm:gap-3 tabular-nums">
          <span>{value.length.toLocaleString()} <span className="hidden sm:inline">chars</span><span className="sm:hidden">c</span></span>
          <span>{wordCount} <span className="hidden sm:inline">words</span><span className="sm:hidden">w</span></span>
          <span>{lineCount} <span className="hidden sm:inline">lines</span><span className="sm:hidden">l</span></span>
        </div>
      </div>
    </div>
  )
}

// Lazy-loaded markdown preview to avoid SSR issues
function MarkdownPreview({ content }: { content: string }) {
  const [ReactMarkdown, setReactMarkdown] = useState<any>(null)
  const [remarkGfm, setRemarkGfm] = useState<any>(null)

  React.useEffect(() => {
    Promise.all([
      import("react-markdown"),
      import("remark-gfm"),
    ]).then(([md, gfm]) => {
      setReactMarkdown(() => md.default)
      setRemarkGfm(() => gfm.default)
    })
  }, [])

  if (!ReactMarkdown) {
    return <p className="text-muted-foreground italic">Loading preview...</p>
  }

  return (
    <ReactMarkdown
      remarkPlugins={remarkGfm ? [remarkGfm] : []}
      components={{
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "")
          const isInline = !match && !className
          if (isInline) {
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            )
          }
          return (
            <pre className="bg-muted/50 border rounded-lg p-4 overflow-x-auto">
              <code className={`text-xs font-mono ${className || ""}`} {...props}>
                {children}
              </code>
            </pre>
          )
        },
        table({ children }: any) {
          return (
            <div className="overflow-x-auto border rounded-lg my-3">
              <table className="w-full text-sm">{children}</table>
            </div>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
