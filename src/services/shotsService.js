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
    serverTimestamp,
    writeBatch
} from "firebase/firestore";
import { db, auth } from "../firebase";

const SHOTS_COLLECTION = "shots";

/**
 * Create a new shot for a project
 */
export async function createShot(projectId, shotData) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to create shots");
    }

    try {
        const docRef = await addDoc(collection(db, SHOTS_COLLECTION), {
            projectId,
            userId: auth.currentUser.uid,
            content: shotData.content || "",
            script: shotData.script || "",
            artDirection: shotData.artDirection || "",
            images: shotData.images || [],
            videos: shotData.videos || [],
            sounds: shotData.sounds || [],
            order: shotData.order || 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, success: true };
    } catch (error) {
        console.error("Error creating shot:", error);
        throw error;
    }
}

/**
 * Get all shots for a specific project
 */
export async function getProjectShots(projectId) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to get shots");
    }

    try {
        // Query by projectId and userId separately, then filter and sort in memory
        const q = query(
            collection(db, SHOTS_COLLECTION),
            where("projectId", "==", projectId)
        );

        const querySnapshot = await getDocs(q);
        const shots = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Only include shots that belong to the current user
            if (data.userId === auth.currentUser.uid) {
                shots.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        // Sort by order field in memory
        shots.sort((a, b) => (a.order || 0) - (b.order || 0));

        return shots;
    } catch (error) {
        console.error("Error getting shots:", error);
        throw error;
    }
}

/**
 * Update a shot
 */
export async function updateShot(shotId, shotData) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to update shots");
    }

    try {
        const shotRef = doc(db, SHOTS_COLLECTION, shotId);
        await updateDoc(shotRef, {
            ...shotData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating shot:", error);
        throw error;
    }
}

/**
 * Delete a shot
 */
export async function deleteShot(shotId) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to delete shots");
    }

    try {
        await deleteDoc(doc(db, SHOTS_COLLECTION, shotId));
        return { success: true };
    } catch (error) {
        console.error("Error deleting shot:", error);
        throw error;
    }
}

/**
 * Save multiple shots at once (for bulk operations)
 * This function deletes all existing shots for the project and creates new ones
 */
export async function saveShotsForProject(projectId, shotsArray) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to save shots");
    }

    try {
        const batch = writeBatch(db);

        // First, delete all existing shots for this project that belong to the current user
        const q = query(
            collection(db, SHOTS_COLLECTION),
            where("projectId", "==", projectId),
            where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);

        // Delete all existing shots belonging to this user
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Then add the new shots
        const shotsRef = collection(db, SHOTS_COLLECTION);

        for (let i = 0; i < shotsArray.length; i++) {
            const shot = shotsArray[i];
            const newDocRef = doc(shotsRef);
            batch.set(newDocRef, {
                projectId,
                userId: auth.currentUser.uid,
                content: shot.content || "",
                script: shot.script || "",
                artDirection: shot.artDirection || "",
                images: shot.images || [],
                videos: shot.videos || [],
                sounds: shot.sounds || [],
                order: i,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error saving shots batch:", error);
        throw error;
    }
}

/**
 * Delete all shots for a project
 */
export async function deleteProjectShots(projectId) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to delete shots");
    }

    try {
        const q = query(
            collection(db, SHOTS_COLLECTION),
            where("projectId", "==", projectId),
            where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);

        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error deleting project shots:", error);
        throw error;
    }
}
