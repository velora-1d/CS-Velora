import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Data format for export
 */
export interface ExportData {
  filename: string;
  columns: string[];
  rows: any[][];
  title?: string;
}

/**
 * Clean data for export (remove nulls, format objects)
 */
const prepareData = (data: ExportData) => {
  return data.rows.map(row => 
    row.map(val => {
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return val;
    })
  );
};

/**
 * Export to CSV
 */
export const exportToCSV = (data: ExportData) => {
  const { filename, columns, rows } = data;
  const processedRows = prepareData(data);
  
  const csvContent = [
    columns.join(","),
    ...processedRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export to Excel
 */
export const exportToExcel = (data: ExportData) => {
  const { filename, columns, rows } = data;
  const processedRows = prepareData(data);
  
  const worksheet = XLSX.utils.aoa_to_sheet([columns, ...processedRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export to PDF
 */
export const exportToPDF = (data: ExportData) => {
  const { filename, columns, rows, title } = data;
  const doc = new jsPDF() as any;
  const processedRows = prepareData(data);

  if (title) {
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString("id-ID")}`, 14, 30);
  }

  doc.autoTable({
    head: [columns],
    body: processedRows,
    startY: title ? 35 : 10,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }, // #3B82F6
  });

  doc.save(`${filename}.pdf`);
};
