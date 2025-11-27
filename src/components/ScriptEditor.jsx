import React, { useState, useEffect, useRef } from "react";

export default function ScriptEditor() {
    // Initialize fullText from localStorage or use default
    const initializeFullText = () => {
        const savedShots = localStorage.getItem("scriptShots");
        if (savedShots) {
            try {
                const shotsData = JSON.parse(savedShots);
                // Reconstruct fullText by joining shot contents with newlines
                return shotsData.map(shot => shot.content).join("\n");
            } catch (error) {
                console.error("Error loading shots from localStorage:", error);
                return "A tiny Pomeranian police officer in a perfectly fitted uniform gazing adoringly at a lost kitten. Extremely cute\nPomeranian police officer standing heroically amidst a backdrop of flaming hot dog carts and exploding donut shops, laser beams shooting out of his police badge. epic like a michae bay movie\nGiant text reading 'I BECAME A POLICE OFFICER!' with a shocked Pomeranian cop, surrounded by giant handcuffs, a massive donut, and overflowing bags of 'doggy treats.' A parody of a MrBeast thumbnail";
            }
        }
        return "A tiny Pomeranian police officer in a perfectly fitted uniform gazing adoringly at a lost kitten. Extremely cute\nPomeranian police officer standing heroically amidst a backdrop of flaming hot dog carts and exploding donut shops, laser beams shooting out of his police badge. epic like a michae bay movie\nGiant text reading 'I BECAME A POLICE OFFICER!' with a shocked Pomeranian cop, surrounded by giant handcuffs, a massive donut, and overflowing bags of 'doggy treats.' A parody of a MrBeast thumbnail";
    };

    const [fullText, setFullText] = useState(initializeFullText());
    const [currentShotIndex, setCurrentShotIndex] = useState(0);
    const [saveStatus, setSaveStatus] = useState("saved"); // "saved", "saving", "unsaved"
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverPosition, setDragOverPosition] = useState(null); // "before" or "after" an index
    const dragOverPositionRef = useRef(null); // Para evitar re-renders innecesarios
    const saveTimeoutRef = useRef(null);
    const lastSavedRef = useRef(fullText);

    // Dividir el texto en shots basado en saltos de línea - NO filtrar aquí
    const displayShots = fullText === "" ? [""] : fullText.split("\n");

    // Para el contador, contar solo los no vacíos
    const shots = displayShots.filter(shot => shot.trim() !== "");

    const handleTextChange = (newText) => {
        setFullText(newText);
        // Mantener el índice actual si es válido, si no, ir al último
        if (currentShotIndex >= newText.split("\n").filter(s => s.trim() !== "").length) {
            setCurrentShotIndex(Math.max(0, newText.split("\n").filter(s => s.trim() !== "").length - 1));
        }
    };

    const handleShotChange = (index, newContent) => {
        // Trabajar directamente con las líneas de fullText
        const currentLines = fullText === "" ? [""] : fullText.split("\n");
        currentLines[index] = newContent;
        setFullText(currentLines.join("\n"));
    };

    const textareaRefs = React.useRef([]);
    const [pendingFocusIndex, setPendingFocusIndex] = useState(null);

    // Enfocar el textarea cuando cambia el índice pendiente
    useEffect(() => {
        if (pendingFocusIndex !== null && textareaRefs.current[pendingFocusIndex]) {
            textareaRefs.current[pendingFocusIndex].focus();
            textareaRefs.current[pendingFocusIndex].setSelectionRange(0, 0);
            setPendingFocusIndex(null);
        }
    }, [pendingFocusIndex, shots.length]);

    // Autosave con debounce de 1 segundo
    useEffect(() => {
        if (fullText !== lastSavedRef.current) {
            setSaveStatus("unsaved");

            // Limpiar timeout anterior
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Establecer nuevo timeout para guardar después de 1 segundo
            saveTimeoutRef.current = setTimeout(() => {
                setSaveStatus("saving");

                // Guardar en localStorage
                const shots = displayShots;
                const shotsData = shots.map((shot, index) => ({
                    id: `shot_${index}`,
                    index: index,
                    content: shot,
                    images: [],
                    videos: [],
                    savedAt: new Date().toISOString()
                }));

                localStorage.setItem("scriptShots", JSON.stringify(shotsData));
                lastSavedRef.current = fullText;

                // Mostrar "saved" por 2 segundos
                setTimeout(() => {
                    setSaveStatus("saved");
                }, 500);
            }, 1000);
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [fullText, displayShots]);

    const handleKeyDown = (e, index) => {
        // Si presionas Enter al final de un textarea
        if (e.key === "Enter" && e.ctrlKey === false) {
            // Verificar si estamos al final del textarea
            const isAtEnd = e.currentTarget.selectionStart === e.currentTarget.value.length;
            if (isAtEnd) {
                e.preventDefault();
                // Usar fullText directamente y dividir por \n para mantener la estructura
                const currentLines = fullText === "" ? [""] : fullText.split("\n");
                // Insertar una nueva línea vacía después de la actual
                currentLines.splice(index + 1, 0, "");
                // Unir de nuevo
                setFullText(currentLines.join("\n"));
                // Cambiar al siguiente índice
                setCurrentShotIndex(index + 1);
                // Marcar para enfocar después
                setPendingFocusIndex(index + 1);
            }
        }

        // Si presionas flecha derecha o abajo al final de un textarea
        if ((e.key === "ArrowRight" || e.key === "ArrowDown") && index < displayShots.length - 1) {
            const isAtEnd = e.currentTarget.selectionStart === e.currentTarget.value.length;
            if (isAtEnd) {
                e.preventDefault();
                // Ir al siguiente textarea
                setCurrentShotIndex(index + 1);
                setPendingFocusIndex(index + 1);
            }
        }

        // Si presionas flecha izquierda o arriba al inicio de un textarea
        if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && index > 0) {
            const isAtStart = e.currentTarget.selectionStart === 0;
            if (isAtStart) {
                e.preventDefault();
                // Ir al textarea anterior y posicionar al final
                setCurrentShotIndex(index - 1);

                setTimeout(() => {
                    if (textareaRefs.current[index - 1]) {
                        const previousTextarea = textareaRefs.current[index - 1];
                        previousTextarea.focus();
                        previousTextarea.setSelectionRange(previousTextarea.value.length, previousTextarea.value.length);
                    }
                }, 0);
            }
        }

        // Si presionas Backspace al inicio de un textarea
        if (e.key === "Backspace" && e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
            if (index > 0) {
                e.preventDefault();
                // Usar fullText directamente
                const currentLines = fullText.split("\n");
                const previousLength = currentLines[index - 1].length;
                // Combinar la línea anterior con la actual
                currentLines[index - 1] = currentLines[index - 1] + currentLines[index];
                // Eliminar la línea actual
                currentLines.splice(index, 1);
                setFullText(currentLines.join("\n"));
                setCurrentShotIndex(index - 1);

                // Mover el cursor al final del textarea anterior
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
        if (window.confirm("Are you sure you want to discard all shots? This cannot be undone.")) {
            setFullText("");
            setCurrentShotIndex(0);
            // Enfocar el primer textarea después de limpiar
            setTimeout(() => {
                if (textareaRefs.current[0]) {
                    textareaRefs.current[0].focus();
                }
            }, 0);
        }
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnd = (e) => {
        // Limpiar el estado cuando se termina el arrastre (incluso si fue cancelado)
        setDraggedIndex(null);
        setDragOverPosition(null);
        dragOverPositionRef.current = null;
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        // Determinar si el cursor está en la mitad superior o inferior del elemento
        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.height / 2;
        const offsetY = e.clientY - rect.top;

        const newPosition = offsetY < midpoint ? "before" : "after";
        const newState = { index, position: newPosition };

        // Solo actualizar el estado si la posición cambió (evitar flickering)
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
        // Solo resetear si realmente salimos del contenedor principal de shots
        // Si relatedTarget es null significa que salimos de la ventana, si no es null
        // y no está dentro de currentTarget, significa que salimos del contenedor
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

        // Calcular la posición final basada en "before" o "after"
        let newDropIndex = dragOverPosition.position === "before" ? dropIndex : dropIndex + 1;

        // Si el índice es después del arrastrado, ajustar para la eliminación
        if (draggedIndex < newDropIndex) {
            newDropIndex -= 1;
        }

        // Evitar soltar en la misma posición
        if (draggedIndex === newDropIndex) {
            setDraggedIndex(null);
            setDragOverPosition(null);
            return;
        }

        // Eliminar línea arrastrada
        currentLines.splice(draggedIndex, 1);
        // Insertar en nueva posición
        currentLines.splice(newDropIndex, 0, draggedLine);

        setFullText(currentLines.join("\n"));
        setCurrentShotIndex(newDropIndex);
        setDraggedIndex(null);
        setDragOverPosition(null);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Script Shots</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                            Shot {currentShotIndex + 1} of {displayShots.length}
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

            {/* Editor de shots */}
            <div
                className="card"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem"
                }}
                onDragLeave={handleDragLeave}
            >
                {displayShots.map((shot, index) => (
                    <div key={index}>
                        {/* Indicador visual ANTES del cuadro */}
                        {draggedIndex !== null && dragOverPosition?.index === index && dragOverPosition?.position === "before" && (
                            <div style={{
                                height: "3px",
                                backgroundColor: "#3b82f6",
                                borderRadius: "2px",
                                marginBottom: "0.5rem",
                                boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)"
                            }} />
                        )}

                        {/* Cuadro del shot */}
                        <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            style={{
                                display: "flex",
                                gap: "0.5rem",
                                alignItems: "flex-start",
                                opacity: draggedIndex === index ? 0.5 : 1,
                                borderRadius: "8px",
                                transition: "all 0.2s",
                                padding: "0.25rem"
                            }}
                        >
                            {/* Icono de arrastrable - tres puntitos */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minWidth: "1.5rem",
                                    cursor: "grab",
                                    color: "#64748b",
                                    fontSize: "1.2rem",
                                    padding: "0.5rem 0.25rem",
                                    userSelect: "none"
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
                            {/* Textarea */}
                            <textarea
                                ref={(el) => (textareaRefs.current[index] = el)}
                                value={shot}
                                onChange={(e) => handleShotChange(index, e.target.value)}
                                onClick={() => setCurrentShotIndex(index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                placeholder="✍️ Start writing your script here"
                                style={{
                                    padding: "0.75rem",
                                    backgroundColor: index === currentShotIndex
                                        ? "rgba(59, 130, 246, 0.15)"
                                        : "rgba(15, 23, 42, 0.8)",
                                    border: index === currentShotIndex
                                        ? "2px solid #3b82f6"
                                        : "1px solid rgba(59, 130, 246, 0.2)",
                                    borderRadius: "8px",
                                    cursor: "text",
                                    transition: "all 0.3s",
                                    color: "#f8fafc",
                                    fontFamily: "monospace",
                                    fontSize: "0.9rem",
                                    lineHeight: "1.4",
                                    resize: "none",
                                    minHeight: "auto",
                                    height: "auto",
                                    overflow: "hidden",
                                    flex: 1
                                }}
                                onMouseEnter={(e) => {
                                    if (index !== currentShotIndex) {
                                        e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
                                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (index !== currentShotIndex) {
                                        e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.8)";
                                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
                                    }
                                }}
                            />
                        </div>

                        {/* Indicador visual DESPUÉS del cuadro */}
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

        </div>
    );
}
