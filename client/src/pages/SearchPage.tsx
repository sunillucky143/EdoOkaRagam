import { SearchBar } from "@/components/SearchBar";
import { AlbumCard } from "@/components/AlbumCard";
import { TrackRow } from "@/components/TrackRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAlbums, mockTracks, mockArtists } from "@/lib/mockData";
import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const handleGenreClick = (genre: string) => {
    setQuery(genre);
  };

  return (
    <div className="h-full overflow-auto pb-32">
      <div className="p-8 space-y-6">
        <div className="flex flex-col items-center gap-6 py-12">
          <h1 className="font-display text-4xl font-bold">Search</h1>
          <SearchBar onSearch={setQuery} />
        </div>

        {query ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6" data-testid="tabs-search">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="albums">Albums</TabsTrigger>
              <TabsTrigger value="artists">Artists</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-8">
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">Top Result</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AlbumCard {...mockAlbums[0]} />
                </div>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">Tracks</h2>
                <div className="space-y-1">
                  {mockTracks.slice(0, 4).map((track, index) => (
                    <TrackRow key={track.id} {...track} number={index + 1} />
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="tracks">
              <div className="space-y-1">
                {mockTracks.map((track, index) => (
                  <TrackRow key={track.id} {...track} number={index + 1} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="albums">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {mockAlbums.map((album) => (
                  <AlbumCard key={album.id} {...album} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="artists">
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
                      <p className="text-sm text-muted-foreground">
                        {artist.monthlyListeners} monthly listeners
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">Browse All</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {["Pop", "Rock", "Hip Hop", "Electronic", "Jazz", "Classical", "R&B", "Country"].map(
                (genre) => (
                  <div
                    key={genre}
                    className="aspect-square rounded-md bg-gradient-to-br from-primary/80 to-chart-2/80 p-6 flex items-end cursor-pointer hover-elevate transition-all"
                    onClick={() => handleGenreClick(genre)}
                    data-testid={`card-genre-${genre}`}
                  >
                    <h3 className="font-display text-2xl font-bold text-white">
                      {genre}
                    </h3>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
