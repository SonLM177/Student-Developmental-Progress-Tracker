import { Student, Observation, AIReport, ClassroomData, AcademicTerm } from '../types';

export async function fetchServerHealth() {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (err) {
    return { status: 'offline', hasGeminiKey: false };
  }
}

export async function syncClassroomFromCloud(classroomId: string): Promise<ClassroomData | null> {
  try {
    const res = await fetch(`/api/sync/classroom/${encodeURIComponent(classroomId)}`);
    if (!res.ok) throw new Error(`Sync fetch failed: ${res.statusText}`);
    const data = await res.json();
    return data.data || null;
  } catch (err) {
    console.warn('Cloud sync read warning:', err);
    return null;
  }
}

export async function pushClassroomToCloud(classroom: ClassroomData): Promise<{ success: boolean; lastSyncedAt?: string; error?: string }> {
  try {
    const res = await fetch(`/api/sync/classroom/${encodeURIComponent(classroom.classroomId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classroom),
    });
    if (!res.ok) throw new Error(`Sync push failed: ${res.statusText}`);
    return await res.json();
  } catch (err: any) {
    console.error('Cloud sync push failed:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function generateAIReport(params: {
  student: Student;
  observations: Observation[];
  term: AcademicTerm;
  reportType: string;
  teacherNotes?: string;
}): Promise<{ success: boolean; report: AIReport; isFallback?: boolean; note?: string }> {
  const res = await fetch('/api/gemini/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate report: ${res.statusText}`);
  }

  return await res.json();
}

export async function analyzeObservationNotes(rawNotes: string, studentContext?: string) {
  const res = await fetch('/api/gemini/tag-observation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawNotes, studentContext }),
  });

  if (!res.ok) {
    throw new Error(`Failed to analyze note: ${res.statusText}`);
  }

  return await res.json();
}
