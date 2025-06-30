/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import {useEffect, useState} from 'react'
import { $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical'
import { $createImageNode, ImageNode } from './InlineImageNodes'
import { Button } from '../ui/button'

export const INSERT_IMAGE_COMMAND: LexicalCommand<string> = createCommand('INSERT_IMAGE_COMMAND')

export default function ImagePlugin() {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagePlugin: ImageNode not registered on editor')
    }
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (src: string) => {
        $insertNodes([$createImageNode(src)])
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])
  return null
}
