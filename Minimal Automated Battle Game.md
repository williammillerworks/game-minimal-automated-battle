# 

Template Name: ChatPRD: PRD for v0.dev  

Description: This Product Requirements Document (PRD) template provides a structured framework for defining a product’s goals, user experience, functional and technical requirements, success metrics, and architecture, optimized for v0.dev.

* tl;dr: A fully automated, minimal-style battle game for the web and mobile web where four named characters move and shoot randomly, bounce off boundaries, and fight until one remains. After 10 seconds, a shrinking circular arena forces fast resolutions. A real-time leaderboard displays current standings. Target audience: casual web/mobile gamers seeking quick, replayable fun.

## Goals

### Business Goals

* Showcase v0.dev’s ability to rapidly prototype interactive, physics-based web experiences using React + Tailwind + Shadcn (2-week MVP).

* Achieve 60%+ “Play Again” rate within first session by delivering a frictionless, replayable loop.

* Maintain 95%+ mobile compatibility across modern iOS and Android browsers.

* Maintain >90 Lighthouse Performance score on mid-tier mobile devices.

* Collect anonymized usage data to inform next iteration (session count, session duration, replay rate).

### User Goals

* Enjoy a zero-input, quick, and repeatable battle experience that starts in under 10 seconds.

* Customize character names easily, with fun defaults available.

* Understand outcomes at a glance via a clear, real-time leaderboard and simple visuals.

* Experience satisfying feedback via sound effects, background music, and haptic cues on mobile.

* Play comfortably on both desktop and mobile with responsive layouts.

### Non-Goals

* No persistent or global leaderboard (per-session only).

* No manual player controls or skill trees/abilities.

* No online multiplayer or networking for MVP.

## User Stories

### Persona: Casual Gamer

* As a Casual Gamer, I want to enter or accept default names for four characters, so that I can start quickly.

* As a Casual Gamer, I want to hit Start and simply watch the action, so that I can enjoy a short break without learning controls.

* As a Casual Gamer, I want the leaderboard to update live, so that I can follow who’s winning in real time.

* As a Casual Gamer, I want a Play Again button at the end, so that I can immediately try a rematch with the same or new names.

### Persona: Spectator

* As a Spectator, I want a clean, minimal visual style, so that I can follow the characters and bullets clearly.

* As a Spectator, I want subtle sound and haptics that intensify at key moments (arena shrink, final duel), so that the experience feels exciting.

* As a Spectator, I want the game to run smoothly on a mobile device, so that I can show it to friends on the go.

### Persona: Mobile-First Player

* As a Mobile-First Player, I want the UI to fit my screen and support touch interactions for setup, so that starting is effortless on my phone.

* As a Mobile-First Player, I want to toggle sound/music/haptics, so that I can play in quiet environments.

## Functional Requirements

* Setup & Controls (Priority: P0)

  * Character Naming: Four name inputs with random/default placeholders; validation for length and uniqueness; quick “Randomize All” option.

  * Start Game: Single Start button enabling audio context and initiating the match.

  * Settings Toggle: In-setup toggles for Music, Sound Effects, Haptics (defaults: on).

* Core Simulation (Priority: P0)

  * Automated Movement: Four characters move in straight lines at the same speed; initial direction randomized; no manual control.

  * Boundary Bounces: Characters reflect off boundaries like billiards (exact reflection on collision).

  * Automated Shooting: Each character fires bullets at randomized intervals with randomized directions; bullets move in straight lines at the same speed as characters.

  * Bullet Resolution: Bullet-character hit causes instant death; bullet-bullet interactions ignored; bullets despawn on boundary contact to limit lifetime.

* Arena & Shrink Mechanic (Priority: P0)

  * Initial Bounds: Rectangular screen bounds define the initial play area.

  * Shrinking Circle: After 10 seconds, a circle appears with diameter equal to the smaller screen dimension and becomes the new active boundary; it linearly shrinks to 20% of that diameter over a default of 30 seconds.

  * Circle Enforcement: Characters bounce off the circular boundary; bullets despawn upon contacting it. If a character lies outside the circle at spawn-time, it is clamped to the nearest point inside and its velocity reflected.

* Leaderboard & HUD (Priority: P0)

  * Real-Time Leaderboard: Fixed at top-left; shows character names, status (Alive/Eliminated), kills, and placement.

  * Kill Feed: Optional small feed beneath leaderboard for last elimination events.

  * Timer & Shrink Indicator: Top HUD shows elapsed time and a subtle ring indicating circle size.

* Audio, Music, Haptics (Priority: P1)

  * Sound Effects: Shooting, bounce, hit/elimination, and victory stingers.

  * Background Music: Minimal loop with volume control; mutes on tab inactivity (optional).

  * Haptics: Mobile vibration on elimination and final circle; respects device capability and user toggle.

* Game Lifecycle (Priority: P0)

  * Win Condition: When one character remains alive, end the game and display Winner modal.

  * Play Again: One-click restart, retaining or randomizing names; reset toggles preserved.

  * Pause/Resume (Optional P2): Hidden debug shortcut or dev toggle for QA.

* Responsiveness & Accessibility (Priority: P0/P1)

  * Responsive Canvas: Scales to viewport; maintains crisp rendering using devicePixelRatio.

  * Reduced Motion: Respect prefers-reduced-motion for UI transitions; game loop remains but UI anims subdued.

  * Color Contrast: Minimal style with Shadcn theme and accessible contrast.

* Analytics (Priority: P2)

  * Client-only event logging (no PII): game_started, arena_shrink_started, elimination, winner_declared, play_again_clicked, settings_changed.

### Game Parameters (Defaults)

* Character Speed: 220 px/s (scaled by devicePixelRatio and canvas size).

* Bullet Speed: 220 px/s (same as characters, per requirement).

* Fire Interval: Randomized per character between 0.6–1.4 seconds.

* Bullet Lifetime: Despawn on boundary hit or after 4 seconds (safety).

* Circle Shrink: Starts at t=10s; shrinks linearly to 20% diameter over 30s.

* Ties: If last remaining characters die on the same frame, declare a tie and show multiple winners.

## User Experience

Using v0.dev-supported tech: React + Shadcn + Tailwind. Canvas rendering for gameplay; Shadcn components for UI.

**Entry Point & First-Time User Experience**

* Discovery: Users land on a minimal page with a title, four name inputs pre-filled with random names, and Start button.

* Onboarding: Inline helper text (“Automated battle. No controls. Last one standing wins.”). Tooltips for toggles (Music, SFX, Haptics). First Start user interaction unlocks audio context for web audio.

**Core Experience**

* Step 1: Name & Settings

  * UI Elements: Shadcn Input x4, Button (Start), Switches for Music/SFX/Haptics, Card to group controls, Tooltip for rules.

  * Data Validation: Names 1–16 chars, unique; invalid inputs highlighted with inline error.

  * Navigation: Fade-in canvas using Framer Motion; Start button triggers transition to gameplay state.

* Step 2: Match Start

  * UI Elements: Full-bleed Canvas area; HUD overlay with Leaderboard (top-left Shadcn Card), Timer, Shrink ring indicator; Mute/Haptics quick toggles (top-right).

  * Data Validation: N/A during gameplay; debounced settings changes.

  * Navigation: Smooth counter/fade for “3-2-1” optional countdown; music fades in.

* Step 3: Automated Battle

  * UI Elements: Minimal avatars (colored discs with initials), bullets (small contrasting dots), circular boundary outline.

  * Data Validation: Physics constraints ensure entities remain within current boundary; bullet lifecycle enforced.

  * Navigation: Subtle HUD updates; bounce/sfx cues; leaderboard reorders on elimination with animated list transitions (Framer Motion).

* Step 4: Arena Shrink

  * UI Elements: Animated circle outline; HUD ring mirrors circle size; optional color shift as circle nears final size.

  * Navigation: Shrink begins at 10s; haptic pulse on start and at 50%/final thresholds (if enabled).

* Step 5: Endgame & Results

  * UI Elements: Winner Modal (Shadcn Dialog) with winner name(s), KOs, and Play Again button; options to Randomize Names or Edit Names.

  * Navigation: Background music crossfades to victory sting; option to instantly restart with no page reload.

**Advanced Features & Edge Cases**

* Edge Cases:

  * Simultaneous Elimination: If multiple characters die on the same frame and no survivors remain, declare a Tie and display co-winners.

  * Spawn Overlap: If initial positions overlap, resolve with slight separation and randomized directions.

  * Off-Circle Spawn on Shrink: Clamp entity inside new circle and reflect velocity.

  * Audio Failures: If audio context fails to start, display non-blocking toast with guidance.

  * Low-Perf Devices: Auto-reduce particle/sfx density if FPS dips below threshold.

* Power-User Features:

  * Seeded RNG (optional dev toggle) for reproducible runs.

  * Debug overlay (FPS, entity counts) hidden behind keyboard shortcut in development.

**UI/UX Highlights**

* Component Strategy: Shadcn UI for inputs, buttons, cards, dialogs, toasts; accessible forms and modals.

* Styling: Tailwind CSS for utility-first, consistent theming with minimal/sleek aesthetic.

* Interactions: Framer Motion for UI transitions (not for canvas gameplay), simple canvas-based animations for entities; interactive mockups built in v0.dev for rapid reviews.

## Narrative

On a quick break, a player opens the Minimal Automated Battle Game. Four name fields already show playful defaults, so they tap Start without fuss. The screen glides into a clean arena framed in a minimalist style. Four colored discs—each labeled by their initials—snap into motion, gliding in straight lines, ricocheting off the edges like billiard balls. Shots crack across the field in tiny flashes. The leaderboard in the corner dances as names jump up and down, and the first elimination lands with a satisfying pop and a gentle buzz on the phone.

Ten seconds in, a perfect circle blooms at center stage and begins to tighten. The corners no longer feel safe—everyone is forced closer. Bullets feel faster here, distances shorter, bounces sharper. The music builds just a little as the ring squeezes to a tense, final arena. A last-second ricochet finds its mark. The winner’s name fills the modal, a bright sting plays, and the haptic pulse confirms the victory.

It’s over in a minute, thrilling and complete. The Play Again button promises an instant rematch. With no controls to learn and nothing to install, the player starts another round, sharing the game with a friend nearby. The business wins too: a compact, polished experience that shows how quickly v0.dev can turn a simple idea into a delightful, responsive, and re-playable microgame.

## Success Metrics

### User-Centric Metrics

* Average Session Length: Target 2–4 minutes per visit (measured via client timers).

* Replay Rate: >60% of matches end with Play Again clicked within 10 seconds.

* Audio/Haptics Opt-In Retention: >70% keep SFX/music/haptics on through session.

* FPS Stability: 90%+ of frames above 55 FPS on target devices.

### Business Metrics

* Time-to-MVP: Production deploy within 2 weeks.

* Engagement: 3+ games per user per session on average.

* Mobile Share: >65% sessions on mobile with comparable engagement metrics.

### Technical Metrics

* Error Rate: <0.1% unhandled JS errors per session (captured via client logging).

* Performance: 60 FPS median; no frame spikes >120 ms.

* Load Performance: TTI <1.5s on 4G mobile with cold cache.

### Tracking Plan

* Events: app_loaded, names_randomized, game_started, arena_shrink_started, bullet_fired, collision_bounce, elimination, tie_declared, winner_declared, play_again_clicked, settings_changed (music/sfx/haptics), fps_bucket_sampled.

* Properties: device_type, viewport_size, fps_avg, audio_enabled, haptics_enabled, elapsed_time, winner_name(s), kills_per_character.

## Technical Considerations

* Rendering: Use a single HTML5 Canvas for gameplay; React manages UI chrome; avoid re-rendering canvas via React reconciliation.

* Game Loop: requestAnimationFrame with fixed timestep accumulator for deterministic physics; interpolate for rendering.

* Physics & Collisions:

  * Character-boundary reflection using vector reflection across wall normal; circular boundary uses radial normal.

  * Bullet-character collision via circle-circle checks; spatial hashing or uniform grid for O(n)–O(n log n) broad-phase.

  * Bullets despawn on boundary contact or lifetime expiration to limit entity count.

* Randomness: Seedable RNG (for dev/QA), default to crypto-safe or mulberry32 fallback.

* Audio: Web Audio API via Howler (or native); unlock on first user gesture; mix levels; throttle concurrent SFX.

* Haptics: Web Vibration API on supported mobile; respect user toggle and OS permissions.

* Mobile Support: Dynamic resolution scaling; cap devicePixelRatio to 2 on low-end devices to preserve FPS.

* Accessibility: High-contrast palette; readable initials; focus management for dialogs; reduced-motion for UI.

* Edge Cases: Simultaneous deaths resolved by frame; tie declared if zero survivors on the resolution frame.

## UI Architecture

* Supported Frameworks: React for UI; Tailwind CSS for styling; Shadcn components for inputs, cards, modals, toasts.

* Component Libraries: Shadcn UI (Input, Button, Switch, Card, Dialog, Tooltip, Toast); custom CanvasRenderer.

* Styling Frameworks: Tailwind for layout and theming; minimal tokens for colors and spacing.

* Animation: Framer Motion for UI transitions (modals, leaderboard list reordering, HUD fades); canvas handles entity motion.

Component Breakdown:

* AppShell: Layout, theme provider, global settings context.

* SetupPanel: Name inputs (4), Randomize All, toggles for Music/SFX/Haptics, Start button.

* GameScreen:

  * CanvasRenderer: Game loop, physics, drawing.

  * HUD: Timer, circle size indicator, quick toggles.

  * Leaderboard: Live list with status, kills, placement.

* ResultDialog: Winner/Tie details, Play Again, Edit/Randomize options.

* AudioManager/HapticsManager: Centralized services responding to game events.

State Management:

* UI State in React (useState/useReducer).

* Game State isolated in a store (Zustand or internal module) to avoid React render pressure.

* Event Bus pattern for decoupling game events from UI reactions (e.g., toasts, sounds, haptics).

## API & Backend

* Data Fetching: None required for MVP; all state local to the session.

* Authentication: None.

* Hosting & Deployment: Vercel; CI/CD for main branch; environment configured for static assets.

* Database: None for MVP (no persistence).

* Assets:

  * Audio: Lightweight OGG/MP3 files for SFX and a short music loop; lazy-load music after Start.

  * Icons/Fonts: System fonts or a minimal webfont; no large images to preserve performance.

  * Caching: Use HTTP caching and preloading for small audio sprites.

## Performance & Scalability

* Optimizations:

  * Offload game loop from React; use Canvas 2D with batched draw calls.

  * Object pooling for bullets to reduce GC pressure.

  * Lazy-load non-critical assets (music) after the first interaction.

  * Cap entities per second (e.g., per-character fire rate) to maintain FPS.

* Accessibility:

  * Respect prefers-reduced-motion for UI elements.

  * Clear color coding and initials; ensure 4.5:1 contrast where applicable.

  * Sound/haptic toggles accessible and persistent during a session.

* Scalability Considerations:

  * While single-user and local, architecture supports later features (modes, more characters) without backend change.

  * Telemetry batching to minimize performance hit; option to disable analytics in low-power mode.

## Integration Points

* UI: Shadcn UI, Tailwind CSS, Framer Motion.

* Game: HTML5 Canvas 2D; optional tiny physics helpers (custom).

* State: Zustand (or lightweight alternative) for game store.

* Audio: Howler.js (or Web Audio wrapper) for SFX/music.

* Haptics: Web Vibration API.

* Analytics (optional): PostHog or Umami for client-only event logging.

* Deployment: Vercel for hosting and previews.