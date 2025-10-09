# Audio Streaming Application Design Guidelines

## Design Approach: Creative Reference-Based

**Primary Inspiration**: Blend Spotify's discoverability + Apple Music's elegant simplicity + Tidal's premium aesthetics, but with bold creative deviations to create something fresh and distinctive.

**Core Philosophy**: Create an immersive, music-first experience with unexpected visual moments and fluid, intuitive interactions.

---

## Color System

### Dark Mode (Primary)
- **Background Foundation**: 220 15% 8% (deep slate, not pure black)
- **Surface Layers**: 220 14% 12% (cards/panels), 220 13% 16% (elevated elements)
- **Primary Brand**: 280 85% 65% (vibrant purple-violet for key actions)
- **Accent**: 170 70% 55% (teal-cyan for active states, now playing indicators)
- **Text**: 220 10% 95% (primary), 220 8% 70% (secondary), 220 6% 50% (tertiary)

### Light Mode
- **Background**: 220 15% 98%
- **Surface**: 0 0% 100% (pure white cards)
- **Primary Brand**: 280 75% 55% (deeper purple for contrast)
- **Accent**: 170 65% 45%

---

## Typography

**Font Stack**: 
- Primary: 'Inter' (Google Fonts) - UI elements, body text
- Display: 'Plus Jakarta Sans' (Google Fonts) - headings, artist names

**Scale**:
- Display/Hero: 48px (3rem) / 700 weight
- H1: 32px (2rem) / 600 weight  
- H2: 24px (1.5rem) / 600 weight
- H3: 20px (1.25rem) / 500 weight
- Body: 16px (1rem) / 400 weight
- Small: 14px (0.875rem) / 400 weight
- Micro: 12px (0.75rem) / 500 weight (for metadata)

---

## Layout System

**Spacing Primitives**: Consistent use of 4, 8, 16, 24, 32 units (p-1, p-2, p-4, p-6, p-8)

**Grid Structure**:
- Sidebar: Fixed 280px (desktop), collapsible drawer (mobile)
- Main content: Fluid with max-w-7xl container
- Player bar: Fixed 96px height at bottom
- Mobile: Full-width, bottom tab navigation

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

---

## Core Components

### Navigation Architecture
**Left Sidebar** (Desktop):
- Logo/brand at top with subtle glow effect
- Primary nav: Home, Search, Library, Liked Songs
- Playlists section with scroll
- Create Playlist CTA with gradient border
- Semi-transparent backdrop blur when music playing

**Mobile Navigation**:
- Bottom tab bar: Home, Search, Library, Profile
- Swipe-up player sheet

### Audio Player (Bottom Bar)
- **Layout**: Three-zone (Track Info | Controls | Volume/Queue)
- **Track Info**: Album art (64px rounded), title, artist with marquee scroll if long
- **Controls**: Previous, Play/Pause (prominent, animated), Next, Shuffle, Repeat
- **Progress Bar**: Custom styled with gradient fill matching album art dominant color
- **Queue Button**: Reveals slide-up queue panel

### Content Cards
**Album/Playlist Cards**:
- Aspect ratio: 1:1 for covers
- Hover: Lift effect (translate-y-2), play button fade-in overlay
- Metadata below: Title (bold), Artist/Info (muted)
- Grid: 5 columns desktop, 3 tablet, 2 mobile

**Track Rows** (in playlists):
- Compact design with: Play indicator, Track #, Album art (48px), Title/Artist, Album name, Duration
- Hover: Background tint, quick actions reveal (Add to playlist, Like)
- Currently playing: Pulsing accent color indicator

### Search Interface
- **Hero Search Bar**: Large, centered with gradient border on focus
- **Recent Searches**: Pills with x-dismiss
- **Results Layout**: Categorized tabs (All, Songs, Albums, Artists, Playlists)
- **Live Search**: Results appear as you type with smooth transitions

### Playlist/Album View
- **Hero Section**: Large album art (320px), gradient background derived from art
- **Sticky Header**: Mini player controls when scrolling
- **Track List**: Table view with alternating subtle row backgrounds
- **Action Bar**: Play, Shuffle, Add to Library, Share, More options

---

## Unique Creative Elements

### Dynamic Visualizer
- Subtle audio-reactive bars in background of now-playing screen
- Responds to bass/treble frequencies with smooth animations
- Optional full-screen immersive mode

### Color Extraction
- Extract dominant colors from album artwork
- Apply subtle gradients to relevant UI sections
- Smooth color transitions between tracks (300ms ease)

### Micro-Interactions
- Like button: Heart fill animation with particle burst
- Volume slider: Visual wave feedback
- Skip track: Slide transition with album art carousel

### Discovery Features
- "Daily Mix" cards with personalized gradient backgrounds
- "For You" section with animated card reveals on scroll
- Genre mood lighting: Subtle background color shifts per genre

---

## Animations (Minimal, Purposeful)

- Page transitions: Fade + slight scale (200ms)
- Card hovers: Lift (150ms ease-out)
- Player controls: Ripple effect on click
- Track change: Cross-fade with slide (250ms)
- **No**: Excessive parallax, auto-playing carousels, spinning elements

---

## Image Strategy

### Required Images
1. **Hero/Banner**: Full-width featured playlist/artist imagery (16:9 ratio, 1920x1080)
2. **Album Covers**: Square format throughout (300x300 minimum)
3. **Artist Headers**: Wide format for artist pages (1400x400)
4. **Placeholder**: Use gradient + music note icon for missing artwork

**Image Treatment**: 
- Slight blur + overlay for hero backgrounds
- Sharp, crisp album covers with subtle shadow
- Lazy loading with blur-up placeholder technique

---

## Accessibility & Performance

- High contrast ratios: 4.5:1 minimum for all text
- Keyboard navigation: Full support with visible focus states
- ARIA labels: Complete for player controls and dynamic content
- Dark mode: Consistent across all form inputs, modals, dropdowns
- Reduce motion: Respect prefers-reduced-motion, disable visualizer

---

**Design Differentiator**: This design stands apart through immersive color dynamics, elegant spatial relationships, and purposeful micro-interactions that celebrate the music without overwhelming the listener.