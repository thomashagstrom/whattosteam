import App from '@/components/App';
import SteamLookup from '@/components/SteamLookup';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">whattosteam</h1>
      <SteamLookup />
      <h2 className="text-xl font-semibold">Your notes</h2>
      <p>
        Sign in, then add a note. It is saved to Firestore under your account, and only you can
        read it.
      </p>
      <App />
    </main>
  );
}
