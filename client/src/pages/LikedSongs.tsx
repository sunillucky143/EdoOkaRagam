import { TrackRow } from "@/components/TrackRow";
import { useEffect, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export default function LikedSongs() {
  const currentUserId = "current-user";
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playQueue } = useAudioPlayer();

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/likes/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Listen for likes list invalidations to live-refresh this page
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'invalidated' && Array.isArray((event as any).query?.queryKey)) {
        const key = (event as any).query.queryKey.join('/');
        if (key === `/api/likes/${currentUserId}`) {
          load();
        }
      }
    });
    return () => { unsubscribe(); };
  }, []);

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 md:p-8 space-y-4 md:space-y-6">
        <h1 className="font-display text-2xl md:text-4xl font-bold">Liked Songs</h1>

        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : tracks.length === 0 ? (
          <div className="text-muted-foreground">No liked songs yet</div>
        ) : (
          <div className="space-y-1">
            {tracks.map((track: any, index: number) => (
              <TrackRow
                key={track.id}
                {...track}
                number={index + 1}
                audioUrl={track.audioUrl}
                isHD={track.isHD}
                onPlay={() => playQueue(tracks, index, 'liked')}
                onLikedChange={(isLiked) => {
                  if (!isLiked) {
                    // Remove from local list immediately for responsive UI
                    setTracks(prev => prev.filter((t:any) => t.id !== track.id));
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


