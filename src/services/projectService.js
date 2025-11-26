import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const PROJECTS_COLLECTION = "projects";

/**
 * Create a new project for a user
 */
export async function createProject(userId, projectData) {
    try {
        const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
            userId,
            name: projectData.name || "Untitled Project",
            description: projectData.description || "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, success: true };
    } catch (error) {
        console.error("Error creating project:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all projects for a specific user
 */
export async function getUserProjects(userId) {
    try {
        const q = query(
            collection(db, PROJECTS_COLLECTION),
            where("userId", "==", userId),
            orderBy("updatedAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const projects = [];

        querySnapshot.forEach((doc) => {
            projects.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, projects };
    } catch (error) {
        console.error("Error getting projects:", error);
        return { success: false, error: error.message, projects: [] };
    }
}

/**
 * Update an existing project
 */
export async function updateProject(projectId, data) {
    try {
        const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
        await updateDoc(projectRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating project:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId) {
    try {
        await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
        return { success: true };
    } catch (error) {
        console.error("Error deleting project:", error);
        return { success: false, error: error.message };
    }
}
