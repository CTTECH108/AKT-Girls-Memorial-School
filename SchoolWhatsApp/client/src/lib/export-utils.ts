import { Student } from "@shared/schema";

export async function exportToExcel(students: Student[], filename: string = "students") {
  // Dynamically import xlsx to avoid bundle size issues
  const XLSX = await import('xlsx');
  
  const data = students.map((student, index) => ({
    'S.No': index + 1,
    'Student Name': student.name,
    'Grade': student.grade,
    'Phone Number': student.phone,
    'Student ID': student.studentId,
    'Notes': student.notes || '',
    'Added Date': new Date(student.createdAt).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  // Auto-size columns
  const wscols = [
    { wch: 8 },   // S.No
    { wch: 25 },  // Student Name
    { wch: 10 },  // Grade
    { wch: 18 },  // Phone Number
    { wch: 15 },  // Student ID
    { wch: 30 },  // Notes
    { wch: 15 },  // Added Date
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export async function exportToPDF(students: Student[], title: string = "Student Database") {
  // Dynamically import jsPDF to avoid bundle size issues
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 20);

  // Add metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  doc.text(`Total Students: ${students.length}`, 20, 35);

  // Prepare table data
  const tableData = students.map((student, index) => [
    index + 1,
    student.name,
    `Grade ${student.grade}`,
    student.phone,
    student.studentId,
    new Date(student.createdAt).toLocaleDateString(),
  ]);

  // Add table
  autoTable(doc, {
    head: [['S.No', 'Student Name', 'Grade', 'Phone Number', 'Student ID', 'Added Date']],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 45, right: 20, bottom: 30, left: 20 },
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}
