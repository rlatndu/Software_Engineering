import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import About from "../pages/About";
import Landing from "../pages/Landing/Landing";
import Login from "../pages/Login/Login"
import Join from "../pages/Join/Join";
import Site from "../pages/Site/Site"
import Main from "../pages/Main/Main";
import ProjectCreatePage from "../pages/Create/Project/project";
import SiteCreatePage from "../pages/Create/Site/site";

const AppRouter = () => {
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />}/>
                <Route path="/login" element={<Login />}/>
                <Route path="/home" element={<Home />}/>
                <Route path="/about" element={<About />}/>
                <Route path="/join" element={<Join />}/>
                <Route path='/site' element={<Site />}/>
                <Route path="/main/:siteId" element={<Main />}/>
                <Route path="/create/project/:siteId" element={<ProjectCreatePage />}/>
                <Route path="/create/site" element={<SiteCreatePage />}/>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;