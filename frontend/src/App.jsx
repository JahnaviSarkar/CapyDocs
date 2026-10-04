import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Workspace from './components/Workspace';

function App() {
  const [session, setSession] = useState(null);

  return (
    <div className="App">
      {!session ? (
        <Dashboard onStart={(s) => setSession(s)} />
      ) : (
        <Workspace session={session} onBack={() => setSession(null)} />
      )}
    </div>
  );
}

export default App;
