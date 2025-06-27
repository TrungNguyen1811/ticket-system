import type {
    LexicalEditor,
    NodeKey,
    NodeSelection,
    RangeSelection,
  } from 'lexical'
  
  
  import './InlineImageNode.css'
  
  import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
  import {useLexicalNodeSelection} from '@lexical/react/useLexicalNodeSelection'
  import {mergeRegister} from '@lexical/utils'
  
  import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    $setSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    DRAGSTART_COMMAND,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    SELECTION_CHANGE_COMMAND,
    $isRangeSelection,
  } from 'lexical'
  import {Suspense, useCallback, useEffect, useRef, useState} from 'react'

import { Input } from '../ui/input'
import { Button } from '../ui/button'

  
  const imageCache = new Set()
  
  function useSuspenseImage(src: string) {
    if (!imageCache.has(src)) {
      throw new Promise((resolve) => {
        const img = new Image()
        img.src = src
        img.onload = () => {
          imageCache.add(src)
          resolve(null)
        }
      })
    }
  }
  
  function LazyImage({
    altText,
    className,
    imageRef,
    src,
    width,
    height,
  }: {
    altText: string;
    className: string | null;
    height: 'inherit' | number;
    imageRef: {current: null | HTMLImageElement};
    src: string;
    width: 'inherit' | number;
  }): JSX.Element {
    useSuspenseImage(src)
    return (
      <img
        className={className || undefined}
        src={src}
        alt={altText}
        ref={imageRef}
        style={{
          height,
          width,
          display: 'block',
        }}
        draggable="false"
      />
    )
  }
  
  export function UpdateInlineImageDialog({
    activeEditor,
    nodeKey,
    onClose,
  }: {
    activeEditor: LexicalEditor;
    nodeKey: NodeKey;
    onClose: () => void;
  }): JSX.Element {
    const editorState = activeEditor.getEditorState()
    const node = editorState.read(() => $getNodeByKey(nodeKey))

    const handleOnConfirm = () => {
      if(node) {
        activeEditor.update(() => { node} )
      }
      onClose()
    }
  
    return (
      <>
        <div style={{marginBottom: '1em'}}>
          <Input
            placeholder="Descriptive alternative text"
          />
        </div>
  
        <div style={{marginTop: '1em', display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
          <Button onClick={handleOnConfirm}>
            Confirm
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </>
    )
  }
  
  export default function InlineImageComponent({
    src,
    altText,
    nodeKey,
    width,
    height,
    showCaption,
    caption,
  }: {
    altText: string;
    caption: LexicalEditor;
    height: 'inherit' | number;
    nodeKey: NodeKey;
    showCaption: boolean;
    src: string;
    width: 'inherit' | number;
  }): JSX.Element {
    const imageRef = useRef<null | HTMLImageElement>(null)
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const [isSelected, setSelected, clearSelection] =
      useLexicalNodeSelection(nodeKey)
    const [editor] = useLexicalComposerContext()
    const [selection, setSelection] = useState<
      RangeSelection | NodeSelection | null
    >(null)
    const activeEditorRef = useRef<LexicalEditor | null>(null)
  
    const onDelete = useCallback(
      (payload: KeyboardEvent) => {
        if (isSelected && $isNodeSelection($getSelection())) {
          const event: KeyboardEvent = payload
          event.preventDefault()
          setSelected(false)
        }
        return false
      },
      [isSelected, nodeKey, setSelected],
    )
  
    const onEnter = useCallback(
      (event: KeyboardEvent) => {
        const latestSelection = $getSelection()
        const buttonElem = buttonRef.current
        if (
          isSelected &&
          $isNodeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          if (showCaption) {
            // Move focus into nested editor
            $setSelection(null)
            event.preventDefault()
            caption.focus()
            return true
          } else if (
            buttonElem !== null &&
            buttonElem !== document.activeElement
          ) {
            event.preventDefault()
            buttonElem.focus()
            return true
          }
        }
        return false
      },
      [caption, isSelected, showCaption],
    )
  
    const onEscape = useCallback(
      (event: KeyboardEvent) => {
        if (
          activeEditorRef.current === caption ||
          buttonRef.current === event.target
        ) {
          $setSelection(null)
          editor.update(() => {
            setSelected(true)
            const parentRootElement = editor.getRootElement()
            if (parentRootElement !== null) {
              parentRootElement.focus()
            }
          })
          return true
        }
        return false
      },
      [caption, editor, setSelected],
    )
  
    useEffect(() => {
      let isMounted = true
      const unregister = mergeRegister(
        editor.registerUpdateListener(({editorState}) => {
          if (isMounted) {
            const sel = editorState.read(() => $getSelection())
            if ($isRangeSelection(sel) || $isNodeSelection(sel)) {
              setSelection(sel)
            } else {
              setSelection(null)
            }
          }
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          (_, activeEditor) => {
            activeEditorRef.current = activeEditor
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand<MouseEvent>(
          CLICK_COMMAND,
          (payload) => {
            const event = payload
            if (event.target === imageRef.current) {
              if (event.shiftKey) {
                setSelected(!isSelected)
              } else {
                clearSelection()
                setSelected(true)
              }
              return true
            }
  
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          DRAGSTART_COMMAND,
          (event) => {
            if (event.target === imageRef.current) {
              // TODO This is just a temporary workaround for FF to behave like other browsers.
              // Ideally, this handles drag & drop too (and all browsers).
              event.preventDefault()
              return true
            }
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_DELETE_COMMAND,
          onDelete,
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_BACKSPACE_COMMAND,
          onDelete,
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          onEscape,
          COMMAND_PRIORITY_LOW,
        ),
      )
      return () => {
        isMounted = false
        unregister()
      }
    }, [
      clearSelection,
      editor,
      isSelected,
      nodeKey,
      onDelete,
      onEnter,
      onEscape,
      setSelected,
    ])
  
    const draggable = isSelected && $isNodeSelection(selection)
    const isFocused = isSelected
    return (
      <Suspense fallback={null}>
        <>
          <div draggable={draggable}>
            <button
              className="image-edit-button"
              ref={buttonRef}
              disabled
            >
              Edit
            </button>
            <LazyImage
              className={
                isFocused
                  ? `focused ${$isNodeSelection(selection) ? 'draggable' : ''}`
                  : null
              }
              src={src}
              altText={altText}
              imageRef={imageRef}
              width={width}
              height={height}
            />
          </div>
        </>
      </Suspense>
    )
  }
  