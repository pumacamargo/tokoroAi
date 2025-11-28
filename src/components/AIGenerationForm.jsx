import React, { useState, useEffect } from "react";
import { subscribeToTemplates, saveTemplate, deleteTemplate, initializeDefaultTemplates } from "../services/templateService";
import { sendToWebhook } from "../services/webhookService";
import { useEnvironment } from "../contexts/EnvironmentContext";
import { auth } from "../firebase";

export default function AIGenerationForm({ stepId, stepLabel, questions, defaultTemplates = [], onGeneratedContent = null }) {
    const { environment } = useEnvironment();

    const [expandedQuestions, setExpandedQuestions] = useState(
        questions.reduce((acc, q) => {
            acc[q.key] = q.defaultOpen || false;
            return acc;
        }, {})
    );
    const [formValues, setFormValues] = useState(
        questions.reduce((acc, q) => {
            acc[q.key] = "";
            return acc;
        }, {})
    );
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [expandedTemplates, setExpandedTemplates] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [generateError, setGenerateError] = useState(null);
    const [advancedMode, setAdvancedMode] = useState(false);

    // Subscribe to templates from Firestore and initialize defaults
    useEffect(() => {
        setLoading(true);
        setError(null);

        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        // Initialize default templates if they don't exist
        if (defaultTemplates.length > 0) {
            initializeDefaultTemplates(stepId, defaultTemplates).catch(err => {
                console.error("Error initializing templates:", err);
            });
        }

        const unsubscribe = subscribeToTemplates(stepId, (templatesData) => {
            setTemplates(templatesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [stepId, defaultTemplates]);

    const toggleQuestion = (questionKey) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [questionKey]: !prev[questionKey]
        }));
    };

    const updateFormValue = (key, value) => {
        setFormValues(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveTemplate = async () => {
        if (!newTemplateName.trim()) {
            alert("Please enter a template name");
            return;
        }

        setSavingTemplate(true);
        try {
            await saveTemplate(stepId, newTemplateName, formValues);
            setNewTemplateName("");
            setShowSaveTemplate(false);
        } catch (err) {
            alert("Error saving template: " + err.message);
            console.error(err);
        } finally {
            setSavingTemplate(false);
        }
    };

    const loadTemplate = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setFormValues(template.data);
            setSelectedTemplate(templateId);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm("Are you sure you want to delete this template?")) {
            return;
        }

        try {
            await deleteTemplate(templateId);
            if (selectedTemplate === templateId) {
                setSelectedTemplate(null);
            }
        } catch (err) {
            alert("Error deleting template: " + err.message);
            console.error(err);
        }
    };

    const handleGenerateWithAI = async () => {
        setGeneratingAI(true);
        setGenerateError(null);

        try {
            const response = await sendToWebhook(stepId, formValues, environment);

            // Extract text content from the response
            let generatedText = "";

            if (response.text) {
                generatedText = response.text;
            } else if (typeof response === "string") {
                generatedText = response;
            } else if (response.content) {
                generatedText = response.content;
            } else {
                // Try to find any string content in the response object
                generatedText = JSON.stringify(response);
            }

            // Remove HTML tags and extra formatting
            generatedText = generatedText
                .replace(/<[^>]*>/g, "") // Remove HTML tags
                .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .trim();

            // Call the callback to update the parent component
            if (onGeneratedContent) {
                onGeneratedContent(generatedText);
            }

            alert("✓ Content generated successfully! Check the Script section.");
        } catch (err) {
            const errorMsg = `Error generating content: ${err.message}`;
            setGenerateError(errorMsg);
            alert(errorMsg);
            console.error(err);
        } finally {
            setGeneratingAI(false);
        }
    };

    return (
        <div className="card">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Templates Section */}
                <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "1rem" }}>
                    <div
                        onClick={() => setExpandedTemplates(!expandedTemplates)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            marginBottom: "0.75rem"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Templates</h4>
                            {selectedTemplate && (
                                <span style={{
                                    fontSize: "0.85rem",
                                    color: "#10b981",
                                    fontWeight: "500",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "4px",
                                    backgroundColor: "rgba(16, 185, 129, 0.2)"
                                }}>
                                    Active: {templates.find(t => t.id === selectedTemplate)?.name || "Unknown"}
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: "1.2rem" }}>{expandedTemplates ? "▼" : "▶"}</span>
                    </div>

                    {expandedTemplates && (
                        <>
                            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                                {templates.map(template => (
                                    <div key={template.id} style={{ display: "flex", gap: "0.25rem" }}>
                                        <button
                                            onClick={() => loadTemplate(template.id)}
                                            style={{
                                                padding: "0.5rem 0.75rem",
                                                borderRadius: "6px",
                                                border: selectedTemplate === template.id
                                                    ? "1px solid #10b981"
                                                    : "1px solid rgba(255, 255, 255, 0.2)",
                                                backgroundColor: selectedTemplate === template.id
                                                    ? "rgba(16, 185, 129, 0.2)"
                                                    : "rgba(15, 23, 42, 0.6)",
                                                color: "#f8fafc",
                                                fontSize: "0.85rem",
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedTemplate !== template.id) {
                                                    e.target.style.borderColor = "rgba(16, 185, 129, 0.5)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedTemplate !== template.id) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                                                }
                                            }}
                                        >
                                            {template.name}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTemplate(template.id)}
                                            style={{
                                                padding: "0.5rem 0.5rem",
                                                borderRadius: "6px",
                                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                                backgroundColor: "rgba(15, 23, 42, 0.6)",
                                                color: "#f8fafc",
                                                fontSize: "0.85rem",
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.borderColor = "rgba(239, 68, 68, 0.5)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {!showSaveTemplate ? (
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        onClick={() => setShowSaveTemplate(true)}
                                        style={{
                                            padding: "0.5rem 0.75rem",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(16, 185, 129, 0.5)",
                                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                                            color: "#10b981",
                                            fontSize: "0.85rem",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        + Save as Template
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                    <input
                                        type="text"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        placeholder="Template name..."
                                        style={{
                                            padding: "0.5rem",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255, 255, 255, 0.2)",
                                            backgroundColor: "rgba(15, 23, 42, 0.6)",
                                            color: "#f8fafc",
                                            fontSize: "0.85rem",
                                            fontFamily: "inherit"
                                        }}
                                    />
                                    <button
                                        onClick={handleSaveTemplate}
                                        disabled={savingTemplate}
                                        style={{
                                            padding: "0.5rem 0.75rem",
                                            borderRadius: "6px",
                                            border: "none",
                                            backgroundColor: "#10b981",
                                            color: "#ffffff",
                                            fontSize: "0.85rem",
                                            cursor: "pointer",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowSaveTemplate(false);
                                            setNewTemplateName("");
                                        }}
                                        style={{
                                            padding: "0.5rem 0.75rem",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255, 255, 255, 0.2)",
                                            backgroundColor: "rgba(15, 23, 42, 0.6)",
                                            color: "#f8fafc",
                                            fontSize: "0.85rem",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Questions Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {questions.map(question => {
                        // Hide Task, Example, Output unless advanced mode is on
                        const hiddenInBasicMode = ["task", "example", "output"].includes(question.key);
                        if (hiddenInBasicMode && !advancedMode) {
                            return null;
                        }

                        return (
                            <div key={question.key}>
                                <label style={{
                                    display: "block",
                                    padding: "0.5rem 0",
                                    fontWeight: "500",
                                    fontSize: "0.9rem"
                                }}>
                                    {question.label}
                                </label>
                                {question.type === "textarea" ? (
                                    <textarea
                                        value={formValues[question.key]}
                                        onChange={(e) => updateFormValue(question.key, e.target.value)}
                                        placeholder={question.placeholder}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255, 255, 255, 0.2)",
                                            backgroundColor: "rgba(15, 23, 42, 0.6)",
                                            color: "#f8fafc",
                                            fontFamily: "inherit",
                                            fontSize: "0.9rem",
                                            minHeight: "80px",
                                            resize: "vertical",
                                            boxSizing: "border-box",
                                            marginBottom: "0.75rem"
                                        }}
                                    />
                                ) : (
                                    <input
                                        type={question.type || "text"}
                                        value={formValues[question.key]}
                                        onChange={(e) => updateFormValue(question.key, e.target.value)}
                                        placeholder={question.placeholder}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255, 255, 255, 0.2)",
                                            backgroundColor: "rgba(15, 23, 42, 0.6)",
                                            color: "#f8fafc",
                                            fontFamily: "inherit",
                                            fontSize: "0.9rem",
                                            boxSizing: "border-box",
                                            marginBottom: "0.75rem"
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer with Advanced Mode Toggle (left) and Generate Button (right) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginTop: "0.5rem" }}>
                    {/* Advanced Mode Toggle - Left */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input
                            type="checkbox"
                            id="advancedMode"
                            checked={advancedMode}
                            onChange={(e) => setAdvancedMode(e.target.checked)}
                            style={{
                                width: "1.25rem",
                                height: "1.25rem",
                                cursor: "pointer",
                                accentColor: "#3b82f6"
                            }}
                        />
                        <label htmlFor="advancedMode" style={{ cursor: "pointer", fontSize: "0.9rem", fontWeight: "500" }}>
                            Advanced Mode
                        </label>
                    </div>

                    {/* Generate Button - Right */}
                    <button
                        onClick={handleGenerateWithAI}
                        disabled={generatingAI}
                        style={{
                            padding: "0.75rem 1.5rem",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: generatingAI ? "#64748b" : "#10b981",
                            color: "#ffffff",
                            fontWeight: "600",
                            fontSize: "0.95rem",
                            cursor: generatingAI ? "not-allowed" : "pointer",
                            transition: "all 0.3s",
                            opacity: generatingAI ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!generatingAI) {
                                e.target.style.backgroundColor = "#059669";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!generatingAI) {
                                e.target.style.backgroundColor = "#10b981";
                            }
                        }}
                    >
                        {generatingAI ? "🔄 Generating..." : "✨ Generate with AI"}
                    </button>
                </div>
            </div>
        </div>
    );
}
