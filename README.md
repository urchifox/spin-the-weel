# Spin the Weel

"Spin the Wheel" is a responsive promotional component that can be embedded into a gaming or casino website. It is independent of its surroundings and can be placed anywhere — this page is just a demo.

Built with TypeScript, HTML, and CSS.

## Embedding

Create a new instance of the [SpinningWheel](./src/spinning-wheel/index.ts) class. Then call the `mount` method on the instance, passing the props described by the [SpinningWheelMountProps](./src/spinning-wheel/types.ts) type.

Note that the root element for the component should have a fixed size (the wheel will be fitted into it).

## Structure

```text
.
├── index.html              # App shell; mounts #app
└── src/
    ├── app.ts              # Entry point; mounts SpinningWheel with mock prizes
    ├── mock-prizes/        # Mock prize data and images for the demo
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
