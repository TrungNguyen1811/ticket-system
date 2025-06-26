import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { toast } from "../ui/use-toast";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";


interface SetEditTextPluginProps {
  text: string;
  isEditMode: boolean;
}

export default function SetEditTextPlugin({
  text,
  isEditMode,
}: SetEditTextPluginProps) {
  const [editor] = useLexicalComposerContext();
  console.log("text", text)


  useEffect(() => {
    if (!isEditMode || !text) return;

    const setPlainText = (plain: string) => {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(plain));
        root.append(paragraph);
      });
    };

    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && "root" in parsed) {
        try {
          const editorState = editor.parseEditorState(JSON.stringify(parsed));
          editor.setEditorState(editorState);
          return;
        } catch (jsonErr) {
          setPlainText(text);
          return;
        }
      }
    } catch {
      // Not JSON
    }

    if (text.trim().startsWith("<") && text.includes("</")) {
      try {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const dom = new DOMParser().parseFromString(text, "text/html");
          console.log("dom", dom)
          const nodes = $generateNodesFromDOM(editor, dom.body as any);
          for (const node of nodes) {
            root.append(node);
          }
        });
        return;
      } catch (htmlErr) {
        // fallback
      }
    }

    setPlainText(text);
  }, [editor, text, isEditMode]);

  return null;
}


