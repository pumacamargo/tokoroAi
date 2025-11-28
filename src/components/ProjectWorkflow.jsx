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
        defaultTemplates: [
            { id: "script_1", name: "Short Form Video", data: { task: "Create engaging short form video script", numShots: "3-5", topic: "Entertainment", example: "TikTok style", output: "Video transcript with timestamps" } },
            { id: "script_2", name: "Commercial", data: { task: "Write product commercial script", numShots: "1", topic: "Product Marketing", example: "30-second ad", output: "Professional voiceover script" } }
        ]
    },
    2: { // Art Direction
        label: "Art Direction",
        questions: [
            { key: "style", label: "Visual Style", placeholder: "Describe the visual style...", type: "textarea", defaultOpen: false },
            { key: "colorPalette", label: "Color Palette", placeholder: "Define color palette...", type: "text", highlight: true, defaultOpen: true },
            { key: "mood", label: "Mood & Tone", placeholder: "Describe mood and tone...", type: "textarea", defaultOpen: false },
            { key: "reference", label: "Reference Images", placeholder: "Enter reference style...", type: "text", defaultOpen: false },
            { key: "guidelines", label: "Brand Guidelines", placeholder: "Brand specific requirements...", type: "textarea", defaultOpen: false }
        ],
        defaultTemplates: [
            { id: "art_1", name: "Modern Minimal", data: { style: "Clean and minimalist", colorPalette: "Blue, white, gray", mood: "Professional and modern", reference: "Flat design", guidelines: "Contemporary branding" } },
            { id: "art_2", name: "Vibrant Colorful", data: { style: "Bold and vibrant", colorPalette: "Bright multi-color", mood: "Fun and energetic", reference: "Pop art style", guidelines: "Youth-oriented" } }
        ]
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
        defaultTemplates: [
            { id: "img_1", name: "Product Shot", data: { subject: "Professional product photography", resolution: "1080x1080", style: "Studio", lighting: "Bright studio lighting", requirements: "White background" } },
            { id: "img_2", name: "Landscape", data: { subject: "Beautiful landscape", resolution: "1920x1080", style: "Photorealistic", lighting: "Golden hour", requirements: "Natural scenery" } }
        ]
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
        defaultTemplates: [
            { id: "vid_1", name: "Promotional Video", data: { description: "Product promotional video", duration: "30", movement: "Smooth pans and zooms", music: "Upbeat background music", transitions: "Fade transitions" } }
        ]
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
        defaultTemplates: [
            { id: "sound_1", name: "Dramatic Impact", data: { description: "Dramatic sound effect", type: "Impact", duration: "2", tone: "Intense and powerful", intensity: "High" } }
        ]
    }
};

export default function ProjectWorkflow({ projectId }) {
    const [activeStep, setActiveStep] = useState(1);
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
                <div className="card">
                    <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>
                        {steps.find(s => s.id === activeStep)?.label}
                    </h3>

                    {/* Contenido por paso */}
                    <div style={{ color: "#cbd5e1" }}>
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
