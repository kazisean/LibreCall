import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { auth } from "./lib/firebase";
import { HomePage } from "./components/HomePage";
import { VideoCall } from "./components/VideoCall";

function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const signIn = async () => {
      try {
        await signInAnonymously(auth);
        console.log("Signed in anonymously");
        setIsAuthReady(true);
      } catch (error) {
        console.error("Error signing in anonymously:", error);
      }
    };

    signIn();
  }, []);

  if (!isAuthReady) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/call" element={<VideoCall />} />
        <Route path="/call/:callId" element={<VideoCall />} />
      </Routes>
    </Router>
  );
}

export default App;