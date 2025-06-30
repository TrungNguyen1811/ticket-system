import { Button } from "@/components/ui/button";
import { useRef } from "react";

export function FileUploader({
  onFileChange,
}: {
  onFileChange: (files: File[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileChange(Array.from(files));
    }
  };

  return (
    <div>
      <Button onClick={handleClick}>Add File</Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
