import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $getRoot } from "lexical";

export function ClearEditorPlugin({ triggerClear, onClearFinished }: { triggerClear: boolean; onClearFinished: () => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (triggerClear) {
      editor.update(() => {
        $getRoot().clear();
      });

      // Gọi callback để reset cờ sau khi xong
      onClearFinished();
    }
  }, [triggerClear, editor, onClearFinished]);

  return null;
}
