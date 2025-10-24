import { AlbumCard } from "@/components/AlbumCard";
import { TrackRow } from "@/components/TrackRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { availableAlbums, availablePlaylists, availableArtists, getUploadsAlbum } from "@/lib/mockData";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function Library() {
  const [uploadsAlbum, setUploadsAlbum] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUploadsAlbum = async () => {
    try {
      setIsLoading(true);
      const album = await getUploadsAlbum();
      setUploadsAlbum(album);
    } catch (error) {
      console.error('Error loading uploads album:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUploadsAlbum();
  }, []);

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 md:p-8 space-y-4 md:space-y-6">
        <h1 className="font-display text-2xl md:text-4xl font-bold">Your Library</h1>

        <Tabs defaultValue="playlists" className="w-full">
          <TabsList data-testid="tabs-library">
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
          </TabsList>

          <TabsContent value="playlists" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {availablePlaylists.map((playlist) => (
                <AlbumCard
                  key={playlist.id}
                  id={playlist.id}
                  title={playlist.name}
                  artist={`${playlist.trackCount} tracks`}
                  cover={playlist.cover}
                />
              ))}
            </div>
            {availablePlaylists.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No playlists available. Create some playlists to get started!
              </p>
            )}
          </TabsContent>

          <TabsContent value="albums" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {uploadsAlbum && uploadsAlbum.tracks > 0 && (
                <AlbumCard 
                  key={uploadsAlbum.id} 
                  {...uploadsAlbum}
                  onPlay={() => {
                    // Navigate to uploads tab when clicked
                    const uploadsTab = document.querySelector('[value="uploads"]') as HTMLElement;
                    uploadsTab?.click();
                  }}
                />
              )}
              {availableAlbums.map((album) => (
                <AlbumCard key={album.id} {...album} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="uploads" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading your uploads...</div>
              </div>
            ) : uploadsAlbum && uploadsAlbum.uploadedTracks.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={uploadsAlbum.cover}
                      alt={uploadsAlbum.title}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div>
                      <h2 className="font-display text-2xl font-bold">{uploadsAlbum.title}</h2>
                      <p className="text-muted-foreground">{uploadsAlbum.artist} • {uploadsAlbum.tracks} track{uploadsAlbum.tracks !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadUploadsAlbum}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {uploadsAlbum.uploadedTracks.map((track: any, index: number) => (
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
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
                  <p className="text-sm">Upload your first music file to see it here!</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="artists" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex flex-col items-center gap-4 p-6 rounded-lg hover-elevate cursor-pointer"
                  data-testid={`card-artist-${artist.id}`}
                >
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="h-40 w-40 rounded-full object-cover"
                  />
                  <div className="text-center">
                    <h3 className="font-semibold">{artist.name}</h3>
                    <p className="text-sm text-muted-foreground">Artist</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
