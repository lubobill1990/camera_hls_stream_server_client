/**
 * Transcode Configuration - FFmpeg HLS transcoding parameters
 */

import { getPlatform, getFFmpegInputFormat, getDeviceInput } from '../camera/platformHelpers.js';

/** HLS segment duration in seconds */
export const HLS_SEGMENT_DURATION = 4;

/** Number of HLS segments to keep in playlist */
export const HLS_LIST_SIZE = 5;

/** HLS segment filename pattern */
export const HLS_SEGMENT_PATTERN = 'segment_%03d.ts';

/** HLS playlist filename */
export const HLS_PLAYLIST_NAME = 'stream.m3u8';

/** Video codec */
export const VIDEO_CODEC = 'libx264';

/** Audio codec */
export const AUDIO_CODEC = 'aac';

/** Video preset (speed vs quality tradeoff) */
export const VIDEO_PRESET = 'ultrafast';

/** Video tune for low latency */
export const VIDEO_TUNE = 'zerolatency';

/** Video CRF (quality, lower = better, 18-28 typical) */
export const VIDEO_CRF = 23;

/** Default video resolution */
export const DEFAULT_RESOLUTION = '1280x720';

/** Default framerate */
export const DEFAULT_FRAMERATE = 30;

/** Default audio sample rate */
export const DEFAULT_AUDIO_RATE = 44100;

/** Audio channels */
export const AUDIO_CHANNELS = 2;

/** Audio bitrate */
export const AUDIO_BITRATE = '128k';

/**
 * Build FFmpeg arguments for HLS transcoding
 */
export interface TranscodeOptions {
  /** Camera device ID */
  cameraId: string;
  
  /** Output directory for HLS files */
  outputDir: string;
  
  /** Video resolution (e.g., '1280x720') */
  resolution?: string;
  
  /** Video framerate */
  framerate?: number;
  
  /** Video bitrate (e.g., '2500k') */
  videoBitrate?: string;
  
  /** Include audio */
  includeAudio?: boolean;
  
  /** Audio device ID (for separate audio input) */
  audioDeviceId?: string;
}

/**
 * Build FFmpeg command arguments for HLS transcoding
 */
export function buildTranscodeArgs(options: TranscodeOptions): string[] {
  const platform = getPlatform();
  const inputFormat = getFFmpegInputFormat(platform);
  const deviceInput = getDeviceInput(platform, options.cameraId);
  
  const resolution = options.resolution ?? DEFAULT_RESOLUTION;
  const framerate = options.framerate ?? DEFAULT_FRAMERATE;
  const includeAudio = options.includeAudio ?? true;
  
  const args: string[] = [];
  
  // Input options
  args.push('-f', inputFormat);
  
  // Platform-specific input options
  if (platform === 'win32') {
    // DirectShow: specify framerate before input
    args.push('-framerate', framerate.toString());
    args.push('-video_size', resolution);
  } else if (platform === 'darwin') {
    // AVFoundation: specify framerate and pixel format
    args.push('-framerate', framerate.toString());
    args.push('-pixel_format', 'uyvy422');
  } else {
    // V4L2: specify format
    args.push('-input_format', 'mjpeg');
    args.push('-framerate', framerate.toString());
    args.push('-video_size', resolution);
  }
  
  // Video input
  args.push('-i', deviceInput);
  
  // Audio input (if enabled)
  if (includeAudio && options.audioDeviceId) {
    if (platform === 'win32') {
      args.push('-f', 'dshow');
      args.push('-i', `audio=${options.audioDeviceId}`);
    } else if (platform === 'darwin') {
      args.push('-f', 'avfoundation');
      args.push('-i', `:${options.audioDeviceId}`);
    } else {
      args.push('-f', 'alsa');
      args.push('-i', options.audioDeviceId);
    }
  }
  
  // Video encoding options
  args.push('-c:v', VIDEO_CODEC);
  args.push('-preset', VIDEO_PRESET);
  args.push('-tune', VIDEO_TUNE);
  args.push('-crf', VIDEO_CRF.toString());
  
  // Scale to target resolution
  args.push('-vf', `scale=${resolution.replace('x', ':')}`);
  
  // Video bitrate (if specified)
  if (options.videoBitrate) {
    args.push('-b:v', options.videoBitrate);
    args.push('-maxrate', options.videoBitrate);
    args.push('-bufsize', '2M');
  }
  
  // Keyframe interval for HLS segments
  args.push('-g', (framerate * HLS_SEGMENT_DURATION).toString());
  args.push('-keyint_min', (framerate * HLS_SEGMENT_DURATION).toString());
  
  // Audio encoding (if input has audio)
  if (includeAudio) {
    args.push('-c:a', AUDIO_CODEC);
    args.push('-b:a', AUDIO_BITRATE);
    args.push('-ar', DEFAULT_AUDIO_RATE.toString());
    args.push('-ac', AUDIO_CHANNELS.toString());
  } else {
    args.push('-an'); // No audio
  }
  
  // HLS output options
  args.push('-f', 'hls');
  args.push('-hls_time', HLS_SEGMENT_DURATION.toString());
  args.push('-hls_list_size', HLS_LIST_SIZE.toString());
  args.push('-hls_flags', 'delete_segments');
  args.push('-hls_segment_filename', `${options.outputDir}/${HLS_SEGMENT_PATTERN}`);
  
  // Output playlist
  args.push(`${options.outputDir}/${HLS_PLAYLIST_NAME}`);
  
  return args;
}

/**
 * Get FFmpeg version check arguments
 */
export function getVersionArgs(): string[] {
  return ['-version'];
}

/**
 * Get FFmpeg codec check arguments
 */
export function getCodecCheckArgs(): string[] {
  return ['-codecs'];
}

/**
 * Parse FFmpeg version from output
 */
export function parseVersion(output: string): string | null {
  const match = output.match(/ffmpeg version (\S+)/);
  return match ? match[1] : null;
}

/**
 * Check if FFmpeg supports required codecs
 */
export function checkCodecSupport(codecOutput: string): {
  h264: boolean;
  aac: boolean;
} {
  return {
    h264: codecOutput.includes('libx264'),
    aac: codecOutput.includes('aac'),
  };
}
