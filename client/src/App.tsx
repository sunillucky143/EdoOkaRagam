import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { AudioPlayer } from "@/components/AudioPlayer";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import Home from "@/pages/Home";
import SearchPage from "@/pages/SearchPage";
import Library from "@/pages/Library";
import Playlist from "@/pages/Playlist";
import ListeningRoom from "@/pages/ListeningRoom";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/library" component={Library} />
      <Route path="/playlist/:id" component={Playlist} />
      <Route path="/liked" component={Playlist} />
      <Route path="/room/:roomId" component={ListeningRoom} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="dark">
          <AudioPlayerProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-40">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-hidden">
                    <Router />
                  </main>
                </div>
              </div>
              <AudioPlayer />
            </SidebarProvider>
            <Toaster />
          </AudioPlayerProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
