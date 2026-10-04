# React + Vite

## Service / Repository architecture

API access for authentication, users, vehicles, routes, schedules, and fares
lives in `src/repositories/`. Feature operations and business logic are exposed
through matching modules in `src/services/`; controllers and views should use
services rather than call the API client or repositories directly. Existing
`src/models/` feature modules remain as compatibility re-exports while callers
migrate.

Fare pricing is implemented by `calculateFare(config, journey)` in
`src/services/fareStrategies.js`. It chooses a distance or flat-fare strategy,
then applies a matching time-based adjustment. Weekday time rules require a
departure date. The result contains the base fare, time adjustment, total,
currency, and matching rule IDs.

Run `npm test` to verify the fare calculation strategies.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
