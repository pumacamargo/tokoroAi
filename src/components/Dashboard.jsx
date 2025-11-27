import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useEnvironment } from "../contexts/EnvironmentContext";
import { useNavigate } from "react-router-dom";
import ProjectList from "./ProjectList";
import ProjectWorkflow from "./ProjectWorkflow";

export default function Dashboard() {
    const [error, setError] = useState("");
    const { currentUser, logout } = useAuth();
    const { environment, toggleEnvironment } = useEnvironment();
    const navigate = useNavigate();
    const [currentProject, setCurrentProject] = useState(null);
    const [showProjectView, setShowProjectView] = useState(false);

    async function handleLogout() {
        setError("");
        try {
            await logout();
            navigate("/login");
        } catch {
            setError("Failed to log out");
        }
    }

    function handleSelectProject(project) {
        setCurrentProject(project);
        setShowProjectView(true);
    }

    function handleBackToProjects() {
        setCurrentProject(null);
        setShowProjectView(false);
    }

    return (
        <div className="container">
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "0.5rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <h1 style={{ margin: 0, fontSize: "clamp(0.95rem, 4vw, 1.3rem)" }}>✨ Tokoro AI</h1>
                    <button
                        onClick={toggleEnvironment}
                        style={{
                            padding: "0.35rem 0.6rem",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            backgroundColor: environment === "test" ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                            color: environment === "test" ? "#f59e0b" : "#10b981",
                            fontSize: "0.7rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.3s",
                            whiteSpace: "nowrap"
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = environment === "test" ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = environment === "test" ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)";
                        }}
                    >
                        {environment === "test" ? "⚡ TEST" : "✓ PROD"}
                    </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{currentUser.email}</span>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}>
                        Log Out
                    </button>
                </div>
            </header>

            {error && <div className="error-alert">{error}</div>}

            {/* Projects View */}
            {!showProjectView ? (
                <ProjectList
                    currentProject={null}
                    onSelectProject={handleSelectProject}
                />
            ) : (
                <>
                    {/* Project Header with Back Button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "0.75rem", flexWrap: "wrap" }}>
                        <div>
                            <h2 style={{ margin: 0, marginBottom: "0.25rem", fontSize: "1.25rem" }}>
                                Working on: <span style={{ color: "#3b82f6" }}>{currentProject.name}</span>
                            </h2>
                            <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.8rem" }}>
                                Created: {currentProject.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
                            </p>
                        </div>
                        <button
                            onClick={handleBackToProjects}
                            className="btn btn-secondary"
                            style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                        >
                            ← Projects
                        </button>
                    </div>

                    {/* Workflow Section */}
                    <ProjectWorkflow />
                </>
            )}
        </div>
    );
}
