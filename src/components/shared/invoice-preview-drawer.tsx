"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, Download, File } from "lucide-react";

interface InvoiceFile {
  fileName: string;
  fileType: string; // "PDF" | "OFD" | "XML"
  fileUrl?: string;
}

interface InvoicePreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  files: InvoiceFile[];
  recordedBy?: string | null;
  uploadFilename?: string | null;
  createdAt?: string | null;
}

export function InvoicePreviewDrawer({ open, onClose, files, recordedBy, uploadFilename, createdAt }: InvoicePreviewDrawerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = 3; // placeholder

  if (!open) return null;

  const activeFile = files[activeTab] ?? files[0];
  const displayName = activeFile?.fileName ?? uploadFilename ?? "未知文件";

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 transition-opacity" onClick={onClose} />

      {/* drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[460px] max-w-[90vw] bg-background border-l-2 border-primary shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <File className="h-4 w-4 text-primary" />
            发票原件预览
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* file tabs */}
        <div className="flex border-b px-4 gap-0">
          {files.map((f, i) => (
            <button
              key={f.fileType}
              onClick={() => { setActiveTab(i); setPage(1); }}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                i === activeTab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.fileType === "PDF" ? "📄 PDF 原件" : f.fileType === "OFD" ? "📋 OFD 文件" : "📝 XML 文件"}
            </button>
          ))}
        </div>

        {/* preview area */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 relative">
          <div className="text-center text-muted-foreground">
            <File className="h-16 w-16 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-sm">{displayName}</p>
            <p className="text-xs mt-1">{page} / {totalPages} 页</p>
          </div>
        </div>

        {/* controls */}
        <div className="border-t px-4 py-2.5 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />上一页
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums min-w-[40px] text-center">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            下一页<ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <ZoomIn className="h-3.5 w-3.5 mr-1" />放大
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="h-3.5 w-3.5 mr-1" />下载
          </Button>
        </div>

        {/* info footer */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center gap-4">
          <span className="font-medium text-foreground">{displayName}</span>
          {recordedBy && <span>上传: {recordedBy}</span>}
          {createdAt && <span>{new Date(createdAt).toLocaleString("zh-CN")}</span>}
        </div>
      </div>
    </>
  );
}
