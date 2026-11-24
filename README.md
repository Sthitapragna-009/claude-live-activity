# Claude Live Activity

**From waiting for a response to watching progress unfold.**

A design exploration of iPhone Live Activities and the Dynamic Island for Claude and Claude Code. Clawd, the Claude Code mascot, walks the progress track the way a delivery rider does in a food-delivery app, so you can follow a long task without opening the app.

> An unofficial design concept. Not affiliated with or endorsed by Anthropic or Apple.

**[Try the interactive prototype →](https://sthitapragna-009.github.io/claude-live-activity/)** · **[Watch the 66-second film](media/claude-live-activity.mp4)**

## What it covers

| Interaction | What happens |
| --- | --- |
| Glance | Compact island: Clawd on the leading side, a progress ring on the trailing side |
| Touch and hold | The island expands to the full status, with one control: Pause |
| Pull down | The Lock Screen card opens to every step, plus Pause, Output, Open and Cancel |
| Permission | Claude asks before it acts: the island opens by itself with Deny and Allow |
| Presentations | Compact, minimal (beside another activity) and 28pt limited width |
| Done | Clawd hops, the island clears, the Lock Screen keeps a summary |

Clawd has a pixel-scale state for each phase: thinking, reading, writing code, running tests, needs you, paused and done.

## Design rules it follows

Built against Apple's Human Interface Guidelines for Live Activities:

- The Dynamic Island stays opaque black; clay orange carries the identity, amber means Claude needs you, green means done.
- One control while running. A permission request is the only exception, because you can act on it.
- Only two events expand the island on their own: a permission request and completion.
- The expanded view is 156pt tall, inside the 84–160pt range. Every animation is under 2 seconds.
- One activity, one place: while the island is expanded, the Lock Screen card steps aside and the screen behind blurs.
- No code, prompts or file contents on the Lock Screen.

## Repository

```
index.html          Interactive prototype (open it in a browser; no build step)
media/              The rendered film
video/              Remotion project for the film
  src/timeline.ts   Every scene time, synced to the voiceover
  src/Phone.tsx     The phone, Dynamic Island and Lock Screen card
  src/Stage3D.tsx   three.js stage: shader backdrop and the voxel 3D Clawd
  src/Clawd.tsx     The pixel Clawd and its states
  render.ps1        Renders the film in chunks and adds the voiceover
```

## Rendering the film

Needs Node 18+ and Chrome.

```powershell
cd video
npm install
npm run studio          # preview and scrub in the browser
.\render.ps1 -Fresh     # render to video/out/claude-live-activity.mp4
```

The render runs in chunks because long WebGL renders can exhaust Chrome's memory. Run `.\render.ps1` without `-Fresh` to resume after a failed chunk.

## Credits

- Voiceover generated with ElevenLabs (voice: Christian, Warm Documentary Narrator).
- Built with [Remotion](https://www.remotion.dev/) and [three.js](https://threejs.org/).
- Clawd and the Claude name belong to Anthropic; the Dynamic Island and Live Activities belong to Apple.
