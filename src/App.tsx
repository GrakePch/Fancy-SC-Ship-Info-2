import "./App.css";
import { Routes, Route } from "react-router-dom";
import Vehicle from "./pages/Vehicle/Vehicle";
import NotFound from "./pages/NotFound/NotFound";
import Home from "./pages/Home/Home";

function App() {
  return (
    <div className="App">
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehicle/:id" element={<Vehicle />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
