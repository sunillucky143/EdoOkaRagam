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
  { id: "1", title: "Starlight", artist: "Luna Eclipse", album: "Midnight Dreams", duration: "3:45", albumCover: album1 },
  { id: "2", title: "Chasing Shadows", artist: "Luna Eclipse", album: "Midnight Dreams", duration: "4:12", albumCover: album1 },
  { id: "3", title: "Moonlit Path", artist: "Luna Eclipse", album: "Midnight Dreams", duration: "3:28", albumCover: album1 },
  { id: "4", title: "Electric Love", artist: "Neon Pulse", album: "Electric Hearts", duration: "3:55", albumCover: album2 },
  { id: "5", title: "Neon Nights", artist: "Neon Pulse", album: "Electric Hearts", duration: "4:20", albumCover: album2 },
  { id: "6", title: "Pulse of the City", artist: "Neon Pulse", album: "Electric Hearts", duration: "3:33", albumCover: album2 },
  { id: "7", title: "Deep Blue", artist: "Azure Sound", album: "Ocean Waves", duration: "5:10", albumCover: album3 },
  { id: "8", title: "Tidal Flow", artist: "Azure Sound", album: "Ocean Waves", duration: "4:45", albumCover: album3 },
  { id: "9", title: "Golden Sunrise", artist: "Sunset Collective", album: "Golden Hour", duration: "3:50", albumCover: album4 },
  { id: "10", title: "Dusk Till Dawn", artist: "Sunset Collective", album: "Golden Hour", duration: "4:05", albumCover: album4 },
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
