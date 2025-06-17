import { useEffect } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"

function SetEditorStateFromRaw({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    try {
      const editorState = editor.parseEditorState(content)
      editor.setEditorState(editorState)
    } catch (err) {
      console.error("Invalid editor state", err)
    }
  }, [editor, content])

  return null
}

export function ReadOnlyEditor({ content }: { content: string }) {
  const initialConfig = {
    editable: false,
    namespace: "ReadOnlyComment",
    onError: (error: any) => {
      console.error(error)
    },
    theme: {
      paragraph: "whitespace-pre-wrap text-sm text-gray-800",
    },
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="outline-none" />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <SetEditorStateFromRaw content={content} />
    </LexicalComposer>
  )
}
