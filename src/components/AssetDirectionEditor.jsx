import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { saveAssetsForProject, getProjectAssets, saveArtDirectionStyle, getArtDirectionStyle } from "../services/assetsService";
import { uploadAndUpdateAssetImage, deleteAssetImage, downloadAndSaveGeneratedImage, updateAssetImageUrl } from "../services/assetImagesService";
import { updateAsset } from "../services/assetsService";
import { getWebhookUrlByKey, sendToWebhook } from "../services/webhookService";
import { auth } from "../firebase";
import { useEnvironment } from "../contexts/EnvironmentContext";

const AssetDirectionEditor = forwardRef(function AssetDirectionEditor(props, ref) {
    const { projectId } = props;
    const { environment } = useEnvironment();

    const initializeFullText = () => {
        const defaultText = "Professional product photography studio setup with soft box lighting\nBold vibrant colors with energetic mood for youth market\nMinimalist aesthetic with clean lines and white space";
        const savedAssets = localStorage.getItem("artDirectionAssets");
        if (savedAssets) {
            try {
                const assetsData = JSON.parse(savedAssets);
                return assetsData.map(asset => asset.content).join("\n");
            } catch (error) {
                console.error("Error loading assets from localStorage:", error);
                return defaultText;
            }
        }
        return defaultText;
    };

    const [fullText, setFullText] = useState(initializeFullText());
    const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
    const [saveStatus, setSaveStatus] = useState("saved");
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverPosition, setDragOverPosition] = useState(null);
    const dragOverPositionRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const lastSavedRef = useRef(fullText);
    const [firestoreAssets, setFirestoreAssets] = useState([]);
    const [artDirectionStyle, setArtDirectionStyle] = useState("");
    const [styleTimeout, setStyleTimeout] = useState(null);
    const [styleSaveStatus, setStyleSaveStatus] = useState("saved");
    const lastStyleRef = useRef("");
    const [assetImages, setAssetImages] = useState({});
    const [uploadingAssets, setUploadingAssets] = useState({});
    const [generatingAssets, setGeneratingAssets] = useState({});
    const [configModalIndex, setConfigModalIndex] = useState(null);
    const [assetConfigs, setAssetConfigs] = useState({});
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [imageViewerIndex, setImageViewerIndex] = useState(null);
    const fileInputRefs = useRef({});

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnd = (e) => {
        setDraggedIndex(null);
        setDragOverPosition(null);
        dragOverPositionRef.current = null;
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.height / 2;
        const offsetY = e.clientY - rect.top;

        const newPosition = offsetY < midpoint ? "before" : "after";
        const newState = { index, position: newPosition };

        if (
            !dragOverPositionRef.current ||
            dragOverPositionRef.current.index !== newState.index ||
            dragOverPositionRef.current.position !== newState.position
        ) {
            dragOverPositionRef.current = newState;
            setDragOverPosition(newState);
        }
    };

    const handleDragLeave = (e) => {
        if (e.relatedTarget === null || !e.currentTarget.contains(e.relatedTarget)) {
            setDragOverPosition(null);
            dragOverPositionRef.current = null;
        }
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || dragOverPosition === null) {
            setDraggedIndex(null);
            setDragOverPosition(null);
            return;
        }

        const currentLines = fullText === "" ? [""] : fullText.split("\n");
        const draggedLine = currentLines[draggedIndex];

        let newDropIndex = dragOverPosition.position === "before" ? dropIndex : dropIndex + 1;

        if (draggedIndex < newDropIndex) {
            newDropIndex -= 1;
        }

        if (draggedIndex === newDropIndex) {
            setDraggedIndex(null);
            setDragOverPosition(null);
            return;
        }

        currentLines.splice(draggedIndex, 1);
        currentLines.splice(newDropIndex, 0, draggedLine);

        setFullText(currentLines.join("\n"));
        setCurrentAssetIndex(newDropIndex);
        setDraggedIndex(null);
        setDragOverPosition(null);
    };

    useImperativeHandle(ref, () => ({
        addGeneratedContent: (generatedText) => {
            const newAssets = generatedText.split("\n").filter(asset => asset.trim() !== "");
            if (newAssets.length === 0) {
                console.warn("No content to add from AI generation");
                return;
            }
            console.log("Adding", newAssets.length, "generated assets to editor");
            const updatedText = fullText ? fullText + "\n" + newAssets.join("\n") : newAssets.join("\n");
            setFullText(updatedText);
        }
    }));

    const displayAssets = fullText === "" ? [""] : fullText.split("\n");
    const assets = displayAssets.filter(asset => asset.trim() !== "");

    const handleAssetChange = (index, newContent) => {
        const currentLines = fullText === "" ? [""] : fullText.split("\n");
        currentLines[index] = newContent;
        setFullText(currentLines.join("\n"));
    };

    const textareaRefs = React.useRef([]);
    const [pendingFocusIndex, setPendingFocusIndex] = useState(null);

    useEffect(() => {
        if (pendingFocusIndex !== null && textareaRefs.current[pendingFocusIndex]) {
            textareaRefs.current[pendingFocusIndex].focus();
            textareaRefs.current[pendingFocusIndex].setSelectionRange(0, 0);
            setPendingFocusIndex(null);
        }
    }, [pendingFocusIndex, assets.length]);

    useEffect(() => {
        if (projectId && auth.currentUser) {
            const loadAssetsAndStyle = async () => {
                try {
                    console.log("Loading assets for projectId:", projectId);
                    const assets = await getProjectAssets(projectId);
                    console.log("Loaded assets from Firestore:", assets.length, assets);
                    setFirestoreAssets(assets);

                    // Load asset images and initialize configurations
                    const imagesMap = {};
                    const configsMap = {};
                    assets.forEach((asset, index) => {
                        if (asset.imageUrl) {
                            imagesMap[index] = asset.imageUrl;
                        }
                        // Initialize config for each asset with default imageModel
                        configsMap[index] = {
                            imageModel: "nanobanedit" // Default to nano banana edit
                        };
                    });
                    // Merge with existing images instead of replacing
                    setAssetImages(prevImages => ({ ...prevImages, ...imagesMap }));
                    // Merge with existing configs instead of replacing
                    setAssetConfigs(prevConfigs => ({ ...prevConfigs, ...configsMap }));

                    if (assets.length > 0) {
                        const fullTextFromAssets = assets.map(asset => asset.content).join("\n");
                        console.log("Assets loaded from Firestore:", assets.length);
                        console.log("Full text:", fullTextFromAssets);
                        setFullText(fullTextFromAssets);
                        lastSavedRef.current = fullTextFromAssets;
                        console.log("Updated fullText with", assets.length, "assets");
                    } else {
                        console.log("No assets found in Firestore for projectId:", projectId);
                    }

                    const style = await getArtDirectionStyle(projectId);
                    setArtDirectionStyle(style);
                    lastStyleRef.current = style;
                    setStyleSaveStatus("saved");
                    console.log("Loaded art direction style:", style);
                } catch (error) {
                    console.error("Error loading assets or style from Firestore:", error);
                }
            };
            loadAssetsAndStyle();
        }
    }, [projectId]);

    useEffect(() => {
        if (fullText !== lastSavedRef.current) {
            setSaveStatus("unsaved");

            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(async () => {
                setSaveStatus("saving");

                try {
                    if (projectId && auth.currentUser) {
                        const nonEmptyAssets = displayAssets.filter(asset => asset.trim() !== "");
                        const assetsData = nonEmptyAssets.map((asset, index) => ({
                            content: asset,
                            visualStyle: "",
                            colorPalette: "",
                            mood: "",
                            references: [],
                            order: index
                        }));

                        console.log("Saving", assetsData.length, "assets to Firestore");
                        await saveAssetsForProject(projectId, assetsData);
                        console.log("Successfully saved assets to Firestore");
                    }

                    const assets = displayAssets;
                    const assetsData = assets.map((asset, index) => ({
                        id: `asset_${index}`,
                        index: index,
                        content: asset,
                        savedAt: new Date().toISOString()
                    }));
                    localStorage.setItem("artDirectionAssets", JSON.stringify(assetsData));

                    lastSavedRef.current = fullText;

                    setTimeout(() => {
                        setSaveStatus("saved");
                    }, 500);
                } catch (error) {
                    console.error("Error saving assets:", error);
                    setSaveStatus("unsaved");
                }
            }, 1000);
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [fullText, displayAssets, projectId]);

    useEffect(() => {
        if (artDirectionStyle !== lastStyleRef.current) {
            setStyleSaveStatus("unsaved");

            if (styleTimeout) {
                clearTimeout(styleTimeout);
            }

            if (artDirectionStyle) {
                const newTimeout = setTimeout(async () => {
                    setStyleSaveStatus("saving");
                    try {
                        console.log("Saving art direction style to Firestore");
                        await saveArtDirectionStyle(projectId, artDirectionStyle);
                        console.log("Successfully saved art direction style");
                        lastStyleRef.current = artDirectionStyle;

                        setTimeout(() => {
                            setStyleSaveStatus("saved");
                        }, 500);
                    } catch (error) {
                        console.error("Error saving art direction style:", error);
                        setStyleSaveStatus("unsaved");
                    }
                }, 1000);

                setStyleTimeout(newTimeout);
            }
        }

        return () => {
            if (styleTimeout) {
                clearTimeout(styleTimeout);
            }
        };
    }, [artDirectionStyle, projectId]);

    // Handle window resize for responsive layout
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const handleUploadImage = async (index, file) => {
        if (!file) return;

        try {
            setUploadingAssets(prev => ({ ...prev, [index]: true }));
            console.log("Starting upload for asset", index);

            const imageUrl = await uploadAndUpdateAssetImage(projectId, `asset_${index}`, file);

            setAssetImages(prev => ({ ...prev, [index]: imageUrl }));
            console.log("Image uploaded successfully:", imageUrl);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert(`Error uploading image: ${error.message}`);
        } finally {
            setUploadingAssets(prev => ({ ...prev, [index]: false }));
            // Reset file input
            if (fileInputRefs.current[index]) {
                fileInputRefs.current[index].value = "";
            }
        }
    };

    const handleUploadClick = (index) => {
        if (fileInputRefs.current[index]) {
            fileInputRefs.current[index].click();
        }
    };

    const handleFileChange = (index, event) => {
        const file = event.target.files?.[0];
        if (file) {
            handleUploadImage(index, file);
        }
    };

    const handleUpdateAssetConfig = (index, config) => {
        setAssetConfigs(prev => ({
            ...prev,
            [index]: config
        }));
    };

    const handleGenerateWithAI = async (index) => {
        const assetText = assets[index];
        if (!assetText || assetText.trim() === "") {
            alert("Please enter asset description before generating");
            return;
        }

        try {
            setGeneratingAssets(prev => ({ ...prev, [index]: true }));
            console.log("Starting AI generation for asset", index);

            // Get the image model from asset config, default to "nanobanedit"
            const imageModel = assetConfigs[index]?.imageModel || "nanobanedit";
            console.log("Image model selected:", imageModel);

            const formData = {
                assetDescription: assetText,
                projectId: projectId,
                assetIndex: index,
                imageModel: imageModel,
                artDirectionStyle: artDirectionStyle,
                timestamp: new Date().toISOString()
            };

            // Choose webhook based on image model
            const webhookKey = imageModel === "nanobanedit" ? "nanoImageGeneration" : "assetImageGeneration";
            const result = await sendToWebhook(webhookKey, formData, environment);
            console.log("AI generation response:", result);

            // Extract image URL from the webhook response
            let imageUrl = null;

            if (Array.isArray(result) && result.length > 0) {
                const responseData = result[0];
                if (responseData.data && responseData.data.resultJson) {
                    try {
                        const resultJson = JSON.parse(responseData.data.resultJson);
                        if (resultJson.resultUrls && resultJson.resultUrls.length > 0) {
                            imageUrl = resultJson.resultUrls[0];
                        }
                    } catch (parseError) {
                        console.error("Error parsing resultJson:", parseError);
                    }
                }
            }

            if (imageUrl) {
                console.log("Found image URL from webhook:", imageUrl);

                // Download the image and save it to Firebase Storage
                const firebaseImageUrl = await downloadAndSaveGeneratedImage(
                    projectId,
                    `asset_${index}`,
                    imageUrl
                );

                // Update the asset images state
                setAssetImages(prev => ({ ...prev, [index]: firebaseImageUrl }));

                // Update asset in Firestore with the Firebase image URL
                await updateAssetImageUrl(projectId, `asset_${index}`, firebaseImageUrl);

                console.log("Image saved and asset updated successfully");
                alert("Image generated and saved successfully!");
            } else {
                console.warn("No image URL found in webhook response");
                alert("Image generation completed but no image URL was returned. Check n8n logs.");
            }
        } catch (error) {
            console.error("Error generating with AI:", error);
            alert(`Error generating image: ${error.message}`);
        } finally {
            setGeneratingAssets(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleDeleteImage = async (index) => {
        if (!assetImages[index]) {
            alert("No image to delete");
            return;
        }

        if (!window.confirm("¿Estás seguro de que deseas eliminar esta imagen?")) {
            return;
        }

        try {
            setUploadingAssets(prev => ({ ...prev, [index]: true }));

            // Extract the storage path from the URL
            const url = assetImages[index];
            const urlObj = new URL(url);

            // Firebase Storage URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
            // Extract the encoded path between /o/ and ?
            const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);

            if (pathMatch) {
                let storagePath = decodeURIComponent(pathMatch[1]);
                console.log("Extracted storage path:", storagePath);

                await deleteAssetImage(storagePath);

                // Clear the image URL from state
                setAssetImages(prev => ({ ...prev, [index]: null }));

                // Update the asset in Firestore to clear imageUrl
                const assetIndex = parseInt(`${index}`);
                if (firestoreAssets.length > assetIndex && assetIndex >= 0) {
                    const asset = firestoreAssets[assetIndex];
                    const assetId = asset.id;
                    await updateAsset(assetId, {
                        imageUrl: "",
                        imageUploadedAt: null,
                        userId: asset.userId,
                        projectId: asset.projectId
                    });
                }

                console.log("Image deleted successfully");
                alert("Imagen eliminada correctamente");
            } else {
                throw new Error("Could not extract storage path from image URL");
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            alert(`Error deleting image: ${error.message}`);
        } finally {
            setUploadingAssets(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Enter" && e.ctrlKey === false) {
            const isAtEnd = e.currentTarget.selectionStart === e.currentTarget.value.length;
            if (isAtEnd) {
                e.preventDefault();
                const currentLines = fullText === "" ? [""] : fullText.split("\n");
                currentLines.splice(index + 1, 0, "");
                setFullText(currentLines.join("\n"));
                setCurrentAssetIndex(index + 1);
                setPendingFocusIndex(index + 1);
            }
        }

        if ((e.key === "ArrowRight" || e.key === "ArrowDown") && index < displayAssets.length - 1) {
            const isAtEnd = e.currentTarget.selectionStart === e.currentTarget.value.length;
            if (isAtEnd) {
                e.preventDefault();
                setCurrentAssetIndex(index + 1);
                setPendingFocusIndex(index + 1);
            }
        }

        if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && index > 0) {
            const isAtStart = e.currentTarget.selectionStart === 0;
            if (isAtStart) {
                e.preventDefault();
                setCurrentAssetIndex(index - 1);

                setTimeout(() => {
                    if (textareaRefs.current[index - 1]) {
                        const previousTextarea = textareaRefs.current[index - 1];
                        previousTextarea.focus();
                        previousTextarea.setSelectionRange(previousTextarea.value.length, previousTextarea.value.length);
                    }
                }, 0);
            }
        }

        if (e.key === "Backspace" && e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
            if (index > 0) {
                e.preventDefault();
                const currentLines = fullText.split("\n");
                const previousLength = currentLines[index - 1].length;
                currentLines[index - 1] = currentLines[index - 1] + currentLines[index];
                currentLines.splice(index, 1);
                setFullText(currentLines.join("\n"));
                setCurrentAssetIndex(index - 1);

                setTimeout(() => {
                    if (textareaRefs.current[index - 1]) {
                        textareaRefs.current[index - 1].focus();
                        textareaRefs.current[index - 1].setSelectionRange(previousLength, previousLength);
                    }
                }, 0);
            }
        }
    };

    const handleDiscard = () => {
        if (window.confirm("Are you sure you want to discard all assets? This cannot be undone.")) {
            setFullText("");
            setCurrentAssetIndex(0);
            setTimeout(() => {
                if (textareaRefs.current[0]) {
                    textareaRefs.current[0].focus();
                }
            }, 0);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Art Direction Style section - HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Art Direction Style</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {styleSaveStatus === "saving" && (
                        <span style={{ color: "#f59e0b", fontSize: "0.8rem", fontStyle: "italic" }}>
                            💾 Saving...
                        </span>
                    )}
                    {styleSaveStatus === "saved" && (
                        <span style={{ color: "#10b981", fontSize: "0.8rem" }}>
                            ✓ Saved
                        </span>
                    )}
                    {styleSaveStatus === "unsaved" && (
                        <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>
                            ● Unsaved
                        </span>
                    )}
                </div>
            </div>

            {/* Art Direction Style CARD */}
            <div className="card">
                <textarea
                    value={artDirectionStyle}
                    onChange={(e) => setArtDirectionStyle(e.target.value)}
                    placeholder="Describe the overall art direction and visual approach..."
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        color: "#f8fafc",
                        fontFamily: "monospace",
                        fontSize: "0.9rem",
                        lineHeight: "1.4",
                        resize: "vertical",
                        minHeight: "100px",
                        boxSizing: "border-box",
                        transition: "all 0.3s"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.8)";
                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                        e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
                        e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.8)";
                    }}
                />
            </div>

            {/* Assets editor HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Art Direction Assets</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                            Asset {currentAssetIndex + 1} of {displayAssets.length}
                        </span>
                        {saveStatus === "saving" && (
                            <span style={{ color: "#f59e0b", fontSize: "0.8rem", fontStyle: "italic" }}>
                                💾 Saving...
                            </span>
                        )}
                        {saveStatus === "saved" && (
                            <span style={{ color: "#10b981", fontSize: "0.8rem" }}>
                                ✓ Saved
                            </span>
                        )}
                        {saveStatus === "unsaved" && (
                            <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>
                                ● Unsaved
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleDiscard}
                        style={{
                            padding: "0.5rem 0.75rem",
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "rgba(239, 68, 68, 0.3)";
                            e.target.style.color = "#fca5a5";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                            e.target.style.color = "#ef4444";
                        }}
                    >
                        🗑️ Discard
                    </button>
                </div>
            </div>

            {/* Assets editor CARD */}
            <div
                className="card"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem"
                }}
                onDragLeave={handleDragLeave}
            >
                {displayAssets.map((asset, index) => (
                    <div key={index}>
                        {draggedIndex !== null && dragOverPosition?.index === index && dragOverPosition?.position === "before" && (
                            <div style={{
                                height: "3px",
                                backgroundColor: "#3b82f6",
                                borderRadius: "2px",
                                marginBottom: "0.5rem",
                                boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)"
                            }} />
                        )}

                        <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            style={{
                                display: "flex",
                                flexDirection: windowWidth < 768 ? "column" : "row",
                                gap: "0.75rem",
                                alignItems: windowWidth < 768 ? "stretch" : "flex-start",
                                opacity: draggedIndex === index ? 0.5 : 1,
                                borderRadius: "8px",
                                transition: "all 0.2s",
                                padding: "0.75rem",
                                backgroundColor: index === currentAssetIndex
                                    ? "rgba(59, 130, 246, 0.1)"
                                    : "rgba(15, 23, 42, 0.5)",
                                border: index === currentAssetIndex
                                    ? "1px solid rgba(59, 130, 246, 0.3)"
                                    : "1px solid rgba(59, 130, 246, 0.1)"
                            }}
                        >
                            {/* Drag handle */}
                            <div
                                style={{
                                    display: windowWidth < 900 ? "none" : "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minWidth: "1.5rem",
                                    cursor: "grab",
                                    color: "#64748b",
                                    fontSize: "1.2rem",
                                    padding: "0rem",
                                    userSelect: "none",
                                    marginTop: "0.5rem"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#94a3b8";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#64748b";
                                }}
                            >
                                ⋮
                            </div>

                            {/* Thumbnail */}
                            <div
                                onClick={() => {
                                    if (assetImages[index]) {
                                        setImageViewerIndex(index);
                                    } else {
                                        handleUploadClick(index);
                                    }
                                }}
                                style={{
                                    minWidth: windowWidth < 768 ? "100%" : (windowWidth < 900 ? "150px" : "120px"),
                                    width: windowWidth < 768 ? "100%" : (windowWidth < 900 ? "150px" : "120px"),
                                    height: windowWidth < 768 ? "200px" : (windowWidth < 900 ? "140px" : "100px"),
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                                    border: "1px solid rgba(59, 130, 246, 0.2)",
                                    cursor: "pointer",
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.3s",
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => {
                                    if (!assetImages[index]) {
                                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                                        e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!assetImages[index]) {
                                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
                                        e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.8)";
                                    }
                                }}
                            >
                                <img
                                    src={assetImages[index] || "https://wpmedia-lj.s3.amazonaws.com/wp-content/uploads/2023/10/Placeholder_01.jpg"}
                                    alt={`Asset ${index + 1}`}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain"
                                    }}
                                />
                                {uploadingAssets[index] && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            fontSize: "0.75rem",
                                            fontWeight: "600"
                                        }}
                                    >
                                        Uploading...
                                    </div>
                                )}
                                <input
                                    ref={(el) => (fileInputRefs.current[index] = el)}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(index, e)}
                                    style={{ display: "none" }}
                                />
                            </div>

                            {/* Text content */}
                            <div
                                style={{
                                    flex: windowWidth < 768 ? "0 1 auto" : (windowWidth < 900 ? 1 : 1),
                                    display: "flex",
                                    flexDirection: "column",
                                    minHeight: windowWidth < 768 ? "auto" : "100px",
                                    minWidth: windowWidth >= 768 && windowWidth < 900 ? "0" : "auto"
                                }}
                            >
                                <textarea
                                    ref={(el) => (textareaRefs.current[index] = el)}
                                    value={asset}
                                    onChange={(e) => {
                                        handleAssetChange(index, e.target.value);
                                        // Auto-grow textarea on mobile
                                        if (windowWidth < 768 && el) {
                                            el.style.height = "auto";
                                            el.style.height = Math.max(80, el.scrollHeight) + "px";
                                        }
                                    }}
                                    onClick={() => setCurrentAssetIndex(index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    placeholder="✍️ Describe your art direction here"
                                    style={{
                                        padding: "0.75rem",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "text",
                                        color: "#f8fafc",
                                        fontFamily: "monospace",
                                        fontSize: windowWidth < 768 ? "0.85rem" : "0.9rem",
                                        lineHeight: "1.4",
                                        resize: "none",
                                        minHeight: windowWidth < 768 ? "80px" : "100px",
                                        maxHeight: "none",
                                        height: windowWidth < 768 ? "auto" : "100px",
                                        overflow: windowWidth < 768 ? "visible" : "auto",
                                        outline: "none",
                                        fontWeight: "500",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            {/* Action buttons */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: windowWidth < 900 ? "column" : "column",
                                    gap: "0.5rem",
                                    minWidth: windowWidth < 768 ? "100%" : (windowWidth < 900 ? "auto" : "140px"),
                                    width: windowWidth < 768 ? "100%" : (windowWidth < 900 ? "160px" : "auto"),
                                    flexShrink: 0
                                }}
                            >
                                <button
                                    onClick={() => handleUploadClick(index)}
                                    disabled={uploadingAssets[index]}
                                    style={{
                                        padding: windowWidth < 768 ? "0.5rem 0.75rem" : (windowWidth < 900 ? "0.4rem 0.6rem" : "0.6rem 1rem"),
                                        backgroundColor: uploadingAssets[index]
                                            ? "rgba(139, 92, 246, 0.1)"
                                            : "rgba(139, 92, 246, 0.2)",
                                        color: uploadingAssets[index] ? "#7c3aed" : "#a78bfa",
                                        border: uploadingAssets[index]
                                            ? "1px solid rgba(139, 92, 246, 0.2)"
                                            : "1px solid rgba(139, 92, 246, 0.4)",
                                        borderRadius: "6px",
                                        cursor: uploadingAssets[index] ? "not-allowed" : "pointer",
                                        fontSize: windowWidth < 768 ? "0.7rem" : (windowWidth < 900 ? "0.65rem" : "0.8rem"),
                                        fontWeight: "600",
                                        transition: "all 0.3s",
                                        whiteSpace: "nowrap",
                                        opacity: uploadingAssets[index] ? 0.6 : 1,
                                        width: "100%"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!uploadingAssets[index]) {
                                            e.target.style.backgroundColor = "rgba(139, 92, 246, 0.3)";
                                            e.target.style.borderColor = "rgba(139, 92, 246, 0.6)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!uploadingAssets[index]) {
                                            e.target.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
                                            e.target.style.borderColor = "rgba(139, 92, 246, 0.4)";
                                        }
                                    }}
                                >
                                    {uploadingAssets[index] ? "⏳ Uploading..." : "📤 Upload Image"}
                                </button>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.25rem",
                                        alignItems: "center",
                                        width: "100%"
                                    }}
                                >
                                    <button
                                        onClick={() => handleGenerateWithAI(index)}
                                        disabled={generatingAssets[index] || !asset.trim()}
                                        style={{
                                            padding: windowWidth < 768 ? "0.5rem 0.75rem" : (windowWidth < 900 ? "0.4rem 0.6rem" : "0.6rem 1rem"),
                                            backgroundColor: generatingAssets[index] || !asset.trim()
                                                ? "rgba(99, 102, 241, 0.1)"
                                                : "rgba(99, 102, 241, 0.2)",
                                            color: generatingAssets[index] || !asset.trim() ? "#4f46e5" : "#818cf8",
                                            border: generatingAssets[index] || !asset.trim()
                                                ? "1px solid rgba(99, 102, 241, 0.2)"
                                                : "1px solid rgba(99, 102, 241, 0.4)",
                                            borderRadius: "6px",
                                            cursor: generatingAssets[index] || !asset.trim() ? "not-allowed" : "pointer",
                                            fontSize: windowWidth < 768 ? "0.7rem" : (windowWidth < 900 ? "0.65rem" : "0.8rem"),
                                            fontWeight: "600",
                                            transition: "all 0.3s",
                                            whiteSpace: "nowrap",
                                            opacity: generatingAssets[index] || !asset.trim() ? 0.6 : 1,
                                            flex: 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!generatingAssets[index] && asset.trim()) {
                                                e.target.style.backgroundColor = "rgba(99, 102, 241, 0.3)";
                                                e.target.style.borderColor = "rgba(99, 102, 241, 0.6)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!generatingAssets[index] && asset.trim()) {
                                                e.target.style.backgroundColor = "rgba(99, 102, 241, 0.2)";
                                                e.target.style.borderColor = "rgba(99, 102, 241, 0.4)";
                                            }
                                        }}
                                    >
                                        {generatingAssets[index] ? "⏳ Generating..." : "🖼️ Generate Image with AI"}
                                    </button>
                                    <button
                                        onClick={() => setConfigModalIndex(index)}
                                        style={{
                                            padding: windowWidth < 768 ? "0.5rem 0.6rem" : "0.6rem 0.8rem",
                                            backgroundColor: "rgba(107, 114, 128, 0.2)",
                                            color: "#9ca3af",
                                            border: "1px solid rgba(107, 114, 128, 0.3)",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: windowWidth < 768 ? "0.9rem" : "1rem",
                                            transition: "all 0.3s",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            minWidth: windowWidth < 768 ? "40px" : "44px",
                                            height: windowWidth < 768 ? "40px" : "44px"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = "rgba(107, 114, 128, 0.3)";
                                            e.target.style.borderColor = "rgba(107, 114, 128, 0.6)";
                                            e.target.style.color = "#d1d5db";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = "rgba(107, 114, 128, 0.2)";
                                            e.target.style.borderColor = "rgba(107, 114, 128, 0.3)";
                                            e.target.style.color = "#9ca3af";
                                        }}
                                        title="Configure asset generation"
                                    >
                                        ⚙️
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleDeleteImage(index)}
                                    disabled={!assetImages[index] || uploadingAssets[index]}
                                    style={{
                                        padding: windowWidth < 768 ? "0.5rem 0.75rem" : (windowWidth < 900 ? "0.4rem 0.6rem" : "0.6rem 1rem"),
                                        backgroundColor: !assetImages[index] || uploadingAssets[index]
                                            ? "rgba(239, 68, 68, 0.1)"
                                            : "rgba(239, 68, 68, 0.2)",
                                        color: !assetImages[index] || uploadingAssets[index] ? "#dc2626" : "#f87171",
                                        border: !assetImages[index] || uploadingAssets[index]
                                            ? "1px solid rgba(239, 68, 68, 0.2)"
                                            : "1px solid rgba(239, 68, 68, 0.4)",
                                        borderRadius: "6px",
                                        cursor: !assetImages[index] || uploadingAssets[index] ? "not-allowed" : "pointer",
                                        fontSize: windowWidth < 768 ? "0.7rem" : (windowWidth < 900 ? "0.65rem" : "0.8rem"),
                                        fontWeight: "600",
                                        transition: "all 0.3s",
                                        whiteSpace: "nowrap",
                                        opacity: !assetImages[index] || uploadingAssets[index] ? 0.6 : 1,
                                        width: "100%"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (assetImages[index] && !uploadingAssets[index]) {
                                            e.target.style.backgroundColor = "rgba(239, 68, 68, 0.3)";
                                            e.target.style.borderColor = "rgba(239, 68, 68, 0.6)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (assetImages[index] && !uploadingAssets[index]) {
                                            e.target.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                                            e.target.style.borderColor = "rgba(239, 68, 68, 0.4)";
                                        }
                                    }}
                                >
                                    🗑️ Delete Image
                                </button>
                            </div>
                        </div>

                        {draggedIndex !== null && dragOverPosition?.index === index && dragOverPosition?.position === "after" && (
                            <div style={{
                                height: "3px",
                                backgroundColor: "#3b82f6",
                                borderRadius: "2px",
                                marginTop: "0.5rem",
                                boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)"
                            }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Configuration Modal */}
            {configModalIndex !== null && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000
                    }}
                    onClick={() => setConfigModalIndex(null)}
                >
                    <div
                        style={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            border: "1px solid rgba(59, 130, 246, 0.2)",
                            borderRadius: "12px",
                            padding: "2rem",
                            minWidth: "400px",
                            maxWidth: "500px",
                            backdropFilter: "blur(10px)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                color: "#f8fafc",
                                fontSize: "1.25rem",
                                fontWeight: "600",
                                marginBottom: "1.5rem"
                            }}
                        >
                            Asset Image Generation Settings
                        </h3>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                marginBottom: "1.5rem"
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        color: "#cbd5e1",
                                        fontSize: "0.875rem",
                                        fontWeight: "500",
                                        marginBottom: "0.5rem"
                                    }}
                                >
                                    Image Model
                                </label>
                                <select
                                    value={assetConfigs[configModalIndex]?.imageModel || "nanobanedit"}
                                    onChange={(e) =>
                                        handleUpdateAssetConfig(configModalIndex, {
                                            ...assetConfigs[configModalIndex],
                                            imageModel: e.target.value
                                        })
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        backgroundColor: "rgba(30, 41, 59, 0.8)",
                                        color: "#f8fafc",
                                        border: "1px solid rgba(59, 130, 246, 0.3)",
                                        borderRadius: "6px",
                                        fontSize: "0.875rem"
                                    }}
                                >
                                    <option value="nanobanedit">Nano Bana Edit</option>
                                    <option value="soraimage">Sora Image</option>
                                </select>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "1rem",
                                justifyContent: "flex-end"
                            }}
                        >
                            <button
                                onClick={() => setConfigModalIndex(null)}
                                style={{
                                    padding: "0.75rem 1.5rem",
                                    backgroundColor: "rgba(107, 114, 128, 0.2)",
                                    color: "#9ca3af",
                                    border: "1px solid rgba(107, 114, 128, 0.3)",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                    transition: "all 0.3s"
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = "rgba(107, 114, 128, 0.3)";
                                    e.target.style.borderColor = "rgba(107, 114, 128, 0.6)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "rgba(107, 114, 128, 0.2)";
                                    e.target.style.borderColor = "rgba(107, 114, 128, 0.3)";
                                }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => setConfigModalIndex(null)}
                                style={{
                                    padding: "0.75rem 1.5rem",
                                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                                    color: "#818cf8",
                                    border: "1px solid rgba(59, 130, 246, 0.4)",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                    transition: "all 0.3s"
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = "rgba(59, 130, 246, 0.3)";
                                    e.target.style.borderColor = "rgba(59, 130, 246, 0.6)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
                                    e.target.style.borderColor = "rgba(59, 130, 246, 0.4)";
                                }}
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            {imageViewerIndex !== null && assetImages[imageViewerIndex] && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2000
                    }}
                    onClick={() => setImageViewerIndex(null)}
                >
                    <div
                        style={{
                            position: "relative",
                            maxWidth: "90vw",
                            maxHeight: "90vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setImageViewerIndex(null)}
                            style={{
                                position: "absolute",
                                top: "-40px",
                                right: "0",
                                background: "none",
                                border: "none",
                                color: "#f8fafc",
                                fontSize: "2rem",
                                cursor: "pointer",
                                zIndex: 2001
                            }}
                        >
                            ✕
                        </button>

                        {/* Image */}
                        <img
                            src={assetImages[imageViewerIndex]}
                            alt={`Asset ${imageViewerIndex + 1}`}
                            style={{
                                maxWidth: "90vw",
                                maxHeight: "90vh",
                                objectFit: "contain",
                                borderRadius: "8px"
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

export default AssetDirectionEditor;
