import express, { type Request, Response } from "express";
import path from "path";
import { StreamingService } from "./streamingService.js";
import { AdaptiveStreamingService } from "./adaptiveStreaming.js";
import { storage } from "./storage.js";

const router = express.Router();

// Stream HD audio files with range support
router.get('/audio/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'hd-audio', filename);
    
    await StreamingService.streamAudioFile(filePath, req, res);
  } catch (error) {
    console.error('Error streaming audio file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream audio file' });
    }
  }
});

// Stream HD conversion by ID
router.get('/conversion/:conversionId', async (req: Request, res: Response) => {
  try {
    const { conversionId } = req.params;
    await StreamingService.streamHDConversion(conversionId, req, res);
  } catch (error) {
    console.error('Error streaming HD conversion:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream HD conversion' });
    }
  }
});

// Stream external URLs (proxy with range support)
router.get('/external', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    await StreamingService.streamExternalUrl(url, req, res);
  } catch (error) {
    console.error('Error streaming external URL:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream external audio' });
    }
  }
});

// Get audio metadata for streaming
router.get('/metadata/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'hd-audio', filename);
    
    const metadata = await StreamingService.getAudioMetadata(filePath);
    res.json(metadata);
  } catch (error) {
    console.error('Error getting audio metadata:', error);
    res.status(500).json({ error: 'Failed to get audio metadata' });
  }
});

// Get metadata for HD conversion
router.get('/metadata/conversion/:conversionId', async (req: Request, res: Response) => {
  try {
    const { conversionId } = req.params;
    const conversion = await storage.getHDAudioConversion(conversionId);
    
    if (!conversion) {
      return res.status(404).json({ error: 'HD conversion not found' });
    }

    const filename = path.basename(conversion.hdUrl);
    const filePath = path.join(process.cwd(), 'uploads', 'hd-audio', filename);
    
    const metadata = await StreamingService.getAudioMetadata(filePath);
    res.json({
      ...metadata,
      conversionId: conversion.id,
      originalUrl: conversion.originalUrl,
      hdUrl: conversion.hdUrl,
      isHD: true
    });
  } catch (error) {
    console.error('Error getting HD conversion metadata:', error);
    res.status(500).json({ error: 'Failed to get HD conversion metadata' });
  }
});

// Create streaming-optimized version
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const { conversionId, url } = req.body;
    
    let inputPath: string;
    
    if (conversionId) {
      // Optimize existing HD conversion
      const conversion = await storage.getHDAudioConversion(conversionId);
      if (!conversion) {
        return res.status(404).json({ error: 'HD conversion not found' });
      }
      
      const filename = path.basename(conversion.hdUrl);
      inputPath = path.join(process.cwd(), 'uploads', 'hd-audio', filename);
    } else if (url) {
      // Optimize external URL (download first)
      const { AudioProcessor } = await import('./audioProcessor.js');
      const result = await AudioProcessor.convertFromUrl(url);
      inputPath = result.hdUrl.replace('/api/audio/hd/', path.join(process.cwd(), 'uploads', 'hd-audio/'));
    } else {
      return res.status(400).json({ error: 'conversionId or url is required' });
    }

    const result = await StreamingService.createOptimizedStreamingFile(inputPath);
    
    res.json({
      success: true,
      streamingUrl: result.url,
      metadata: result.metadata,
      optimized: true
    });
  } catch (error) {
    console.error('Error creating streaming-optimized file:', error);
    res.status(500).json({ error: 'Failed to create streaming-optimized file' });
  }
});

// Adaptive streaming endpoints
router.get('/adaptive/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    await AdaptiveStreamingService.streamAdaptiveAudio(filename, req, res);
  } catch (error) {
    console.error('Error streaming adaptive audio:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream adaptive audio' });
    }
  }
});

// Create adaptive stream
router.post('/adaptive/create', async (req: Request, res: Response) => {
  try {
    const { conversionId, url } = req.body;
    
    let inputPath: string;
    
    if (conversionId) {
      // Use existing HD conversion
      const conversion = await storage.getHDAudioConversion(conversionId);
      if (!conversion) {
        return res.status(404).json({ error: 'HD conversion not found' });
      }
      
      const filename = path.basename(conversion.hdUrl);
      inputPath = path.join(process.cwd(), 'uploads', 'hd-audio', filename);
    } else if (url) {
      // Use external URL (download first)
      const { AudioProcessor } = await import('./audioProcessor.js');
      const result = await AudioProcessor.convertFromUrl(url);
      inputPath = result.hdUrl.replace('/api/audio/hd/', path.join(process.cwd(), 'uploads', 'hd-audio/'));
    } else {
      return res.status(400).json({ error: 'conversionId or url is required' });
    }

    // Detect network condition
    const networkCondition = await AdaptiveStreamingService.detectNetworkCondition(req);
    
    // Create adaptive stream
    const result = await AdaptiveStreamingService.createAdaptiveStream(inputPath, networkCondition);
    
    res.json({
      success: true,
      streamingUrl: result.streamUrl,
      profile: result.profile,
      metadata: result.metadata,
      networkCondition,
      adaptive: true
    });
  } catch (error) {
    console.error('Error creating adaptive stream:', error);
    res.status(500).json({ error: 'Failed to create adaptive stream' });
  }
});

// Get adaptive streaming profiles
router.get('/adaptive/profiles', (req: Request, res: Response) => {
  res.json(AdaptiveStreamingService.getAllProfiles());
});

// Monitor streaming performance
router.post('/adaptive/monitor', async (req: Request, res: Response) => {
  try {
    const { streamUrl } = req.body;
    const networkCondition = await AdaptiveStreamingService.detectNetworkCondition(req);
    
    const monitoring = await AdaptiveStreamingService.monitorStreamingPerformance(
      streamUrl,
      networkCondition
    );
    
    res.json({
      ...monitoring,
      networkCondition
    });
  } catch (error) {
    console.error('Error monitoring streaming performance:', error);
    res.status(500).json({ error: 'Failed to monitor streaming performance' });
  }
});

// Get streaming info
router.get('/info', (req: Request, res: Response) => {
  res.json({
    streaming: true,
    rangeRequests: true,
    chunkSize: StreamingService.getStreamingChunkSize(0),
    supportedFormats: ['mp3', 'mpeg'],
    adaptiveStreaming: true,
    features: [
      'HTTP Range Requests',
      'Partial Content Streaming',
      'Adaptive Chunk Sizes',
      'Progressive Download',
      'Seek Support',
      'Adaptive Bitrate Streaming',
      'Network-Aware Quality Adjustment'
    ]
  });
});

export { router as streamingRoutes };
