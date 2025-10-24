import { AudioProcessor } from './audioProcessor.js';
import { StreamingService } from './streamingService.js';
import type { Request, Response } from 'express';

export interface NetworkCondition {
  connectionSpeed: 'slow' | 'medium' | 'fast';
  bandwidth: number; // in kbps
  latency: number; // in ms
}

export interface AdaptiveStreamingProfile {
  id: string;
  name: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  description: string;
}

export class AdaptiveStreamingService {
  private static readonly STREAMING_PROFILES: AdaptiveStreamingProfile[] = [
    {
      id: 'low',
      name: 'Low Quality',
      bitrate: 128000, // 128 kbps
      sampleRate: 44100,
      channels: 2,
      description: 'Optimized for slow connections'
    },
    {
      id: 'medium',
      name: 'Standard Quality',
      bitrate: 192000, // 192 kbps
      sampleRate: 44100,
      channels: 2,
      description: 'Balanced quality and bandwidth'
    },
    {
      id: 'high',
      name: 'HD Quality',
      bitrate: 320000, // 320 kbps
      sampleRate: 44100,
      channels: 2,
      description: 'High definition audio'
    }
  ];

  static async detectNetworkCondition(req: Request): Promise<NetworkCondition> {
    // Simple network detection based on user agent and headers
    const userAgent = req.headers['user-agent'] || '';
    const connectionType = req.headers['sec-ch-ua-mobile'] ? 'mobile' : 'desktop';
    
    // Default to medium connection
    let connectionSpeed: 'slow' | 'medium' | 'fast' = 'medium';
    
    // Detect mobile devices (typically slower connections)
    if (connectionType === 'mobile') {
      connectionSpeed = 'slow';
    }
    
    // Detect high-end devices/browsers
    if (userAgent.includes('Chrome') && !userAgent.includes('Mobile')) {
      connectionSpeed = 'fast';
    }

    // Estimate bandwidth and latency
    const bandwidth = this.estimateBandwidth(connectionSpeed);
    const latency = this.estimateLatency(connectionSpeed);

    return {
      connectionSpeed,
      bandwidth,
      latency
    };
  }

  static estimateBandwidth(connectionSpeed: 'slow' | 'medium' | 'fast'): number {
    switch (connectionSpeed) {
      case 'slow':
        return 256; // 256 kbps
      case 'medium':
        return 1024; // 1 Mbps
      case 'fast':
        return 5000; // 5 Mbps
      default:
        return 1024;
    }
  }

  static estimateLatency(connectionSpeed: 'slow' | 'medium' | 'fast'): number {
    switch (connectionSpeed) {
      case 'slow':
        return 500; // 500ms
      case 'medium':
        return 200; // 200ms
      case 'fast':
        return 50; // 50ms
      default:
        return 200;
    }
  }

  static getOptimalProfile(networkCondition: NetworkCondition): AdaptiveStreamingProfile {
    const { bandwidth, latency } = networkCondition;
    
    // Choose profile based on bandwidth and latency
    if (bandwidth < 512 || latency > 300) {
      return this.STREAMING_PROFILES[0]; // Low quality
    } else if (bandwidth < 2048 || latency > 150) {
      return this.STREAMING_PROFILES[1]; // Medium quality
    } else {
      return this.STREAMING_PROFILES[2]; // High quality
    }
  }

  static async createAdaptiveStream(
    inputPath: string, 
    networkCondition: NetworkCondition
  ): Promise<{
    streamUrl: string;
    profile: AdaptiveStreamingProfile;
    metadata: any;
  }> {
    const profile = this.getOptimalProfile(networkCondition);
    
    // Create optimized stream with adaptive quality
    const filename = `adaptive_${profile.id}_${Date.now()}.mp3`;
    const outputPath = `uploads/hd-audio/${filename}`;

    try {
      const ffmpeg = (await import('fluent-ffmpeg')).default;
      
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioBitrate(`${profile.bitrate / 1000}k`)
          .audioFrequency(profile.sampleRate)
          .audioChannels(profile.channels)
          .format('mp3')
          .outputOptions([
            '-movflags', 'faststart',
            '-preset', 'fast',
            '-bufsize', `${profile.bitrate / 8}`, // Buffer size in bytes
          ])
          .on('start', (commandLine) => {
            console.log(`Creating adaptive stream (${profile.name}):`, commandLine);
          })
          .on('progress', (progress) => {
            console.log(`Adaptive streaming: ${progress.percent}% done`);
          })
          .on('end', async () => {
            try {
              const metadata = await StreamingService.getAudioMetadata(outputPath);
              resolve({
                streamUrl: `/api/stream/adaptive/${filename}`,
                profile,
                metadata
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (err) => {
            console.error('Adaptive streaming error:', err);
            reject(err);
          })
          .save(outputPath);
      });
    } catch (error) {
      console.error('Error creating adaptive stream:', error);
      throw error;
    }
  }

  static async streamAdaptiveAudio(
    filename: string,
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Extract profile from filename
      const profileId = filename.split('_')[1];
      const profile = this.STREAMING_PROFILES.find(p => p.id === profileId);
      
      if (!profile) {
        res.status(400).json({ error: 'Invalid adaptive streaming profile' });
        return;
      }

      const filePath = `uploads/hd-audio/${filename}`;
      
      // Stream with adaptive chunk size based on profile
      const chunkSize = this.getAdaptiveChunkSize(profile);
      
      // Set adaptive headers
      res.set({
        'Accept-Ranges': 'bytes',
        'Content-Type': 'audio/mpeg',
        'X-Streaming-Profile': profile.id,
        'X-Streaming-Bitrate': profile.bitrate.toString(),
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
      });

      await StreamingService.streamAudioFile(filePath, req, res);
    } catch (error) {
      console.error('Error streaming adaptive audio:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream adaptive audio' });
      }
    }
  }

  static getAdaptiveChunkSize(profile: AdaptiveStreamingProfile): number {
    // Adaptive chunk size based on quality profile
    switch (profile.id) {
      case 'low':
        return 64 * 1024; // 64KB chunks for slow connections
      case 'medium':
        return 128 * 1024; // 128KB chunks
      case 'high':
        return 256 * 1024; // 256KB chunks
      default:
        return 128 * 1024;
    }
  }

  static getAllProfiles(): AdaptiveStreamingProfile[] {
    return this.STREAMING_PROFILES;
  }

  static async monitorStreamingPerformance(
    streamUrl: string,
    networkCondition: NetworkCondition
  ): Promise<{
    performance: 'good' | 'fair' | 'poor';
    recommendation: string;
    suggestedProfile?: AdaptiveStreamingProfile;
  }> {
    // Simulate performance monitoring
    const { bandwidth, latency } = networkCondition;
    
    let performance: 'good' | 'fair' | 'poor' = 'good';
    let recommendation = 'Current quality is optimal';
    let suggestedProfile: AdaptiveStreamingProfile | undefined;

    if (bandwidth < 512 || latency > 300) {
      performance = 'poor';
      recommendation = 'Consider switching to lower quality for better performance';
      suggestedProfile = this.STREAMING_PROFILES[0];
    } else if (bandwidth < 1024 || latency > 200) {
      performance = 'fair';
      recommendation = 'Performance is acceptable, but could be improved';
      suggestedProfile = this.STREAMING_PROFILES[1];
    }

    return {
      performance,
      recommendation,
      suggestedProfile
    };
  }

  static async cleanupAdaptiveStreams(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const audioDir = 'uploads/hd-audio';
      const files = await fs.promises.readdir(audioDir);
      const now = Date.now();
      
      for (const file of files) {
        if (file.startsWith('adaptive_')) {
          const filePath = path.join(audioDir, file);
          const stats = await fs.promises.stat(filePath);
          
          // Delete adaptive streams older than 2 hours
          if (now - stats.mtime.getTime() > 2 * 60 * 60 * 1000) {
            await fs.promises.unlink(filePath);
            console.log(`Cleaned up adaptive stream: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up adaptive streams:', error);
    }
  }
}

// Clean up adaptive streams every 30 minutes
setInterval(() => {
  AdaptiveStreamingService.cleanupAdaptiveStreams();
}, 30 * 60 * 1000);

