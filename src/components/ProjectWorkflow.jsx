import React, { useState } from "react";
import ScriptEditor from "./ScriptEditor";

export default function ProjectWorkflow() {
    const [activeStep, setActiveStep] = useState(1);
    const [aiGenerationEnabled, setAiGenerationEnabled] = useState({
        1: false, // Script
        2: false, // Art Direction
        3: false, // Image Generation
        4: false, // Video Generation
        5: false  // SoundFX
    });

    const steps = [
        { id: 1, label: "Script", icon: "📝" },
        { id: 2, label: "Art Direction", icon: "🎨" },
        { id: 3, label: "Image Generation", icon: "🖼️" },
        { id: 4, label: "Video Generation", icon: "🎬" },
        { id: 5, label: "SoundFX", icon: "🔊" },
        { id: 6, label: "Render", icon: "✨" }
    ];

    const toggleAiGeneration = (stepId) => {
        setAiGenerationEnabled(prev => ({
            ...prev,
            [stepId]: !prev[stepId]
        }));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* SECCIÓN 1: MENÚ PRINCIPAL */}
            <div className="card">
                <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Project Workflow</h3>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.25rem",
                    overflow: "auto",
                    paddingBottom: "0.5rem"
                }}>
                    {steps.map((step, index) => (
                        <div key={step.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                            <button
                                onClick={() => setActiveStep(step.id)}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    padding: "0.6rem 0.5rem",
                                    borderRadius: "8px",
                                    border: activeStep === step.id
                                        ? "2px solid #3b82f6"
                                        : "2px solid rgba(255, 255, 255, 0.1)",
                                    background: activeStep === step.id
                                        ? "rgba(59, 130, 246, 0.15)"
                                        : "rgba(15, 23, 42, 0.6)",
                                    color: activeStep === step.id ? "#3b82f6" : "#94a3b8",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                    fontSize: "0.7rem",
                                    fontWeight: activeStep === step.id ? "600" : "400",
                                    width: "100%",
                                    minWidth: "70px"
                                }}
                                onMouseEnter={(e) => {
                                    if (activeStep !== step.id) {
                                        e.target.style.borderColor = "rgba(59, 130, 246, 0.3)";
                                        e.target.style.background = "rgba(59, 130, 246, 0.1)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeStep !== step.id) {
                                        e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                                        e.target.style.background = "rgba(15, 23, 42, 0.6)";
                                    }
                                }}
                            >
                                <span style={{ fontSize: "1.2rem" }}>{step.icon}</span>
                                <span style={{ lineHeight: "1.2" }}>{step.label}</span>
                            </button>
                            {index < steps.length - 1 && (
                                <div style={{
                                    width: "100%",
                                    height: "2px",
                                    background: index < activeStep - 1
                                        ? "#3b82f6"
                                        : "rgba(255, 255, 255, 0.1)",
                                    margin: "0 0.25rem"
                                }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 2: GENERATE WITH AI */}
            {activeStep !== 6 && (
                <>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.75rem"
                    }}>
                        <h3 style={{ margin: 0, fontSize: "1rem" }}>Generate with AI</h3>
                        <input
                            type="checkbox"
                            checked={aiGenerationEnabled[activeStep]}
                            onChange={() => toggleAiGeneration(activeStep)}
                            style={{
                                width: "1.5rem",
                                height: "1.5rem",
                                cursor: "pointer",
                                accentColor: "#10b981"
                            }}
                        />
                    </div>

                    {aiGenerationEnabled[activeStep] && (
                        <div className="card">
                            <div style={{
                                padding: "1.5rem",
                                backgroundColor: "rgba(139, 92, 246, 0.1)",
                                borderRadius: "8px",
                                border: "1px solid rgba(139, 92, 246, 0.3)"
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem"
                                }}>
                                    <span style={{ fontSize: "2rem" }}>✨</span>
                                    <div>
                                        <div style={{ fontWeight: "600", color: "#f8fafc", fontSize: "1rem" }}>
                                            {steps.find(s => s.id === activeStep)?.label}
                                        </div>
                                        <div style={{
                                            fontSize: "0.9rem",
                                            color: "#94a3b8",
                                            marginTop: "0.25rem"
                                        }}>
                                            AI-powered content generation enabled
                                        </div>
                                    </div>
                                </div>

                                {/* Estado de confirmación */}
                                <div style={{
                                    marginTop: "1rem",
                                    padding: "1rem",
                                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                                    borderRadius: "6px",
                                    borderLeft: "4px solid #10b981",
                                    color: "#d1fae5"
                                }}>
                                    <div style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span>✓</span>
                                        Ready to generate <strong>{steps.find(s => s.id === activeStep)?.label}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* SECCIÓN 3: DETALLES DEL PASO */}
            {activeStep === 1 ? (
                <ScriptEditor />
            ) : (
                <div className="card">
                    <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>
                        {steps.find(s => s.id === activeStep)?.label}
                    </h3>

                    {/* Contenido por paso */}
                    <div style={{ color: "#cbd5e1" }}>
                        {activeStep === 2 && (
                            <div>
                                <p>Define visual direction and style with AI recommendations</p>
                                <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                                    Establish artistic style and visual concepts for your project.
                                </p>
                            </div>
                        )}
                        {activeStep === 3 && (
                            <div>
                                <p>Generate images using AI models</p>
                                <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                                    Create high-quality images based on your direction and prompts.
                                </p>
                            </div>
                        )}
                        {activeStep === 4 && (
                            <div>
                                <p>Create video content from images and sequences</p>
                                <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                                    Animate and combine images into dynamic video sequences.
                                </p>
                            </div>
                        )}
                        {activeStep === 5 && (
                            <div>
                                <p>Generate sound effects and audio using AI</p>
                                <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                                    Create immersive audio experiences with AI-generated sound effects.
                                </p>
                            </div>
                        )}
                        {activeStep === 6 && (
                            <div>
                                <p>Finalize and render your complete project</p>
                                <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                                    Combine all elements and export your finished production.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
