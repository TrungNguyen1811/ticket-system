import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convertLexicalToEmailHtml } from "@/utils/emailHtmlCleaner";

export function EmailTableExample() {
  const [cleanedHtml, setCleanedHtml] = useState("");

  // Example table HTML similar to what you provided
  const exampleTableHtml = `
<table class="ExampleEditorTheme__table" dir="ltr">
  <colgroup>
    <col style="width: 99px;">
    <col style="width: 101px;">
    <col style="width: 100px;">
    <col style="width: 100px;">
    <col style="width: 100px;">
    <col style="width: 100px;">
  </colgroup>
  <tbody>
    <tr dir="ltr">
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 0, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <b><strong class="editor-text-bold" style="white-space: pre-wrap;">adadadasádá</strong></b>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 0, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <b><strong class="editor-text-bold" style="white-space: pre-wrap;">dádasdasda</strong></b>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 0, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <b><strong class="editor-text-bold" style="white-space: pre-wrap;">dsadasdasd</strong></b>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 0, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <b><strong class="editor-text-bold" style="white-space: pre-wrap;">ddsadasdasd</strong></b>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 0, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <b><strong class="editor-text-bold" style="white-space: pre-wrap;">dsdasdasd</strong></b>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 0, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <b><strong class="editor-text-bold" style="white-space: pre-wrap;">dasdasda</strong></b>
        </p>
      </td>
    </tr>
    <tr dir="ltr">
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 255, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <span style="white-space: pre-wrap;">dasdas</span>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 255, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <span style="white-space: pre-wrap;">ddđáas</span>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 255, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <span style="white-space: pre-wrap;">dadasd</span>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 255, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <span style="white-space: pre-wrap;">ddasda</span>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 255, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <span style="white-space: pre-wrap;">sadasd</span>
        </p>
      </td>
      <td class="ExampleEditorTheme__tableCell" dir="ltr" style="background-color: rgb(255, 255, 0); border: 1px solid black; width: 75px; vertical-align: top; text-align: start;">
        <p class="editor-paragraph" dir="ltr">
          <span style="white-space: pre-wrap;">dádá</span>
        </p>
      </td>
    </tr>
  </tbody>
</table>`;

  const handleCleanTable = () => {
    try {
      const cleaned = convertLexicalToEmailHtml(exampleTableHtml, {
        preserveTables: true,
        preserveLinks: true,
        preserveImages: true,
        maxWidth: "600px",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        lineHeight: "1.6"
      });
      setCleanedHtml(cleaned);
    } catch (error) {
      console.error("Error cleaning table:", error);
      setCleanedHtml("Error processing table");
    }
  };

  const handleCopyCleaned = () => {
    navigator.clipboard.writeText(cleanedHtml);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Table Conversion Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleCleanTable} variant="default">
                Convert Table for Email
              </Button>
              <Button onClick={handleCopyCleaned} variant="outline" disabled={!cleanedHtml}>
                Copy Cleaned HTML
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Original Table (Lexical HTML)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div 
                      className="max-w-full overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: exampleTableHtml }}
                    />
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-600">View Raw HTML</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {exampleTableHtml}
                    </pre>
                  </details>
                </CardContent>
              </Card>

              {/* Cleaned Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email-Friendly Table</CardTitle>
                </CardHeader>
                <CardContent>
                  {cleanedHtml ? (
                    <>
                      <div className="border rounded-lg p-4 bg-white">
                        <div 
                          className="max-w-full overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                        />
                      </div>
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-600">View Cleaned HTML</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {cleanedHtml}
                        </pre>
                      </details>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Click "Convert Table for Email" to see the cleaned version
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What the Email HTML Cleaner Does:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Removes Lexical-specific classes (ExampleEditorTheme__, editor-*)</li>
                <li>• Converts inline styles to email-compatible CSS</li>
                <li>• Removes problematic CSS properties (position, z-index, etc.)</li>
                <li>• Ensures tables are properly structured for email clients</li>
                <li>• Applies consistent font families and sizes</li>
                <li>• Maintains table borders and cell padding</li>
                <li>• Preserves text formatting (bold, italic, etc.)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 