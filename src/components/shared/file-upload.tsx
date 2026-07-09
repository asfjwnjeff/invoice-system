"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedFile { id: string; fileName: string; filePath: string; fileSize: number; }

interface FileUploadProps {
  entityType: string; entityId?: string; files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void; accept?: string; maxSize?: number;
}

export function FileUpload({ entityType, entityId, files, onChange, accept, maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (fileList: File[]) => {
    setUploading(true);
    const newFiles: UploadedFile[] = [];
    for (const file of fileList) {
      if (file.size > maxSize) continue;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      if (entityId) formData.append("entityId", entityId);
      const res = await fetch("/api/files", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) newFiles.push(json.data);
    }
    onChange([...files, ...newFiles]);
    setUploading(false);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => { e.preventDefault(); await uploadFiles(Array.from(e.dataTransfer.files)); }, [entityType, entityId, files]);
  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => { await uploadFiles(Array.from(e.target.files ?? [])); };

  const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  return (
    <div className="space-y-3">
      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
        className={cn("flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors hover:border-muted-foreground cursor-pointer")}>
        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">拖拽文件到此处，或点击选择</p>
        <input type="file" className="hidden" id="fu-input" accept={accept} multiple onChange={handleSelect} />
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={uploading}
          onClick={() => document.getElementById("fu-input")?.click()}>
          {uploading ? "上传中..." : "选择文件"}
        </Button>
      </div>
      {files.map((f) => (
        <div key={f.id} className="flex items-center justify-between rounded-sm bg-muted px-3 py-2">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{f.fileName}</span><span className="text-xs text-muted-foreground">{formatSize(f.fileSize)}</span></div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange(files.filter((x) => x.id !== f.id))}><X className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
    </div>
  );
}
