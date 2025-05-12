import React from "react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    return (
        <div style={{padding: "1rem"}}>
            <h1>홈 페이지</h1>
            <Button onClick={() => navigate("/about")}>클릭해보기</Button>
        </div>
    );
};

export default Home;