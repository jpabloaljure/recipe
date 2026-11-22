# D-11 evidence: YouTube header outside the video on iPhone landscape

Reported 2026-11-22 on the production site (`https://recipe-henna-pi.vercel.app`),
Chrome for iOS (WebKit) on a real iPhone, landscape. The video on screen is
`3m9arffvbJA` ("Hyderabad Chicken Masala").

| File | What it shows |
|---|---|
| `expected-desktop.webp` | Expected: the player's header (channel avatar, title, channel name, CC) sits inside the centered 9:16 video. |
| `current-iphone-landscape.jpg` | Current: the avatar, title and channel name sit to the left of the video image, outside it; the video is narrower and shifted from the center. |

Measurements still missing (see D-11 in `backlog/draft-backlog-list.md`): the
sizes of the slide, the frame and the iframe on the phone, and the slide's
safe-area padding. A paste-in console snippet for Safari Web Inspector was given
in the 2026-11-22 session; the same values can be read in the Xcode Simulator.
