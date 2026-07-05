# COSMOS — An Infinite Journey Through Spacetime

A real-3D, infinite-scroll website that teaches physics and astrophysics by
flying you past the objects themselves: Earth → Mars → Jupiter → Saturn →
the Sun → a pulsar → a black hole → and back to the start, forever.

## Highlights

- **True 3D, zero image assets** — every planet, star, ring and the black-hole
  accretion disk is generated live in GLSL shaders (Three.js + WebGL).
- **Infinite scroll** — the camera rides a *closed* Catmull-Rom spline.
  Scrolling never hits an end: past the event horizon, spacetime loops back
  to low Earth orbit.
- **Cinematic transitions** — damped virtual scroll, camera banking into
  turns, chapter panels that fade with distance, and a horizon blackout that
  hides the seam of the loop.
- **Real physics per chapter** — gravity as geometry, the rocket equation,
  the Roche limit, fusion, neutron degeneracy, Schwarzschild radius and
  time dilation, each with the actual formula and data.
- **Gravitational lensing** — a custom post-processing pass bends the
  starfield around the black hole; UnrealBloom provides the HDR glow.

## Run

Any static file server works (ES modules require http, not file://):

```
cd cosmos
python -m http.server 8340        # or: npx http-server -p 8340
```

Then open http://localhost:8340. Three.js loads from the jsDelivr CDN.

## Controls

- **Scroll / swipe / arrow keys** — travel (both directions, forever)
- **Dots (right edge)** — jump to a chapter
- **Mouse** — subtle parallax on the camera
