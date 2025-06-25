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
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";

// Import necessary nodes
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";

// Auto-link matchers
const URL_MATCHER = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    return (
      match && {
        index: match.index,
        length: match[0].length,
        text: match[0],
        url: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
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

      // Use editor.update to safely set editor state
      editor.update(() => {
        try {
          const editorState = editor.parseEditorState(content);
          editor.setEditorState(editorState);
        } catch (err) {
          console.error("Failed to parse editor state:", err);
        }
      });
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
  // Clean and enhance HTML content for better rendering
  let enhancedContent = content;
  
  // Ensure proper list rendering
  enhancedContent = enhancedContent.replace(/<ul>/g, '<ul class="list-disc list-inside mb-2 space-y-1">');
  enhancedContent = enhancedContent.replace(/<ol>/g, '<ol class="list-decimal list-inside mb-2 space-y-1">');
  enhancedContent = enhancedContent.replace(/<li>/g, '<li class="text-sm mb-1">');
  
  // Ensure proper heading rendering
  enhancedContent = enhancedContent.replace(/<h1>/g, '<h1 class="text-xl font-bold mb-2">');
  enhancedContent = enhancedContent.replace(/<h2>/g, '<h2 class="text-lg font-bold mb-2">');
  enhancedContent = enhancedContent.replace(/<h3>/g, '<h3 class="text-base font-bold mb-2">');
  enhancedContent = enhancedContent.replace(/<h4>/g, '<h4 class="text-sm font-bold mb-2">');
  enhancedContent = enhancedContent.replace(/<h5>/g, '<h5 class="text-xs font-bold mb-2">');
  enhancedContent = enhancedContent.replace(/<h6>/g, '<h6 class="text-xs font-bold mb-2">');
  
  // Ensure proper paragraph rendering
  enhancedContent = enhancedContent.replace(/<p>/g, '<p class="mb-2">');
  
  // Ensure proper link rendering
  enhancedContent = enhancedContent.replace(/<a /g, '<a class="text-blue-600 underline hover:text-blue-800" ');
  
  // Ensure proper blockquote rendering
  enhancedContent = enhancedContent.replace(/<blockquote>/g, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">');
  
  // Ensure proper code rendering
  enhancedContent = enhancedContent.replace(/<code>/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">');
  enhancedContent = enhancedContent.replace(/<pre>/g, '<pre class="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto mb-2">');

  return (
    <div
      className="email-content text-sm text-gray-800 max-w-full"
      style={{
        // Email-specific styles
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: '1.6',
      }}
      dangerouslySetInnerHTML={{ 
        __html: enhancedContent 
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

  // Debug logging
  console.log("ReadOnlyEditor processing content:", {
    type: typeof content,
    length: content.length,
    isHTML: content.trim().startsWith("<") && content.includes("</"),
    isLexical: isLexicalState(content),
    preview: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
  });

  try {
    // If content is HTML (starts with < and contains HTML tags), render as HTML
    if (content.trim().startsWith("<") && content.includes("</")) {
      return renderHTMLContent(content);
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
        theme: {
          root: "email-content text-sm text-gray-800 max-w-full",
          paragraph: "mb-2 last:mb-0",
          heading: {
            h1: "text-xl font-bold mb-2",
            h2: "text-lg font-bold mb-2",
            h3: "text-base font-bold mb-2",
            h4: "text-sm font-bold mb-2",
            h5: "text-xs font-bold mb-2",
            h6: "text-xs font-bold mb-2",
          },
          list: {
            ul: "list-disc list-inside mb-2 space-y-1",
            ol: "list-decimal list-inside mb-2 space-y-1",
            listitem: "text-sm mb-1",
          },
          link: "text-blue-600 underline hover:text-blue-800",
          quote: "border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2",
          code: "bg-gray-100 px-1 py-0.5 rounded text-sm font-mono",
          text: {
            bold: "font-semibold",
            italic: "italic",
            underline: "underline",
            strikethrough: "line-through",
            underlineStrikethrough: "underline line-through",
          },
        },
        nodes: [
          HeadingNode,
          QuoteNode,
          ListItemNode,
          ListNode,
          LinkNode,
          CodeNode,
          CodeHighlightNode,
        ],
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
            <AutoLinkPlugin matchers={MATCHERS} />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
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
