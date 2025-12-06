
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Download, Mic, Wand2, History, Trash2, Github, Volume2, Info } from 'lucide-react';
import { PRESET_VOICES, VoiceConfig, GeneratedAudio, ReferenceAudio, TTSMode } from './types';
import { generateSpeech } from './services/geminiService';
import AudioVisualizer from './components/AudioVisualizer';
import ReferenceUploader from './components/ReferenceUploader';

const App: React.FC = () => {
  // State
  const [inputText, setInputText] = useState<string>("Hello! This is a VibeStudio demo. I can clone the style of the reference audio you select or upload. Give it a try!");
  const [selectedVoice, setSelectedVoice] = useState<VoiceConfig>(PRESET_VOICES[0]);
  const [mode, setMode] = useState<TTSMode>(TTSMode.PRESET);
  const [referenceAudio, setReferenceAudio] = useState<ReferenceAudio | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedHistory, setGeneratedHistory] = useState<GeneratedAudio[]>([]);
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);

  // Audio Context & Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        setAnalyser(analyserRef.current);
      }
    };
    // Initialize on first interaction to comply with browser autoplay policies
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, []);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsGenerating(true);

    try {
      let voiceId = selectedVoice.id;
      let displayVoiceName = selectedVoice.name;

      // Handle Cloning Mode Simulation
      if (mode === TTSMode.CLONE && referenceAudio) {
        if (referenceAudio.type === 'sample' && referenceAudio.targetVoiceId) {
          // Standard Sample: Map directly to the predefined backend voice
          voiceId = referenceAudio.targetVoiceId;
        } else if (referenceAudio.type === 'upload' && referenceAudio.baseModelId) {
          // Custom Upload: Map to the user-selected base model for best match
          voiceId = referenceAudio.baseModelId;
        } else {
           // Fallback default
           voiceId = 'Puck'; 
        }
        displayVoiceName = `Clone (${referenceAudio.name})`;
      }
      
      const { audioBuffer, blob } = await generateSpeech(inputText, voiceId, audioContextRef.current);

      const url = URL.createObjectURL(blob);
      const newAudio: GeneratedAudio = {
        id: Date.now().toString(),
        text: inputText,
        voiceName: displayVoiceName,
        timestamp: Date.now(),
        duration: audioBuffer.duration,
        audioUrl: url,
        audioBuffer: audioBuffer
      };

      setGeneratedHistory(prev => [newAudio, ...prev]);
      setCurrentAudio(newAudio);
      playAudio(newAudio.audioBuffer);

    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate audio. Please check your API key or connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = useCallback((buffer: AudioBuffer) => {
    if (!audioContextRef.current || !analyserRef.current) return;

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    source.onended = () => setIsPlaying(false);
    sourceNodeRef.current = source;
    
    source.start(0);
    setIsPlaying(true);
  }, []);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleHistoryPlay = (item: GeneratedAudio) => {
    setCurrentAudio(item);
    playAudio(item.audioBuffer);
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setGeneratedHistory(prev => prev.filter(p => p.id !== id));
    if (currentAudio?.id === id) {
      stopAudio();
      setCurrentAudio(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-inter">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mic className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              VibeStudio <span className="text-indigo-400 font-light">TTS</span>
            </h1>
          </div>
          <a 
            href="https://github.com/microsoft/VibeVoice" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Github size={18} />
            <span>VibeVoice Model</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Mode Switcher */}
          <div className="bg-slate-900 rounded-2xl p-1.5 flex shadow-inner">
            <button
              onClick={() => setMode(TTSMode.PRESET)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                mode === TTSMode.PRESET 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Standard Voice
            </button>
            <button
              onClick={() => setMode(TTSMode.CLONE)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                mode === TTSMode.CLONE
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Voice Cloning
            </button>
          </div>

          {/* Configuration Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            
            {/* Voice Selection (Conditional) */}
            {mode === TTSMode.PRESET ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Select Voice</label>
                <div className="grid grid-cols-1 gap-2">
                  {PRESET_VOICES.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice)}
                      className={`
                        flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group
                        ${selectedVoice.id === voice.id 
                          ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                          : 'bg-slate-800/50 border-transparent hover:border-slate-700 hover:bg-slate-800'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          selectedVoice.id === voice.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
                        }`}>
                          {voice.name[0]}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-medium ${selectedVoice.id === voice.id ? 'text-white' : 'text-slate-300'}`}>
                            {voice.name}
                          </p>
                          <p className="text-xs text-slate-500">{voice.gender} • {voice.style}</p>
                        </div>
                      </div>
                      {selectedVoice.id === voice.id && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ReferenceUploader 
                selectedFile={referenceAudio} 
                onFileSelect={setReferenceAudio} 
              />
            )}

            {/* Text Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">Script</label>
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none font-mono text-sm leading-relaxed"
                  placeholder="Enter the text you want to synthesize..."
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-600">
                  {inputText.length} chars
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !inputText.trim() || (mode === TTSMode.CLONE && !referenceAudio)}
              className={`
                w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isGenerating 
                  ? 'bg-indigo-900/50 text-indigo-200' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30 hover:shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99]'}
              `}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></div>
                  Synthesizing...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate Audio
                </>
              )}
            </button>
            
            {mode === TTSMode.CLONE && (
                <div className="flex gap-2 items-start text-xs text-slate-500 bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
                    <Info size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
                    <p>
                        This mode uses the <strong>Gemini 2.5 Flash</strong> engine to simulate the prosody and timbre of your reference audio by mapping it to the closest available neural voice model.
                    </p>
                </div>
            )}
          </div>
        </div>

        {/* Right Panel: Visualization & History */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          
          {/* Visualizer Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
             {/* Decorative background glow */}
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

             <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                 Playback
               </h2>
               {currentAudio && (
                 <a
                  href={currentAudio.audioUrl}
                  download={`vibe-studio-${currentAudio.id}.wav`}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                 >
                   <Download size={14} />
                   Download WAV
                 </a>
               )}
             </div>

             <div className="space-y-6">
                <AudioVisualizer analyser={analyser} isPlaying={isPlaying} />

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={stopAudio}
                    disabled={!currentAudio || !isPlaying}
                    className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Square size={20} fill="currentColor" />
                  </button>
                  
                  <button
                    onClick={() => currentAudio && playAudio(currentAudio.audioBuffer)}
                    disabled={!currentAudio || isPlaying}
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isPlaying 
                        ? 'bg-slate-800 text-indigo-500 shadow-none' 
                        : 'bg-indigo-500 text-white hover:bg-indigo-400 hover:scale-105 shadow-indigo-500/30'}
                    `}
                  >
                    <Play size={32} fill="currentColor" className="ml-1" />
                  </button>
                </div>

                {currentAudio && (
                  <div className="text-center space-y-1 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm font-medium text-slate-200 line-clamp-1">{currentAudio.text}</p>
                    <p className="text-xs text-slate-500">Voice: {currentAudio.voiceName}</p>
                  </div>
                )}
             </div>
          </div>

          {/* History List */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex-1 flex flex-col min-h-[300px]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History size={18} className="text-indigo-400" />
              History
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[400px]">
              {generatedHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 min-h-[200px]">
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center">
                    <Mic size={24} className="opacity-50" />
                  </div>
                  <p className="text-sm">No generations yet. Start creating!</p>
                </div>
              ) : (
                generatedHistory.map((item) => (
                  <div 
                    key={item.id}
                    className={`
                      group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer
                      ${currentAudio?.id === item.id 
                        ? 'bg-slate-800 border-indigo-500/30 shadow-md' 
                        : 'bg-slate-900/30 border-slate-800 hover:bg-slate-800 hover:border-slate-700'}
                    `}
                    onClick={() => handleHistoryPlay(item)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                        ${currentAudio?.id === item.id && isPlaying ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}
                      `}>
                         {currentAudio?.id === item.id && isPlaying ? (
                           <Volume2 size={18} className="animate-pulse" />
                         ) : (
                           <Play size={14} className="ml-0.5" />
                         )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${currentAudio?.id === item.id ? 'text-indigo-200' : 'text-slate-300'}`}>
                          {item.text}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{item.voiceName}</span>
                          <span>•</span>
                          <span>{Math.round(item.duration)}s</span>
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteHistory(e, item.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
