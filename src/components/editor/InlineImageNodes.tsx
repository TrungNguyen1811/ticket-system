
import type {

    LexicalEditor,
    NodeKey,
    SerializedEditor,
    SerializedLexicalNode,
    Spread,
  } from 'lexical'
  
  import {DecoratorNode} from 'lexical'
  
  export interface InlineImagePayload {
    altText: string;
    caption?: LexicalEditor;
    height?: number;
    key?: NodeKey;
    showCaption?: boolean;
    src: string;
    width?: number;
  }
  
  
  export type SerializedInlineImageNode = Spread<
    {
      altText: string;
      caption: SerializedEditor;
      height?: number;
      showCaption: boolean;
      src: string;
      width?: number;
    },
    SerializedLexicalNode
  >;
  
  export class ImageNode extends DecoratorNode<JSX.Element> {
    __src: string
  
    static getType(): string {
      return 'image'
    }
  
    static clone(node: ImageNode): ImageNode {
      return new ImageNode(node.__src, node.__key)
    }
  
    static importJSON(serializedNode: any): ImageNode {
      return new ImageNode(serializedNode.src, serializedNode.key)
    }
  
    exportJSON(): any {
      return {
        type: 'image',
        version: 1,
        src: this.__src,
      }
    }
  
    constructor(src: string, key?: string) {
      super(key)
      this.__src = src
    }
  
    createDOM(): HTMLElement {
      const img = document.createElement('img')
      img.src = this.__src
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      img.style.display = 'block'
      return img
    }
  
    updateDOM(): false {
      return false
    }
  
    decorate(): JSX.Element {
      return <img src={this.__src} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} alt="" />
    }
  }
  
  export function $createImageNode(src: string): ImageNode {
    return new ImageNode(src)
  }
  
  export function $isImageNode(node: any): node is ImageNode {
    return node instanceof ImageNode
  }
  