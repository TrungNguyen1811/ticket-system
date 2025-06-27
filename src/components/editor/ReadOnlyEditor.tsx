import { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import configTheme from "../theme/configTheme";

// Import necessary nodes
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { fixAttachmentImageSrc } from "@/pages/conversations/ConversationDetailPage";
import { remove } from "lodash";
import PlaygroundAutoLinkPlugin from "./AutoLinkPlugin";
import ListMaxIndentLevelPlugin from "./ListMaxIndentLevelPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { cleanHtmlForEmail } from "@/utils/emailHtmlCleaner";

// Auto-link matchers
const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    return (
      match && {
        index: match.index,
        length: match[0].length,
        text: match[0],
        url: match[0].startsWith("http") ? match[0] : `https://${match[0]}`,
      }
    );
  },
];

function SetEditorStateFromRaw({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    try {
      // Check if content is actually a Lexical state before parsing
      if (!isLexicalState(content)) {
        console.warn(
          "SetEditorStateFromRaw received non-Lexical content:",
          content,
        );
        return;
      }

      // // Use editor.update to safely set editor state
      // editor.update(() => {
      //   try {
      //     const editorState = editor.parseEditorState(content);
      //     editor.setEditorState(editorState);
      //   } catch (err) {
      //     console.error("Failed to parse editor state:", err);
      //   }
      // });
    } catch (err) {
      console.error("Invalid editor state", err);
    }
  }, [editor, content]);

  return null;
}

function isLexicalState(content: string): boolean {
  if (!content || typeof content !== "string") {
    return false;
  }

  try {
    const parsed = JSON.parse(content);
    // Check if it has the required Lexical structure
    return (
      parsed &&
      typeof parsed === "object" &&
      "root" in parsed &&
      typeof parsed.root === "object" &&
      "children" in parsed.root
    );
  } catch {
    return false;
  }
}

// Enhanced HTML content renderer with comprehensive email styling
function renderHTMLContent(content: string) {
  // Use the email HTML cleaner to ensure consistent rendering
  const cleanedContent = cleanHtmlForEmail(content, {
    preserveTables: true,
    preserveLinks: true,
    preserveImages: true,
    maxWidth: "100%",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    lineHeight: "1.6"
  });

  return (
    <div
      className="email-content text-sm text-gray-800 max-w-full"
      style={{
        // Email-specific styles
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: "1.6",
      }}
      dangerouslySetInnerHTML={{
        __html: cleanedContent,
      }}
    />
  );
}

export function ReadOnlyEditor({ content }: { content?: string }) {
  // Handle undefined/null content
  if (!content) {
    console.warn("ReadOnlyEditor: Content is undefined/null");
    return (
      <div className="whitespace-pre-wrap text-sm text-gray-800 max-w-[900px] text-gray-500 italic">
        No content available
      </div>
    );
  }

  try {
    // If content is HTML (starts with < and contains HTML tags), render as HTML
    if (content.trim().startsWith("<") && content.includes("</")) {
      // Use the email HTML cleaner for consistent processing
      const cleanedContent = cleanHtmlForEmail(content, {
        preserveTables: true,
        preserveLinks: true,
        preserveImages: true,
        maxWidth: "100%",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        lineHeight: "1.6"
      });

      return renderHTMLContent(fixAttachmentImageSrc(cleanedContent));
    }

    // If content is Lexical state, use enhanced Lexical editor with available plugins
    if (isLexicalState(content)) {
      const uniqueId = `ReadOnlyEmailEditor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const initialConfig = {
        editable: false,
        namespace: uniqueId,
        onError: (error: any) => {
          console.error("Lexical editor error:", error);
        },
        theme: configTheme,
        nodes: [
          HeadingNode,
          ListNode,
          ListItemNode,
          CodeNode,
          CodeHighlightNode,
          AutoLinkNode,
          LinkNode,
          TableNode, TableCellNode, TableRowNode
        ]
      };

      return (
        <div className="readonly-editor-container">
          <LexicalComposer key={uniqueId} initialConfig={initialConfig}>
            <RichTextPlugin
              contentEditable={<ContentEditable className="outline-none" />}
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <ListPlugin />
            <LinkPlugin />
            <PlaygroundAutoLinkPlugin />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <SetEditorStateFromRaw content={content} />
          </LexicalComposer>
        </div>
      );
    }

    // Fallback: render as plain text (for regular strings)
    return (
      <div className="whitespace-pre-wrap text-sm text-gray-800 max-w-[900px]">
        {content}
      </div>
    );
  } catch (error) {
    console.error("ReadOnlyEditor error:", error);
    return (
      <div className="whitespace-pre-wrap text-sm text-gray-800 max-w-[900px] text-red-500">
        Error rendering content: {String(error)}
      </div>
    );
  }
}
