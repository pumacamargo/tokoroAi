import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ProjectList from "./ProjectList";

export default function Dashboard() {
    const [error, setError] = useState("");
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [currentProject, setCurrentProject] = useState(null);

    async function handleLogout() {
        setError("");
        try {
            await logout();
            navigate("/login");
        } catch {
            setError("Failed to log out");
        }
    }

    async function triggerWebhook(type) {
        if (!currentProject) {
            setStatus("Por favor selecciona un proyecto primero.");
            return;
        }

        setLoading(true);
        setStatus(`Triggering ${type} generation for "${currentProject.name}"...`);

        // TODO: Replace with actual webhook URLs
        const webhookUrl = "https://example.com/webhook/" + type;

        try {
            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Uncomment below when real webhooks are ready
            // const response = await fetch(webhookUrl, { 
            //   method: 'POST',
            //   body: JSON.stringify({ projectId: currentProject.id })
            // });
            // if (!response.ok) throw new Error('Network response was not ok');

            setStatus(`Success! ${type} generation started for "${currentProject.name}".`);
        } catch (err) {
            console.error(err);
            setStatus("Error triggering webhook.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container">
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
                <div>
                    <h1>AI Studio</h1>
                    {currentProject && (
                        <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                            Proyecto actual: <span style={{ color: "#3b82f6", fontWeight: "600" }}>{currentProject.name}</span>
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ color: "#94a3b8" }}>{currentUser.email}</span>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Log Out
                    </button>
                </div>
            </header>

            {error && <div className="error-alert">{error}</div>}

            {/* Project Management */}
            <ProjectList
                currentProject={currentProject}
                onSelectProject={setCurrentProject}
            />

            {/* Generation Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>

                {/* Image Generation Card */}
                <div className="card">
                    <h3>Generate Image</h3>
                    <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
                        Create stunning visuals using our advanced AI model.
                    </p>
                    <button
                        disabled={loading || !currentProject}
                        onClick={() => triggerWebhook('image')}
                        className="btn btn-primary w-full"
                    >
                        {loading ? "Processing..." : "Generate Image"}
                    </button>
                </div>

                {/* Video Generation Card */}
                <div className="card">
                    <h3>Generate Video</h3>
                    <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
                        Turn text into captivating video content instantly.
                    </p>
                    <button
                        disabled={loading || !currentProject}
                        onClick={() => triggerWebhook('video')}
                        className="btn btn-primary w-full"
                        style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}
                    >
                        {loading ? "Processing..." : "Generate Video"}
                    </button>
                </div>

            </div>

            {status && (
                <div className="card mt-4 text-center" style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                    <p style={{ color: "#34d399", margin: 0 }}>{status}</p>
                </div>
            )}
        </div>
    );
}
