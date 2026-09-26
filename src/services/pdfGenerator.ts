import jsPDF from 'jspdf';
import { Student, AIReport, Observation, ClassroomData } from '../types';
import { DOMAIN_META, MASTERY_LEVEL_CONFIG } from '../data/domainMeta';

export function exportParentConferencePDF(
  student: Student,
  report: AIReport,
  observations: Observation[],
  classroom: ClassroomData
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header Banner
  doc.setFillColor(30, 58, 138); // Deep Navy (Slate-900 / Indigo-900)
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('STUDENT DEVELOPMENTAL PROGRESS SUMMARY', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `${classroom.classroomName} • Academic Year: ${classroom.academicYear} • Term: ${report.term}`,
    margin + 6,
    y + 16
  );

  y += 28;

  // Student Info Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Student: ${student.firstName} ${student.lastName} ${student.preferredName ? `("${student.preferredName}")` : ''}`, margin + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Grade Level: ${student.gradeLevel}`, margin + 6, y + 14);
  doc.text(`Lead Teacher: ${classroom.leadTeacher}`, margin + 65, y + 14);
  doc.text(`Report Date: ${new Date(report.generatedAt).toLocaleDateString()}`, margin + 130, y + 14);

  y += 28;

  // Section: Executive Summary
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. EXECUTIVE DEVELOPMENTAL SUMMARY', margin, y);
  y += 5;

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  const execLines = doc.splitTextToSize(report.executiveSummary, contentWidth);
  doc.text(execLines, margin, y);
  y += execLines.length * 4.5 + 4;

  // Section: Growth Velocity
  if (report.growthVelocitySummary) {
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
    doc.setTextColor(2, 132, 199);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Academic Year Growth Trajectory:', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const velLines = doc.splitTextToSize(report.growthVelocitySummary, contentWidth - 8);
    doc.text(velLines, margin + 4, y + 9);
    y += 16;
  }

  // Section: Key Developmental Domain Highlights
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. DOMAIN PROGRESS & CLASSROOM EVIDENCE', margin, y);
  y += 6;

  report.domainHighlights.forEach((dh) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    const meta = DOMAIN_META[dh.domain] || {
      name: dh.domainName,
      color: '#0284c7',
    };

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    
    // Calculate box height dynamically
    const summaryLines = doc.splitTextToSize(dh.summary, contentWidth - 10);
    const boxHeight = 16 + summaryLines.length * 4.2 + (dh.strengths?.length || 0) * 4.2 + (dh.nextSteps?.length || 0) * 4.2;

    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    // Color indicator left bar
    doc.setFillColor(meta.color);
    doc.roundedRect(margin, y, 3.5, boxHeight, 1, 1, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(dh.domainName, margin + 8, y + 6);

    let innerY = y + 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(summaryLines, margin + 8, innerY);
    innerY += summaryLines.length * 4.2 + 1;

    if (dh.strengths && dh.strengths.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text('Key Strengths: ', margin + 8, innerY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const strText = dh.strengths.join(' • ');
      const strLines = doc.splitTextToSize(strText, contentWidth - 35);
      doc.text(strLines, margin + 30, innerY);
      innerY += strLines.length * 4.2;
    }

    if (dh.nextSteps && dh.nextSteps.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6); // Amber
      doc.text('Focus / Next Step: ', margin + 8, innerY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const stepText = dh.nextSteps.join(' • ');
      const stepLines = doc.splitTextToSize(stepText, contentWidth - 38);
      doc.text(stepLines, margin + 35, innerY);
      innerY += stepLines.length * 4.2;
    }

    y += boxHeight + 4;
  });

  // Page 2 Check for Next Steps & Signatures
  if (y > 210) {
    doc.addPage();
    y = 20;
  }

  // Section 3: Recommendations for Home
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. ACTIONABLE STRATEGIES FOR HOME & FAMILY SUPPORT', margin, y);
  y += 6;

  report.recommendationsForHome.forEach((rec, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text(`${idx + 1}.`, margin + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    const recLines = doc.splitTextToSize(rec, contentWidth - 10);
    doc.text(recLines, margin + 8, y);
    y += recLines.length * 4.2 + 2;
  });

  y += 4;

  // Section 4: Conference Notes & Signatures
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Parent-Teacher Conference Acknowledgement & Signatures', margin + 6, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('We have reviewed the developmental observations, growth trajectories, and collaborative goals for this period.', margin + 6, y + 12);

  // Signature lines
  const sigY = y + 26;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 6, sigY, margin + 70, sigY);
  doc.text("Teacher's Signature & Date", margin + 6, sigY + 5);

  doc.line(margin + 90, sigY, margin + 160, sigY);
  doc.text("Parent / Guardian Signature & Date", margin + 90, sigY + 5);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Confidential Student Progress Record • Page ${i} of ${totalPages} • Generated via Student Developmental Progress Tracker`,
      margin,
      290
    );
  }

  const cleanName = `${student.firstName}_${student.lastName}_Progress_Summary_${report.term.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(cleanName);
}
