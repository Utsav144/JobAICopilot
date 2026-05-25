import { parseList, type ResumeProfile } from "@/lib/resume-profile";
import type { ResumeTemplate } from "@/lib/resume-templates";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sanitizePdfText(value: string) {
  return value.replace(/[()\\]/g, "\\$&").replace(/[^\x20-\x7E]/g, " ");
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
}

function createZip(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  files.forEach((file) => {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    locals.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  });

  const centralDirectory = concatBytes(centrals);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, offset, true);

  return concatBytes([...locals, centralDirectory, end]);
}

function docParagraph(text: string, options: { heading?: boolean; bold?: boolean } = {}) {
  const size = options.heading ? "24" : "21";
  const bold = options.bold || options.heading ? "<w:b/>" : "";
  return `<w:p><w:pPr><w:spacing w:after="${options.heading ? "120" : "80"}"/></w:pPr><w:r><w:rPr>${bold}<w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

export function createResumeDocx(profile: ResumeProfile, template: ResumeTemplate) {
  const sections = [
    ["PROFESSIONAL SUMMARY", profile.summary],
    ["CORE SKILLS", parseList(profile.skills).join(" | ")],
    ["EXPERIENCE", profile.experience],
    ["PROJECTS", profile.projects],
    ["EDUCATION", profile.education],
    ["CERTIFICATIONS", profile.certifications]
  ];
  const sectionXml = sections
    .filter(([, value]) => value)
    .map(([label, value]) => [
      docParagraph(label, { heading: true }),
      ...String(value).split("\n").filter(Boolean).map((line) => docParagraph(line.trim()))
    ].join(""))
    .join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${docParagraph(profile.name || "Resume", { bold: true })}${docParagraph(profile.title || profile.targetRole || template.name, { bold: true })}${docParagraph([profile.email, profile.phone, profile.location, profile.links].filter(Boolean).join(" | "))}${sectionXml}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`;

  return createZip([
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: "word/document.xml", content: documentXml }
  ]);
}

export function createResumePdf(profile: ResumeProfile, template: ResumeTemplate) {
  const sections = [
    ["PROFESSIONAL SUMMARY", profile.summary],
    ["CORE SKILLS", parseList(profile.skills).join(" | ")],
    ["EXPERIENCE", profile.experience],
    ["PROJECTS", profile.projects],
    ["EDUCATION", profile.education],
    ["CERTIFICATIONS", profile.certifications]
  ];
  const lines = [
    profile.name || "Resume",
    profile.title || profile.targetRole || template.name,
    [profile.email, profile.phone, profile.location, profile.links].filter(Boolean).join(" | "),
    "",
    ...sections.flatMap(([label, value]) => value ? [label, ...String(value).split("\n").filter(Boolean)] : [])
  ].slice(0, 54);
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 780 Td",
    ...lines.map((line, index) => `${index === 0 ? "/F1 18 Tf " : index === 1 ? "/F1 13 Tf " : "/F1 10 Tf "}(${sanitizePdfText(line).slice(0, 92)}) Tj 0 -16 Td`),
    "ET"
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
