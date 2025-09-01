// /lib/pdf/prescription.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type RxLike = {
  vitals?: {
    temperature?: string;
    bp?: string;
    bpSys?: string;
    bpDia?: string;
    spo2?: string;
    weight?: string;
    bmi?: string;
  };
  clinical?: {
    chiefComplaints?: string;
  };
  prescription?: Array<{
    medicine?: string;
    frequency?: string;
    dosage?: string;
    duration?: string;
    instruction?: string; // → Advice (per your requirement)
  }>;
  plan?: {
    advice?: string;
  };
};

export type PatientInfo = {
  name: string;
  age?: string;
  gender?: string;
  abhaNumber?: string;
  abhaAddress?: string;
};

export type DoctorInfo = {
  name: string;
  regNo?: string;
  specialty?: string;
  qualifications?: string;
};

export type ClinicInfo = {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
};

type GenerateArgs = {
  rx: RxLike;
  patient: PatientInfo;
  doctor: DoctorInfo;
  clinic: ClinicInfo;
  fileName?: string;
};

/** Public entry: generates and downloads the PDF */
export async function generatePrescriptionPdf({
  rx,
  patient,
  doctor,
  clinic,
  fileName,
}: GenerateArgs) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait in points
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // ---- Layout constants
  const margin = 36;
  const lineGap = 4;
  const sectionGap = 12;
  const titleSize = 14;
  const labelSize = 11;
  const textSize = 11;
  const smallSize = 10;

  let y = page.getSize().height - margin;

  const drawText = (txt: string, x: number, yPos: number, size = textSize, bold = false, color = rgb(0, 0, 0)) => {
    page.drawText(txt, { x, y: yPos, size, font: bold ? fontBold : font, color });
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: rgb(0.2, 0.2, 0.2) });
  };

  const wrapText = (txt: string, maxWidth: number, size = textSize) => {
    if (!txt) return [""];
    const words = txt.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const width = font.widthOfTextAtSize(test, size);
      if (width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const addPageIfNeeded = (neededHeight: number) => {
    if (y - neededHeight < margin + 60) {
      // footer space + margin
      drawFooter(); // draw footer before jumping
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      (page as any) = newPage; // rebind for TS
      y = newPage.getSize().height - margin;
    }
  };

  // ---- HEADER (clinic title centered)
  const clinicTitle = clinic.name || "Clinic";
  const titleWidth = fontBold.widthOfTextAtSize(clinicTitle, 18);
  drawText(clinicTitle, (page.getSize().width - titleWidth) / 2, y, 18, true);
  y -= 18 + 6;

  drawLine(margin, y, page.getSize().width - margin, y, 1);
  y -= sectionGap;

  // Patient (left) + Doctor (right)
  const colW = (page.getSize().width - margin * 2) / 2;
  const leftX = margin;
  const rightX = margin + colW;

  drawText("Patient", leftX, y, labelSize, true);
  drawText("Doctor", rightX, y, labelSize, true);
  y -= labelSize + 4;

  // Patient block
  const pLines: string[] = [
    patient.name || "",
    [patient.gender, patient.age].filter(Boolean).join(" • "),
    patient.abhaNumber ? `ABHA No: ${patient.abhaNumber}` : "",
    patient.abhaAddress ? `ABHA Address: ${patient.abhaAddress}` : "",
  ].filter(Boolean);

  let yLeft = y;
  for (const l of pLines) {
    drawText(l, leftX, yLeft, textSize);
    yLeft -= textSize + lineGap;
  }

  // Doctor block
  const dLines: string[] = [
    doctor.name || "",
    doctor.specialty ? `Specialty: ${doctor.specialty}` : "",
    doctor.qualifications ? `Qual: ${doctor.qualifications}` : "",
    doctor.regNo ? `Reg No: ${doctor.regNo}` : "",
  ].filter(Boolean);

  let yRight = y;
  for (const l of dLines) {
    drawText(l, rightX, yRight, textSize);
    yRight -= textSize + lineGap;
  }

  y = Math.min(yLeft, yRight) - sectionGap;
  drawLine(margin, y, page.getSize().width - margin, y);
  y -= sectionGap;

  // ---- VITALS
  const vitals = rx.vitals || {};
  const bpText =
    vitals.bp?.trim()
      ? vitals.bp
      : (vitals.bpSys && vitals.bpDia ? `${vitals.bpSys}/${vitals.bpDia} mmHg` : "");

  const vitalsKV: Array<[string, string | undefined]> = [
    ["Temperature", vitals.temperature ? `${vitals.temperature} °C` : ""],
    ["BP", bpText || ""],
    ["SpO2", vitals.spo2 ? `${vitals.spo2} %` : ""],
    ["Weight", vitals.weight ? `${vitals.weight} kg` : ""],
    ["BMI", vitals.bmi || ""],
  ].filter(([, v]) => v && String(v).trim().length > 0) as any;

  if (vitalsKV.length > 0) {
    drawText("Vitals", margin, y, labelSize, true);
    y -= labelSize + 6;

    const colGap = 18;
    const kvCols = 3;
    const kvColW = (page.getSize().width - margin * 2 - colGap * (kvCols - 1)) / kvCols;

    let xi = margin;
    let col = 0;
    let rowHeight = textSize + lineGap;

    for (const [k, v] of vitalsKV) {
      addPageIfNeeded(textSize * 2 + lineGap + 6);
      drawText(`${k}:`, xi, y, textSize, true);
      drawText(String(v), xi + 80, y, textSize);
      col++;
      if (col === kvCols) {
        y -= rowHeight;
        xi = margin;
        col = 0;
      } else {
        xi += kvColW + colGap;
      }
    }
    if (col !== 0) y -= rowHeight;
    y -= sectionGap;
  }

  // ---- Chief Complaint
  const chief = rx.clinical?.chiefComplaints?.trim();
  if (chief) {
    drawText("Chief Complaint", margin, y, labelSize, true);
    y -= labelSize + 4;
    const lines = wrapText(chief, page.getSize().width - margin * 2);
    for (const l of lines) {
      addPageIfNeeded(textSize + lineGap);
      drawText(l, margin, y, textSize);
      y -= textSize + lineGap;
    }
    y -= sectionGap;
  }

  // ---- Medications Table
  const meds = (rx.prescription || []).filter(
    m =>
      (m.medicine && m.medicine.trim()) ||
      (m.frequency && m.frequency.trim()) ||
      (m.instruction && m.instruction.trim()) ||
      (m.dosage && m.dosage.trim()) ||
      (m.duration && m.duration.trim())
  );

  if (meds.length > 0) {
    drawText("Medications", margin, y, labelSize, true);
    y -= labelSize + 6;

    const tableX = margin;
    const tableW = page.getSize().width - margin * 2;

    // Column widths (approx to look like a Rx)
    const colWidths = {
      medicine: tableW * 0.32,
      frequency: tableW * 0.14,
      advice: tableW * 0.24,
      dosage: tableW * 0.14,
      duration: tableW * 0.16,
    };
    const colOrder: Array<[keyof typeof colWidths, string]> = [
      ["medicine", "Medicine"],
      ["frequency", "Freq"],
      ["advice", "Advice"],
      ["dosage", "Dosage"],
      ["duration", "Duration"],
    ];

    const headerH = textSize + 8;
    addPageIfNeeded(headerH + 10);

    // Header row
    let cx = tableX;
    let cy = y;
    for (const [, label] of colOrder) {
      drawText(label, cx + 4, cy, textSize, true);
      cx += (colWidths as any)[label.toLowerCase?.() || ""] ?? 0; // not used; we’ll use map below
    }
    // better: use defined keys to advance
    cx = tableX;
    for (const [key] of colOrder) {
      const w = (colWidths as any)[key];
      drawLine(cx, cy - 4, cx + w, cy - 4, 1);
      cx += w;
    }
    y -= headerH;

    const rowLineGap = 6;
    const cellPadX = 4;

    const cellKeys = {
      medicine: (m: any) => (m.medicine || "").trim(),
      frequency: (m: any) => (m.frequency || "").trim(),
      advice: (m: any) => (m.instruction || "").trim(),
      dosage: (m: any) => (m.dosage || "").trim(),
      duration: (m: any) => (m.duration || "").trim(),
    };

    for (const m of meds) {
      // Calculate row height from wrapped cells
      const wrapped: Record<string, string[]> = {};
      let maxLines = 1;
      for (const [key] of colOrder) {
        const text = (cellKeys as any)[key](m) as string;
        const w = (colWidths as any)[key] - cellPadX * 2;
        const lines = wrapText(text, Math.max(60, w), textSize);
        wrapped[key] = lines;
        maxLines = Math.max(maxLines, lines.length);
      }
      const rowH = maxLines * (textSize + lineGap) + rowLineGap;

      addPageIfNeeded(rowH);

      // Draw cell text
      let x = tableX;
      const baseY = y;
      for (const [key] of colOrder) {
        const w = (colWidths as any)[key];
        const lines = wrapped[key];
        let ty = baseY;
        for (const ln of lines) {
          drawText(ln, x + cellPadX, ty, textSize);
          ty -= textSize + lineGap;
        }
        x += w;
      }

      // Row divider
      y -= rowH;
      drawLine(tableX, y + rowLineGap / 2, tableX + tableW, y + rowLineGap / 2, 0.5);
    }

    y -= sectionGap;
  }

  // ---- Advice
  const advice = rx.plan?.advice?.trim();
  if (advice) {
    drawText("Advice", margin, y, labelSize, true);
    y -= labelSize + 4;
    const lines = wrapText(advice, page.getSize().width - margin * 2);
    for (const l of lines) {
      addPageIfNeeded(textSize + lineGap);
      drawText(l, margin, y, textSize);
      y -= textSize + lineGap;
    }
    y -= sectionGap;
  }

  // ---- Footer
  function drawFooter() {
    const footerY = margin + 22;
    drawLine(margin, footerY + 12, page.getSize().width - margin, footerY + 12, 1);
    const c1 = clinic.name || "Clinic";
    const c2 = [clinic.address, clinic.phone].filter(Boolean).join(" • ");
    const c3 = clinic.website ? String(clinic.website) : "";
    drawText(c1, margin, footerY, smallSize, true, rgb(0.1, 0.1, 0.1));
    if (c2) drawText(c2, margin, footerY - smallSize - 2, smallSize);
    if (c3) drawText(c3, margin, footerY - (smallSize + 2) * 2, smallSize);
  }

  drawFooter();

  // ---- Save + download
  const stamp = new Date();
  const defaultName = `Prescription_${patient.name?.replace(/\s+/g, "_")}_${stamp
    .toISOString()
    .slice(0, 10)}.pdf`;

  const bytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || defaultName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
