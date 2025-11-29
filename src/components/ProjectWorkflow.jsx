import React, { useState } from "react";
import ScriptEditor from "./ScriptEditor";
import AssetDirectionEditor from "./AssetDirectionEditor";
import AIGenerationForm from "./AIGenerationForm";

// Define questions and templates for each step
const STEP_CONFIGS = {
    1: { // Script
        label: "Script",
        questions: [
            { key: "task", label: "Task", placeholder: "Enter task description...", type: "textarea", defaultOpen: false },
            { key: "numShots", label: "Num of Shots", placeholder: "Enter number of shots...", type: "text", defaultOpen: false },
            { key: "topic", label: "Topic", placeholder: "Enter topic...", type: "text", highlight: true, defaultOpen: true },
            { key: "example", label: "Structure", placeholder: "Enter structure...", type: "textarea", defaultOpen: false },
            { key: "output", label: "Output", placeholder: "Enter output specifications...", type: "textarea", defaultOpen: false }
        ],
        defaultTemplates: []
    },
    2: { // Art Direction
        label: "Art Direction",
        questions: [
            { key: "task", label: "Task", placeholder: "Enter task description...", type: "textarea", defaultOpen: false, advanced: false },
            { key: "example", label: "Structure", placeholder: "Enter structure...", type: "textarea", highlight: true, defaultOpen: true, advanced: false },
            { key: "output", label: "Output", placeholder: "Enter output specifications...", type: "textarea", defaultOpen: false, advanced: true }
        ],
        defaultTemplates: []
    },
    3: { // Image Generation
        label: "Image Generation",
        questions: [
            { key: "subject", label: "Subject", placeholder: "What should be in the image...", type: "textarea", defaultOpen: false },
            { key: "resolution", label: "Resolution", placeholder: "Image resolution...", type: "text", highlight: true, defaultOpen: true },
            { key: "style", label: "Art Style", placeholder: "Artistic style...", type: "text", defaultOpen: false },
            { key: "lighting", label: "Lighting", placeholder: "Lighting conditions...", type: "text", defaultOpen: false },
            { key: "requirements", label: "Special Requirements", placeholder: "Any specific requirements...", type: "textarea", defaultOpen: false }
        ],
        defaultTemplates: []
    },
    4: { // Video Generation
        label: "Video Generation",
        questions: [
            { key: "description", label: "Video Description", placeholder: "Describe the video content...", type: "textarea", defaultOpen: false },
            { key: "duration", label: "Duration", placeholder: "Video length in seconds...", type: "text", highlight: true, defaultOpen: true },
            { key: "movement", label: "Movement & Animation", placeholder: "How should elements move...", type: "textarea", defaultOpen: false },
            { key: "music", label: "Music & Sound", placeholder: "Audio requirements...", type: "text", defaultOpen: false },
            { key: "transitions", label: "Transitions & Effects", placeholder: "Special effects needed...", type: "textarea", defaultOpen: false }
        ],
        defaultTemplates: []
    },
    5: { // SoundFX
        label: "SoundFX",
        questions: [
            { key: "description", label: "Sound Description", placeholder: "Describe the sound effect...", type: "textarea", defaultOpen: false },
            { key: "type", label: "Sound Type", placeholder: "Type of sound (ambient, impact, etc)...", type: "text", highlight: true, defaultOpen: true },
            { key: "duration", label: "Duration", placeholder: "Duration in seconds...", type: "text", defaultOpen: false },
            { key: "tone", label: "Tone & Mood", placeholder: "Sound tone and mood...", type: "text", defaultOpen: false },
            { key: "intensity", label: "Intensity Level", placeholder: "Volume and intensity level...", type: "text", defaultOpen: false }
        ],
        defaultTemplates: []
    }
};

export default function ProjectWorkflow({ projectId }) {
    const [activeStep, setActiveStep] = useState(1);
    const [scriptContent, setScriptContent] = useState("");
    const [aiGenerationEnabled, setAiGenerationEnabled] = useState({
        1: false, // Script
        2: false, // Art Direction
        3: false, // Image Generation
        4: false, // Video Generation
        5: false  // SoundFX
    });
    const scriptEditorRef = React.useRef(null);
    const assetDirectionEditorRef = React.useRef(null);

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

    const handleGeneratedContent = (generatedText) => {
        // For step 1 (Script), pass the content to the ScriptEditor
        if (activeStep === 1 && scriptEditorRef.current) {
            scriptEditorRef.current.addGeneratedContent(generatedText);
        }
        // For step 2 (Art Direction), pass the content to the AssetDirectionEditor
        if (activeStep === 2 && assetDirectionEditorRef.current) {
            assetDirectionEditorRef.current.addGeneratedContent(generatedText);
        }
        // TODO: Add handlers for other steps
    };

    // Update scriptContent whenever we leave Script view (activeStep changes from 1)
    React.useEffect(() => {
        if (activeStep !== 1 && scriptEditorRef.current) {
            const content = scriptEditorRef.current.getScriptContent?.();
            if (content) {
                setScriptContent(content);
            }
        }
    }, [activeStep]);

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
                    <div
                        onClick={() => toggleAiGeneration(activeStep)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "0.75rem",
                            cursor: "pointer"
                        }}
                    >
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
                        <AIGenerationForm
                            stepId={activeStep}
                            stepLabel={STEP_CONFIGS[activeStep].label}
                            questions={STEP_CONFIGS[activeStep].questions}
                            defaultTemplates={STEP_CONFIGS[activeStep].defaultTemplates}
                            onGeneratedContent={handleGeneratedContent}
                            scriptContent={scriptContent}
                        />
                    )}
                </>
            )}

            {/* SECCIÓN 3: DETALLES DEL PASO */}
            {activeStep === 1 ? (
                <ScriptEditor ref={scriptEditorRef} projectId={projectId} />
            ) : activeStep === 2 ? (
                <AssetDirectionEditor ref={assetDirectionEditorRef} projectId={projectId} />
            ) : (
                <>
                    <h3 style={{ marginBottom: "0.75rem", fontSize: "1rem", marginTop: 0 }}>
                        {steps.find(s => s.id === activeStep)?.label}
                    </h3>
                    <div className="card">
                    </div>
                </>
            )}
        </div>
    );
}
