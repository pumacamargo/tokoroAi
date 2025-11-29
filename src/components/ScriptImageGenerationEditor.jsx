import React, { useState, useEffect, useRef } from "react";
import { sendToWebhook } from "../services/webhookService";
import { useEnvironment } from "../contexts/EnvironmentContext";

function ScriptImageGenerationEditor(props) {
    const { stepId, projectId, scripts = [], onScriptUpdate } = props;
    const { environment } = useEnvironment();

    const [localScripts, setLocalScripts] = useState([]);
    const [generatingIndex, setGeneratingIndex] = useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const fileInputRefs = useRef({});

    // Sincronizar scripts externos con estado local
    useEffect(() => {
        if (scripts && scripts.length > 0) {
            setLocalScripts(scripts);
        }
    }, [scripts]);

    // Handle window resize for responsive layout
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Determine layout based on window width
    const isVertical = windowWidth < 900;

    // Get labels based on step
    const getStepLabels = () => {
        switch(stepId) {
            case 3: // Image Generation
                return {
                    secondLabel: "Prompt",
                    generatePromptBtn: "Generate Prompt",
                    generateBtn: "Generate Image"
                };
            case 4: // Video Generation
                return {
                    secondLabel: "Description",
                    generatePromptBtn: "Generate Description",
                    generateBtn: "Generate Video"
                };
            case 5: // SoundFX
                return {
                    secondLabel: "Audio Prompt",
                    generatePromptBtn: "Generate Prompt",
                    generateBtn: "Generate Sound"
                };
            default:
                return {
                    secondLabel: "Prompt",
                    generatePromptBtn: "Generate Prompt",
                    generateBtn: "Generate"
                };
        }
    };

    const labels = getStepLabels();

    const handleScriptChange = (index, newContent) => {
        const updated = [...localScripts];
        updated[index] = { ...updated[index], content: newContent };
        setLocalScripts(updated);
        // Notificar al padre del cambio
        if (onScriptUpdate) {
            onScriptUpdate(updated);
        }
    };

    const handlePromptChange = (index, newPrompt) => {
        const updated = [...localScripts];
        updated[index] = { ...updated[index], prompt: newPrompt };
        setLocalScripts(updated);
        // Notificar al padre del cambio
        if (onScriptUpdate) {
            onScriptUpdate(updated);
        }
    };

    const handleImageUpload = async (index, file) => {
        if (!file) return;

        try {
            // TODO: Implement image upload to Firebase Storage
            // For now, just create a local preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const updated = [...localScripts];
                updated[index] = { ...updated[index], image: e.target.result };
                setLocalScripts(updated);
                // Notificar al padre del cambio
                if (onScriptUpdate) {
                    onScriptUpdate(updated);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error uploading image: " + error.message);
        }
    };

    const handleGeneratePrompt = async (index) => {
        if (!localScripts[index] || !localScripts[index].content.trim()) {
            alert("Please enter script content first");
            return;
        }

        setGeneratingIndex(index);
        try {
            // Send to webhook to generate prompt from script
            const formData = {
                script: localScripts[index].content,
                projectId: projectId,
                stepId: stepId
            };

            const response = await sendToWebhook(stepId, formData, environment);
            let generatedPrompt = "";

            if (response.text) {
                generatedPrompt = response.text;
            } else if (typeof response === "string") {
                generatedPrompt = response;
            }

            if (generatedPrompt) {
                handlePromptChange(index, generatedPrompt);
            }
        } catch (error) {
            console.error("Error generating prompt:", error);
            alert("Error generating prompt: " + error.message);
        } finally {
            setGeneratingIndex(null);
        }
    };

    const handleGenerateImage = async (index) => {
        if (!localScripts[index] || !localScripts[index].prompt.trim()) {
            alert("Please enter or generate a prompt first");
            return;
        }

        setGeneratingIndex(index);
        try {
            // Send to webhook to generate image/video/sound
            const formData = {
                prompt: localScripts[index].prompt,
                script: localScripts[index].content,
                projectId: projectId,
                stepId: stepId
            };

            const response = await sendToWebhook(stepId, formData, environment);
            console.log("Generation response:", response);

            // TODO: Handle image/video/sound result and save to Firebase
        } catch (error) {
            console.error("Error generating:", error);
            alert("Error generating: " + error.message);
        } finally {
            setGeneratingIndex(null);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {localScripts.map((script, index) => (
                <div
                    key={index}
                    style={{
                        display: "flex",
                        flexDirection: isVertical ? "column" : "row",
                        gap: "1rem",
                        padding: "1rem",
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        borderRadius: "8px"
                    }}
                >
                    {/* Column 1: Image */}
                    <div
                        style={{
                            flex: isVertical ? "0 0 100%" : "0 0 30%",
                            minHeight: isVertical ? "100px" : "150px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(30, 41, 59, 0.5)",
                            borderRadius: "8px",
                            border: "2px dashed rgba(59, 130, 246, 0.3)",
                            cursor: stepId === 3 ? "pointer" : "default",
                            overflow: "hidden",
                            opacity: stepId === 3 ? 1 : 0.6
                        }}
                        onClick={() => stepId === 3 && fileInputRefs.current[index]?.click()}
                    >
                        {script.image ? (
                            <img
                                src={script.image}
                                alt={`Script ${index + 1}`}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain"
                                }}
                            />
                        ) : (
                            <div style={{ textAlign: "center", color: "#64748b" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
                                <p style={{ margin: 0, fontSize: "0.9rem" }}>Click to upload image</p>
                            </div>
                        )}
                        <input
                            ref={(el) => (fileInputRefs.current[index] = el)}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => handleImageUpload(index, e.target.files?.[0])}
                        />
                    </div>

                    {/* Column 2: Script and Prompt */}
                    <div
                        style={{
                            flex: isVertical ? "0 0 100%" : "1 1 auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem"
                        }}
                    >
                        {/* Script */}
                        <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: "500", marginBottom: "0.25rem", color: "#cbd5e1" }}>
                                Script
                            </label>
                            <textarea
                                value={script.content}
                                onChange={(e) => stepId === 1 && handleScriptChange(index, e.target.value)}
                                readOnly={stepId !== 1}
                                placeholder="Enter script content..."
                                style={{
                                    flex: 1,
                                    padding: "0.75rem",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(59, 130, 246, 0.2)",
                                    backgroundColor: stepId === 1 ? "rgba(15, 23, 42, 0.6)" : "rgba(15, 23, 42, 0.4)",
                                    color: "#f8fafc",
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                    lineHeight: "1.4",
                                    resize: "none",
                                    minHeight: isVertical ? "60px" : "70px",
                                    overflow: "auto",
                                    opacity: stepId === 1 ? 1 : 0.7,
                                    cursor: stepId === 1 ? "text" : "default"
                                }}
                            />
                        </div>

                        {/* Second textarea - Prompt/Description/Audio Prompt */}
                        <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: "500", marginBottom: "0.25rem", color: "#cbd5e1" }}>
                                {labels.secondLabel}
                            </label>
                            <textarea
                                value={script.prompt}
                                onChange={(e) => handlePromptChange(index, e.target.value)}
                                placeholder={stepId === 1 ? "Enter or generate prompt..." : "Generated content will appear here"}
                                style={{
                                    flex: 1,
                                    padding: "0.75rem",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(59, 130, 246, 0.2)",
                                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                                    color: "#f8fafc",
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                    lineHeight: "1.4",
                                    resize: "none",
                                    minHeight: isVertical ? "60px" : "70px",
                                    overflow: "auto"
                                }}
                            />
                        </div>
                    </div>

                    {/* Column 3: Buttons */}
                    <div
                        style={{
                            flex: isVertical ? "0 0 100%" : "0 0 auto",
                            display: "flex",
                            flexDirection: isVertical ? "row" : "column",
                            gap: "0.5rem",
                            justifyContent: isVertical ? "flex-start" : "center"
                        }}
                    >
                        <button
                            onClick={() => handleGeneratePrompt(index)}
                            disabled={generatingIndex === index}
                            style={{
                                padding: "0.75rem 1rem",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: generatingIndex === index ? "#64748b" : "#3b82f6",
                                color: "#ffffff",
                                fontWeight: "600",
                                fontSize: "0.85rem",
                                cursor: generatingIndex === index ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                                opacity: generatingIndex === index ? 0.7 : 1,
                                whiteSpace: "nowrap",
                                filter: stepId !== 1 ? "grayscale(60%)" : "none"
                            }}
                            onMouseEnter={(e) => {
                                if (generatingIndex !== index) {
                                    e.target.style.backgroundColor = "#2563eb";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (generatingIndex !== index) {
                                    e.target.style.backgroundColor = "#3b82f6";
                                }
                            }}
                        >
                            {generatingIndex === index ? "Generating..." : labels.generatePromptBtn}
                        </button>

                        <button
                            onClick={() => handleGenerateImage(index)}
                            disabled={generatingIndex === index}
                            style={{
                                padding: "0.75rem 1rem",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: generatingIndex === index ? "#64748b" : "#8b5cf6",
                                color: "#ffffff",
                                fontWeight: "600",
                                fontSize: "0.85rem",
                                cursor: generatingIndex === index ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                                opacity: generatingIndex === index ? 0.7 : 1,
                                whiteSpace: "nowrap",
                                filter: stepId === 1 ? "grayscale(60%)" : "none"
                            }}
                            onMouseEnter={(e) => {
                                if (generatingIndex !== index) {
                                    e.target.style.backgroundColor = "#7c3aed";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (generatingIndex !== index) {
                                    e.target.style.backgroundColor = "#8b5cf6";
                                }
                            }}
                        >
                            {generatingIndex === index ? "Generating..." : labels.generateBtn}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ScriptImageGenerationEditor;
