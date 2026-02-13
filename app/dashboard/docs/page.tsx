"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, BookOpen, ChevronRight, FileText, Loader2, X,
  ArrowUp, Hash, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeadingInfo { level: number; text: string; id: string }
interface DocFile { slug: string; title: string; content: string; headings: HeadingInfo[] }
interface SearchResult {
  type: "page" | "heading"; docSlug: string; docTitle: string;
  headingText?: string; headingId?: string; headingLevel?: number;
}

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function DocsPage() {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/docs").then(r => r.json()).then(d => {
      setDocs(d.docs || []);
      if (d.docs?.length) setActiveSlug(d.docs[0].slug);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const fn = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeDoc = useMemo(() => docs.find(d => d.slug === activeSlug), [docs, activeSlug]);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    docs.forEach(doc => {
      if (doc.title.toLowerCase().includes(q) || doc.slug.includes(q))
        results.push({ type: "page", docSlug: doc.slug, docTitle: doc.title });
      doc.headings.forEach(h => {
        if (h.text.toLowerCase().includes(q))
          results.push({ type: "heading", docSlug: doc.slug, docTitle: doc.title, headingText: h.text, headingId: h.id, headingLevel: h.level });
      });
    });
    return results.slice(0, 20);
  }, [searchQuery, docs]);

  const navigate = useCallback((slug: string, headingId?: string) => {
    setActiveSlug(slug);
    setSearchOpen(false);
    setSearchQuery("");
    if (headingId) {
      setTimeout(() => {
        document.getElementById(headingId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const scrollToHeading = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const activeIndex = docs.findIndex(d => d.slug === activeSlug);
  const prevDoc = activeIndex > 0 ? docs[activeIndex - 1] : null;
  const nextDoc = activeIndex < docs.length - 1 ? docs[activeIndex + 1] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[15vh]" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
          <div className="w-full max-w-lg bg-background border rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search documentation..." className="border-0 shadow-none focus-visible:ring-0 h-8 text-[15px]" autoFocus />
              {searchQuery && <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSearchQuery("")}><X className="h-3.5 w-3.5" /></Button>}
            </div>
            {searchResults.length > 0 && (
              <ScrollArea className="max-h-[320px]">
                <div className="p-2">
                  {searchResults.map((r, i) => (
                    <button key={i} onClick={() => navigate(r.docSlug, r.headingId)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-muted/60 transition-colors">
                      {r.type === "page" ? <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{r.type === "heading" ? r.headingText : r.docTitle}</p>
                        {r.type === "heading" && <p className="text-[11px] text-muted-foreground truncate">{r.docTitle}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No results found</div>
            )}
            <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Navigate results</span>
              <span className="text-[11px] text-muted-foreground">ESC to close</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Left Sidebar  Page Navigation */}
        <aside className="hidden lg:block w-[240px] shrink-0 border-r sticky top-0 h-screen overflow-y-auto">
          <div className="p-4 pb-2">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold tracking-tight">Documentation</span>
            </div>
            <button onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-muted/40 hover:bg-muted/60 transition-colors mb-4">
              <Search className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground flex-1 text-left">Search...</span>
              <kbd className="text-[10px] bg-background border rounded px-1 py-0.5 text-muted-foreground">Ctrl K</kbd>
            </button>
          </div>
          <nav className="px-3 pb-4">
            {docs.map(doc => (
              <button key={doc.slug} onClick={() => navigate(doc.slug)}
                className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-left transition-colors mb-0.5",
                  activeSlug === doc.slug ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}>
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{doc.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile nav */}
          <div className="lg:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <select value={activeSlug} onChange={e => navigate(e.target.value)}
                className="flex-1 text-[13px] bg-transparent border-0 outline-none">
                {docs.map(d => <option key={d.slug} value={d.slug}>{d.title}</option>)}
              </select>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}>
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex">
            {/* Article */}
            <article ref={contentRef} className="flex-1 min-w-0 max-w-3xl mx-auto px-6 py-8 lg:px-10">
              {activeDoc && (
                <div className="docs-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => <h1 id={slugify(String(children))} className="text-2xl font-bold tracking-tight mb-4 mt-2 scroll-mt-20">{children}</h1>,
                      h2: ({children}) => <h2 id={slugify(String(children))} className="text-lg font-semibold tracking-tight mb-3 mt-8 pb-2 border-b scroll-mt-20">{children}</h2>,
                      h3: ({children}) => <h3 id={slugify(String(children))} className="text-[15px] font-semibold mb-2 mt-6 scroll-mt-20">{children}</h3>,
                      h4: ({children}) => <h4 id={slugify(String(children))} className="text-sm font-semibold mb-1.5 mt-4 scroll-mt-20">{children}</h4>,
                      p: ({children}) => <p className="text-[14px] leading-relaxed text-foreground/85 mb-3">{children}</p>,
                      ul: ({children}) => <ul className="text-[14px] leading-relaxed list-disc pl-5 mb-3 space-y-1 text-foreground/85">{children}</ul>,
                      ol: ({children}) => <ol className="text-[14px] leading-relaxed list-decimal pl-5 mb-3 space-y-1 text-foreground/85">{children}</ol>,
                      li: ({children}) => <li className="text-[14px]">{children}</li>,
                      a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">{children}<ExternalLink className="h-2.5 w-2.5" /></a>,
                      strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({children}) => <em className="italic">{children}</em>,
                      blockquote: ({children}) => <blockquote className="border-l-2 border-primary/30 pl-4 my-3 text-[13px] text-muted-foreground italic">{children}</blockquote>,
                      code: ({children, className}) => {
                        const isBlock = className?.includes("language-");
                        if (isBlock) return <pre className="bg-muted/60 border rounded-lg p-3 my-3 overflow-x-auto"><code className="text-[12px] font-mono leading-relaxed">{children}</code></pre>;
                        return <code className="bg-muted/60 text-[12.5px] font-mono px-1 py-0.5 rounded">{children}</code>;
                      },
                      table: ({children}) => <div className="my-4 overflow-x-auto border rounded-lg"><table className="w-full text-[13px]">{children}</table></div>,
                      thead: ({children}) => <thead className="bg-muted/40 border-b">{children}</thead>,
                      th: ({children}) => <th className="text-left px-3 py-2 font-semibold text-[12px] uppercase tracking-wider text-muted-foreground">{children}</th>,
                      td: ({children}) => <td className="px-3 py-2 border-t text-[13px]">{children}</td>,
                      hr: () => <hr className="my-6 border-border/60" />,
                      img: ({src, alt}) => <img src={src} alt={alt || ""} className="rounded-lg border my-4 max-w-full h-auto" />,
                    }}
                  >
                    {activeDoc.content}
                  </ReactMarkdown>

                  {/* Prev / Next navigation */}
                  <div className="flex items-center justify-between mt-10 pt-6 border-t">
                    {prevDoc ? (
                      <button onClick={() => navigate(prevDoc.slug)} className="group flex flex-col items-start gap-0.5 text-left">
                        <span className="text-[11px] text-muted-foreground">Previous</span>
                        <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">{prevDoc.title}</span>
                      </button>
                    ) : <div />}
                    {nextDoc ? (
                      <button onClick={() => navigate(nextDoc.slug)} className="group flex flex-col items-end gap-0.5 text-right">
                        <span className="text-[11px] text-muted-foreground">Next</span>
                        <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1">{nextDoc.title}<ChevronRight className="h-3 w-3" /></span>
                      </button>
                    ) : <div />}
                  </div>
                </div>
              )}
            </article>

            {/* Right Sidebar  Table of Contents */}
            <aside className="hidden xl:block w-[200px] shrink-0">
              <div className="sticky top-8 py-8 pr-4">
                {activeDoc && activeDoc.headings.filter(h => h.level >= 2 && h.level <= 3).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">On this page</p>
                    <nav className="space-y-0.5">
                      {activeDoc.headings.filter(h => h.level >= 2 && h.level <= 3).map((h, i) => (
                        <button key={i} onClick={() => scrollToHeading(h.id)}
                          className={cn(
                            "block w-full text-left text-[12px] py-1 transition-colors hover:text-foreground truncate",
                            h.level === 3 ? "pl-3 text-muted-foreground/70" : "text-muted-foreground",
                          )}>
                          {h.text}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* Scroll to top */}
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-30 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
