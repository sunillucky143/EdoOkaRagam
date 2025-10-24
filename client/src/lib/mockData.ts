// Clean data structure - only server tracks (no mock data)
import album1 from "@assets/stock_images/album_cover_music_vi_a1fa8e27.jpg";
import { audioService } from './audioService';

// Empty static tracks array - only use server data
const staticTracks: any[] = [];

// Get all tracks from server (only uploaded tracks)
export async function getAllTracks() {
  try {
    const tracks = await audioService.getAllTracks();
    return tracks;
  } catch (error) {
    console.error('Error fetching tracks from server:', error);
    // Return empty array if server fails
    return [];
  }
}

// Get uploaded tracks specifically
export async function getUploadedTracks() {
  try {
    const allTracks = await audioService.getAllTracks();
    // Filter tracks that have isHD: true or start with "uploaded_" in their ID
    return allTracks.filter(track => 
      track.isHD === true || 
      track.id.startsWith('uploaded_') ||
      track.title?.includes('[Uploaded]')
    );
  } catch (error) {
    console.error('Error fetching uploaded tracks:', error);
    return [];
  }
}

// Get uploads album
export async function getUploadsAlbum() {
  try {
    const uploadedTracks = await getUploadedTracks();
    return {
      id: "uploads",
      title: "My Uploads",
      artist: "You",
      cover: album1, // Default cover for uploads
      year: new Date().getFullYear(),
      tracks: uploadedTracks.length,
      uploadedTracks: uploadedTracks
    };
  } catch (error) {
    console.error('Error fetching uploads album:', error);
    return {
      id: "uploads",
      title: "My Uploads",
      artist: "You", 
      cover: album1,
      year: new Date().getFullYear(),
      tracks: 0,
      uploadedTracks: []
    };
  }
}

// Export empty arrays for backward compatibility
export const availableTracks = staticTracks;
export const availableAlbums: any[] = [];
export const availablePlaylists: any[] = [];
export const availableArtists: any[] = [];

// Legacy exports for backward compatibility
export const mockTracks = staticTracks;
export const mockAlbums: any[] = [];
export const mockPlaylists: any[] = [];
export const mockArtists: any[] = [];