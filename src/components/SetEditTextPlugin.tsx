import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

interface SetEditTextPluginProps {
  text: string;
  isEditMode: boolean;
}

export default function SetEditTextPlugin({ text, isEditMode }: SetEditTextPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (isEditMode && text) {
      try {
        // Try to parse as JSON first
        const jsonContent = JSON.parse(text);
        editor.setEditorState(editor.parseEditorState(JSON.stringify(jsonContent)));
      } catch (e) {
        // If not JSON, treat as plain text
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(text));
          root.append(paragraph);
        });
      }
    }
  }, [editor, text, isEditMode]);

  return null;
}