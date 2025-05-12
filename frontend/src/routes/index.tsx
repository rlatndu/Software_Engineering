import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import About from "../pages/About";
import Landing from "../pages/Landing/Landing";
import Login from "../pages/Login/Login"
import Join from "../pages/Join/Join";
import Main from "../pages/Main/Main";
import ProjectCreatePage from "../pages/Create/Project/project";

const AppRouter = () => {
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />}/>
                <Route path="/login" element={<Login />}/>
                <Route path="/home" element={<Home />}/>
                <Route path="/about" element={<About />}/>
                <Route path="/join" element={<Join />}/>
                <Route path="/Main" element={<Main />}/>
                <Route path="/Create/Project" element={<ProjectCreatePage />}></Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;