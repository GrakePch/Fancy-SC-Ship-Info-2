import "./App.css";
import { Routes, Route } from "react-router-dom";
import Vehicle from "./pages/Vehicle/Vehicle";
import NotFound from "./pages/NotFound/NotFound";
import Home from "./pages/Home/Home";
import GlobalSearch from "./components/GlobalSearch/GlobalSearch";
import PersonalWeaponSelector from "./pages/PersonalWeaponSelector/PersonalWeaponSelector";
import PersonalWeaponInfo from "./pages/PersonalWeaponInfo/PersonalWeaponInfo";

function App() {
  return (
    <div className="App">
      <GlobalSearch />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehicle/:id" element={<Vehicle />} />
          <Route path="/PW" element={<PersonalWeaponSelector />} />
          <Route path="/PW/:className" element={<PersonalWeaponInfo />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
