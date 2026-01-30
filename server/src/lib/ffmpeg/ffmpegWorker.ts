/**
 * FFmpeg Worker - Manages FFmpeg child process for HLS transcoding
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { buildTranscodeArgs, TranscodeOptions, HLS_PLAYLIST_NAME } from './transcodeConfig.js';
import { getFFmpegPath } from '../camera/cameraManager.js';

/** FFmpeg worker state */
export type WorkerState = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';

/** FFmpeg worker events */
export interface FFmpegWorkerEvents {
  started: [];
  stopped: [];
  error: [Error];
  output: [string];
  progress: [FFmpegProgress];
}

/** FFmpeg progress information */
export interface FFmpegProgress {
  frame: number;
  fps: number;
  time: string;
  bitrate: string;
  speed: string;
}

/**
 * FFmpeg Worker class - manages a single FFmpeg transcoding process
 */
export class FFmpegWorker extends EventEmitter {
  private process: ChildProcess | null = null;
  private _state: WorkerState = 'idle';
  private stderrBuffer: string = '';
  private readonly options: TranscodeOptions;
  private startTime: Date | null = null;
  
  constructor(options: TranscodeOptions) {
    super();
    this.options = options;
  }
  
  /**
   * Get current worker state
   */
  get state(): WorkerState {
    return this._state;
  }
  
  /**
   * Get the HLS playlist URL path
   */
  get playlistPath(): string {
    return `${this.options.outputDir}/${HLS_PLAYLIST_NAME}`;
  }
  
  /**
   * Get stream uptime in seconds
   */
  get uptime(): number {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }
  
  /**
   * Start the FFmpeg transcoding process
   */
  async start(): Promise<void> {
    if (this._state !== 'idle' && this._state !== 'stopped' && this._state !== 'error') {
      throw new Error(`Cannot start worker in state: ${this._state}`);
    }
    
    this._state = 'starting';
    
    const ffmpegPath = getFFmpegPath();
    const args = buildTranscodeArgs(this.options);
    
    console.log(`Starting FFmpeg: ${ffmpegPath} ${args.join(' ')}`);
    
    try {
      this.process = spawn(ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      
      // Handle stdout
      this.process.stdout?.on('data', (data) => {
        this.emit('output', data.toString());
      });
      
      // Handle stderr (FFmpeg outputs progress to stderr)
      this.process.stderr?.on('data', (data) => {
        const output = data.toString();
        this.stderrBuffer += output;
        this.emit('output', output);
        
        // Parse progress information
        const progress = this.parseProgress(output);
        if (progress) {
          this.emit('progress', progress);
        }
        
        // Detect successful start
        if (this._state === 'starting' && this.stderrBuffer.includes('Opening')) {
          this._state = 'running';
          this.startTime = new Date();
          this.emit('started');
        }
      });
      
      // Handle process close
      this.process.on('close', (code) => {
        const wasRunning = this._state === 'running';
        this._state = code === 0 || this._state === 'stopping' ? 'stopped' : 'error';
        this.process = null;
        
        if (wasRunning || this._state === 'stopped') {
          this.emit('stopped');
        }
        
        if (code !== 0 && code !== null && this._state === 'error') {
          this.emit('error', new Error(`FFmpeg exited with code ${code}`));
        }
      });
      
      // Handle process error
      this.process.on('error', (error) => {
        this._state = 'error';
        this.emit('error', error);
      });
      
      // Wait for process to start (with timeout)
      await this.waitForStart(10000);
      
    } catch (error) {
      this._state = 'error';
      throw error;
    }
  }
  
  /**
   * Stop the FFmpeg process gracefully
   */
  async stop(): Promise<void> {
    if (!this.process || this._state === 'stopped' || this._state === 'idle') {
      return;
    }
    
    this._state = 'stopping';
    
    // Send quit signal to FFmpeg
    this.process.stdin?.write('q');
    
    // Wait for graceful shutdown
    const stopped = await this.waitForStop(5000);
    
    if (!stopped && this.process) {
      // Force kill if not stopped
      this.process.kill('SIGKILL');
      await this.waitForStop(2000);
    }
    
    this._state = 'stopped';
  }
  
  /**
   * Kill the FFmpeg process immediately
   */
  kill(): void {
    if (this.process) {
      this.process.kill('SIGKILL');
      this.process = null;
      this._state = 'stopped';
    }
  }
  
  /**
   * Parse FFmpeg progress output
   */
  private parseProgress(output: string): FFmpegProgress | null {
    const frameMatch = output.match(/frame=\s*(\d+)/);
    const fpsMatch = output.match(/fps=\s*([\d.]+)/);
    const timeMatch = output.match(/time=\s*([\d:.]+)/);
    const bitrateMatch = output.match(/bitrate=\s*([^\s]+)/);
    const speedMatch = output.match(/speed=\s*([^\s]+)/);
    
    if (frameMatch && fpsMatch && timeMatch) {
      return {
        frame: parseInt(frameMatch[1], 10),
        fps: parseFloat(fpsMatch[1]),
        time: timeMatch[1],
        bitrate: bitrateMatch?.[1] ?? 'N/A',
        speed: speedMatch?.[1] ?? 'N/A',
      };
    }
    
    return null;
  }
  
  /**
   * Wait for the process to start
   */
  private waitForStart(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this._state === 'starting') {
          // Assume started if process is still running
          this._state = 'running';
          this.startTime = new Date();
          this.emit('started');
          resolve();
        }
      }, timeout);
      
      const onStarted = () => {
        clearTimeout(timer);
        this.off('error', onError);
        resolve();
      };
      
      const onError = (error: Error) => {
        clearTimeout(timer);
        this.off('started', onStarted);
        reject(error);
      };
      
      this.once('started', onStarted);
      this.once('error', onError);
    });
  }
  
  /**
   * Wait for the process to stop
   */
  private waitForStop(timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve(true);
        return;
      }
      
      const timer = setTimeout(() => {
        this.off('stopped', onStopped);
        resolve(false);
      }, timeout);
      
      const onStopped = () => {
        clearTimeout(timer);
        resolve(true);
      };
      
      this.once('stopped', onStopped);
    });
  }
}

/** Map of stream ID to worker */
const workers = new Map<string, FFmpegWorker>();

/**
 * Create and start a new FFmpeg worker
 */
export async function createWorker(streamId: string, options: TranscodeOptions): Promise<FFmpegWorker> {
  const existing = workers.get(streamId);
  if (existing) {
    throw new Error(`Worker already exists for stream: ${streamId}`);
  }
  
  const worker = new FFmpegWorker(options);
  workers.set(streamId, worker);
  
  try {
    await worker.start();
    return worker;
  } catch (error) {
    workers.delete(streamId);
    throw error;
  }
}

/**
 * Get a worker by stream ID
 */
export function getWorker(streamId: string): FFmpegWorker | undefined {
  return workers.get(streamId);
}

/**
 * Stop and remove a worker
 */
export async function stopWorker(streamId: string): Promise<boolean> {
  const worker = workers.get(streamId);
  if (!worker) {
    return false;
  }
  
  await worker.stop();
  workers.delete(streamId);
  return true;
}

/**
 * Kill all workers (for cleanup)
 */
export function killAllWorkers(): void {
  for (const worker of workers.values()) {
    worker.kill();
  }
  workers.clear();
}

/**
 * Get all active worker stream IDs
 */
export function getActiveStreams(): string[] {
  return Array.from(workers.keys());
}
