import { getAccessToken } from './googleAuth';
import { ClassroomData, Student, Observation, AIReport, DomainGrowthScore } from '../types';
import { DOMAIN_META, MASTERY_LEVEL_CONFIG } from '../data/domainMeta';

export interface WorkspaceExportResult {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  title?: string;
  type: 'sheet' | 'doc';
  error?: string;
}

export interface WorkspaceRecentFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
  modifiedTime: string;
  iconLink?: string;
}

/**
 * Ensures a valid access token is present before calling Google APIs
 */
async function requireAuthToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with your Google account to access Google Workspace.');
  }
  return token;
}

// ==========================================
// GOOGLE SHEETS API INTEGRATION
// ==========================================

/**
 * Creates a comprehensive Google Sheets spreadsheet containing:
 * - Tab 1: Student Roster & Demographics
 * - Tab 2: All Classroom Observation Logs
 * - Tab 3: Domain Mastery Summary Matrix
 */
export async function exportRosterToGoogleSheets(
  classroom: ClassroomData,
  students: Student[],
  observations: Observation[],
  getDomainScores: (studentId: string) => DomainGrowthScore[]
): Promise<WorkspaceExportResult> {
  const token = await requireAuthToken();

  const title = `[SproutTrack] ${classroom.classroomName} - Student Roster & Growth Logs (${classroom.academicYear})`;

  // 1. Create a new Spreadsheet with 3 tabs
  const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        { properties: { sheetId: 0, title: 'Student Roster', gridProperties: { frozenRowCount: 1 } } },
        { properties: { sheetId: 1, title: 'Observation Logs', gridProperties: { frozenRowCount: 1 } } },
        { properties: { sheetId: 2, title: 'Domain Mastery Matrix', gridProperties: { frozenRowCount: 1 } } },
      ],
    }),
  });

  if (!createResp.ok) {
    const errJson = await createResp.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Failed to create Google Sheet (HTTP ${createResp.status})`);
  }

  const sheetData = await createResp.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Roster Rows
  const rosterHeader = [
    'Student ID',
    'First Name',
    'Last Name',
    'Preferred Name',
    'Grade Level',
    'Academic Year',
    'Date of Birth',
    'ELL / Dual Lang',
    'IEP Support',
    'Target Goals',
    'Interests & Passions',
    'Primary Guardian',
    'Guardian Email',
    'Guardian Phone',
    'Guardian Preferred Lang',
    'Total Observations Logged',
  ];

  const rosterRows = students.map((s) => {
    const studentObs = observations.filter((o) => o.studentId === s.id);
    const guardian = s.parentContacts && s.parentContacts[0] ? s.parentContacts[0] : null;

    return [
      s.id,
      s.firstName,
      s.lastName,
      s.preferredName || s.firstName,
      s.gradeLevel,
      s.academicYear,
      s.dateOfBirth || 'N/A',
      s.ellStatus ? 'YES (ELL)' : 'No',
      s.iepSupport ? 'YES (IEP)' : 'No',
      (s.targetGoals || []).join('; '),
      (s.interests || []).join(', '),
      guardian ? `${guardian.name} (${guardian.relationship})` : 'N/A',
      guardian ? guardian.email : 'N/A',
      guardian ? guardian.phone : 'N/A',
      guardian ? guardian.preferredLanguage : 'English',
      studentObs.length,
    ];
  });

  // 3. Prepare Observation Logs Rows
  const obsHeader = [
    'Observation ID',
    'Date',
    'Academic Term',
    'Student Name',
    'Student ID',
    'Developmental Domain',
    'Subcategory / Skill',
    'Mastery Level',
    'Context / Activity',
    'Tags',
    'Strengths Observed',
    'Support / Next Step',
    'Milestone Demonstrated',
    'Raw Teacher Notes',
    'Observer',
  ];

  const studentMap = new Map(students.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));

  const obsRows = observations
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((o) => {
      const studentName = studentMap.get(o.studentId) || o.studentId;
      const domainName = DOMAIN_META[o.domain]?.name || o.domain;
      return [
        o.id,
        o.date,
        o.term,
        studentName,
        o.studentId,
        domainName,
        o.subCategory,
        o.masteryLevel.toUpperCase(),
        o.context,
        (o.tags || []).join(', '),
        o.strengthNote || '',
        o.supportNeed || '',
        o.milestoneMet || '',
        o.rawNotes,
        o.observedBy,
      ];
    });

  // 4. Prepare Domain Mastery Matrix Rows
  const matrixHeader = [
    'Student Name',
    'Grade',
    'Social-Emotional',
    'Language & Literacy',
    'Math & Logic',
    'Cognitive & Science',
    'Physical & Motor',
    'Creative Arts',
    'Overall Average Score (0-100)',
    'Total Observations',
  ];

  const matrixRows = students.map((s) => {
    const scores = getDomainScores(s.id);
    const scoreMap = new Map(scores.map((sc) => [sc.domain, sc.score]));
    const studentObs = observations.filter((o) => o.studentId === s.id);

    const se = scoreMap.get('social_emotional') || 50;
    const ll = scoreMap.get('language_literacy') || 50;
    const ml = scoreMap.get('math_logic') || 50;
    const cs = scoreMap.get('cognitive_science') || 50;
    const pm = scoreMap.get('physical_motor') || 50;
    const ca = scoreMap.get('creative_arts') || 50;
    const avg = Math.round((se + ll + ml + cs + pm + ca) / 6);

    return [
      `${s.firstName} ${s.lastName}`,
      s.gradeLevel,
      `${se}%`,
      `${ll}%`,
      `${ml}%`,
      `${cs}%`,
      `${pm}%`,
      `${ca}%`,
      `${avg}%`,
      studentObs.length,
    ];
  });

  // 5. Populate Data into all sheets via batchUpdate values
  const updateDataResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Student Roster'!A1",
            values: [rosterHeader, ...rosterRows],
          },
          {
            range: "'Observation Logs'!A1",
            values: [obsHeader, ...obsRows],
          },
          {
            range: "'Domain Mastery Matrix'!A1",
            values: [matrixHeader, ...matrixRows],
          },
        ],
      }),
    }
  );

  if (!updateDataResp.ok) {
    const errJson = await updateDataResp.json().catch(() => ({}));
    console.error('Failed to populate Google Sheets data:', errJson);
  }

  // 6. Style Headers & Grid with emerald theme
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Style Header for Sheet 0 (Roster)
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.72, blue: 0.50 }, // Emerald #10B981
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Style Header for Sheet 1 (Observation Logs)
          {
            repeatCell: {
              range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.72, blue: 0.50 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Style Header for Sheet 2 (Matrix)
          {
            repeatCell: {
              range: { sheetId: 2, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.72, blue: 0.50 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      }),
    });
  } catch (e) {
    console.warn('Non-fatal error styling sheet headers:', e);
  }

  return {
    success: true,
    fileId: spreadsheetId,
    fileUrl: spreadsheetUrl,
    title,
    type: 'sheet',
  };
}

/**
 * Exports just the Observation Logs to a dedicated Google Sheet
 */
export async function exportObservationsToGoogleSheets(
  classroom: ClassroomData,
  observations: Observation[],
  students: Student[]
): Promise<WorkspaceExportResult> {
  const token = await requireAuthToken();
  const title = `[SproutTrack] Observation Logbook - ${classroom.classroomName} (${new Date().toLocaleDateString()})`;

  const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { sheetId: 0, title: 'All Observations', gridProperties: { frozenRowCount: 1 } } }],
    }),
  });

  if (!createResp.ok) {
    const err = await createResp.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Sheet for Observations');
  }

  const { spreadsheetId } = await createResp.json();
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const studentMap = new Map(students.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));

  const headers = [
    'Date',
    'Term',
    'Student Name',
    'Domain',
    'Skill Area',
    'Mastery Level',
    'Activity Context',
    'Observed Strengths',
    'Next Steps / Support Needs',
    'Milestone Met',
    'Teacher Observation Notes',
  ];

  const rows = observations.map((o) => [
    o.date,
    o.term,
    studentMap.get(o.studentId) || o.studentId,
    DOMAIN_META[o.domain]?.name || o.domain,
    o.subCategory,
    o.masteryLevel.toUpperCase(),
    o.context,
    o.strengthNote || '',
    o.supportNeed || '',
    o.milestoneMet || '',
    o.rawNotes,
  ]);

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'All Observations'!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [headers, ...rows] }),
  });

  // Apply header color
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.72, blue: 0.50 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      }),
    });
  } catch (e) {
    // ignore styling errors
  }

  return {
    success: true,
    fileId: spreadsheetId,
    fileUrl: spreadsheetUrl,
    title,
    type: 'sheet',
  };
}

// ==========================================
// GOOGLE DOCS API INTEGRATION
// ==========================================

/**
 * Creates a structured Google Doc containing a full Student Developmental Report
 */
export async function exportReportToGoogleDocs(
  student: Student,
  report: AIReport,
  classroom: ClassroomData
): Promise<WorkspaceExportResult> {
  const token = await requireAuthToken();

  const title = `[SproutTrack] Progress Report - ${student.firstName} ${student.lastName} (${report.term})`;

  // 1. Create empty document
  const createResp = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createResp.ok) {
    const err = await createResp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Doc (HTTP ${createResp.status})`);
  }

  const doc = await createResp.json();
  const documentId = doc.documentId;
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // 2. Build structured text payload
  const lines: string[] = [];
  lines.push(`STUDENT DEVELOPMENTAL PROGRESS REPORT`);
  lines.push(`Learner: ${student.firstName} ${student.lastName} (${student.preferredName || student.firstName})`);
  lines.push(`Classroom: ${classroom.classroomName} • Grade: ${student.gradeLevel} • Academic Year: ${student.academicYear}`);
  lines.push(`Lead Educator: ${classroom.leadTeacher} • Target Term: ${report.term}`);
  lines.push(`Date of Report: ${new Date(report.generatedAt).toLocaleDateString()}`);
  lines.push(`--------------------------------------------------------------------------------\n`);

  lines.push(`1. EXECUTIVE DEVELOPMENTAL SUMMARY`);
  lines.push(`${report.executiveSummary}\n`);

  if (report.growthVelocitySummary) {
    lines.push(`GROWTH TRAJECTORY & VELOCITY`);
    lines.push(`${report.growthVelocitySummary}\n`);
  }

  lines.push(`2. CORE DEVELOPMENTAL DOMAIN HIGHLIGHTS`);
  report.domainHighlights.forEach((dh) => {
    lines.push(`\n[${dh.domainName.toUpperCase()}]`);
    lines.push(`Summary: ${dh.summary}`);
    if (dh.strengths && dh.strengths.length > 0) {
      lines.push(`Key Strengths:`);
      dh.strengths.forEach((st) => lines.push(`  • ${st}`));
    }
    if (dh.nextSteps && dh.nextSteps.length > 0) {
      lines.push(`Next Steps & Growth Focus:`);
      dh.nextSteps.forEach((ns) => lines.push(`  • ${ns}`));
    }
  });

  lines.push(`\n3. CLASSROOM SOCIAL DYNAMICS & COMMUNITY PARTICIPATION`);
  lines.push(`${report.classroomSocialDynamic}\n`);

  if (report.recommendationsForHome && report.recommendationsForHome.length > 0) {
    lines.push(`4. RECOMMENDED STRATEGIES FOR HOME`);
    report.recommendationsForHome.forEach((rec, idx) => {
      lines.push(`  ${idx + 1}. ${rec}`);
    });
    lines.push(``);
  }

  if (report.recommendedClassroomScaffolds && report.recommendedClassroomScaffolds.length > 0) {
    lines.push(`5. CLASSROOM SCAFFOLDS & INSTRUCTIONAL ADAPTATIONS`);
    report.recommendedClassroomScaffolds.forEach((scaff, idx) => {
      lines.push(`  ${idx + 1}. ${scaff}`);
    });
    lines.push(``);
  }

  lines.push(`6. EDUCATOR'S REFLECTION & CLOSING THOUGHTS`);
  lines.push(`${report.teacherReflection}\n`);

  lines.push(`--------------------------------------------------------------------------------`);
  lines.push(`Generated via SproutTrack Classroom Intelligence & ${report.generatedByModel}`);

  const fullText = lines.join('\n');

  // 3. Insert text into the document
  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: fullText,
          },
        },
      ],
    }),
  });

  return {
    success: true,
    fileId: documentId,
    fileUrl: documentUrl,
    title,
    type: 'doc',
  };
}

/**
 * Creates a Parent Conference Preparation Brief in Google Docs
 */
export async function exportConferencePrepToGoogleDocs(
  student: Student,
  observations: Observation[],
  domainScores: DomainGrowthScore[],
  classroom: ClassroomData
): Promise<WorkspaceExportResult> {
  const token = await requireAuthToken();
  const title = `[SproutTrack] Parent Conference Prep - ${student.firstName} ${student.lastName}`;

  const createResp = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createResp.ok) {
    const err = await createResp.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Doc for Conference Prep');
  }

  const { documentId } = await createResp.json();
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  const guardian = student.parentContacts && student.parentContacts[0] ? student.parentContacts[0] : null;

  const lines: string[] = [
    `PARENT-TEACHER CONFERENCE PREPARATION BRIEF`,
    `Student: ${student.firstName} ${student.lastName} | Grade: ${student.gradeLevel}`,
    `Educator: ${classroom.leadTeacher} | Classroom: ${classroom.classroomName}`,
    `Parent / Guardian: ${guardian ? `${guardian.name} (${guardian.email} | ${guardian.phone})` : 'Not recorded'}`,
    `--------------------------------------------------------------------------------\n`,
    `CONFERENCE TALKING POINTS & CELEBRATIONS:`,
    `• Welcome and celebrate ${student.firstName}'s transition into ${student.gradeLevel}.`,
    `• Highlight high student passions: ${(student.interests || []).join(', ') || 'Classroom discovery'}.`,
    `• Review progress on targeted student goals: ${(student.targetGoals || []).join('; ') || 'General grade expectations'}.\n`,
    `DEVELOPMENTAL DOMAIN SCORES OVERVIEW:`,
  ];

  domainScores.forEach((ds) => {
    lines.push(`• ${ds.domainName}: ${ds.score}% (${ds.level.toUpperCase()}) - ${ds.trend.toUpperCase()}`);
    ds.keyHighlights.forEach((kh) => lines.push(`    - ${kh}`));
  });

  lines.push(`\nRECENT OBSERVATIONAL EVIDENCE (${observations.length} logs):`);
  observations.slice(0, 5).forEach((o, i) => {
    lines.push(`[${i + 1}] Date: ${o.date} | Domain: ${DOMAIN_META[o.domain]?.name || o.domain} | Level: ${o.masteryLevel}`);
    lines.push(`    Note: "${o.rawNotes}"`);
    if (o.strengthNote) lines.push(`    Strength: "${o.strengthNote}"`);
  });

  lines.push(`\nQUESTIONS / PARTNERSHIP PROMPTS FOR PARENTS:`);
  lines.push(`1. What routines or activities are currently exciting ${student.firstName} at home?`);
  lines.push(`2. Are there any particular areas where you feel ${student.firstName} needs extra encouragement?`);
  lines.push(`3. Shared goal for next academic term: [_______________________________________]`);

  const fullText = lines.join('\n');

  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: fullText,
          },
        },
      ],
    }),
  });

  return {
    success: true,
    fileId: documentId,
    fileUrl: documentUrl,
    title,
    type: 'doc',
  };
}

// ==========================================
// GOOGLE DRIVE API INTEGRATION
// ==========================================

/**
 * Queries Google Drive for recently generated SproutTrack exports
 */
export async function listWorkspaceExports(): Promise<WorkspaceRecentFile[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const query = encodeURIComponent("name contains '[SproutTrack]' and trashed = false");
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime,iconLink)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!resp.ok) return [];
    const data = await resp.json();
    return data.files || [];
  } catch (err) {
    console.error('Failed to list Google Drive files:', err);
    return [];
  }
}
