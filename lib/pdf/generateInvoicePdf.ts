import { colors } from "@mui/material";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/**
 * Production-ready, aligned invoice PDF generator.
 * Fixes:
 *  1. Removes stray superscript “1” (font fallback bug)
 *  2. Prevents overflow in Price / Total cells
 *  3. Summary block aligns exactly with table right edge
 */
export function generateInvoicePdf({
  invoiceId,
  patientName,
  date,
  items,
  gst,
  discount,
  total,
}: {
  invoiceId: string;
  patientName: string;
  date: string;
  items: { service: string; qty: number; price: number }[];
  gst: number;
  discount: number;
  total: number;
}) {
  const doc = new jsPDF({ compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();

  /* ---------------- Header ---------------- */
  const logoUrl = "/whitelogo.png";
  const clinicName = "Sushila Mathrutva Clinic";
  const clinicTag = "A Multispeciality Clinic – Gynecology & General Medicine";

  try {
    doc.addImage(logoUrl, "PNG", 15, 10, 18, 18);
  } catch {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(clinicName, pageWidth / 2, 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(clinicTag, pageWidth / 2, 24, { align: "center" });

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(14, 30, pageWidth - 14, 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("INVOICE", pageWidth / 2, 38, { align: "center" });

  /* ---------------- Invoice + Patient Info ---------------- */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice ID: ${invoiceId}`, 14, 48);
  doc.text(`Date: ${date}`, pageWidth - 14, 48, { align: "right" });
  doc.text(`Patient: ${patientName}`, 14, 56);
  doc.text("Phone: 98765 43210", 14, 62);
  doc.text("Address: JP Nagar, Bengaluru", 14, 68);

  /* ---------------- Table ---------------- */
  const tableBody: RowInput[] = items.map((it, idx) => [
    idx + 1,
    it.service || "-",
    it.qty.toString(),
    `${it.price.toFixed(2)}`,
    `${(it.qty * it.price).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 75,
    head: [["#", "Service", "Qty", "Price (Rs)", "Total (Rs)"]],
    body: tableBody,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      lineColor: [220, 220, 220],
      textColor: [30, 30, 30],
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      overflow: "ellipsize", // prevent overflow
      halign: "left",
      valign: "middle",
    },
    headStyles: {
      fillColor: [242, 242, 242],
      textColor: [0, 0, 0],
      halign: "left",
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "left" },
      1: { cellWidth: 90, halign: "left" },
      2: { cellWidth: 15, halign: "left" },
      3: { cellWidth: 30, halign: "left" },
      4: { cellWidth: 38, halign: "left" },
    },
    margin: { left: 14, right: 14 },
    tableLineWidth: 0.1,
  });
  const highlightBlue = [23, 99, 191]; // rgb(23,99,191)
  const tableEndY = (doc as any).lastAutoTable.finalY;

  /* ---------------- Summary (aligned with table) ---------------- */
  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const gstAmount = (subtotal * gst) / 100;
  const rightEdge = pageWidth - 14; // same as table margin
  let y = tableEndY + 8;

  const drawRow = (
    label: string,
    value: string,
    bold = false,
    colors = false
  ) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setDrawColor(colors ? "blue" : "gray");
    doc.text(label, rightEdge - 60, y);
    doc.text(value, rightEdge, y, { align: "right" });
    y += 6;
  };

  doc.setFontSize(10);
  drawRow("Subtotal:", `Rs ${subtotal.toFixed(2)}`);
  drawRow(`GST (${gst}%):`, `Rs ${gstAmount.toFixed(2)}`);
  drawRow("Discount:", `Rs ${discount.toFixed(2)}`);

  // --- Blue total line ---
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 54, 102);
  doc.text("Total Amount:", rightEdge - 60, y);
  doc.text(`Rs. ${total.toFixed(2)}`, rightEdge, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
 

  /* ---------------- Footer ---------------- */
  const footerTop = y + 10;
  doc.setDrawColor(200);
  doc.line(14, footerTop, rightEdge, footerTop);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  const footerLines = [
    "Sushila Mathrutva Clinic • JP Nagar, Bengaluru",
    "Phone: 09742000134 • Email: info@sushilaclinic.in",
    "Thank you for visiting! Please retain this invoice for your records.",
  ];
  footerLines.forEach((line, i) => {
    doc.text(line, pageWidth / 2, footerTop + 6 + i * 5, { align: "center" });
  });

  /* ---------------- Print ---------------- */
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}
