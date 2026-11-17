'use client';

import AuthGate from './AuthGate';
import Notes from './Notes';
import Providers from './Providers';

export default function App() {
  return (
    <Providers>
      <AuthGate>{(user) => <Notes uid={user.uid} />}</AuthGate>
    </Providers>
  );
}
