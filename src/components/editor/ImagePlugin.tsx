// import {
//     $createParagraphNode,
//     $insertNodes,
//     COMMAND_PRIORITY_LOW,
//   } from "lexical";
//   import {
//     useLexicalComposerContext
//   } from "@lexical/react/LexicalComposerContext";
//   import {
//     useEffect
//   } from "react";

//   export function ImagePlugin() {
//     const [editor] = useLexicalComposerContext();

//     useEffect(() => {
//       return editor.registerCommand(
//         INSERT_IMAGE_COMMAND,
//         (payload) => {
//           const imageNode = $createImageNode(payload);
//           $insertNodes([imageNode, $createParagraphNode()]);
//           return true;
//         },
//         COMMAND_PRIORITY_LOW
//       );
//     }, [editor]);

//     return null;
//   }
