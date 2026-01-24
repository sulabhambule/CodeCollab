import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Background from "./components/Background";

function App() {
  return (
    <BrowserRouter>
      <Background />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
