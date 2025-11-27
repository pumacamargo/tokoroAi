import { db, auth } from "../firebase";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    Timestamp,
    getDocs
} from "firebase/firestore";

const TEMPLATES_COLLECTION = "templates";

/**
 * Get real-time templates for a specific step
 * @param {number} stepId - The step ID (1-5)
 * @param {function} callback - Callback function that receives the templates array
 * @returns {function} Unsubscribe function
 */
export const subscribeToTemplates = (stepId, callback) => {
    if (!auth.currentUser) {
        console.log("User not authenticated");
        callback([]);
        return () => {};
    }

    const q = query(
        collection(db, TEMPLATES_COLLECTION),
        where("userId", "==", auth.currentUser.uid),
        where("stepId", "==", stepId)
    );

    return onSnapshot(q, (snapshot) => {
        const templates = [];
        snapshot.forEach((doc) => {
            templates.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(templates);
    });
};

/**
 * Save a new template to Firestore
 * @param {number} stepId - The step ID (1-5)
 * @param {string} name - Template name
 * @param {object} data - Template data (form values)
 * @returns {Promise} Promise that resolves when template is saved
 */
export const saveTemplate = async (stepId, name, data) => {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to save templates");
    }

    try {
        const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
            userId: auth.currentUser.uid,
            stepId: stepId,
            name: name,
            data: data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving template:", error);
        throw error;
    }
};

/**
 * Delete a template from Firestore
 * @param {string} templateId - The template document ID
 * @returns {Promise} Promise that resolves when template is deleted
 */
export const deleteTemplate = async (templateId) => {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to delete templates");
    }

    try {
        await deleteDoc(doc(db, TEMPLATES_COLLECTION, templateId));
    } catch (error) {
        console.error("Error deleting template:", error);
        throw error;
    }
};

/**
 * Initialize default templates for a user if they don't exist
 * @param {number} stepId - The step ID (1-5)
 * @param {array} defaultTemplates - Array of default template objects
 * @returns {Promise} Promise that resolves when initialization is complete
 */
export const initializeDefaultTemplates = async (stepId, defaultTemplates) => {
    if (!auth.currentUser) {
        return;
    }

    try {
        const q = query(
            collection(db, TEMPLATES_COLLECTION),
            where("userId", "==", auth.currentUser.uid),
            where("stepId", "==", stepId)
        );

        // Check if user already has templates for this step
        const snapshot = await getDocs(q);

        // If no templates exist, add default ones
        if (snapshot.empty) {
            for (const template of defaultTemplates) {
                await addDoc(collection(db, TEMPLATES_COLLECTION), {
                    userId: auth.currentUser.uid,
                    stepId: stepId,
                    name: template.name,
                    data: template.data,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
            }
        }
    } catch (error) {
        console.error("Error initializing default templates:", error);
    }
};
