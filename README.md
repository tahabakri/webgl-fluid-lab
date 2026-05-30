# WebGL Fluid Lab

> An interactive, real-time fluid **text-distortion** effect. Move your cursor across the screen and the type ripples and refracts like the surface of water — a 2D wave simulation running entirely on the GPU.

**[▶ Try the live demo](https://tahabakri.github.io/webgl-fluid-lab/)** · Built with **Three.js**, **GLSL**, and **Vite**.

> Best experienced with a cursor — move it across the screen and the type ripples and refracts in real time.

<!-- To add a preview here, record a short screen capture of the live demo (a GIF shows the ripples best),
     drop it in docs/, and uncomment: ![WebGL Fluid Lab](docs/preview.gif) -->

---

## Features

- **GPU wave simulation** — a discrete 2D wave equation solved every frame in a fragment shader, no CPU physics.
- **Pointer & touch ripples** — drop energy into the field wherever you move; works on mobile.
- **Live controls** — change the display phrase, damping (how long ripples live), and displacement strength in real time.
- **Retina aware & responsive** — scales to device pixel ratio and re-rasterises on resize.
- **Lean** — one runtime dependency (Three.js). No engine, no framework, no analytics.

## How it works

The effect is a two-pass render loop with a [ping-pong framebuffer](https://en.wikipedia.org/wiki/Multiple_buffering) (two float render targets, `A` and `B`, swapped each frame):

1. **Simulation pass** (`src/shaders/simulation.frag.glsl`)
   The wave field is stored in an RGBA **float** texture — `R` holds the current height, `G` holds the previous height. Each pixel reads its four neighbours, averages them, and reflects through its previous value to integrate the wave equation. A `damping` factor bleeds energy so ripples fade. Where the pointer is, a falloff brush adds height — that's the splash.

2. **Render pass** (`src/shaders/render.frag.glsl`)
   The **gradient** of the wave field becomes a UV offset. Sampling the text texture through that offset bends the type exactly like light refracting through moving water. A small specular term along rising slopes adds the glints.

The headline text itself is rasterised to a 2D `<canvas>` and uploaded as a texture, so any phrase distorts without baking image assets.

```
pointer ──► [ simulation pass ] ──► float RT (height field) ──► [ render pass ] ──► screen
                  ▲                                                   │
                  └───────────────── previous frame ◄────────────────┘
```

## Tech stack

| | |
|---|---|
| Rendering | [Three.js](https://threejs.org/) (`WebGLRenderer`, float render targets, `ShaderMaterial`) |
| Shaders | GLSL ES — custom simulation + displacement passes |
| Build | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 |
| Deploy | GitHub Pages via GitHub Actions |

## Run locally

```bash
git clone https://github.com/tahabakri/webgl-fluid-lab.git
cd webgl-fluid-lab
npm install
npm run dev        # http://localhost:5173
```

Build and preview the production bundle:

```bash
npm run build
npm run preview
```

## Project structure

```
webgl-fluid-lab/
├── index.html              # markup + control-panel UI
├── src/
│   ├── main.js             # Three.js setup, render loop, input handling
│   ├── style.css           # Tailwind entry + canvas/HUD styles
│   └── shaders/
│       ├── vertex.glsl
│       ├── simulation.frag.glsl   # wave-propagation pass
│       └── render.frag.glsl       # refraction / display pass
├── vite.config.js
└── .github/workflows/deploy.yml   # build + deploy to GitHub Pages
```

## License

[MIT](LICENSE) © Taha Bakri
