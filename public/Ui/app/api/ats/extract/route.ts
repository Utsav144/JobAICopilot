import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import path from "node:path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const pdfWorkerSrc = path.join(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs");

function cleanText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \u00A0]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a resume file." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Resume file is too large. Upload a file under 8 MB." }, { status: 400 });
  }

  const extension = extensionOf(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  try {
    if (extension === "pdf" || file.type === "application/pdf") {
      PDFParse.setWorker(pdfWorkerSrc);
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const parsed = await parser.getText();
      await parser.destroy();
      text = parsed.text || "";
    } else if (
      extension === "docx" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value || "";
    } else if (["txt", "md", "rtf"].includes(extension) || file.type.startsWith("text/")) {
      text = buffer.toString("utf8");
    } else {
      return NextResponse.json(
        { error: "Supported resume formats are PDF, DOCX, TXT, MD, and RTF." },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not extract text from this resume." },
      { status: 400 }
    );
  }

  const cleaned = cleanText(text);
  if (cleaned.length < 20) {
    return NextResponse.json(
      { error: "Could not extract readable resume text. Try exporting the resume as text or paste the resume content." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    fileName: file.name,
    text: cleaned,
    characters: cleaned.length,
    words: cleaned.split(/\s+/).filter(Boolean).length
  });
}
