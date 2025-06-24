import { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

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

      const editorState = editor.parseEditorState(content);
      editor.setEditorState(editorState);
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
    fullContent: content,
  });

  try {
    // If content is HTML (starts with < and contains HTML tags), render as HTML
    if (content.trim().startsWith("<") && content.includes("</")) {
      return (
        <div
          className="whitespace-pre-wrap text-sm text-gray-800"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    // If content is Lexical state, use Lexical editor
    if (isLexicalState(content)) {
      const initialConfig = {
        editable: false,
        namespace: "ReadOnlyComment",
        onError: (error: any) => {
          console.error("Lexical editor error:", error);
        },
        theme: {
          paragraph: "whitespace-pre-wrap text-sm text-gray-800",
        },
      };

      return (
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={<ContentEditable className="outline-none" />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <SetEditorStateFromRaw content={content} />
        </LexicalComposer>
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
