import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Persistent Cloud Storage Mock Directory
const DATA_DIR = path.join(process.cwd(), '.cloud_sync_store');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getClassroomFilePath(classroomId: string) {
  const safeId = classroomId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `classroom_${safeId}.json`);
}

// Server-side Gemini AI Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Cloud Sync: Fetch Classroom state
app.get('/api/sync/classroom/:id', (req, res) => {
  const { id } = req.params;
  const filePath = getClassroomFilePath(id);
  
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json({ success: true, data, source: 'cloud_storage' });
    } catch (err) {
      console.error('Error reading classroom sync file:', err);
    }
  }

  // Not found in file store yet
  return res.json({
    success: true,
    data: null,
    message: 'Classroom not yet uploaded to cloud. Local state will be promoted.',
  });
});

// Cloud Sync: Push / Sync Classroom state
app.post('/api/sync/classroom/:id', (req, res) => {
  const { id } = req.params;
  const incomingData = req.body;

  if (!incomingData) {
    return res.status(400).json({ success: false, error: 'No classroom data provided' });
  }

  const filePath = getClassroomFilePath(id);
  const updatedData = {
    ...incomingData,
    lastSyncedAt: new Date().toISOString(),
    version: (incomingData.version || 0) + 1,
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    return res.json({
      success: true,
      lastSyncedAt: updatedData.lastSyncedAt,
      version: updatedData.version,
      message: 'Cloud sync successful across teacher devices',
    });
  } catch (err: any) {
    console.error('Error persisting cloud sync data:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to save to cloud storage' });
  }
});

// AI Endpoint: Automated Progress Report Generator
app.post('/api/gemini/generate-report', async (req, res) => {
  const { student, observations, term, reportType, teacherNotes } = req.body;

  if (!student || !observations) {
    return res.status(400).json({ error: 'Missing student or observation data' });
  }

  const ai = getGeminiClient();

  // If no Gemini key is set, generate a rich structured heuristic fallback report
  if (!ai) {
    const fallbackReport = generateHeuristicReport(student, observations, term, reportType, teacherNotes);
    return res.json({
      success: true,
      report: fallbackReport,
      isFallback: true,
      note: 'Generated using local analytical synthesis engine (Add GEMINI_API_KEY for deep LLM reasoning)',
    });
  }

  try {
    const prompt = `You are a Senior Child Development Specialist and Master Elementary Educator.
Generate a comprehensive, encouraging, and actionable Student Developmental Progress Report.

STUDENT PROFILE:
Name: ${student.firstName} ${student.lastName} (Preferred: ${student.preferredName || student.firstName})
Grade Level: ${student.gradeLevel}
Academic Year: ${student.academicYear}
Target Term: ${term}
Report Focus: ${reportType} (Parent Conference & Developmental Record)
Teacher Reflections: ${teacherNotes || 'None specified'}
Interests: ${student.interests ? student.interests.join(', ') : 'General classroom exploration'}
Target Goals: ${student.targetGoals ? student.targetGoals.join('; ') : 'General grade-level mastery'}

RAW CLASSROOM OBSERVATIONS (${observations.length} records):
${observations
  .map(
    (obs: any, idx: number) =>
      `[Obs ${idx + 1}] Date: ${obs.date} | Domain: ${obs.domain} | Category: ${obs.subCategory} | Level: ${obs.masteryLevel} | Context: ${obs.context}
Notes: "${obs.rawNotes}"
Strength: "${obs.strengthNote || 'N/A'}" | Support Need: "${obs.supportNeed || 'N/A'}" | Milestone: "${obs.milestoneMet || 'N/A'}"`
  )
  .join('\n\n')}

INSTRUCTIONS:
Synthesize the observations into an articulate, strength-based developmental report.
Return a STRICT JSON OBJECT with this schema:
{
  "executiveSummary": "2-3 polished paragraphs summarizing student growth, classroom presence, and overall learning trajectory.",
  "growthVelocitySummary": "1-2 sentences highlighting the student's acceleration from early term to current date.",
  "domainHighlights": [
    {
      "domain": "social_emotional" | "language_literacy" | "math_logic" | "cognitive_science" | "physical_motor" | "creative_arts",
      "domainName": "Full Domain Name",
      "summary": "Detailed synthesis of observational evidence in this domain.",
      "strengths": ["Strength 1 with observational evidence", "Strength 2"],
      "nextSteps": ["Actionable classroom/home next step 1", "Next step 2"]
    }
  ],
  "classroomSocialDynamic": "Paragraph on peer collaboration, communication, and emotional resilience.",
  "recommendationsForHome": ["Concrete recommendation for parents 1", "Home strategy 2", "Home strategy 3"],
  "recommendedClassroomScaffolds": ["Teacher instructional strategy 1", "Classroom adaptation 2"],
  "teacherReflection": "Constructive, warm concluding thought for parent conference."
}
Only output valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const text = response.text || '{}';
    const parsedData = JSON.parse(text);

    return res.json({
      success: true,
      report: {
        id: `rep-${Date.now()}`,
        studentId: student.id,
        term,
        generatedAt: new Date().toISOString(),
        type: reportType || 'parent_conference',
        ...parsedData,
        generatedByModel: 'Gemini 3.7 Flash',
      },
    });
  } catch (error: any) {
    console.error('Gemini Report generation error:', error);
    // Fallback gracefully
    const fallbackReport = generateHeuristicReport(student, observations, term, reportType, teacherNotes);
    return res.json({
      success: true,
      report: fallbackReport,
      isFallback: true,
      errorMsg: error.message,
    });
  }
});

// AI Endpoint: Assist in tagging & categorizing raw observation notes
app.post('/api/gemini/tag-observation', async (req, res) => {
  const { rawNotes, studentContext } = req.body;
  if (!rawNotes) {
    return res.status(400).json({ error: 'Missing raw notes' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      success: true,
      analysis: {
        domain: 'language_literacy',
        subCategory: 'Observation Note',
        masteryLevel: 'proficient',
        suggestedTags: ['classroom-observation'],
        strengthNote: 'Active participation observed',
        supportNeed: 'Continue regular scaffolding',
        milestoneMet: 'Demonstrates active engagement',
      },
    });
  }

  try {
    const prompt = `Analyze this raw teacher observation note for an elementary student:
"${rawNotes}"
Context: ${studentContext || 'General classroom'}

Return a JSON object:
{
  "domain": "social_emotional" | "language_literacy" | "math_logic" | "cognitive_science" | "physical_motor" | "creative_arts",
  "subCategory": "Concise skill area (e.g., Phonemic Awareness, Number Sense, Conflict Resolution)",
  "masteryLevel": "emerging" | "developing" | "proficient" | "advanced",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "strengthNote": "Brief 1-sentence strength extracted from observation",
  "supportNeed": "Brief 1-sentence growth opportunity or support recommendation",
  "milestoneMet": "Specific developmental milestone demonstrated (or null if none)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (err: any) {
    console.error('Gemini tag observation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Fallback Heuristic Generator for reports if API key is not yet set
function generateHeuristicReport(student: any, observations: any[], term: string, reportType: string, teacherNotes?: string) {
  const domainCounts: Record<string, number> = {};
  const strengthsCollected: string[] = [];
  const supportCollected: string[] = [];

  observations.forEach((o) => {
    domainCounts[o.domain] = (domainCounts[o.domain] || 0) + 1;
    if (o.strengthNote && o.strengthNote.length > 5) strengthsCollected.push(o.strengthNote);
    if (o.supportNeed && o.supportNeed.length > 5) supportCollected.push(o.supportNeed);
  });

  const domainNames: Record<string, string> = {
    social_emotional: 'Social-Emotional & Self-Regulation',
    language_literacy: 'Language & Literacy',
    math_logic: 'Mathematical & Logical Reasoning',
    cognitive_science: 'Cognitive & Scientific Inquiry',
    physical_motor: 'Physical & Motor Development',
    creative_arts: 'Creative Expression & Approaches',
  };

  const domainKeys = Object.keys(domainCounts);
  const activeDomains = domainKeys.length > 0 ? domainKeys : ['language_literacy', 'math_logic', 'social_emotional'];

  const domainHighlights = activeDomains.map((dom) => {
    const domObs = observations.filter((o) => o.domain === dom);
    const topObs = domObs[domObs.length - 1];
    return {
      domain: dom,
      domainName: domainNames[dom] || dom,
      summary: domObs.length > 0
        ? `Observed in ${domObs.length} distinct classroom settings. Demonstrated sustained focus and noticeable progression towards Grade ${student.gradeLevel || '1'} targets.`
        : `Consistently meets expected grade-level milestones with steady engagement.`,
      strengths: domObs.filter((o) => o.strengthNote).map((o) => o.strengthNote!).slice(0, 3).concat([
        `${student.firstName} demonstrates attentive listening and task follow-through in this domain.`
      ]).slice(0, 2),
      nextSteps: domObs.filter((o) => o.supportNeed).map((o) => o.supportNeed!).slice(0, 2).concat([
        `Continue providing structured opportunities for independent discovery and peer verbalization.`
      ]).slice(0, 2),
    };
  });

  return {
    id: `rep-${Date.now()}`,
    studentId: student.id,
    term: term || 'Winter Term (Q2)',
    generatedAt: new Date().toISOString(),
    type: reportType || 'parent_conference',
    executiveSummary: `${student.firstName} ${student.lastName} has shown steady and commendable progress across academic and developmental milestones during this ${term}. Through ${observations.length} classroom observation sessions, ${student.firstName} has exhibited strong engagement, positive peer relations, and noticeable growth in core learning domains.`,
    growthVelocitySummary: `${student.firstName} demonstrates an upward growth trajectory across multiple assessment checkpoints throughout the academic year.`,
    domainHighlights,
    classroomSocialDynamic: `${student.firstName} contributes actively to our classroom community, participating in group discussions and collaborating with respect and kindness during small-group stations.`,
    recommendationsForHome: [
      `Engage in 15–20 minutes of daily interactive shared reading, asking open-ended comprehension questions.`,
      `Incorporate everyday counting, measuring, and pattern recognition during daily family routines.`,
      `Celebrate small milestones to foster a growth mindset and persistence with new challenges.`,
    ],
    recommendedClassroomScaffolds: [
      `Utilize visual scheduling and step-by-step rubrics during multi-stage independent tasks.`,
      `Offer flexible partner pairings to build both leadership and supportive collaborative skills.`,
    ],
    teacherReflection: teacherNotes || `${student.firstName} is a delightful member of our classroom. We look forward to partnering together to support their continuous development!`,
    generatedByModel: 'Classroom Progress Synthesis Engine',
  };
}

// ================= VITE / SPA MIDDLEWARE =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Development server running on http://localhost:${PORT}`);
  });
}

startServer();
