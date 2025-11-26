import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserProjects, createProject, deleteProject } from "../services/projectService";

export default function ProjectList({ currentProject, onSelectProject }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const { currentUser } = useAuth();

    useEffect(() => {
        loadProjects();
    }, [currentUser]);

    async function loadProjects() {
        if (!currentUser) return;

        setLoading(true);
        const result = await getUserProjects(currentUser.uid);
        if (result.success) {
            setProjects(result.projects);
        }
        setLoading(false);
    }

    async function handleCreateProject() {
        if (!newProjectName.trim()) return;

        const result = await createProject(currentUser.uid, {
            name: newProjectName
        });

        if (result.success) {
            setNewProjectName("");
            setShowNewProjectModal(false);
            await loadProjects();
        }
    }

    async function handleDeleteProject(projectId, e) {
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this project?")) return;

        const result = await deleteProject(projectId);
        if (result.success) {
            await loadProjects();
            if (currentProject?.id === projectId) {
                onSelectProject(null);
            }
        }
    }

    if (loading) {
        return <div style={{ color: "#94a3b8" }}>Loading projects...</div>;
    }

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "0.5rem", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>My Projects</h3>
                <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="btn btn-primary"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                >
                    + New
                </button>
            </div>

            {projects.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center", padding: "1rem", margin: 0 }}>
                    No projects yet. Create one to get started!
                </p>
            ) : (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => onSelectProject(project)}
                            className="project-item"
                            style={{
                                padding: "0.75rem",
                                background: currentProject?.id === project.id
                                    ? "rgba(59, 130, 246, 0.2)"
                                    : "rgba(15, 23, 42, 0.6)",
                                border: `1px solid ${currentProject?.id === project.id
                                    ? "rgba(59, 130, 246, 0.5)"
                                    : "var(--glass-border)"}`,
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: "600", marginBottom: "0.1rem", fontSize: "0.95rem" }}>
                                    {project.name}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                    {project.createdAt?.toDate?.()?.toLocaleDateString() || "Recently created"}
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleDeleteProject(project.id, e)}
                                className="btn-icon-delete"
                                style={{
                                    background: "transparent",
                                    border: "1px solid rgba(239, 68, 68, 0.5)",
                                    color: "#ef4444",
                                    padding: "0.4rem",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => e.target.style.background = "rgba(239, 68, 68, 0.2)"}
                                onMouseLeave={(e) => e.target.style.background = "transparent"}
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* New Project Modal */}
            {showNewProjectModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000
                    }}
                    onClick={() => setShowNewProjectModal(false)}
                >
                    <div
                        className="card"
                        style={{ maxWidth: "350px", width: "90%" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem", margin: 0 }}>New Project</h3>
                        <div className="form-group" style={{ marginBottom: "1rem" }}>
                            <label style={{ marginBottom: "0.3rem", fontSize: "0.9rem" }}>Project Name</label>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="My Amazing Project"
                                autoFocus
                                onKeyPress={(e) => e.key === "Enter" && handleCreateProject()}
                                style={{ fontSize: "0.9rem", padding: "0.5rem" }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                            <button
                                onClick={handleCreateProject}
                                className="btn btn-primary"
                                disabled={!newProjectName.trim()}
                                style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowNewProjectModal(false)}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
