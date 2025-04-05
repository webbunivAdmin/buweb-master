"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, List, ListOrdered, LinkIcon, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)

  // Get the current selection in the textarea
  const getSelection = () => {
    const textarea = textareaRef.current
    if (!textarea) return { start: 0, end: 0, text: "" }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = value.substring(start, end)

    return { start, end, text }
  }

  // Update the text with the formatted content
  const updateText = (before: string, selected: string, after: string) => {
    const { start, end } = getSelection()
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(newValue)

    // Focus back on textarea after update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(start + before.length, start + before.length + selected.length)
      }
    }, 0)
  }

  // Format handlers
  const handleBold = () => {
    const { text } = getSelection()
    updateText("**", text || "bold text", "**")
  }

  const handleItalic = () => {
    const { text } = getSelection()
    updateText("*", text || "italic text", "*")
  }

  const handleBulletList = () => {
    const { text } = getSelection()
    if (text) {
      const lines = text.split("\n")
      const bulletList = lines.map((line) => `- ${line}`).join("\n")
      updateText("", bulletList, "")
    } else {
      updateText("- ", "List item", "\n")
    }
  }

  const handleNumberedList = () => {
    const { text } = getSelection()
    if (text) {
      const lines = text.split("\n")
      const numberedList = lines.map((line, i) => `${i + 1}. ${line}`).join("\n")
      updateText("", numberedList, "")
    } else {
      updateText("1. ", "List item", "\n")
    }
  }

  const handleLink = () => {
    if (linkUrl && linkText) {
      updateText("[", linkText, `](${linkUrl})`)
      setLinkUrl("")
      setLinkText("")
      setIsLinkPopoverOpen(false)
    }
  }

  const handleAlignment = (alignment: "left" | "center" | "right") => {
    const { text } = getSelection()

    if (text) {
      let alignedText = ""

      switch (alignment) {
        case "center":
          alignedText = `<div style="text-align: center;">${text}</div>`
          break
        case "right":
          alignedText = `<div style="text-align: right;">${text}</div>`
          break
        default:
          alignedText = text // Left is default
      }

      updateText("", alignedText, "")
    }
  }

  // Set initial link text from selection
  useEffect(() => {
    if (isLinkPopoverOpen) {
      const { text } = getSelection()
      if (text) {
        setLinkText(text)
      }
    }
  }, [isLinkPopoverOpen])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-md border bg-background p-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={handleBold} className="h-8 w-8">
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={handleItalic} className="h-8 w-8">
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={handleBulletList} className="h-8 w-8">
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={handleNumberedList} className="h-8 w-8">
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>

          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Insert Link</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-text">Link Text</Label>
                  <Input
                    id="link-text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Enter link text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <Button type="button" onClick={handleLink} disabled={!linkUrl || !linkText} className="w-full">
                  Insert Link
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="mx-1 h-6 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleAlignment("left")}
                className="h-8 w-8"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleAlignment("center")}
                className="h-8 w-8"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleAlignment("right")}
                className="h-8 w-8"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[200px] font-mono"
        style={{ minHeight }}
      />
    </div>
  )
}

