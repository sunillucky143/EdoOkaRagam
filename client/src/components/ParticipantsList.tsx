import { Users, Crown, ToggleRight, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RoomParticipant } from "@shared/schema";

interface ParticipantsListProps {
  participants: RoomParticipant[];
  hostId: string;
  currentUserId: string;
  onTogglePermissions?: (userId: string, canControl: boolean) => void;
}

export function ParticipantsList({
  participants,
  hostId,
  currentUserId,
  onTogglePermissions,
}: ParticipantsListProps) {
  const isHost = currentUserId === hostId;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">
          Participants ({participants.length})
        </h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2 px-4">
          {participants.map((participant) => {
            const isParticipantHost = participant.userId === hostId;
            const initials = participant.username
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={participant.id}
                className="flex items-center justify-between gap-3 p-3 rounded-md hover-elevate"
                data-testid={`participant-${participant.userId}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {participant.username}
                      </span>
                      {isParticipantHost && (
                        <Crown className="h-4 w-4 text-chart-2 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {participant.canControl ? "Can control" : "Listening"}
                    </span>
                  </div>
                </div>

                {isHost && !isParticipantHost && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => {
                      onTogglePermissions?.(
                        participant.userId,
                        !participant.canControl,
                      );
                      console.log(
                        `Toggled permissions for ${participant.username}`,
                      );
                    }}
                    data-testid={`button-toggle-permission-${participant.userId}`}
                  >
                    {participant.canControl ? (
                      <ToggleRight className="h-5 w-5 text-chart-2" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
