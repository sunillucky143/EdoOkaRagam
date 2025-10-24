import express, { type Request, Response } from "express";
import multer from "multer";
import path from "path";
import { AudioProcessor } from "./audioProcessor.js";
import { storage } from "./storageFactory.js";
import type { InsertHDAudioConversion } from "@shared/schema";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(process.cwd(), 'temp'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Serve HD audio files
router.get('/hd/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'hd-audio', filename);
  
  // Check if request was aborted
  req.on('aborted', () => {
    console.log('Request aborted for HD audio file:', filename);
  });
  
  res.sendFile(filePath, (err) => {
    if (err) {
      // Check if response headers have already been sent
      if (res.headersSent) {
        console.error('Error serving HD audio file (headers already sent):', err.message);
        return;
      }
      
      console.error('Error serving HD audio file:', err);
      
      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
        res.status(404).json({ error: 'HD audio file not found' });
      }
    }
  });
});

// Serve default album cover
router.get('/default-album-cover.jpg', (req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), 'attached_assets', 'stock_images', 'album_cover_music_vi_a1fa8e27.jpg');
  
  // Check if request was aborted
  req.on('aborted', () => {
    console.log('Request aborted for default album cover');
  });
  
  res.sendFile(filePath, (err) => {
    if (err) {
      // Check if response headers have already been sent
      if (res.headersSent) {
        console.error('Error serving default album cover (headers already sent):', err.message);
        return;
      }
      
      console.error('Error serving default album cover:', err);
      
      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
        res.status(404).json({ error: 'Default album cover not found' });
      }
    }
  });
});

// Upload and convert audio to HD (adds to track list)
router.post('/upload', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Get metadata from the original file
    const originalInfo = await AudioProcessor.getAudioInfo(req.file.path);
    
    // Convert to HD
    const result = await AudioProcessor.convertToHD(req.file.path, `${req.file.filename}_hd.mp3`);
    
    // Generate track metadata
    const trackId = `uploaded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = req.file.originalname.replace(/\.[^/.]+$/, ""); // Remove extension
    
    // Save conversion record to database first to get the conversion ID
    const conversion = await storage.createHDAudioConversion({
      originalUrl: req.file.originalname,
      hdUrl: result.hdUrl,
      originalBitrate: result.originalInfo.bitrate,
      originalSampleRate: result.originalInfo.sampleRate,
      originalChannels: result.originalInfo.channels,
      originalFormat: result.originalInfo.format,
      originalSize: result.originalInfo.size,
      hdBitrate: result.hdInfo.bitrate,
      hdSampleRate: result.hdInfo.sampleRate,
      hdChannels: result.hdInfo.channels,
      hdFormat: result.hdInfo.format,
      hdSize: result.hdInfo.size,
      conversionTime: result.conversionTime,
    });

    // Create track object
    const newTrack = {
      id: trackId,
      title: filename,
      artist: "Unknown Artist", // Could be extracted from metadata in future
      album: "Uploaded Music",
      duration: Math.round(originalInfo.duration / 60) + ":" + (Math.round(originalInfo.duration % 60)).toString().padStart(2, '0'),
      albumCover: "/api/audio/default-album-cover.jpg", // Default cover
      audioUrl: `/api/audio/hd/${result.hdUrl.split('/').pop()}`,
      hdAudioUrl: `/api/stream/conversion/${conversion.id}`,
      isHD: true
    };

    // Add track to storage (this will be used by the client)
    const createdTrack = await storage.createTrack({
      title: newTrack.title,
      artist: newTrack.artist,
      album: newTrack.album,
      duration: newTrack.duration,
      albumCover: newTrack.albumCover,
      audioUrl: newTrack.audioUrl,
      hdAudioUrl: newTrack.hdAudioUrl,
      isHD: newTrack.isHD,
      uploadedBy: "system", // TODO: Get from authenticated user
      fileSize: originalInfo.size,
      format: originalInfo.format,
      bitrate: originalInfo.bitrate,
      sampleRate: originalInfo.sampleRate,
      channels: originalInfo.channels,
    });

    // Clean up uploaded file
    const fs = await import('fs');
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      track: createdTrack,
      conversion: {
        id: conversion.id,
        originalUrl: conversion.originalUrl,
        hdUrl: conversion.hdUrl,
        originalInfo: result.originalInfo,
        hdInfo: result.hdInfo,
        conversionTime: result.conversionTime,
      }
    });
  } catch (error) {
    console.error('Error uploading and converting audio:', error);
    res.status(500).json({ error: 'Failed to upload and convert audio to HD' });
  }
});

// Convert uploaded audio to HD (legacy endpoint)
router.post('/convert/upload', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const result = await AudioProcessor.convertToHD(req.file.path, `${req.file.filename}_hd.mp3`);
    
    // Save conversion record to database
    const conversion = await storage.createHDAudioConversion({
      originalUrl: req.file.originalname,
      hdUrl: result.hdUrl,
      originalBitrate: result.originalInfo.bitrate,
      originalSampleRate: result.originalInfo.sampleRate,
      originalChannels: result.originalInfo.channels,
      originalFormat: result.originalInfo.format,
      originalSize: result.originalInfo.size,
      hdBitrate: result.hdInfo.bitrate,
      hdSampleRate: result.hdInfo.sampleRate,
      hdChannels: result.hdInfo.channels,
      hdFormat: result.hdInfo.format,
      hdSize: result.hdInfo.size,
      conversionTime: result.conversionTime,
    });

    // Clean up uploaded file
    const fs = await import('fs');
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      conversion: {
        id: conversion.id,
        originalUrl: conversion.originalUrl,
        hdUrl: conversion.hdUrl,
        originalInfo: result.originalInfo,
        hdInfo: result.hdInfo,
        conversionTime: result.conversionTime,
      }
    });
  } catch (error) {
    console.error('Error converting uploaded audio:', error);
    res.status(500).json({ error: 'Failed to convert audio to HD' });
  }
});

// Convert external URL to HD
router.post('/convert/url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check if we already have a conversion for this URL
    const existingConversion = await storage.getHDAudioConversionByOriginalUrl(url);
    if (existingConversion) {
      return res.json({
        success: true,
        conversion: existingConversion,
        cached: true
      });
    }

    const result = await AudioProcessor.convertFromUrl(url);
    
    // Save conversion record to database
    const conversion = await storage.createHDAudioConversion({
      originalUrl: url,
      hdUrl: result.hdUrl,
      originalBitrate: result.originalInfo.bitrate,
      originalSampleRate: result.originalInfo.sampleRate,
      originalChannels: result.originalInfo.channels,
      originalFormat: result.originalInfo.format,
      originalSize: result.originalInfo.size,
      hdBitrate: result.hdInfo.bitrate,
      hdSampleRate: result.hdInfo.sampleRate,
      hdChannels: result.hdInfo.channels,
      hdFormat: result.hdInfo.format,
      hdSize: result.hdInfo.size,
      conversionTime: result.conversionTime,
    });

    res.json({
      success: true,
      conversion: {
        id: conversion.id,
        originalUrl: conversion.originalUrl,
        hdUrl: conversion.hdUrl,
        originalInfo: result.originalInfo,
        hdInfo: result.hdInfo,
        conversionTime: result.conversionTime,
      },
      cached: false
    });
  } catch (error) {
    console.error('Error converting URL to HD:', error);
    res.status(500).json({ error: 'Failed to convert URL to HD' });
  }
});

// Get audio info without conversion
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { url, filePath } = req.body;
    
    if (!url && !filePath) {
      return res.status(400).json({ error: 'URL or filePath is required' });
    }

    const audioInfo = url 
      ? await AudioProcessor.getAudioInfo(url)
      : await AudioProcessor.getAudioInfo(filePath);
    
    const isHD = AudioProcessor.isHDAudio(audioInfo);
    const hdSpecs = AudioProcessor.getHDSpecs();

    res.json({
      audioInfo,
      isHD,
      hdSpecs,
      needsConversion: !isHD
    });
  } catch (error) {
    console.error('Error analyzing audio:', error);
    res.status(500).json({ error: 'Failed to analyze audio' });
  }
});

// Get conversion by ID
router.get('/conversion/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conversion = await storage.getHDAudioConversion(id);
    
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    res.json(conversion);
  } catch (error) {
    console.error('Error getting conversion:', error);
    res.status(500).json({ error: 'Failed to get conversion' });
  }
});

// Get HD specs
router.get('/hd-specs', (req: Request, res: Response) => {
  res.json(AudioProcessor.getHDSpecs());
});

// Get all tracks (including uploaded ones)
router.get('/tracks', async (req: Request, res: Response) => {
  try {
    const tracks = await storage.getAllTracks();
    res.json({
      success: true,
      tracks,
      count: tracks.length
    });
  } catch (error) {
    console.error('Error getting tracks:', error);
    res.status(500).json({ error: 'Failed to get tracks' });
  }
});

// Get individual track audio stream
router.get('/tracks/:trackId/stream', async (req: Request, res: Response) => {
  try {
    const { trackId } = req.params;
    const tracks = await storage.getAllTracks();
    const track = tracks.find(t => t.id === trackId);
    
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    // Return the audio URL for the track
    res.json({
      success: true,
      audioUrl: track.audioUrl || track.hdAudioUrl
    });
  } catch (error) {
    console.error('Error getting track stream:', error);
    res.status(500).json({ error: 'Failed to get track stream' });
  }
});

export { router as audioRoutes };
