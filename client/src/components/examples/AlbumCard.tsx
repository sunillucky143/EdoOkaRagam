import { AlbumCard } from "../AlbumCard";
import { mockAlbums } from "@/lib/mockData";

export default function AlbumCardExample() {
  return (
    <div className="p-8 bg-background">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {mockAlbums.slice(0, 5).map((album) => (
          <AlbumCard key={album.id} {...album} />
        ))}
      </div>
    </div>
  );
}
