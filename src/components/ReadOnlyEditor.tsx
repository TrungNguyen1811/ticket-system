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

function isLexicalState(content: string): boolean {
  try {
    const parsed = JSON.parse(content)
    return parsed && typeof parsed === 'object' && 'root' in parsed
  } catch {
    return false
  }
}

export function ReadOnlyEditor({ content }: { content: string }) {
  // If content is HTML (starts with < and contains HTML tags), render as HTML
  if (content.trim().startsWith('<') && content.includes('</')) {
    return (
      <div 
        className="whitespace-pre-wrap text-sm text-gray-800"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  // If content is Lexical state, use Lexical editor
  if (isLexicalState(content)) {
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

  // Fallback: render as plain text
  return (
    <div className="whitespace-pre-wrap text-sm text-gray-800 max-w-[900px]">
      {content}
    </div>
  )
}
