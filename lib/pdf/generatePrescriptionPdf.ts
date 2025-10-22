"use client";

/**
 * ARAN Care – generatePrescriptionPdf.ts (Styled Version)
 * Changes:
 * 1. Headings colored #0E98BA
 * 2. Bullet points (•) before each item under headings
 * 3. Medicines table header: grey background, white text
 * 4. Doctor's signature just above footer
 * 5. Logo centered in header
 */

interface Medication {
  medicine: string;
  frequency: string;
  dosage: string;
  duration: string;
  instructions?: string;
}

interface Vitals {
  temperature?: string;
  bp?: string;
  spo2?: string;
  pulse?: string;
}

interface Patient {
  name: string;
  age?: string;
  gender?: string;
  abhaNumber?: string;
  abhaAddress?: string;
  vitals?: Vitals;
  chiefComplaints?: string;
  investigationAdvice?: string;
  followUpText?: string;
  followUpDate?: string;
}

interface Doctor {
  name: string;
  regNo?: string;
  specialty?: string;
}

interface Clinic {
  name: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
}

interface PrescriptionPdfInput {
  rx: { medications?: Medication[] };
  patient: Patient;
  doctor: Doctor;
  clinic: Clinic;
}

export async function generatePrescriptionPdf({
  rx,
  patient,
  doctor,
  clinic,
}: PrescriptionPdfInput) {
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default;
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const teal: [number, number, number] = [14, 152, 186];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // // Dummy autoTable call to bind plugin
  // autoTable(doc, { head: [[" "]], body: [[" "]], startY: 0 });
  // (doc as any).lastAutoTable = null;

  /* ---------- Header ---------- */
  // Centered logo
  try {
    if (clinic.logoUrl) {
      const logo = await loadImageAsBase64("/icons/logo.png");
      if (logo) {
        const logoWidth = 10;
        const logoHeight = 10;
        const logoX = pageWidth / 2 - logoWidth / 2;
        doc.addImage(logo, "PNG", logoX, 6, logoWidth, logoHeight);
      }
    }
  } catch {
    /* ignore */
  }

  // Left: Patient details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Patient: ${patient.name || "-"}`, 14, 18);
  let yLeft = 24;
  const patientSub = [
    `${patient.gender || ""} ${patient.age ?  + patient.age : ""}`.trim(),
    patient.abhaNumber ? `ABHA No: ${patient.abhaNumber}` : "",
    patient.abhaAddress ? `ABHA Address: ${patient.abhaAddress}` : "",
  ].filter(Boolean);
  patientSub.forEach((line) => {
    doc.text(` ${line}`, 14, yLeft);
    yLeft += 6;
  });

  // Right: Doctor details
  const rightStartX = pageWidth - 60;
  let yRight = 18;
  doc.setFont("helvetica", "bold");
  doc.text(doctor.name || "Doctor", rightStartX, yRight);
  yRight += 6;
  doc.setFont("helvetica", "normal");
  if (doctor.specialty) {
    doc.text(`${doctor.specialty}`, rightStartX, yRight);
    yRight += 6;
  }
  if (doctor.regNo) {
    doc.text(`Reg No: ${doctor.regNo}`, rightStartX, yRight);
    yRight += 6;
  }

  // Divider line
  doc.setDrawColor(180);
  doc.line(14, 40, pageWidth - 14, 40);

  /* ---------- Section: Vitals ---------- */
  let y = 48;
  const vitals = patient.vitals || {};
  const hasVitals =
    vitals.temperature || vitals.bp || vitals.spo2 || vitals.pulse;
  if (hasVitals) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...teal);
    doc.setFontSize(8);
    doc.text("Vitals", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    const vitalsData = [
      `•Temperature: ${vitals.temperature || "-"}`,
      `•BP: ${vitals.bp || "-"}`,
      `•SpO2: ${vitals.spo2 || "-"}`,
      `•Pulse: ${vitals.pulse || "-"}`,
    ];
    vitalsData.forEach((v, i) => {
      doc.text(v, 20, y + i * 6);
    });
    y += 30;
  }

  /* ---------- Section: Chief Complaints ---------- */
  if (patient.chiefComplaints) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...teal);
    doc.setFontSize(8);
    doc.text("Chief Complaints", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text(`• ${patient.chiefComplaints}`, 20, y, {
      maxWidth: pageWidth - 40,
    });
    y += 10;
  }

  /* ---------- Section: Medicines ---------- */
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...teal);
  doc.setFontSize(8);
  doc.text("Medicines", 14, y);
  y += 6;

  const rows =
    rx.medications?.map((m: Medication) => [
      m.medicine,
      m.frequency,
      m.dosage,
      m.duration,
      m.instructions || "",
    ]) || [];

  autoTable(doc, {
    head: [["Medicine", "Frequency", "Dosage", "Duration", "Instructions"]],
    body: rows.length ? rows : [["—", "—", "—", "—", "—"]],
    startY: y,
    theme: "grid",
    headStyles: {
      fillColor: [100, 100, 100], // grey
      textColor: 255, // white
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 2 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  /* ---------- Section: Investigations ---------- */
  if (patient.investigationAdvice) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...teal);
    doc.setFontSize(8);
    doc.text("Investigations / Advice", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`• ${patient.investigationAdvice}`, 20, y, {
      maxWidth: pageWidth - 40,
    });
    y += 10;
  }

  /* ---------- Section: Follow-up ---------- */
if (patient.followUpText || patient.followUpDate) {
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...teal);
  doc.setFontSize(8);
  doc.text("Follow-up", 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);

  const followLines = [
    patient.followUpText ? `• ${patient.followUpText}` : null,
    patient.followUpDate ? `• Visit on ${patient.followUpDate}` : null,
  ].filter(Boolean);

  followLines.forEach((line, i) => {
    doc.text(line!, 20, y + i * 6, { maxWidth: pageWidth - 40 });
  });

  y += followLines.length * 6 + 6; // space after section
}


  
  /* ---------- Doctor Signature Block ---------- */
doc.setFont("helvetica", "italic");
doc.setFontSize(8);
doc.text("Doctor's Signature", pageWidth - 60, pageHeight - 45);
doc.line(pageWidth - 80, pageHeight - 47, pageWidth - 20, pageHeight - 47);

// Doctor details below signature
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(0, 0, 0);

let sigY = pageHeight - 40;
if (doctor.name) {
  doc.text(doctor.name, pageWidth - 80, sigY);
  sigY += 5;
}
if (doctor.specialty) {
  doc.text(doctor.specialty, pageWidth - 80, sigY);
  sigY += 5;
}
if (doctor.regNo) {
  doc.text(`Reg No: ${doctor.regNo}`, pageWidth - 80, sigY);
}


  /* ---------- Footer ---------- */
  doc.setDrawColor(180);
  doc.line(14, pageHeight - 25, pageWidth - 14, pageHeight - 25);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...teal);
  doc.setFontSize(8);
  doc.text(clinic.name || "Clinic Name", 14, pageHeight - 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  if (clinic.address)
    doc.text(clinic.address, 14, pageHeight - 15, {
      maxWidth: pageWidth - 28,
    });
  if (clinic.phone) doc.text(`Ph: ${clinic.phone}`, 14, pageHeight - 10);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    "Generated by ARAN HMIS – Digital Prescription",
    pageWidth - 100,
    pageHeight - 10
  );

  /* ---------- Save ---------- */
  doc.save(`${patient.name?.replace(/\s+/g, "_") || "Prescription"}.pdf`);
}

/* ---------- Helper ---------- */
async function loadImageAsBase64(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(reader.result ? (reader.result as string) : null);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
