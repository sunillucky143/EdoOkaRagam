import {
  Home,
  Search,
  Library,
  Heart,
  PlusCircle,
  Music,
  Users,
  Radio,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { CreatePlaylistDialog } from "@/components/CreatePlaylistDialog";
import { UploadMusicDialog } from "@/components/UploadMusicDialog";
import { CollaborativePlaylistDialog } from "@/components/CollaborativePlaylistDialog";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Your Library", url: "/library", icon: Library },
];

const socialItems = [
  { title: "Activity Feed", url: "/feed", icon: Radio },
  { title: "Friends", url: "/friends", icon: Users },
  { title: "Liked Songs", url: "/liked", icon: Heart },
];

const playlists = [
  { id: "1", name: "Chill Vibes" },
  { id: "2", name: "Workout Mix" },
  { id: "3", name: "Study Sessions" },
  { id: "4", name: "Evening Unwind" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
            <Music className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Streamify
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Social</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Playlists</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="mb-2 space-y-2">
              <CreatePlaylistDialog />
              <CollaborativePlaylistDialog />
            </div>
            <SidebarMenu>
              {playlists.map((playlist) => (
                <SidebarMenuItem key={playlist.id}>
                  <SidebarMenuButton
                    asChild
                    data-testid={`link-playlist-${playlist.id}`}
                  >
                    <Link href={`/playlist/${playlist.id}`}>
                      {playlist.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <UploadMusicDialog
          trigger={
            <Button
              variant="outline"
              className="w-full"
              data-testid="button-upload"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Upload Music
            </Button>
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
