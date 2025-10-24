import { AlbumCard } from "@/components/AlbumCard";
import { TrackRow } from "@/components/TrackRow";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/JoinRoomDialog";
import { Button } from "@/components/ui/button";
import { availableAlbums, getAllTracks } from "@/lib/mockData";
import { audioService } from "@/lib/audioService";
import heroBg from "@assets/stock_images/music_concert_crowd__56613b88.jpg";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function Home() {
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTracks = async (isBackgroundRefresh = false) => {
    try {
      if (isBackgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const tracks = await audioService.getAllTracks();
      
      // Only update if tracks actually changed
      if (tracks.length !== allTracks.length || 
          tracks.some((track, index) => track.id !== allTracks[index]?.id)) {
        setAllTracks(tracks);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      // Fallback to static tracks if server fails
      const fallbackTracks = await getAllTracks();
      setAllTracks(fallbackTracks);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, []);

  // Auto-refresh tracks every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTracks(true); // Background refresh
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [allTracks.length]); // Re-run when track count changes

  return (
    <div className="h-full overflow-auto">
      <div
        className="relative h-64 md:h-80 flex items-center px-4 md:px-8 mb-6 md:mb-8"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
        <div className="relative z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-6xl font-bold mb-2 md:mb-4 text-white">
                Welcome Back
              </h1>
              <p className="text-base md:text-xl text-white/90">
                Your personal music universe awaits
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <CreateRoomDialog />
              <JoinRoomDialog />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-6 md:space-y-8">
        <section>
          <h2 className="font-display text-xl md:text-2xl font-semibold mb-3 md:mb-4" data-testid="text-section-title">
            Available Albums
          </h2>
          {availableAlbums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-muted-foreground mb-4">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-muted-foreground text-sm">
                No albums available yet. Upload music to create albums.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {availableAlbums.map((album) => (
                <AlbumCard key={album.id} {...album} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl md:text-2xl font-semibold">
                Available Tracks
              </h2>
              {isRefreshing && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadTracks(true)}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading tracks...</div>
            </div>
          ) : allTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No tracks available</h3>
              <p className="text-muted-foreground mb-4">
                Upload some music to get started!
              </p>
              <p className="text-sm text-muted-foreground">
                Use the upload button to add your favorite songs.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1">
              {allTracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  {...track}
                  number={index + 1}
                  isPlaying={false}
                  audioUrl={track.audioUrl}
                  isHD={track.isHD}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
