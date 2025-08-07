import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
  className?: string;
  variant?: 'wave' | 'bars' | 'circle';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}
export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioLevel,
  isRecording,
  className,
  variant = 'wave',
  size = 'md',
  color = 'primary-600',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sizes = {
    sm: { width: 200, height: 60 },
    md: { width: 300, height: 80 },
    lg: { width: 400, height: 100 },
  };
  const { width, height } = sizes[size];
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (variant === 'wave') {
        drawWave(ctx, width, height, audioLevel, isRecording, color);
      } else if (variant === 'bars') {
        drawBars(ctx, width, height, audioLevel, isRecording, color);
      } else if (variant === 'circle') {
        drawCircle(ctx, width, height, audioLevel, isRecording, color);
      }
      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };
    if (isRecording) {
      draw();
    } else {
      // Draw static state
      draw();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioLevel, isRecording, variant, width, height, color]);
  return (
    <motion.div
      className={cn('flex items-center justify-center', className)}
      animate={{
        scale: isRecording ? [1, 1.05, 1] : 1,
      }}
      transition={{
        duration: 2,
        repeat: isRecording ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </motion.div>
  );
};
// Wave visualization
function drawWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  audioLevel: number,
  isRecording: boolean,
  color: string
) {
  const centerY = height / 2;
  const amplitude = isRecording ? audioLevel * (height / 3) : 2;
  const frequency = 0.02;
  const time = Date.now() * 0.005;
  ctx.strokeStyle = `rgb(37, 99, 235)`; // primary-600
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < width; x++) {
    const y = centerY + Math.sin(x * frequency + time) * amplitude;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  // Add glow effect when recording
  if (isRecording && audioLevel > 0.1) {
    ctx.shadowColor = `rgb(37, 99, 235)`;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
// Bars visualization
function drawBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  audioLevel: number,
  isRecording: boolean,
  color: string
) {
  const barCount = 20;
  const barWidth = width / barCount - 2;
  const maxBarHeight = height - 10;
  for (let i = 0; i < barCount; i++) {
    const barHeight = isRecording
      ? (Math.random() * audioLevel + 0.1) * maxBarHeight
      : Math.random() * 10 + 5;
    const x = i * (barWidth + 2);
    const y = height - barHeight;
    // Gradient from bottom to top
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgb(37, 99, 235)');
    gradient.addColorStop(1, 'rgb(59, 130, 246)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
    // Add glow effect for active bars
    if (isRecording && barHeight > maxBarHeight * 0.3) {
      ctx.shadowColor = 'rgb(37, 99, 235)';
      ctx.shadowBlur = 5;
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.shadowBlur = 0;
    }
  }
}
// Circle visualization
function drawCircle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  audioLevel: number,
  isRecording: boolean,
  color: string
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) / 4;
  const radius = baseRadius + (isRecording ? audioLevel * 20 : 0);
  // Outer circle (pulse effect)
  if (isRecording) {
    const pulseRadius = radius + Math.sin(Date.now() * 0.01) * 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(37, 99, 235, 0.3)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // Main circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, radius
  );
  gradient.addColorStop(0, 'rgb(59, 130, 246)');
  gradient.addColorStop(1, 'rgb(37, 99, 235)');
  ctx.fillStyle = gradient;
  ctx.fill();
  // Add glow effect when recording
  if (isRecording && audioLevel > 0.1) {
    ctx.shadowColor = 'rgb(37, 99, 235)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  // Inner circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fill();
}
// Preset visualizer components
export const WaveVisualizer: React.FC<Omit<AudioVisualizerProps, 'variant'>> = (props) => (
  <AudioVisualizer {...props} variant="wave" />
);
export const BarsVisualizer: React.FC<Omit<AudioVisualizerProps, 'variant'>> = (props) => (
  <AudioVisualizer {...props} variant="bars" />
);
export const CircleVisualizer: React.FC<Omit<AudioVisualizerProps, 'variant'>> = (props) => (
  <AudioVisualizer {...props} variant="circle" />
);
export default AudioVisualizer;