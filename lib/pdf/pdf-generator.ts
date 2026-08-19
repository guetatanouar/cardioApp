import jsPDF from "jspdf";

interface PdfHeader {
  title: string;
  doctorName?: string;
  doctorAddress?: string;
  doctorCity?: string;
  date?: string;
}

interface PdfSection {
  label: string;
  fields: Array<{ key: string; label: string; value: string }>;
}

export function generatePdf(header: PdfHeader, sections: PdfSection[], filename: string) {
  const doc = new jsPDF();
  const pageWidth = 210;
  const margin = 20;

  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text(header.title, pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(0);
  if (header.doctorName) doc.text(header.doctorName, margin, 35);
  if (header.doctorAddress) doc.text(header.doctorAddress, margin, 40);
  if (header.doctorCity) doc.text(header.doctorCity, margin, 45);
  if (header.date) doc.text(header.date, pageWidth - margin, 35, { align: "right" });

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, 50, pageWidth - margin, 50);

  let y = 60;

  for (const section of sections) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246);
    doc.text(section.label, margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(100);
    for (const field of section.fields) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      const display = field.value || "[a remplir]";
      doc.text(`  ${field.label}: ${display}`, margin + 5, y);
      y += 5;
    }
    y += 4;
  }

  doc.save(filename);
}
