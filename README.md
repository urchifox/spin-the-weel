# Spin the Weel

"Spin the Wheel" is a responsive promotional component that can be embedded into a gaming or casino website. It is independent of its surroundings and can be placed anywhere — this page is just a demo.

Built with TypeScript, HTML, and CSS.

## Embedding

Create a new instance of the [SpinningWheel](./src/spinning-wheel/index.ts) class. Then call the `mount` method on the instance, passing the props described by the [SpinningWheelMountProps](./src/spinning-wheel/types.ts) type.

Note that the root element for the component should have a fixed size (the wheel will be fitted into it).

## Single spin restriction

The component never decides on its own whether a spin is allowed, and it never picks the prize. Both come from the `Authorizer` passed into the constructor (see Authorizer in [types.ts](./src/spinning-wheel/types.ts)):

- `getInitialInfo(id)` returns the prizes and the already claimed prize, if there is one. An already claimed wheel is mounted straight into its final state, with the spin button disabled.
- `requestSpin(id)` is where the authority chooses and records the prize. For a wheel that was already used it answers `wasSpun: true` with the previously claimed prize, and the component reveals that prize instead of spinning.

So the client only animates towards an outcome that the authority has already committed to. Tampering with the component can change the animation, but not the prize, and it cannot produce a second spin.

In real usage the `Authorizer` is a thin wrapper around backend endpoints. The player is identified by their server-side session, and the claim is stored on the server, so the restriction survives reloads, cleared browsers, and other devices. The backend should also write the claim atomically, so two parallel requests cannot both win.

Client-side storage (local storage, cookies) is deliberately not used for this. It lives on the user's machine, where it can be cleared, edited, or sidestepped with a private window in seconds, so it cannot be the authority over an award — at best it is a UX hint.

Connecting to a backend is out of scope here, so the demo ships [MockServerAdapter](./src/mock-server-adapter/mock-server-adapter.ts): an in-memory stand-in implementing the same interface. It holds the claim for the lifetime of the page, so a reload starts over. Swapping it for real HTTP calls is the only change the component needs.

## Structure

```text
.
├── index.html              # App shell; mounts #app
└── src/
    ├── app.ts              # Entry point; mounts SpinningWheel with mock prizes
    ├── mock-prizes/        # Mock prize data and images for the demo
    ├── mock-server/        # In-memory Authorizer standing in for a backend
    ├── spinning-wheel/     # Self-contained wheel component
    └── styles/             # Global styles for the demo page only
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
