This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Firebase App Hosting

This app goes live on Firebase App Hosting, not Vercel: once a Firebase project is
connected, every change merged to the main branch goes online by itself. See the
Firebase section below.

## Firebase

This app is wired to **Cloud Firestore** and **Firebase Authentication** and runs
against the local emulators until a real Firebase project is connected.

```bash
npm run emulators   # Auth on :9099, Firestore on :8081, dashboard on :4000
npm run dev         # in a second terminal
```

- `lib/firebase.ts` builds the Firebase clients. With no
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID` set it uses the emulators.
- `firestore.rules` is the security policy. It is closed by default: each signed-in
  person can read and write only their own `notes`. Open a new path on purpose, and
  review every change to this file.
- `apphosting.yaml` sets the limits for Firebase App Hosting, where this app is
  deployed once a Firebase project is connected.
- `lib/friendly-errors.ts` turns the errors people hit into plain sentences and logs the
  real error code to the browser console, so a failure never hides behind one generic line.
  Use `reportError` and `describeError` in every place that catches an error.
- `lib/route-errors.ts` is the same for server routes: `return routeError('where', error)` writes
  the real error code and message to the server log and answers with a short code and a plain
  sentence, never a bare 500. In the browser, `describeRouteError` turns that answer into a sentence.

### Run against your real Firebase project

With no `NEXT_PUBLIC_FIREBASE_PROJECT_ID` the app uses the emulators, where a real account or a
provider such as Google or Facebook cannot sign in. To use your real project, copy
`.env.example` to `.env.local`, fill in the four values from the Firebase console (Project
settings, Your apps, your web app) and restart `npm run dev`. They are public identifiers, not
secrets. Popup sign-in also needs `localhost` under Authentication, Settings, Authorized domains.

### Keys and secrets

A secret (an API key or token) is never committed or written into code. LoomShift keeps the keys
your app needs in your own Google account and gives them to the deployed app; add them in LoomShift
under Deliveries, What your app needs. To run with one on your own machine, put it in
`.env.local`, which is not committed. Code that reads a secret should stop with an error that
names the variable when it is missing, never print the value.

`STEAM_API_KEY` is the Steam Web API key used by `/api/steam/games` to list a profile's owned games.
Create it at https://steamcommunity.com/dev/apikey. It is read on the server on each request, so
setting it on the running service takes effect without a rebuild. It never reaches the browser. When
it is unset the route answers with an error that names `STEAM_API_KEY`. `apphosting.yaml` maps it
from a secret of the same name (runtime only), which must exist in the deployed backend's secrets.

Run the tests with `npm test`.
