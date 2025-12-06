import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./components/HomePage";
import { VideoCall } from "./components/VideoCall";

function App() {
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