/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClassroomProvider, useClassroom } from './context/ClassroomContext';
import { Navbar } from './components/Navbar';
import { StudentList } from './components/StudentList';
import { StudentProfile } from './components/StudentProfile';
import { GrowthCharts } from './components/GrowthCharts';
import { AutomatedReportGenerator } from './components/AutomatedReportGenerator';
import { ParentConferenceSummary } from './components/ParentConferenceSummary';
import { ClassAnalytics } from './components/ClassAnalytics';
import { ObservationModal } from './components/ObservationModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { NewStudentModal } from './components/NewStudentModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { Observation } from './types';

function MainAppContent() {
  const { activeView, setActiveView } = useClassroom();

  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [observationTargetStudentId, setObservationTargetStudentId] = useState<string | undefined>(undefined);
  const [editObservation, setEditObservation] = useState<Observation | null>(null);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [workspaceDefaultAction, setWorkspaceDefaultAction] = useState<any>(undefined);
  const [workspaceTargetStudentId, setWorkspaceTargetStudentId] = useState<string | undefined>(undefined);

  const handleOpenObservationModal = (studentId?: string, editObs?: Observation) => {
    setObservationTargetStudentId(studentId);
    setEditObservation(editObs || null);
    setIsObservationModalOpen(true);
  };

  const handleOpenWorkspaceModal = (action?: string, studentId?: string) => {
    setWorkspaceDefaultAction(action as any);
    setWorkspaceTargetStudentId(studentId);
    setIsWorkspaceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation Bar */}
      <Navbar
        onOpenObservationModal={() => handleOpenObservationModal()}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenNewStudentModal={() => setIsNewStudentModalOpen(true)}
        onOpenWorkspaceModal={() => handleOpenWorkspaceModal()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'roster' && (
          <StudentList
            onOpenObservationModal={handleOpenObservationModal}
            onOpenNewStudentModal={() => setIsNewStudentModalOpen(true)}
            onOpenWorkspaceModal={() => handleOpenWorkspaceModal('roster_sheets')}
          />
        )}

        {activeView === 'student-detail' && (
          <StudentProfile
            onOpenObservationModal={handleOpenObservationModal}
            onNavigateToAIReports={() => setActiveView('ai-reports')}
            onNavigateToParentPDF={() => setActiveView('parent-summary')}
            onOpenWorkspaceModal={handleOpenWorkspaceModal}
          />
        )}

        {activeView === 'growth-charts' && <GrowthCharts />}

        {activeView === 'ai-reports' && (
          <AutomatedReportGenerator
            onOpenWorkspaceModal={handleOpenWorkspaceModal}
          />
        )}

        {activeView === 'parent-summary' && (
          <ParentConferenceSummary
            onOpenWorkspaceModal={handleOpenWorkspaceModal}
          />
        )}

        {activeView === 'cohort-analytics' && (
          <ClassAnalytics
            onOpenWorkspaceModal={() => handleOpenWorkspaceModal('roster_sheets')}
          />
        )}
      </main>

      {/* Observation Logger Dialog */}
      <ObservationModal
        isOpen={isObservationModalOpen}
        onClose={() => {
          setIsObservationModalOpen(false);
          setEditObservation(null);
        }}
        initialStudentId={observationTargetStudentId}
        editObservation={editObservation}
      />

      {/* Multi-Device Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Student Enrollment Modal */}
      <NewStudentModal
        isOpen={isNewStudentModalOpen}
        onClose={() => setIsNewStudentModalOpen(false)}
      />

      {/* Google Workspace Modal (Sheets, Docs, Drive) */}
      <GoogleWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        defaultAction={workspaceDefaultAction}
        defaultStudentId={workspaceTargetStudentId}
      />
    </div>
  );
}

export default function App() {
  return (
    <ClassroomProvider>
      <MainAppContent />
    </ClassroomProvider>
  );
}

