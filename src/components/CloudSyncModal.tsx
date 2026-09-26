import React, { useState } from 'react';
import {
  X,
  Cloud,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Tablet,
  Download,
  Upload,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    classroom,
    syncStatus,
    triggerManualSync,
    switchClassroom,
  } = useClassroom();

  const [inputRoomCode, setInputRoomCode] = useState(classroom.classroomId);
  const [copied, setCopied] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classroom.classroomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = async () => {
    await triggerManualSync();
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 3000);
  };

  const handleSwitchRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomCode.trim()) return;
    await switchClassroom(inputRoomCode);
    onClose();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(classroom, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Classroom_${classroom.classroomId}_Backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0C0C0E] rounded-2xl max-w-xl w-full shadow-2xl border border-[#27272A] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#121215] text-white flex items-center justify-between border-b border-[#27272A]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Multi-Device Cloud Synchronization Hub</h2>
              <p className="text-xs text-[#71717A]">Seamless real-time data access across teacher laptops, iPads, & phones</p>
            </div>
          </div>
          <button
            id="close-sync-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-[#E4E4E7]">
          {/* Room Sync Code Share Card */}
          <div className="bg-[#121215] p-5 rounded-2xl border border-[#27272A] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Classroom Sync ID
                </label>
                <p className="text-xs text-[#71717A]">Share this ID with co-teachers & specialists to collaborate live</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Cloud Store</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-[#18181B] px-4 py-2.5 rounded-xl border border-[#27272A] font-mono text-base font-bold text-white tracking-wider select-all">
                {classroom.classroomId}
              </div>
              <button
                id="copy-room-code-btn"
                onClick={handleCopyCode}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Connected Device Simulation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Connected Educator Devices</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181B] border border-[#27272A]">
                <div className="flex items-center space-x-3">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <div>
                    <strong className="text-white block font-semibold">Teacher Desk Station (This Device)</strong>
                    <span className="text-[11px] text-[#71717A]">Lead Teacher: {classroom.leadTeacher}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                  Active Now
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181B] border border-[#27272A]">
                <div className="flex items-center space-x-3">
                  <Tablet className="w-4 h-4 text-[#A1A1AA]" />
                  <div>
                    <strong className="text-white block font-semibold">Classroom iPad (Guided Reading Station)</strong>
                    <span className="text-[11px] text-[#71717A]">Co-Teacher / Specialist Observer</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#A1A1AA] bg-[#27272A] px-2 py-0.5 rounded">
                  Synced 2m ago
                </span>
              </div>
            </div>
          </div>

          {/* Manual Force Sync & Cloud Status */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#27272A] text-xs">
            <div>
              <span className="text-[#A1A1AA] block">
                Last Cloud Synchronized: <strong className="text-white">{new Date(syncStatus.lastSynced).toLocaleTimeString()}</strong>
              </span>
              <span className="text-[11px] text-[#71717A]">Classroom Version: v{classroom.version}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="manual-force-sync-btn"
                disabled={syncStatus.isSyncing}
                onClick={handleManualSync}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncStatus.isSyncing ? 'Syncing...' : syncSuccess ? 'Sync Complete!' : 'Force Sync'}</span>
              </button>

              <button
                id="backup-json-export-btn"
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl border border-[#27272A] text-[#A1A1AA] hover:bg-[#18181B] hover:text-white text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                title="Download JSON offline backup"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Switch Classroom Section */}
          <form onSubmit={handleSwitchRoom} className="pt-4 border-t border-[#27272A] space-y-2">
            <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
              Switch or Join Another Classroom Code
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="switch-room-input"
                type="text"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ROOM-104-OAK or ROOM-202"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] font-mono uppercase focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Join Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
