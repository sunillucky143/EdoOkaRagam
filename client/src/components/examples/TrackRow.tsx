import { TrackRow } from "../TrackRow";
import { availableTracks } from "@/lib/mockData";

export default function TrackRowExample() {
  return (
    <div className="p-8 bg-background">
      <div className="space-y-1">
        {availableTracks.slice(0, 5).map((track, index) => (
          <TrackRow
            key={track.id}
            {...track}
            number={index + 1}
            isPlaying={index === 0}
            audioUrl={track.audioUrl}
          />
        ))}
      </div>
    </div>
  );
}
