import { $generateHtmlFromNodes } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useEffect } from "react";

export function OnChangePlugin({
  onChange,
}: {
  onChange: (data: { raw: string; html: string; text: string }) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const raw = JSON.stringify(editorState.toJSON());
        const root = $getRoot();
        const text = root.getTextContent();
        let html = "";
        try {
          html = $generateHtmlFromNodes(editor, null);
        } catch (e) {
          html = text;
        }
        console.log("DEBUG root.getChildren():", editor);
        console.log("DEBUG HTML:", html);
        onChange({ raw, html, text });
      });
    });
  }, [editor, onChange]);

  return null;
}
