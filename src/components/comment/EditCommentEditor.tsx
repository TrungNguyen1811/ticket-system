import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, EditorState } from "lexical";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import ToolbarPlugin from "@/components/editor/ToolbarPlugin";
import configTheme from "../theme/configTheme";

interface EditCommentEditorProps {
  initialState: string;
  onChange: (value: { raw: string; html: string }) => void;
}

const EditCommentEditor = ({
  initialState,
  onChange,
}: EditCommentEditorProps) => {
  const initialConfig = {
    namespace: "EditCommentEditor",
    editorState: initialState,
    theme: configTheme,
    onError: (e: Error) => {
      console.error(e);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorInner onChange={onChange} />
    </LexicalComposer>
  );
};

const EditorInner = ({
  onChange,
}: {
  onChange: (value: { raw: string; html: string }) => void;
}) => {
  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const html = $getRoot().getTextContent();
      const raw = JSON.stringify(editorState.toJSON());
      onChange({ html, raw });
    });
  };

  return (
    <>
      <ToolbarPlugin />
      <RichTextPlugin
        contentEditable={
          <ContentEditable className="min-h-[80px] border rounded-md p-2 text-sm" />
        }
        placeholder={
          <div className="text-sm text-muted-foreground px-2 py-1">
            Edit your comment...
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={handleChange} />
    </>
  );
};

export default EditCommentEditor;
