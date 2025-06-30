"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  ElementFormatType,
  $isElementNode,
  LexicalEditor,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isParentElementRTL,
  $isAtNodeEnd,
  $wrapNodes,
} from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { createPortal } from "react-dom";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingTagType,
} from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages,
} from "@lexical/code";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Pencil,
  Table2,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { INSERT_IMAGE_COMMAND } from './InlineImagePlugin';
import attachmentService from "@/services/attachment.service";

const headingTags: { tag: HeadingTagType; icon: any; label: string }[] = [
  { tag: "h1", icon: Heading1, label: "Heading 1" },
  { tag: "h2", icon: Heading2, label: "Heading 2" },
  { tag: "h3", icon: Heading3, label: "Heading 3" },
  { tag: "h4", icon: Heading4, label: "Heading 4" },
  { tag: "h5", icon: Heading5, label: "Heading 5" }
];

const LowPriority = 1;

function positionEditorElement(editor: any, rect: any) {
  if (rect === null) {
    editor.style.opacity = "0";
    editor.style.top = "-1000px";
    editor.style.left = "-1000px";
  } else {
    editor.style.opacity = "1";
    editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
    editor.style.left = `${
      rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2
    }px`;
  }
}

function getSelectedNode(selection: any) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

function FloatingLinkEditor({ editor }: any) {
  const editorRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mouseDownRef = useRef(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isEditMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState(null);
  const [activeEditor, setActiveEditor] = useState(editor)

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
    }
    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (editorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      !nativeSelection?.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection?.anchorNode)
    ) {
      const domRange = nativeSelection?.getRangeAt(0);
      let rect;
      if (nativeSelection?.anchorNode === rootElement) {
        let inner = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild;
        }
        rect = inner.getBoundingClientRect();
      } else {
        rect = domRange?.getBoundingClientRect();
      }

      if (!mouseDownRef.current) {
        positionEditorElement(editorElem, rect);
      }
      setLastSelection(selection as any);
      setActiveEditor(selection)
    } else if (!activeElement || activeElement.className !== "link-input") {
      positionEditorElement(editorElem, null);
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl("");
    }

    return true;
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }: any) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        LowPriority 
      )
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  return (
    <div ref={editorRef} className="link-editor">
      {isEditMode ? (
        <input
          ref={inputRef}
          className="link-input"
          value={linkUrl}
          onChange={(event) => {
            setLinkUrl(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (lastSelection !== null) {
                if (linkUrl !== "") {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
                }
                setEditMode(false);
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              setEditMode(false);
            }
          }}
        />
      ) : (
        <>
          <div className="flex flex-row justify-between items-center p-2">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-[#216fdb] no-underline block whitespace-nowrap overflow-hidden mr-[30px] text-ellipsis hover:underline">
              {linkUrl}
            </a>
            <Pencil className="link-edit h-4 w-4"
              role="button"
              tabIndex={0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setEditMode(true);
              }}
              />
          </div>
        </>
      )}
    </div>
  );
}

export default function ToolbarPlugin({
  ticketId,
  onAddInlineImage,
}: {
  ticketId: string,
  onAddInlineImage?: (editor: any, files: FileList) => void
}) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberList, setIsNumberList] = useState(false);
  const [activeHeading, setActiveHeading] = useState<HeadingTagType | null>(null);
  const [isCode, setIsCode] = useState(false);
  const [textAlign, setTextAlign] = useState<ElementFormatType>("left");
  const [isTable, setIsTable] = useState(false);
  const [blockType, setBlockType] = useState<string>("paragraph");
  const [showTableModal, setShowTableModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  // Link input modal state

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      const node = getSelectedNode(selection);
      if (!node) return;

      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));
      const listNode = $getNearestNodeOfType(node, ListNode);
      const listType = listNode?.getListType();
      setIsBulletList(listType === "bullet");
      setIsNumberList(listType === "number");
      // Heading
      let foundHeading: HeadingTagType | null = null;
      headingTags.forEach(({ tag }) => {
        if ($isHeadingNode(node) && node.getTag() === tag) foundHeading = tag;
      });
      setActiveHeading(foundHeading);
      setIsCode($isCodeNode(parent) || $isCodeNode(node));
      // Fix: Only set textAlign if valid
      const validAligns: ElementFormatType[] = ["left", "center", "right", "justify"];
      const align = (selection.format as unknown) as ElementFormatType;
      setTextAlign(validAligns.includes(align) ? align : "left");
      // Block type
      if ($isListNode(node)) {
        setBlockType(node.getListType() === "bullet" ? "ul" : node.getListType() === "number" ? "ol" : "list");
      } else if ($isHeadingNode(node)) {
        setBlockType(node.getTag());
      } else if ($isQuoteNode(node)) {
        setBlockType("quote");
      } else if ($isCodeNode(node)) {
        setBlockType("code");
      } 
    } else {
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setIsStrikethrough(false);
      setIsLink(false);
      setIsBulletList(false);
      setIsNumberList(false);
      setActiveHeading(null);
      setIsCode(false);
      setTextAlign("left");
      setBlockType("paragraph");
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      })
    );
  }, [editor, updateToolbar]);

  function getTopLevelNodes(selection: any) {
    return selection.getNodes().map((node: any) => node.getTopLevelElementOrThrow());
  }

  function toggleHeading(editor: any) {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchorNode = selection.anchor.getNode();
      let node = anchorNode.getTopLevelElementOrThrow();

      // Nếu không phải paragraph hoặc heading thì chuyển về paragraph trước
      if (
        node.getType() !== "paragraph" &&
        !$isHeadingNode(node) &&
        $isElementNode(node)
      ) {
        const para = $createParagraphNode();
        const children = node.getChildren();
        children.forEach((child) => para.append(child));
        node.replace(para);
        node = para;
      }

      // Chuyển thành heading h1
      const newHeading = $createHeadingNode("h1");
      if ($isElementNode(node)) {
        const children = node.getChildren();
        children.forEach((child) => newHeading.append(child));
      }
      node.replace(newHeading);
    });
  }
  
  

  function toggleCode() {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          node.replace($createCodeNode());
        });
      }
    });
  }

  function setTextAlignment(alignment: ElementFormatType) {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  }

  // --- Link UX improvement ---
  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);



  // --- Numbered List ---
  const formatNumberList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = getTopLevelNodes(selection);
        const allAreOrdered = nodes.every(
          (node: any) => $isListNode(node) && node.getListType() === "number"
        );
        if (allAreOrdered) {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
      }
    });
  };

  const formatBulletList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = getTopLevelNodes(selection);
        const allAreBullets = nodes.every(
          (node: any) => $isListNode(node) && node.getListType() === "bullet"
        );
  
        if (allAreBullets) {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }
      }
    });
  };

  return (
    <div className="toolbar border border-input rounded-t-md bg-muted/50 p-1 flex flex-wrap gap-1 items-center">
      {/* Text Formatting */}
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

      {/* Links */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isLink && "bg-muted")}
        onClick={insertLink}
        title="Link"
        aria-label="Insert Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      {isLink &&
            createPortal(<FloatingLinkEditor editor={editor} />, document.body)}

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isBulletList && "bg-muted")}
        onClick={formatBulletList}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isNumberList && "bg-muted")}
        onClick={formatNumberList}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Headings */}
      {headingTags.map(({ tag, icon: Icon, label }) => (
        <Button
          key={tag}
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", activeHeading === tag && "bg-muted")}
          onClick={() => toggleHeading(editor)}
          title={label}
          aria-pressed={activeHeading === tag}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isCode && "bg-muted")}
        onClick={toggleCode}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text Alignment */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", textAlign === "left" && "bg-muted")}
        onClick={() => setTextAlignment("left")}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", textAlign === "center" && "bg-muted")}
        onClick={() => setTextAlignment("center")}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", textAlign === "right" && "bg-muted")}
        onClick={() => setTextAlignment("right")}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", textAlign === "justify" && "bg-muted")}
        onClick={() => setTextAlignment("justify")}
        title="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", isTable && "bg-muted")}
        onClick={() => {
          setShowTableModal(true);
        }}
        title="Insert Table"
      >
        <Table2 className="h-4 w-4" />
      </Button>

      {showTableModal && (
        <InsertTableDialog
          activeEditor={editor}
          onClose={() => setShowTableModal(false)}
        />
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            if (onAddInlineImage) {
              onAddInlineImage(editor, e.target.files);
            }
            e.target.value = '';
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => fileInputRef.current?.click()}
        title="Insert Image"
      >
        <Image className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      {/* Undo/Redo */}
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
  );
}

export function InsertTableDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [rows, setRows] = useState('5')
  const [columns, setColumns] = useState('5')
  const [isDisabled, setIsDisabled] = useState(true)

  useEffect(() => {
    const row = Number(rows)
    const column = Number(columns)
    if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
      setIsDisabled(false)
    } else {
      setIsDisabled(true)
    }
  }, [rows, columns])

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns,
      rows,
    })

    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rows</label>
            <input
              type="number"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Columns</label>
            <input
              type="number"
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="50"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={isDisabled} onClick={onClick}>
              Insert Table
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}