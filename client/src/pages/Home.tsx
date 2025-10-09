import { AlbumCard } from "@/components/AlbumCard";
import { TrackRow } from "@/components/TrackRow";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/JoinRoomDialog";
import { mockAlbums, mockTracks } from "@/lib/mockData";
import heroBg from "@assets/stock_images/music_concert_crowd__56613b88.jpg";

export default function Home() {
  return (
    <div className="h-full overflow-auto pb-32">
      <div
        className="relative h-80 flex items-center px-8 mb-8"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
        <div className="relative z-10 w-full">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display text-6xl font-bold mb-4 text-white">
                Welcome Back
              </h1>
              <p className="text-xl text-white/90">
                Your personal music universe awaits
              </p>
            </div>
            <div className="flex gap-3">
              <CreateRoomDialog />
              <JoinRoomDialog />
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 space-y-8">
        <section>
          <h2 className="font-display text-2xl font-semibold mb-4" data-testid="text-section-title">
            Recently Played
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {mockAlbums.map((album) => (
              <AlbumCard key={album.id} {...album} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">
            Recommended for You
          </h2>
          <div className="space-y-1">
            {mockTracks.slice(0, 5).map((track, index) => (
              <TrackRow
                key={track.id}
                {...track}
                number={index + 1}
                isPlaying={index === 0}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">
            New Releases
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {mockAlbums.slice(0, 5).map((album) => (
              <AlbumCard key={album.id} {...album} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
