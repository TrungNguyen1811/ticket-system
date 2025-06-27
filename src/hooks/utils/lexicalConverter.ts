import { cleanHtmlForEmail, EmailHtmlOptions } from "./emailHtmlCleaner";

/**
 * Convert Lexical editor state to email-friendly HTML
 */
export function convertLexicalToEmailHtml(
  lexicalState: string,
  options: EmailHtmlOptions = {}
): string {
  try {
    // If it's already HTML, clean it
    if (lexicalState.trim().startsWith("<")) {
      return cleanHtmlForEmail(lexicalState, options);
    }

    // If it's Lexical state JSON, we need to convert it to HTML first
    // This is a simplified conversion - in a real implementation,
    // you might want to use Lexical's HTML export utilities
    const parsed = JSON.parse(lexicalState);
    if (parsed && parsed.root && parsed.root.children) {
      // Convert Lexical state to HTML (simplified)
      const html = convertLexicalStateToHtml(parsed);
      return cleanHtmlForEmail(html, options);
    }

    // Fallback: treat as plain text
    return `<p style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 0px 0; text-align: left;">${lexicalState}</p>`;
  } catch (error) {
    console.error("Error converting Lexical state to email HTML:", error);
    // Fallback: treat as plain text
    return `<p style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0; text-align: left;">${lexicalState}</p>`;
  }
}

/**
 * Simplified Lexical state to HTML converter
 * This is a basic implementation - you might want to use Lexical's built-in HTML export
 */
function convertLexicalStateToHtml(lexicalState: any): string {
  let html = "";
  
  function processNode(node: any): string {
    if (!node) return "";
    
    try {
      switch (node.type) {
        case "paragraph":
          return `<p>${node.children?.map(processNode).join("") || ""}</p>`;
        
        case "heading":
          const tag = `h${node.tag || 1}`;
          return `<${tag}>${node.children?.map(processNode).join("") || ""}</${tag}>`;
        
        case "list":
          // Add proper fallback for listType
          const listType = node.listType || "bullet";
          const listTag = listType === "number" ? "ol" : "ul";
          return `<${listTag}>${node.children?.map(processNode).join("") || ""}</${listTag}>`;
        
        case "listitem":
          return `<li>${node.children?.map(processNode).join("") || ""}</li>`;
        
        case "quote":
          return `<blockquote>${node.children?.map(processNode).join("") || ""}</blockquote>`;
        
        case "code":
          return `<pre><code>${node.children?.map(processNode).join("") || ""}</code></pre>`;
        
        case "link":
          const url = node.url || "#";
          return `<a href="${url}">${node.children?.map(processNode).join("") || ""}</a>`;
        
        case "text":
          let text = node.text || "";
          if (node.format & 1) text = `<strong>${text}</strong>`; // bold
          if (node.format & 2) text = `<em>${text}</em>`; // italic
          if (node.format & 4) text = `<u>${text}</u>`; // underline
          if (node.format & 8) text = `<s>${text}</s>`; // strikethrough
          return text;
        
        case "table":
          return `<table>${node.children?.map(processNode).join("") || ""}</table>`;
        
        case "tablerow":
          return `<tr>${node.children?.map(processNode).join("") || ""}</tr>`;
        
        case "tablecell":
          const cellTag = node.headerState === 1 ? "th" : "td";
          return `<${cellTag}>${node.children?.map(processNode).join("") || ""}</${cellTag}>`;
        
        default:
          if (node.children) {
            return node.children.map(processNode).join("");
          }
          return "";
      }
    } catch (error) {
      console.error("Error processing node:", error, node);
      // Return empty string as fallback
      return "";
    }
  }
  
  try {
    if (lexicalState.root && lexicalState.root.children) {
      html = lexicalState.root.children.map(processNode).join("");
    }
  } catch (error) {
    console.error("Error processing lexical state:", error);
    html = "";
  }
  
  return html;
} 