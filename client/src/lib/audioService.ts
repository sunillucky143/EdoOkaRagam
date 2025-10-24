import { queryClient } from './queryClient';

export interface AudioInfo {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
}

export interface HDConversionResult {
  id: string;
  originalUrl: string;
  hdUrl: string;
  originalInfo: AudioInfo;
  hdInfo: AudioInfo;
  conversionTime: number;
  cached?: boolean;
}

export interface AudioAnalysisResult {
  audioInfo: AudioInfo;
  isHD: boolean;
  hdSpecs: {
    bitrate: string;
    sampleRate: string;
    channels: number;
    format: string;
  };
  needsConversion: boolean;
}

export interface StreamingInfo {
  streaming: boolean;
  rangeRequests: boolean;
  chunkSize: number;
  supportedFormats: string[];
  features: string[];
}

export interface StreamingMetadata {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
  conversionId?: string;
  originalUrl?: string;
  hdUrl?: string;
  isHD?: boolean;
}

class AudioService {
  private conversionCache = new Map<string, HDConversionResult>();

  async analyzeAudio(url: string): Promise<AudioAnalysisResult> {
    try {
      const response = await fetch('/api/audio/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze audio');
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing audio:', error);
      throw error;
    }
  }

  async convertUrlToHD(url: string): Promise<HDConversionResult> {
    // Check cache first
    if (this.conversionCache.has(url)) {
      const cached = this.conversionCache.get(url)!;
      console.log('Using cached HD conversion for:', url);
      return { ...cached, cached: true };
    }

    try {
      const response = await fetch('/api/audio/convert/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert audio to HD');
      }

      const result = await response.json();
      
      if (result.success) {
        const conversion = result.conversion;
        this.conversionCache.set(url, conversion);
        
        // Cache for 1 hour
        setTimeout(() => {
          this.conversionCache.delete(url);
        }, 3600000);

        return conversion;
      } else {
        throw new Error('Conversion failed');
      }
    } catch (error) {
      console.error('Error converting URL to HD:', error);
      throw error;
    }
  }

  async convertUploadedFile(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload and convert audio to HD');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh the tracks list after successful upload
        await this.refreshTracks();
        return result;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async getAllTracks(): Promise<any[]> {
    try {
      const response = await fetch('/api/audio/tracks');
      
      if (!response.ok) {
        throw new Error('Failed to get tracks');
      }

      const result = await response.json();
      return result.tracks || [];
    } catch (error) {
      console.error('Error getting tracks:', error);
      return [];
    }
  }

  async refreshTracks(): Promise<void> {
    // This could be used to trigger a refresh in components that display tracks
    // For now, we'll just log that tracks have been refreshed
    console.log('Tracks refreshed');
  }

  async getConversion(id: string): Promise<HDConversionResult> {
    try {
      const response = await fetch(`/api/audio/conversion/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get conversion');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting conversion:', error);
      throw error;
    }
  }

  getHDSpecs(): Promise<{ bitrate: string; sampleRate: string; channels: number; format: string }> {
    return fetch('/api/audio/hd-specs')
      .then(response => response.json())
      .catch(error => {
        console.error('Error getting HD specs:', error);
        throw error;
      });
  }

  isHDAudio(audioInfo: AudioInfo): boolean {
    return (
      audioInfo.bitrate >= 256000 && // 256 kbps or higher
      audioInfo.sampleRate >= 44100 && // 44.1 kHz or higher
      audioInfo.channels >= 2 // Stereo or better
    );
  }

  formatBitrate(bitrate: number): string {
    if (bitrate >= 1000000) {
      return `${(bitrate / 1000000).toFixed(1)} Mbps`;
    } else if (bitrate >= 1000) {
      return `${(bitrate / 1000).toFixed(0)} kbps`;
    } else {
      return `${bitrate} bps`;
    }
  }

  formatSampleRate(sampleRate: number): string {
    if (sampleRate >= 1000) {
      return `${(sampleRate / 1000).toFixed(1)} kHz`;
    } else {
      return `${sampleRate} Hz`;
    }
  }

  formatFileSize(size: number): string {
    if (size >= 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    } else if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${size} B`;
    }
  }

  async getStreamingUrl(trackUrl: string, conversionId?: string): Promise<string> {
    try {
      if (conversionId) {
        // Use existing HD conversion for streaming
        return `/api/stream/conversion/${conversionId}`;
      }

      // Check if it's already HD
      const analysis = await this.analyzeAudio(trackUrl);
      
      if (analysis.isHD) {
        // For HD audio, use streaming endpoint
        return `/api/stream/external?url=${encodeURIComponent(trackUrl)}`;
      }

      // Convert to HD and get streaming URL
      const conversion = await this.convertUrlToHD(trackUrl);
      
      // Get streaming-optimized version
      const optimizeResponse = await fetch('/api/stream/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversionId: conversion.id }),
      });

      if (optimizeResponse.ok) {
        const result = await optimizeResponse.json();
        return result.streamingUrl;
      }

      // Fallback to HD URL
      return conversion.hdUrl;
    } catch (error) {
      console.error('Error getting streaming URL:', error);
      // Fallback to original URL
      return trackUrl;
    }
  }

  async getHDUrlForTrack(trackUrl: string): Promise<string> {
    try {
      // First check if it's already HD
      const analysis = await this.analyzeAudio(trackUrl);
      
      if (analysis.isHD) {
        return trackUrl;
      }

      // Convert to HD
      const conversion = await this.convertUrlToHD(trackUrl);
      return conversion.hdUrl;
    } catch (error) {
      console.error('Error getting HD URL:', error);
      // Fallback to original URL
      return trackUrl;
    }
  }

  async getStreamingInfo(): Promise<StreamingInfo> {
    try {
      const response = await fetch('/api/stream/info');
      return await response.json();
    } catch (error) {
      console.error('Error getting streaming info:', error);
      throw error;
    }
  }

  async getStreamingMetadata(filename: string): Promise<StreamingMetadata> {
    try {
      const response = await fetch(`/api/stream/metadata/${filename}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting streaming metadata:', error);
      throw error;
    }
  }

  async getStreamingMetadataForConversion(conversionId: string): Promise<StreamingMetadata> {
    try {
      const response = await fetch(`/api/stream/metadata/conversion/${conversionId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting conversion streaming metadata:', error);
      throw error;
    }
  }

  createStreamingAudioElement(src: string): HTMLAudioElement {
    const audio = new Audio();
    audio.src = src;
    audio.preload = 'metadata'; // Only load metadata initially
    
    // Enable seeking and streaming
    audio.addEventListener('loadstart', () => {
      console.log('Streaming: Started loading audio');
    });
    
    audio.addEventListener('canplay', () => {
      console.log('Streaming: Audio can start playing');
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.log('Streaming: Audio can play through without buffering');
    });
    
    audio.addEventListener('progress', () => {
      console.log('Streaming: Buffering progress');
    });
    
    audio.addEventListener('seeking', () => {
      console.log('Streaming: Seeking to position');
    });
    
    audio.addEventListener('seeked', () => {
      console.log('Streaming: Seek completed');
    });

    return audio;
  }

  isStreamingSupported(): boolean {
    // Check if the browser supports range requests
    return 'range' in document.createElement('audio').style || 
           typeof fetch !== 'undefined';
  }

  clearCache(): void {
    this.conversionCache.clear();
  }
}

export const audioService = new AudioService();
