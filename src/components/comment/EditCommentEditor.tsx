import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, EditorState } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import ToolbarPlugin from "@/components/editor/ToolbarPlugin";
import configTheme from "../theme/configTheme";

interface EditCommentEditorProps {
  initialState: string;
  onChange: (value: { raw: string; html: string }) => void;
  ticketId: string
}

const EditCommentEditor = ({
  initialState,
  onChange,
  ticketId,
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
      <EditorInner onChange={onChange} ticketId={ticketId}/>
    </LexicalComposer>
  );
};

const EditorInner = ({
  onChange,
  ticketId
}: {
  onChange: (value: { raw: string; html: string }) => void;
  ticketId: string
}) => {
  const [editor] = useLexicalComposerContext();

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const html = $getRoot().getTextContent(); // TODO: Replace with proper HTML exporter
      const raw = JSON.stringify(editorState.toJSON());
      onChange({ html, raw });
    });
  };

  return (
    <>
      <ToolbarPlugin ticketId={ticketId}/>
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
