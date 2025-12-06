
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, '#818cf8'); // Indigo 400
        gradient.addColorStop(1, '#4f46e5'); // Indigo 600

        ctx.fillStyle = gradient;
        
        // Rounded top bars
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      draw();
    } else {
      // Clear canvas if stopped
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw a flat line
      ctx.beginPath();
      ctx.strokeStyle = '#334155';
      ctx.moveTo(0, canvas.height - 2);
      ctx.lineTo(canvas.width, canvas.height - 2);
      ctx.stroke();
      if(animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={100} 
      className="w-full h-24 bg-slate-900/50 rounded-lg border border-slate-800 shadow-inner"
    />
  );
};

export default AudioVisualizer;
