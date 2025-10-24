import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function RoomAddSongs() {
  const [, params] = useRoute("/room/:roomId/add");
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [tab, setTab] = useState<"songs" | "albums">("songs");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/audio/tracks');
        const data = await res.json();
        const all = data.tracks || [];
        setTracks(all);
        // Derive simple albums grouping
        const byAlbum: Record<string, any[]> = {};
        for (const t of all) {
          const key = t.album || "Unknown";
          byAlbum[key] = byAlbum[key] || [];
          byAlbum[key].push(t);
        }
        setAlbums(Object.entries(byAlbum).map(([name, items]) => ({ name, items })));
      } catch {}
    })();
  }, []);

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) =>
      (t.title||"").toLowerCase().includes(q) ||
      (t.artist||"").toLowerCase().includes(q) ||
      (t.album||"").toLowerCase().includes(q)
    );
  }, [tracks, query]);

  const filteredAlbums = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return albums;
    return albums.filter((a) => a.name.toLowerCase().includes(q) || a.items.some((t:any)=> (t.title||"").toLowerCase().includes(q)));
  }, [albums, query]);

  const bulkAdd = () => {
    const chosen = filteredTracks.filter(t => selected[t.id]);
    if (chosen.length === 0) return;
    sessionStorage.setItem('room.add.bulk', JSON.stringify(chosen));
    navigate(`/room/${params?.roomId}`);
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(`/room/${params?.roomId}`)}>Back</Button>
        <h1 className="font-display text-2xl font-bold">Add to Room Queue</h1>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Search songs or albums" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <div className="flex gap-1">
          <Button variant={tab==='songs'?"default":"outline"} onClick={()=>setTab('songs')}>Songs</Button>
          <Button variant={tab==='albums'?"default":"outline"} onClick={()=>setTab('albums')}>Albums</Button>
        </div>
      </div>

      {tab==='songs' && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Selected: {Object.values(selected).filter(Boolean).length}</div>
          <Button onClick={bulkAdd}>Add Selected</Button>
        </div>
      )}

      {tab === 'songs' ? (
        <div className="space-y-2">
          {filteredTracks.map((t) => (
            <Card key={t.id} className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Checkbox checked={!!selected[t.id]} onCheckedChange={(v)=> setSelected((s)=> ({ ...s, [t.id]: !!v }))} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{t.artist} • {t.album}</div>
                </div>
              </div>
              <Button size="sm" onClick={() => {
                sessionStorage.setItem('room.add.track', JSON.stringify(t));
                navigate(`/room/${params?.roomId}`);
              }}>Add</Button>
            </Card>
          ))}
          {filteredTracks.length === 0 && (
            <div className="text-muted-foreground">No songs found.</div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlbums.map((a) => (
            <Card key={a.name} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{a.name}</div>
                <Button size="sm" onClick={() => {
                  sessionStorage.setItem('room.add.album', JSON.stringify(a.items));
                  navigate(`/room/${params?.roomId}`);
                }}>Add All</Button>
              </div>
              <div className="space-y-1">
                {a.items.slice(0,5).map((t:any) => (
                  <div key={t.id} className="text-sm text-muted-foreground truncate">{t.title} • {t.artist}</div>
                ))}
              </div>
            </Card>
          ))}
          {filteredAlbums.length === 0 && (
            <div className="text-muted-foreground">No albums found.</div>
          )}
        </div>
      )}
    </div>
  );
}


