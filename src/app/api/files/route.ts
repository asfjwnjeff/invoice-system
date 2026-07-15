import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const entityType = (formData.get("entityType") as string) ?? "misc";
  const entityId = (formData.get("entityId") as string) ?? "pending";

  if (!file) return NextResponse.json({ success: false, error: "未选择文件" }, { status: 400 });

  const ext = path.extname(file.name);
  const fileType = ext.replace(".", "").toUpperCase();
  const fileName = `${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "uploads", entityType);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);

  const record = await db.invoiceFile.create({
    data: { entityType, entityId, fileName: file.name, filePath: path.join("uploads", entityType, fileName), fileType, fileSize: file.size, mimeType: file.type || "application/octet-stream", uploadedBy: session.user.id },
  });

  return NextResponse.json({ success: true, data: { id: record.id, fileName: record.fileName, filePath: record.filePath, fileSize: record.fileSize } });
}
