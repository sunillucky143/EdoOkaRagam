import { AudioPlayer } from "../AudioPlayer";
import { mockTracks } from "@/lib/mockData";

export default function AudioPlayerExample() {
  return (
    <div className="h-32 bg-background">
      <AudioPlayer track={mockTracks[0]} />
    </div>
  );
}
