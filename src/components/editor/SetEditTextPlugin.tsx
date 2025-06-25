import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";

interface SetEditTextPluginProps {
  text: string;
  isEditMode: boolean;
}

export default function SetEditTextPlugin({
  text,
  isEditMode,
}: SetEditTextPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (isEditMode && text) {
      try {
        // Try to parse as JSON first (Lexical state)
        const jsonContent = JSON.parse(text);
        if (
          jsonContent &&
          typeof jsonContent === "object" &&
          "root" in jsonContent
        ) {
          try {
            const editorState = editor.parseEditorState(
              JSON.stringify(jsonContent),
            );
            editor.setEditorState(editorState);
          } catch (parseError) {
            console.warn(
              "Failed to parse Lexical state, falling back to text:",
              parseError,
            );
            // Fallback to text if parsing fails
            editor.update(() => {
              const root = $getRoot();
              root.clear();
              const paragraph = $createParagraphNode();
              paragraph.append($createTextNode(text));
              root.append(paragraph);
            });
          }
          return;
        }
      } catch (e) {
        // Not JSON, continue to other parsing methods
      }

      // Try to parse as HTML
      if (text.trim().startsWith("<") && text.includes("</")) {
        try {
          // For HTML content, we'll create a simple text representation
          // In a full implementation, you might want to use an HTML parser
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = text;
          const plainText = tempDiv.textContent || tempDiv.innerText || "";

          editor.update(() => {
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(plainText));
            root.append(paragraph);
          });
          return;
        } catch (e) {
          console.warn("Failed to parse HTML content:", e);
        }
      }

      // Fallback: treat as plain text
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(text));
        root.append(paragraph);
      });
    }
  }, [editor, text, isEditMode]);

  return null;
}
