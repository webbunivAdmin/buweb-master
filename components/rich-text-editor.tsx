"use client"

import { useState, useRef } from "react"
import { Bold, Code, Heading1, Heading2, Image, Italic, Link, List, ListOrdered, Quote, Undo } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { marked } from "marked"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here... Use markdown for formatting.",
  minHeight = "400px",
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState("write")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormat = (format: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    let newText = ""

    switch (format) {
      case "bold":
        newText = `**${selectedText || "bold text"}**`
        break
      case "italic":
        newText = `*${selectedText || "italic text"}*`
        break
      case "h1":
        newText = `\n# ${selectedText || "Heading 1"}\n`
        break
      case "h2":
        newText = `\n## ${selectedText || "Heading 2"}\n`
        break
      case "link":
        newText = `[${selectedText || "link text"}](https://example.com)`
        break
      case "image":
        newText = `![${selectedText || "alt text"}](https://example.com/image.jpg)`
        break
      case "code":
        newText = selectedText.includes("\n")
          ? `\n\`\`\`\n${selectedText || "code block"}\n\`\`\`\n`
          : `\`${selectedText || "inline code"}\``
        break
      case "quote":
        newText = `\n> ${selectedText || "blockquote"}\n`
        break
      case "ul":
        newText = `\n- ${selectedText || "list item"}\n`
        break
      case "ol":
        newText = `\n1. ${selectedText || "list item"}\n`
        break
      default:
        newText = selectedText
    }

    const newContent = value.substring(0, start) + newText + value.substring(end)
    onChange(newContent)

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = start + newText.length
      textarea.selectionEnd = start + newText.length
    }, 0)
  }

  // Use marked library for rendering markdown
  const getHtmlContent = () => {
    try {
      return { __html: marked(value) }
    } catch (error) {
      return { __html: "<p>Error rendering preview</p>" }
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-0">
        <Tabs defaultValue="write" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center border-b px-4 py-2">
            <h2 className="text-lg font-semibold mr-auto">Editor</h2>
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="write" className="m-0">
            <div className="border-b p-2 flex flex-wrap gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("h1")}>
                      <Heading1 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Heading 1</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("h2")}>
                      <Heading2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Heading 2</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("bold")}>
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bold</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("italic")}>
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Italic</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("link")}>
                      <Link className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Link</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("image")}>
                      <Image className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Image</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("code")}>
                      <Code className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Code</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("quote")}>
                      <Quote className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quote</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("ul")}>
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bullet List</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => insertFormat("ol")}>
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Numbered List</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onChange("")}>
                      <Undo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              className="min-h-[400px] p-4 border-0 rounded-none focus-visible:ring-0 resize-none"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ minHeight }}
            />
          </TabsContent>

          <TabsContent value="preview" className="m-0 min-h-[400px] p-4">
            {value ? (
              <div className="prose max-w-none" dangerouslySetInnerHTML={getHtmlContent()} />
            ) : (
              <div className="text-muted-foreground text-center py-20">Your preview will appear here</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

