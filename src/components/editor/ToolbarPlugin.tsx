"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useCallback, useEffect, useState } from "react"
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  ElementFormatType,
  COMMAND_PRIORITY_LOW,
  INSERT_TAB_COMMAND,
  createCommand,
} from "lexical"
import {
  HeadingTagType
} from "@lexical/rich-text";

import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListNode } from "@lexical/list"
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils"
import { $isHeadingNode } from "@lexical/rich-text"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Undo,
  Redo,
  Heading1,
  Heading2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [isBulletList, setIsBulletList] = useState(false)
  const [isNumberList, setIsNumberList] = useState(false)
  const [isH1, setIsH1] = useState(false)
  const [isH2, setIsH2] = useState(false)
  const SET_HEADING_LEVEL_COMMAND = createCommand<HeadingTagType>('SET_HEADING_LEVEL_COMMAND');


  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"))
      setIsItalic(selection.hasFormat("italic"))
      setIsUnderline(selection.hasFormat("underline"))
      setIsStrikethrough(selection.hasFormat("strikethrough"))

      const nodes = selection.getNodes()
      const node = nodes.length > 0 ? nodes[0] : null
      if (!node) {
        // Reset states if no node
        setIsLink(false)
        setIsBulletList(false)
        setIsNumberList(false)
        setIsH1(false)
        setIsH2(false)
        return
      }

      const parent = node.getParent()

      // Check for link node
      setIsLink($isLinkNode(parent) || $isLinkNode(node))

      // Check for lists
      const listNode = $getNearestNodeOfType(node, ListNode)
      const listType = listNode?.getListType()
      setIsBulletList(listType === "bullet")
      setIsNumberList(listType === "number")

      // Check for headings
      setIsH1($isHeadingNode(node) && node.getTag() === "h1")
      setIsH2($isHeadingNode(node) && node.getTag() === "h2")
    } else {
      // No selection or non-range selection — reset toolbar states
      setIsBold(false)
      setIsItalic(false)
      setIsUnderline(false)
      setIsStrikethrough(false)
      setIsLink(false)
      setIsBulletList(false)
      setIsNumberList(false)
      setIsH1(false)
      setIsH2(false)
    }
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
    )
  }, [editor, updateToolbar])

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://")
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [editor, isLink])

  return (
    <div className="border border-input rounded-t-md bg-muted/50 p-1 flex flex-wrap gap-1 items-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isBold && "bg-muted")}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isItalic && "bg-muted")}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isUnderline && "bg-muted")}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isStrikethrough && "bg-muted")}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isLink && "bg-muted")}
        onClick={insertLink}
        title="Link"
      >
        <Link className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isBulletList && "bg-muted")}
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isNumberList && "bg-muted")}
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />
      <Button
  type="button"
  variant="ghost"
  size="sm"
  className={cn("h-8 w-8 p-0", isH1 && "bg-muted")}
  onClick={() => 
    editor.dispatchCommand(SET_HEADING_LEVEL_COMMAND, 'h1' as HeadingTagType)}
  title="Heading 1"
>
  <Heading1 className="h-4 w-4" />
</Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isH2 && "bg-muted")}
        onClick={() =>
          editor.dispatchCommand(SET_HEADING_LEVEL_COMMAND, "h2" as HeadingTagType)
        }
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <div className="flex-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}