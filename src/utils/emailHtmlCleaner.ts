/**
 * Utility functions to clean and convert HTML content for email delivery
 */

export interface EmailHtmlOptions {
  preserveTables?: boolean;
  preserveLinks?: boolean;
  preserveImages?: boolean;
  maxWidth?: string;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
}

/**
 * Clean HTML content from Lexical editor to make it email-friendly
 */
export function cleanHtmlForEmail(
  html: string,
  options: EmailHtmlOptions = {}
): string {
  const {
    preserveTables = true,
    preserveLinks = true,
    preserveImages = true,
    maxWidth = "100%",
    fontFamily = "Arial, sans-serif",
    fontSize = "14px",
    lineHeight = "1.6"
  } = options;

  if (!html || typeof html !== "string") {
    return "";
  }

  // Create a temporary DOM element to parse and manipulate the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  // Remove all script and style tags
  const scripts = body.querySelectorAll("script, style");
  scripts.forEach(el => el.remove());

  // Clean up Lexical-specific classes and attributes
  const lexicalElements = body.querySelectorAll("[class*='editor-'], [class*='ExampleEditorTheme']");
  lexicalElements.forEach(el => {
    // Remove Lexical-specific classes but keep the element
    const classes = el.className.split(" ").filter(cls => 
      !cls.startsWith("editor-") && 
      !cls.startsWith("ExampleEditorTheme") &&
      !cls.startsWith("lexical")
    );
    el.className = classes.join(" ");
  });

  // Convert inline styles to email-friendly styles
  const allElements = body.querySelectorAll("*");
  allElements.forEach(el => {
    const element = el as HTMLElement;
    
    // Remove problematic CSS properties
    const style = element.style;
    if (style) {
      // Remove position, z-index, and other problematic properties
      style.removeProperty("position");
      style.removeProperty("z-index");
      style.removeProperty("float");
      style.removeProperty("clear");
      style.removeProperty("display");
      style.removeProperty("flex");
      style.removeProperty("grid");
      style.removeProperty("transform");
      style.removeProperty("transition");
      style.removeProperty("animation");
      style.removeProperty("box-shadow");
      style.removeProperty("text-shadow");
      style.removeProperty("border-radius");
      style.removeProperty("border-image");
      style.removeProperty("background-image");
      style.removeProperty("background-size");
      style.removeProperty("background-position");
      style.removeProperty("background-repeat");
    }
  });

  // Handle tables specifically for Gmail compatibility
  if (preserveTables) {
    const tables = body.querySelectorAll("table");
    tables.forEach(table => {
      const tableElement = table as HTMLTableElement;
      
      // Gmail-friendly table attributes and styles
      tableElement.setAttribute("cellpadding", "8");
      tableElement.setAttribute("cellspacing", "0");
      tableElement.setAttribute("border", "1");
      tableElement.setAttribute("width", "100%");
      
      // Add email-friendly table styles (inline for Gmail)
      tableElement.style.width = "100%";
      tableElement.style.borderCollapse = "collapse";
      tableElement.style.borderSpacing = "0";
      tableElement.style.border = "1px solid #000000";
      tableElement.style.maxWidth = maxWidth;
      tableElement.style.fontFamily = fontFamily;
      tableElement.style.fontSize = fontSize;
      tableElement.style.lineHeight = lineHeight;
      
      // Style table cells for Gmail
      const cells = tableElement.querySelectorAll("td, th");
      cells.forEach(cell => {
        const cellElement = cell as HTMLTableCellElement;
        
        // Set cell attributes for Gmail
        cellElement.setAttribute("valign", "top");
        cellElement.setAttribute("align", "left");
        
        // Inline styles for Gmail compatibility
        cellElement.style.border = "1px solid #000000";
        cellElement.style.padding = "8px";
        cellElement.style.textAlign = "left";
        cellElement.style.verticalAlign = "top";
        cellElement.style.fontFamily = fontFamily;
        cellElement.style.fontSize = fontSize;
        cellElement.style.lineHeight = lineHeight;
        cellElement.style.backgroundColor = "#ffffff";
        cellElement.style.margin = "0";
        cellElement.style.borderCollapse = "collapse";
        cellElement.style.borderSpacing = "0";
      });
      
      // Style table rows for Gmail
      const rows = tableElement.querySelectorAll("tr");
      rows.forEach(row => {
        const rowElement = row as HTMLTableRowElement;
        rowElement.style.margin = "0";
        rowElement.style.padding = "0";
        rowElement.style.borderCollapse = "collapse";
        rowElement.style.borderSpacing = "0";
      });
    });
  }

  // Handle links
  if (preserveLinks) {
    const links = body.querySelectorAll("a");
    links.forEach(link => {
      const linkElement = link as HTMLAnchorElement;
      linkElement.style.color = "#0066cc";
      linkElement.style.textDecoration = "underline";
    });
  }

  // Handle images
  if (preserveImages) {
    const images = body.querySelectorAll("img");
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      imgElement.style.maxWidth = "100%";
      imgElement.style.height = "auto";
      imgElement.style.display = "block";
      imgElement.style.border = "none";
    });
  }

  // Apply base styles to paragraphs and other text elements
  const textElements = body.querySelectorAll("p, div, span, h1, h2, h3, h4, h5, h6");
  textElements.forEach(el => {
    const element = el as HTMLElement;
    element.style.fontFamily = fontFamily;
    element.style.fontSize = fontSize;
    element.style.lineHeight = lineHeight;
    element.style.margin = "0 0 0px 0";
    element.style.padding = "0";
    element.style.textAlign = "left";
  });

  // Handle headings specifically
  const headings = body.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headings.forEach((heading, index) => {
    const headingElement = heading as HTMLHeadingElement;
    const sizes = ["24px", "20px", "18px", "16px", "14px", "12px"];
    const weights = ["bold", "bold", "bold", "bold", "bold", "bold"];
    
    headingElement.style.fontSize = sizes[index] || "16px";
    headingElement.style.fontWeight = weights[index] || "bold";
    headingElement.style.margin = "0 0 10px 0";
    headingElement.style.color = "#333";
    headingElement.style.textAlign = "left";
  });

  // Handle lists with better structure normalization
  const lists = body.querySelectorAll("ul, ol");
  lists.forEach(list => {
    const listElement = list as HTMLElement;
    
    // Force proper list styling regardless of inline styles
    listElement.style.margin = "1rem 0 !important";
    listElement.style.padding = "0 0 0 1.5rem !important";
    listElement.style.listStyleType = list.tagName.toLowerCase() === "ol" ? "decimal" : "disc";
    listElement.style.listStylePosition = "outside";
    
    const listItems = listElement.querySelectorAll("li");
    listItems.forEach(li => {
      const liElement = li as HTMLElement;
      
      // Force proper list item styling
      liElement.style.margin = "0.5rem 0 !important";
      liElement.style.padding = "0 0 0 0.5rem !important";
      liElement.style.display = "list-item !important";
      liElement.style.listStyleType = "inherit";
      liElement.style.textAlign = "left";
      
      // Handle nested paragraphs and spans inside list items
      const paragraphs = liElement.querySelectorAll("p");
      paragraphs.forEach(p => {
        const pElement = p as HTMLElement;
        // Remove paragraph margins and move content up
        pElement.style.margin = "0 !important";
        pElement.style.padding = "0 !important";
        
        // If paragraph contains only text content, move it to list item
        if (pElement.children.length === 0 && pElement.textContent?.trim()) {
          liElement.innerHTML = pElement.textContent;
        }
      });
      
      // Handle nested spans that might contain the actual content
      const spans = liElement.querySelectorAll("span");
      spans.forEach(span => {
        const spanElement = span as HTMLElement;
        // Remove unnecessary span styling
        spanElement.style.margin = "0 !important";
        spanElement.style.padding = "0 !important";
        spanElement.style.lineHeight = "1.6 !important";
      });
    });
  });

  // Handle blockquotes
  const blockquotes = body.querySelectorAll("blockquote");
  blockquotes.forEach(quote => {
    const quoteElement = quote as HTMLElement;
    quoteElement.style.borderLeft = "4px solid #ccc";
    quoteElement.style.margin = "10px 0";
    quoteElement.style.padding = "10px 10px";
    quoteElement.style.backgroundColor = "#f9f9f9";
    quoteElement.style.fontStyle = "italic";
    quoteElement.style.textAlign = "left";
  });

  // Handle code blocks
  const codeBlocks = body.querySelectorAll("pre, code");
  codeBlocks.forEach(code => {
    const codeElement = code as HTMLElement;
    codeElement.style.backgroundColor = "#f4f4f4";
    codeElement.style.border = "1px solid #ddd";
    codeElement.style.borderRadius = "3px";
    codeElement.style.padding = "8px";
    codeElement.style.fontFamily = "monospace";
    codeElement.style.fontSize = "12px";
    codeElement.style.overflow = "auto";
    codeElement.style.textAlign = "left";
  });

  // Create email wrapper
  const emailWrapper = doc.createElement("div");
  emailWrapper.style.fontFamily = fontFamily;
  emailWrapper.style.fontSize = fontSize;
  emailWrapper.style.lineHeight = lineHeight;
  emailWrapper.style.color = "#333";
  emailWrapper.style.maxWidth = maxWidth;
  emailWrapper.style.margin = "0";
  emailWrapper.style.padding = "0px";
  emailWrapper.style.textAlign = "left";
  
  // Move all content to the wrapper
  while (body.firstChild) {
    emailWrapper.appendChild(body.firstChild);
  }
  body.appendChild(emailWrapper);

  return body.innerHTML;
}

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

/**
 * Create a complete email HTML document
 */
export function createEmailDocument(
  content: string,
  options: EmailHtmlOptions = {}
): string {
  const cleanedContent = cleanHtmlForEmail(content, options);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Content</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            background-color: #ffffff;
            text-align: left;
        }
        .email-container {
            max-width: 600px;
            margin: 0;
            background-color: #ffffff;
            text-align: left;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            border: 1px solid #000000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
        }
        td, th {
            border: 1px solid #000000;
            padding: 8px;
            text-align: left;
            vertical-align: top;
            background-color: #ffffff;
            margin: 0;
            border-collapse: collapse;
            border-spacing: 0;
        }
        tr {
            margin: 0;
            padding: 0;
            border-collapse: collapse;
            border-spacing: 0;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
        }
        a {
            color: #0066cc;
            text-decoration: underline;
        }
        blockquote {
            border-left: 4px solid #ccc;
            margin: 10px 0;
            padding: 10px 20px;
            background-color: #f9f9f9;
            font-style: italic;
        }
        pre, code {
            background-color: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 8px;
            font-family: monospace;
            font-size: 12px;
            overflow: auto;
        }
        /* List styling with proper markers */
        ul {
            list-style-type: disc;
            margin: 10px 0;
            padding-left: 20px;
        }
        ol {
            list-style-type: decimal;
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
            padding: 0;
        }
        /* Marker styling for better email compatibility */
        ul li::marker {
            color: #333;
            font-weight: normal;
        }
        ol li::marker {
            color: #333;
            font-weight: normal;
        }
        /* Fallback for older email clients that don't support ::marker */
        ul li {
            list-style-type: disc;
        }
        ol li {
            list-style-type: decimal;
        }
        /* Ensure all text elements are left-aligned */
        p, div, h1, h2, h3, h4, h5, h6, li, td, th, blockquote {
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="email-container">
        ${cleanedContent}
    </div>
</body>
</html>`;
} 