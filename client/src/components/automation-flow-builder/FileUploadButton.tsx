// FileUploadButton.tsx - File Upload Component

import { useRef } from "react";

interface FileUploadButtonProps {
  accept: string;
  onUpload: (file: File) => void;
  children: React.ReactNode;
  className?: string;
}

export function FileUploadButton({
  accept,
  onUpload,
  children,
  className = "",
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 ${className}`}
      >
        {children}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}