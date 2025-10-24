import fs from 'fs';
import path from 'path';
import { AudioProcessor } from './audioProcessor.js';
import type { Request, Response } from 'express';

export interface StreamRange {
  start: number;
  end: number;
  total: number;
  chunkSize: number;
}

export class StreamingService {
  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private static readonly AUDIO_DIR = path.join(process.cwd(), 'uploads', 'hd-audio');
  private static readonly TEMP_DIR = path.join(process.cwd(), 'temp');

  static parseRangeHeader(rangeHeader: string, fileSize: number): StreamRange | null {
    if (!rangeHeader) return null;

    // Parse range header: "bytes=start-end"
    const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!matches) return null;

    const start = parseInt(matches[1], 10);
    const end = matches[2] ? parseInt(matches[2], 10) : Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);

    return {
      start,
      end,
      total: fileSize,
      chunkSize: end - start + 1
    };
  }

  static async streamAudioFile(filePath: string, req: Request, res: Response): Promise<void> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Audio file not found' });
        return;
      }

      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const range = this.parseRangeHeader(req.headers.range as string, fileSize);

      // Set appropriate headers
      res.set({
        'Accept-Ranges': 'bytes',
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000', // 1 year cache
        'ETag': `"${stats.mtime.getTime()}-${fileSize}"`,
        'Last-Modified': stats.mtime.toUTCString(),
      });

      if (range) {
        // Partial content request
        res.status(206); // Partial Content
        res.set({
          'Content-Length': range.chunkSize.toString(),
          'Content-Range': `bytes ${range.start}-${range.end}/${fileSize}`,
        });

        // Stream the requested range
        const stream = fs.createReadStream(filePath, { start: range.start, end: range.end });
        stream.pipe(res);

        stream.on('error', (error) => {
          console.error('Stream error:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Stream error' });
          }
        });

      } else {
        // Full file request
        res.status(200);
        res.set('Content-Length', fileSize.toString());

        // Stream the entire file
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);

        stream.on('error', (error) => {
          console.error('Stream error:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Stream error' });
          }
        });
      }

    } catch (error) {
      console.error('Error streaming audio file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream audio file' });
      }
    }
  }

  static async streamHDConversion(conversionId: string, req: Request, res: Response): Promise<void> {
    try {
      // Get conversion details from storage
      const { storage } = await import('./storage.js');
      const conversion = await storage.getHDAudioConversion(conversionId);
      
      if (!conversion) {
        res.status(404).json({ error: 'HD conversion not found' });
        return;
      }

      // Extract filename from HD URL
      const filename = path.basename(conversion.hdUrl);
      const filePath = path.join(this.AUDIO_DIR, filename);

      await this.streamAudioFile(filePath, req, res);

    } catch (error) {
      console.error('Error streaming HD conversion:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream HD audio' });
      }
    }
  }

  static async streamExternalUrl(url: string, req: Request, res: Response): Promise<void> {
    try {
      // For external URLs, we need to proxy the stream
      // This is a simplified implementation - in production you might want to cache
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url, {
        headers: {
          'Range': req.headers.range as string,
        }
      });

      if (!response.ok) {
        res.status(response.status).json({ error: 'Failed to fetch external audio' });
        return;
      }

      // Forward headers
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      const contentRange = response.headers.get('content-range');
      const acceptRanges = response.headers.get('accept-ranges');

      if (contentLength) res.set('Content-Length', contentLength);
      if (contentType) res.set('Content-Type', contentType);
      if (contentRange) res.set('Content-Range', contentRange);
      if (acceptRanges) res.set('Accept-Ranges', acceptRanges);

      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache for external files

      // Set appropriate status
      if (response.status === 206) {
        res.status(206); // Partial Content
      } else {
        res.status(200);
      }

      // Pipe the response
      if (response.body) {
        response.body.pipe(res);
      }

    } catch (error) {
      console.error('Error streaming external URL:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream external audio' });
      }
    }
  }

  static async getAudioMetadata(filePath: string): Promise<{
    duration: number;
    bitrate: number;
    sampleRate: number;
    channels: number;
    format: string;
    size: number;
  }> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const stats = fs.statSync(filePath);
      const audioInfo = await AudioProcessor.getAudioInfo(filePath);

      return {
        ...audioInfo,
        size: stats.size
      };
    } catch (error) {
      console.error('Error getting audio metadata:', error);
      throw error;
    }
  }

  static async createOptimizedStreamingFile(inputPath: string, outputFilename?: string): Promise<{
    filePath: string;
    url: string;
    metadata: any;
  }> {
    try {
      // Create streaming-optimized version with smaller chunks
      const filename = outputFilename || `stream_${Date.now()}.mp3`;
      const outputPath = path.join(this.AUDIO_DIR, filename);

      // Use FFmpeg to create streaming-optimized version
      const ffmpeg = (await import('fluent-ffmpeg')).default;
      
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioBitrate('320k')
          .audioFrequency(44100)
          .audioChannels(2)
          .format('mp3')
          .outputOptions([
            '-movflags', 'faststart', // Optimize for streaming
            '-preset', 'fast', // Fast encoding
          ])
          .on('start', (commandLine) => {
            console.log('Creating streaming-optimized file:', commandLine);
          })
          .on('progress', (progress) => {
            console.log(`Streaming optimization: ${progress.percent}% done`);
          })
          .on('end', async () => {
            try {
              const metadata = await this.getAudioMetadata(outputPath);
              resolve({
                filePath: outputPath,
                url: `/api/stream/audio/${filename}`,
                metadata
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (err) => {
            console.error('FFmpeg streaming optimization error:', err);
            reject(err);
          })
          .save(outputPath);
      });
    } catch (error) {
      console.error('Error creating streaming file:', error);
      throw error;
    }
  }

  static getStreamingChunkSize(fileSize: number): number {
    // Adaptive chunk size based on file size
    if (fileSize < 10 * 1024 * 1024) { // < 10MB
      return 256 * 1024; // 256KB
    } else if (fileSize < 100 * 1024 * 1024) { // < 100MB
      return 512 * 1024; // 512KB
    } else {
      return 1024 * 1024; // 1MB
    }
  }

  static async cleanupStreamingFiles(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.AUDIO_DIR);
      const now = Date.now();
      
      for (const file of files) {
        if (file.startsWith('stream_')) {
          const filePath = path.join(this.AUDIO_DIR, file);
          const stats = await fs.promises.stat(filePath);
          
          // Delete streaming files older than 24 hours
          if (now - stats.mtime.getTime() > 24 * 60 * 60 * 1000) {
            await fs.promises.unlink(filePath);
            console.log(`Cleaned up old streaming file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up streaming files:', error);
    }
  }
}

// Clean up streaming files every hour
setInterval(() => {
  StreamingService.cleanupStreamingFiles();
}, 60 * 60 * 1000);

