import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing/Landing";
import Login from "./pages/Login/Login";
import Join from "./pages/Join/Join";
import Main from "./pages/Main/Main";
import Home from "./pages/Home/Home";
import Site from "./pages/Site/Site";
import Project from "./pages/Create/Project/project";
import Verify from "./pages/Verify/Verify";
import IdFind from "./pages/FindId/IdFind";
import PasswordFind from "./pages/FindId/PasswordFind";
import SiteCreatePage from './pages/Create/Site/site';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/join/verify" element={<Verify />} />
        <Route path="/id_find" element={<IdFind />} />
        <Route path="/password_find" element={<PasswordFind />} />
        <Route path="/main/:siteId" element={<Main />} />
        <Route path="/home" element={<Home />} />
        <Route path="/site" element={<Site />} />
        <Route path="/Create/Site" element={<SiteCreatePage />} />
        <Route path="/project" element={<Project />} />
      </Routes>
    </Router>
  );
}

export default App;