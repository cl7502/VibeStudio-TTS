
import React, { useRef, useState } from 'react';
import { Upload, X, FileAudio, Mic2, Sparkles, LayoutGrid, HardDrive } from 'lucide-react';
import { ReferenceAudio, SAMPLE_VOICES, PRESET_VOICES } from '../types';

interface ReferenceUploaderProps {
  onFileSelect: (file: ReferenceAudio | null) => void;
  selectedFile: ReferenceAudio | null;
}

const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({ onFileSelect, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      // Default to the first voice as base model, user can change it
      onFileSelect({
        id: `upload-${Date.now()}`,
        name: file.name,
        blob: file,
        url: url,
        type: 'upload',
        style: 'Custom Upload',
        baseModelId: 'Puck' // Default
      });
    }
  };

  const updateBaseModel = (voiceId: string) => {
    if (selectedFile && selectedFile.type === 'upload') {
      onFileSelect({
        ...selectedFile,
        baseModelId: voiceId
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          Reference Audio Source
        </label>
        
        {/* Tab Switcher */}
        {!selectedFile && (
           <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
             <button
               onClick={() => setActiveTab('library')}
               className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'library' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <div className="flex items-center gap-1.5">
                 <LayoutGrid size={12} />
                 Library
               </div>
             </button>
             <button
               onClick={() => setActiveTab('upload')}
               className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
                <div className="flex items-center gap-1.5">
                 <HardDrive size={12} />
                 Upload
               </div>
             </button>
           </div>
        )}
      </div>

      {/* Selected State Banner */}
      {selectedFile ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-indigo-900/20 rounded-xl p-4 border border-indigo-500/30 flex items-center justify-between group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-lg ${selectedFile.color || 'bg-indigo-600'}`}>
                {selectedFile.type === 'upload' ? <FileAudio size={20} /> : <Mic2 size={20} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{selectedFile.name}</p>
                <p className="text-xs text-indigo-300 flex items-center gap-1">
                  {selectedFile.type === 'upload' ? 'Custom Upload' : `Standard Sample • ${selectedFile.style}`}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null);
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Base Model Selector for Uploads */}
          {selectedFile.type === 'upload' && (
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
               <label className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Base Model Match</label>
               <p className="text-xs text-slate-400 mb-2">Select the base voice that best matches the gender and tone of your upload for the most accurate simulation.</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 {PRESET_VOICES.map(voice => (
                   <button
                     key={voice.id}
                     onClick={() => updateBaseModel(voice.id)}
                     className={`
                       flex items-center gap-2 p-2 rounded-lg text-xs text-left border transition-all
                       ${selectedFile.baseModelId === voice.id 
                         ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200' 
                         : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}
                     `}
                   >
                     <div className={`w-2 h-2 rounded-full ${selectedFile.baseModelId === voice.id ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                     <span>{voice.name} ({voice.gender})</span>
                   </button>
                 ))}
               </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {activeTab === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`
                relative group cursor-pointer
                flex flex-col items-center justify-center
                h-48 rounded-xl border-2 border-dashed
                transition-all duration-200
                ${isDragging 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}
              `}
            >
              <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-300">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload size={20} />
                </div>
                <span className="text-sm font-medium">Click to upload reference</span>
                <span className="text-xs text-slate-500">WAV or MP3 (Max 10MB)</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
                accept="audio/*"
              />
            </div>
          )}

          {activeTab === 'library' && (
            <div className="grid grid-cols-2 gap-3 h-48 overflow-y-auto pr-1 custom-scrollbar">
              {SAMPLE_VOICES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onFileSelect(sample)}
                  className="flex flex-col gap-2 p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${sample.color}`}>
                        {sample.name[0]}
                      </div>
                      <div className="text-[10px] bg-slate-950/50 px-1.5 py-0.5 rounded text-slate-400">
                        Sample
                      </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{sample.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{sample.style}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReferenceUploader;
