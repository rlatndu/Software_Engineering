// src/pages/Login/NaverCallback.tsx

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NaverCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // 1. URL에서 code, state 추출
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const state = params.get("state");

        // 2. code, state가 없는 경우는 인증 실패
        if (!code || !state) {
            alert("잘못된 접근입니다! 다시 로그인 해주세요.");
            navigate("/login");
            return;
        }

        // 3. code, state를 백엔드에 POST로 전송해서 인증 요청
        fetch("http://localhost:8080/api/auth/naver/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, state }),
            credentials: "include", // 백엔드 세션/쿠키 인증 사용 시 필요
        })
            .then((res) => {
                if (!res.ok) throw new Error("네이버 인증 실패!");
                return res.json();
            })
            .then(() => {
                // data에 토큰이나 사용자 정보 등이 담겨 있을 수 있음
                // 예: localStorage.setItem("token", data.token);

                // 4. 성공 시 /site로 이동!
                navigate("/site");
            })
            .catch(() => {
                alert("네이버 로그인 인증 실패! 다시 시도해 주세요.");
                navigate("/login");
            });
    }, [location, navigate]);

    return <div>네이버 인증 처리 중입니다...</div>;
};

export default NaverCallback;
