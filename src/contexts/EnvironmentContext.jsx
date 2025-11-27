import React, { createContext, useState, useContext } from "react";

const EnvironmentContext = createContext();

export function EnvironmentProvider({ children }) {
    const [environment, setEnvironment] = useState(() => {
        // Get from localStorage if available
        const saved = localStorage.getItem("appEnvironment");
        return saved || "production";
    });

    const toggleEnvironment = () => {
        const newEnvironment = environment === "production" ? "test" : "production";
        setEnvironment(newEnvironment);
        localStorage.setItem("appEnvironment", newEnvironment);
    };

    return (
        <EnvironmentContext.Provider value={{ environment, toggleEnvironment }}>
            {children}
        </EnvironmentContext.Provider>
    );
}

export function useEnvironment() {
    const context = useContext(EnvironmentContext);
    if (!context) {
        throw new Error("useEnvironment must be used within EnvironmentProvider");
    }
    return context;
}
