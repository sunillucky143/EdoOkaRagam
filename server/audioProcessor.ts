import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Set FFmpeg path for Windows
const FFMPEG_PATH = 'C:\\Users\\sunil\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0-full_build\\bin';
ffmpeg.setFfmpegPath(path.join(FFMPEG_PATH, 'ffmpeg.exe'));
ffmpeg.setFfprobePath(path.join(FFMPEG_PATH, 'ffprobe.exe'));

export interface AudioInfo {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
}

export interface HDConversionResult {
  originalUrl: string;
  hdUrl: string;
  originalInfo: AudioInfo;
  hdInfo: AudioInfo;
  conversionTime: number;
}

export class AudioProcessor {
  private static readonly HD_AUDIO_DIR = path.join(process.cwd(), 'uploads', 'hd-audio');
  private static readonly TEMP_DIR = path.join(process.cwd(), 'temp');
  
  // Ensure directories exist
  static {
    this.ensureDirectoriesExist();
  }
  
  private static ensureDirectoriesExist() {
    if (!fs.existsSync(this.HD_AUDIO_DIR)) {
      fs.mkdirSync(this.HD_AUDIO_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.TEMP_DIR)) {
      fs.mkdirSync(this.TEMP_DIR, { recursive: true });
    }
  }
  
  // HD Audio specifications
  private static readonly HD_SPECS = {
    bitrate: '320k',      // 320 kbps for HD quality
    sampleRate: '44100',  // 44.1 kHz sample rate
    channels: 2,          // Stereo
    format: 'mp3'         // MP3 format for compatibility
  };

  static async initialize(): Promise<void> {
    // Ensure directories exist
    await fs.promises.mkdir(this.HD_AUDIO_DIR, { recursive: true });
    await fs.promises.mkdir(this.TEMP_DIR, { recursive: true });
  }

  static async getAudioInfo(filePath: string): Promise<AudioInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        if (!audioStream) {
          reject(new Error('No audio stream found'));
          return;
        }

        const stats = fs.statSync(filePath);
        
        resolve({
          duration: metadata.format.duration || 0,
          bitrate: parseInt(audioStream.bit_rate || '0'),
          sampleRate: parseInt(audioStream.sample_rate || '0'),
          channels: audioStream.channels || 0,
          format: metadata.format.format_name || '',
          size: stats.size
        });
      });
    });
  }

  static async convertToHD(inputPath: string, outputFilename?: string): Promise<HDConversionResult> {
    const startTime = Date.now();
    
    // Get original audio info
    const originalInfo = await this.getAudioInfo(inputPath);
    
    // Generate unique filename if not provided
    const filename = outputFilename || `hd_${randomUUID()}.${this.HD_SPECS.format}`;
    const outputPath = path.join(this.HD_AUDIO_DIR, filename);
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate(this.HD_SPECS.bitrate)
        .audioFrequency(parseInt(this.HD_SPECS.sampleRate))
        .audioChannels(this.HD_SPECS.channels)
        .format(this.HD_SPECS.format)
        .on('start', (commandLine) => {
          console.log('FFmpeg process started:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', async () => {
          try {
            const hdInfo = await this.getAudioInfo(outputPath);
            const conversionTime = Date.now() - startTime;
            
            resolve({
              originalUrl: inputPath,
              hdUrl: `/api/audio/hd/${filename}`,
              originalInfo,
              hdInfo,
              conversionTime
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  static async convertFromUrl(url: string): Promise<HDConversionResult> {
    const tempFilename = `temp_${randomUUID()}.tmp`;
    const tempPath = path.join(this.TEMP_DIR, tempFilename);
    
    return new Promise((resolve, reject) => {
      ffmpeg(url)
        .on('start', (commandLine) => {
          console.log('Downloading and converting:', commandLine);
        })
        .on('error', (err) => {
          console.error('Download/conversion error:', err);
          reject(err);
        })
        .on('end', async () => {
          try {
            const result = await this.convertToHD(tempPath);
            // Clean up temp file
            await fs.promises.unlink(tempPath);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .save(tempPath);
    });
  }

  static isHDAudio(audioInfo: AudioInfo): boolean {
    return (
      audioInfo.bitrate >= 256000 && // 256 kbps or higher
      audioInfo.sampleRate >= 44100 && // 44.1 kHz or higher
      audioInfo.channels >= 2 // Stereo or better
    );
  }

  static async cleanupTempFiles(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.TEMP_DIR);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.TEMP_DIR, file);
        const stats = await fs.promises.stat(filePath);
        
        // Delete files older than 1 hour
        if (now - stats.mtime.getTime() > 3600000) {
          await fs.promises.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  static getHDSpecs() {
    return this.HD_SPECS;
  }
}

// Initialize the processor
AudioProcessor.initialize().catch(console.error);

// Clean up temp files every hour
setInterval(() => {
  AudioProcessor.cleanupTempFiles();
}, 3600000);
