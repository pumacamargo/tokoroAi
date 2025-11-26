import React, { useState } from "react";

export default function ProjectWorkflow() {
    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        { id: 1, label: "Script", icon: "📝" },
        { id: 2, label: "Art Direction", icon: "🎨" },
        { id: 3, label: "Image Generation", icon: "🖼️" },
        { id: 4, label: "Video Generation", icon: "🎬" },
        { id: 5, label: "SoundFX", icon: "🔊" },
        { id: 6, label: "Render", icon: "✨" }
    ];

    return (
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
    );
}
