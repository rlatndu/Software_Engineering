import React from "react";

type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

const Button = ({ children, onClick, className }: ButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={`rounded bg-blue-500 text-white px-4 py-2 hower:bg-blue-600 ${className}`}>
                {children}
        </button>
    );
};

export default Button;