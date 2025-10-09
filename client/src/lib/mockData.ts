// TODO: remove mock functionality
import album1 from "@assets/stock_images/album_cover_music_vi_a1fa8e27.jpg";
import album2 from "@assets/stock_images/album_cover_music_vi_933ee067.jpg";
import album3 from "@assets/stock_images/album_cover_music_vi_40499e58.jpg";
import album4 from "@assets/stock_images/album_cover_music_vi_1bf8a636.jpg";
import album5 from "@assets/stock_images/album_cover_music_vi_be25d568.jpg";
import artist1 from "@assets/stock_images/musician_artist_perf_1eb15fc2.jpg";
import artist2 from "@assets/stock_images/musician_artist_perf_244530ea.jpg";
import artist3 from "@assets/stock_images/musician_artist_perf_7da9f39f.jpg";

export const mockAlbums = [
  {
    id: "1",
    title: "Midnight Dreams",
    artist: "Luna Eclipse",
    cover: album1,
    year: 2024,
    tracks: 12,
  },
  {
    id: "2",
    title: "Electric Hearts",
    artist: "Neon Pulse",
    cover: album2,
    year: 2024,
    tracks: 10,
  },
  {
    id: "3",
    title: "Ocean Waves",
    artist: "Azure Sound",
    cover: album3,
    year: 2023,
    tracks: 14,
  },
  {
    id: "4",
    title: "Golden Hour",
    artist: "Sunset Collective",
    cover: album4,
    year: 2024,
    tracks: 8,
  },
  {
    id: "5",
    title: "Urban Echoes",
    artist: "Metro Beats",
    cover: album5,
    year: 2023,
    tracks: 11,
  },
];

export const mockTracks = [
  { 
    id: "1", 
    title: "Acoustic Breeze", 
    artist: "Benjamin Tissot", 
    album: "Acoustic Collection", 
    duration: "2:37", 
    albumCover: album1,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3"
  },
  { 
    id: "2", 
    title: "Sunny", 
    artist: "Benjamin Tissot", 
    album: "Upbeat Vibes", 
    duration: "2:20", 
    albumCover: album1,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-sunny.mp3"
  },
  { 
    id: "3", 
    title: "Tomorrow", 
    artist: "Benjamin Tissot", 
    album: "Cinematic Dreams", 
    duration: "4:54", 
    albumCover: album1,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-tomorrow.mp3"
  },
  { 
    id: "4", 
    title: "Ukulele", 
    artist: "Benjamin Tissot", 
    album: "Happy Tunes", 
    duration: "2:26", 
    albumCover: album2,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-ukulele.mp3"
  },
  { 
    id: "5", 
    title: "Energy", 
    artist: "Benjamin Tissot", 
    album: "Electronic Beats", 
    duration: "2:59", 
    albumCover: album2,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-energy.mp3"
  },
  { 
    id: "6", 
    title: "Going Higher", 
    artist: "Benjamin Tissot", 
    album: "Inspiring Music", 
    duration: "4:04", 
    albumCover: album2,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-goinghigher.mp3"
  },
  { 
    id: "7", 
    title: "Summer", 
    artist: "Benjamin Tissot", 
    album: "Summer Vibes", 
    duration: "3:59", 
    albumCover: album3,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-summer.mp3"
  },
  { 
    id: "8", 
    title: "Memories", 
    artist: "Benjamin Tissot", 
    album: "Emotional Journey", 
    duration: "3:50", 
    albumCover: album3,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-memories.mp3"
  },
  { 
    id: "9", 
    title: "Creative Minds", 
    artist: "Benjamin Tissot", 
    album: "Innovation", 
    duration: "2:26", 
    albumCover: album4,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-creativeminds.mp3"
  },
  { 
    id: "10", 
    title: "Tenderness", 
    artist: "Benjamin Tissot", 
    album: "Piano Collection", 
    duration: "2:03", 
    albumCover: album4,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-tenderness.mp3"
  },
  { 
    id: "11", 
    title: "Happy Rock", 
    artist: "Benjamin Tissot", 
    album: "Rock Anthems", 
    duration: "1:45", 
    albumCover: album5,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-happyrock.mp3"
  },
  { 
    id: "12", 
    title: "Dubstep", 
    artist: "Benjamin Tissot", 
    album: "Electronic Energy", 
    duration: "2:03", 
    albumCover: album5,
    audioUrl: "https://www.bensound.com/bensound-music/bensound-dubstep.mp3"
  },
];

export const mockPlaylists = [
  { id: "1", name: "Chill Vibes", trackCount: 24, cover: album1 },
  { id: "2", name: "Workout Mix", trackCount: 18, cover: album2 },
  { id: "3", name: "Study Sessions", trackCount: 32, cover: album3 },
  { id: "4", name: "Evening Unwind", trackCount: 15, cover: album4 },
];

export const mockArtists = [
  { id: "1", name: "Luna Eclipse", image: artist1, monthlyListeners: "2.5M" },
  { id: "2", name: "Neon Pulse", image: artist2, monthlyListeners: "1.8M" },
  { id: "3", name: "Azure Sound", image: artist3, monthlyListeners: "3.2M" },
];
