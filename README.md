# Spin the Weel

"Spin the Wheel" is a responsive promotional component that can be embedded into a gaming or casino website. It is independent of its surroundings and can be placed anywhere — this page is just a demo.

Built with TypeScript, HTML, and CSS.

## Embedding

Create a new instance of the [SpinningWheel](./src/spinning-wheel/index.ts) class. Then call the `mount` method on the instance, passing the props described by the [SpinningWheelMountProps](./src/spinning-wheel/types.ts) type.

Note that the root element for the component should have a fixed size (the wheel will be fitted into it).

Two optional mount props tune the look and the feel: `segmentsColors` controls the hue range, saturation, and lightness of the sectors, and `spinOptions` controls the windup, the number of turns, the spin duration, and the pause before the prize is revealed. Anything left out falls back to [defaults.ts](./src/spinning-wheel/defaults.ts).

## Single spin restriction

The component never decides on its own whether a spin is allowed, and it never picks the prize. Both come from the `Authorizer` passed into the constructor (see Authorizer in [types.ts](./src/spinning-wheel/types.ts)):

- `getInitialInfo(id)` returns the prizes and the already claimed prize, if there is one. An already claimed wheel is mounted straight into its final state, with the spin button disabled.
- `requestSpin(id)` is where the authority chooses and records the prize. For a wheel that was already used it answers `wasSpun: true` with the previously claimed prize, and the component reveals that prize instead of spinning.

So the client only animates towards an outcome that the authority has already committed to. Tampering with the component can change the animation, but not the prize, and it cannot produce a second spin.

In real usage the `Authorizer` is a thin wrapper around backend endpoints. The player is identified by their server-side session, and the claim is stored on the server, so the restriction survives reloads, cleared browsers, and other devices. The backend should also write the claim atomically, so two parallel requests cannot both win.

Client-side storage (local storage, cookies) is deliberately not used for this. It lives on the user's machine, where it can be cleared, edited, or sidestepped with a private window in seconds, so it cannot be the authority over an award — at best it is a UX hint.

Connecting to a backend is out of scope here, so the demo ships [MockServerAdapter](./src/mock-server-adapter/index.ts): an in-memory stand-in implementing the same interface. It holds the claim for the lifetime of the page, so a reload starts over. Swapping it for real HTTP calls is the only change the component needs.

## Architecture

The component is split into four collaborators, each owning one concern, with `SpinningWheel` as the only part that talks to the outside world.

- [SpinningWheel](./src/spinning-wheel/index.ts) is the public API and the orchestrator. It calls the `Authorizer`, resolves a prize id into a prize and its index, wires up the click handler and the resize observer, and hands work to the others. It owns no DOM and no math.
- [UI](./src/spinning-wheel/ui.ts) owns the DOM. It builds the markup, clones prize elements from the `<template>` in [spinningWheel.html](./src/spinning-wheel/spinningWheel.html), writes the CSS custom properties, fits the wheel into its root, and is the only place that queries elements. Nothing else holds an element reference.
- [Geometry](./src/spinning-wheel/geometry.ts) owns the math and is pure: sector angles, icon sizing, conic-gradient stops, the random landing angle for a segment, the shortest rotation back to zero, and the offset between a prize and the wheel centre. It touches no DOM, so it can be reasoned about and tested on its own.
- [Animator](./src/spinning-wheel/animator.ts) owns the motion. It builds the Web Animations keyframes for the spin and drives the reveal transition, taking the elements it needs as arguments from `UI`.
- [Spinner](./src/spinning-wheel/spinner.ts) owns the spin lifecycle: it guards against a second spin while one is running, awaits the animation, handles cancellation on unmount, and then triggers the reveal.

The dependency direction is one-way. `SpinningWheel` → `Spinner` → `UI` → `Animator` → `Geometry`, and `Geometry` depends on nothing. Adding a new mount prop means touching `defaults.ts`, `types.ts`, and the one class that consumes it.

## Structure

```text
.
├── index.html                  # App shell; mounts #app
└── src/
    ├── app.ts                  # Entry point; mounts SpinningWheel with mock prizes
    ├── mock-prizes/            # Mock prize data and images for the demo
    ├── mock-server-adapter/    # In-memory Authorizer standing in for a backend
    ├── spinning-wheel/         # Self-contained wheel component
    │   ├── index.ts            # Public API and orchestration
    │   ├── ui.ts               # DOM creation, queries, CSS custom properties
    │   ├── geometry.ts         # Pure angle, sizing, and gradient math
    │   ├── animator.ts         # Spin keyframes and prize reveal
    │   ├── spinner.ts          # Spin lifecycle and re-entry guard
    │   ├── defaults.ts         # Fallback colors and spin options
    │   ├── helpers.ts          # Small shared utilities
    │   ├── types.ts            # Public types
    │   ├── spinningWheel.html  # Markup and the prize template
    │   └── styles/             # Component styles
    └── styles/                 # Global styles for the demo page only
```

## How to run

```bash
npm install
```

| Script            | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run serve`   | Dev server on http://localhost:5173              |
| `npm run build`   | Production build into `dist`                     |
| `npm run preview` | Serves the built `dist` on http://localhost:4173 |
