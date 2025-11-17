import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Row = Record<string, any>;

export const exportToCsv = (rows: Row[], filename: string) => {
  const csv = Papa.unparse(rows || []);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
};

export const exportToXlsx = (sheets: { name: string; rows: Row[] }[], filename: string) => {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows || []);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31) || 'Sheet');
  });
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  link.click();
};

export const exportToPdf = (title: string, columns: string[], rows: Row[], filename: string) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  const tableBody = (rows || []).map((r) => columns.map((c) => String(r[c] ?? '')));
  autoTable(doc, {
    startY: 60,
    head: [columns],
    body: tableBody,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [33, 150, 83] },
    theme: 'striped'
  });
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};

export const pickColumns = (rows: Row[], keys: string[]): Row[] => {
  return (rows || []).map((r) => keys.reduce((acc: Row, k) => { acc[k] = r[k]; return acc; }, {}));
};
