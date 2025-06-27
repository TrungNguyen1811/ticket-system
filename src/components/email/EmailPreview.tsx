import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertLexicalToEmailHtml, createEmailDocument } from "@/utils/emailHtmlCleaner";

interface EmailPreviewProps {
  initialContent?: string;
}

export function EmailPreview({ initialContent = "" }: EmailPreviewProps) {
  const [rawContent, setRawContent] = useState(initialContent);
  const [cleanedHtml, setCleanedHtml] = useState("");
  const [fullEmailDocument, setFullEmailDocument] = useState("");

  const handleCleanContent = () => {
    try {
      const cleaned = convertLexicalToEmailHtml(rawContent, {
        preserveTables: true,
        preserveLinks: true,
        preserveImages: true,
        maxWidth: "600px",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        lineHeight: "1.6"
      });
      
      const fullDocument = createEmailDocument(rawContent, {
        preserveTables: true,
        preserveLinks: true,
        preserveImages: true,
        maxWidth: "600px",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        lineHeight: "1.6"
      });

      setCleanedHtml(cleaned);
      setFullEmailDocument(fullDocument);
    } catch (error) {
      console.error("Error cleaning content:", error);
      setCleanedHtml("Error processing content");
      setFullEmailDocument("Error processing content");
    }
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(cleanedHtml);
  };

  const handleCopyFullDocument = () => {
    navigator.clipboard.writeText(fullEmailDocument);
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Email HTML Cleaner & Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raw Content (Lexical HTML or JSON)</label>
              <Textarea
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Paste your Lexical HTML content here..."
                className="min-h-[200px] font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCleanContent} variant="default">
                Clean & Convert
              </Button>
              <Button onClick={handleCopyHtml} variant="outline" disabled={!cleanedHtml}>
                Copy Cleaned HTML
              </Button>
              <Button onClick={handleCopyFullDocument} variant="outline" disabled={!fullEmailDocument}>
                Copy Full Email Document
              </Button>
            </div>

            <Tabs defaultValue="preview" className="w-full">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="cleaned-html">Cleaned HTML</TabsTrigger>
                <TabsTrigger value="full-document">Full Email Document</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Email Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cleanedHtml ? (
                      <div 
                        className="border rounded-lg p-4 bg-white max-w-[600px] mx-auto"
                        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                      />
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        Click "Clean & Convert" to see the preview
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cleaned-html" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cleaned HTML Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={cleanedHtml}
                      readOnly
                      className="min-h-[400px] font-mono text-xs"
                      placeholder="Cleaned HTML will appear here..."
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="full-document" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Complete Email Document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={fullEmailDocument}
                      readOnly
                      className="min-h-[400px] font-mono text-xs"
                      placeholder="Complete email document will appear here..."
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 