import { AlbumCard } from "@/components/AlbumCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAlbums, mockPlaylists, mockArtists } from "@/lib/mockData";

export default function Library() {
  return (
    <div className="h-full overflow-auto pb-32">
      <div className="p-8 space-y-6">
        <h1 className="font-display text-4xl font-bold">Your Library</h1>

        <Tabs defaultValue="playlists" className="w-full">
          <TabsList data-testid="tabs-library">
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
          </TabsList>

          <TabsContent value="playlists" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {mockPlaylists.map((playlist) => (
                <AlbumCard
                  key={playlist.id}
                  id={playlist.id}
                  title={playlist.name}
                  artist={`${playlist.trackCount} tracks`}
                  cover={playlist.cover}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="albums" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {mockAlbums.map((album) => (
                <AlbumCard key={album.id} {...album} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="artists" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mockArtists.map((artist) => (
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
