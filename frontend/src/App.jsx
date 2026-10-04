import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Workspace from './components/Workspace';

function App() {
  const [session, setSession] = useState(null);
  const [timeoutError, setTimeoutError] = useState(null);

  return (
    <div className="App">
      {!session ? (
        <Dashboard 
          onStart={(s) => { setSession(s); setTimeoutError(null); }} 
          timeoutError={timeoutError}
        />
      ) : (
        <Workspace 
          session={session} 
          onBack={(err) => { setSession(null); if (err) setTimeoutError(err); }} 
        />
      )}
    </div>
  );
}

export default App;
