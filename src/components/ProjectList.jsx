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

        if (!confirm("¿Estás seguro de eliminar este proyecto?")) return;

        const result = await deleteProject(projectId);
        if (result.success) {
            await loadProjects();
            if (currentProject?.id === projectId) {
                onSelectProject(null);
            }
        }
    }

    if (loading) {
        return <div style={{ color: "#94a3b8" }}>Cargando proyectos...</div>;
    }

    return (
        <div className="card" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3>Mis Proyectos</h3>
                <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="btn btn-primary"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                >
                    + Nuevo Proyecto
                </button>
            </div>

            {projects.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>
                    No tienes proyectos. ¡Crea uno para empezar!
                </p>
            ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => onSelectProject(project)}
                            className="project-item"
                            style={{
                                padding: "1rem",
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
                                alignItems: "center"
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                                    {project.name}
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                                    {project.createdAt?.toDate?.()?.toLocaleDateString() || "Reciente"}
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleDeleteProject(project.id, e)}
                                className="btn-icon-delete"
                                style={{
                                    background: "transparent",
                                    border: "1px solid rgba(239, 68, 68, 0.5)",
                                    color: "#ef4444",
                                    padding: "0.5rem",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
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
                        style={{ maxWidth: "400px", width: "90%" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: "1.5rem" }}>Nuevo Proyecto</h3>
                        <div className="form-group">
                            <label>Nombre del Proyecto</label>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Mi Proyecto Increíble"
                                autoFocus
                                onKeyPress={(e) => e.key === "Enter" && handleCreateProject()}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                            <button
                                onClick={handleCreateProject}
                                className="btn btn-primary"
                                disabled={!newProjectName.trim()}
                                style={{ flex: 1 }}
                            >
                                Crear
                            </button>
                            <button
                                onClick={() => setShowNewProjectModal(false)}
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
