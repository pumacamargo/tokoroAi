import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    writeBatch
} from "firebase/firestore";
import { db, auth } from "../firebase";

const ASSETS_COLLECTION = "assets";

/**
 * Create a new asset for a project
 */
export async function createAsset(projectId, assetData) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to create assets");
    }

    try {
        const docRef = await addDoc(collection(db, ASSETS_COLLECTION), {
            projectId,
            userId: auth.currentUser.uid,
            content: assetData.content || "",
            visualStyle: assetData.visualStyle || "",
            colorPalette: assetData.colorPalette || "",
            mood: assetData.mood || "",
            references: assetData.references || [],
            order: assetData.order || 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, success: true };
    } catch (error) {
        console.error("Error creating asset:", error);
        throw error;
    }
}

/**
 * Get all assets for a specific project
 */
export async function getProjectAssets(projectId) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to get assets");
    }

    try {
        const q = query(
            collection(db, ASSETS_COLLECTION),
            where("projectId", "==", projectId)
        );

        const querySnapshot = await getDocs(q);
        const assets = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Only include assets that belong to the current user
            if (data.userId === auth.currentUser.uid) {
                assets.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        // Sort by order field in memory
        assets.sort((a, b) => (a.order || 0) - (b.order || 0));

        return assets;
    } catch (error) {
        console.error("Error getting assets:", error);
        throw error;
    }
}

/**
 * Update an asset
 */
export async function updateAsset(assetId, assetData) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to update assets");
    }

    try {
        const assetRef = doc(db, ASSETS_COLLECTION, assetId);
        await updateDoc(assetRef, {
            ...assetData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating asset:", error);
        throw error;
    }
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to delete assets");
    }

    try {
        await deleteDoc(doc(db, ASSETS_COLLECTION, assetId));
        return { success: true };
    } catch (error) {
        console.error("Error deleting asset:", error);
        throw error;
    }
}

/**
 * Save multiple assets at once (for bulk operations)
 * This function deletes all existing assets for the project and creates new ones
 */
export async function saveAssetsForProject(projectId, assetsArray) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to save assets");
    }

    try {
        const batch = writeBatch(db);

        // First, delete all existing assets for this project that belong to the current user
        const q = query(
            collection(db, ASSETS_COLLECTION),
            where("projectId", "==", projectId),
            where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);

        // Delete all existing assets belonging to this user
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Then add the new assets
        const assetsRef = collection(db, ASSETS_COLLECTION);

        for (let i = 0; i < assetsArray.length; i++) {
            const asset = assetsArray[i];
            const newDocRef = doc(assetsRef);
            batch.set(newDocRef, {
                projectId,
                userId: auth.currentUser.uid,
                content: asset.content || "",
                visualStyle: asset.visualStyle || "",
                colorPalette: asset.colorPalette || "",
                mood: asset.mood || "",
                references: asset.references || [],
                order: i,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error saving assets batch:", error);
        throw error;
    }
}

/**
 * Delete all assets for a project
 */
export async function deleteProjectAssets(projectId) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to delete assets");
    }

    try {
        const q = query(
            collection(db, ASSETS_COLLECTION),
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
        console.error("Error deleting project assets:", error);
        throw error;
    }
}

/**
 * Save Art Direction Style for a project
 */
export async function saveArtDirectionStyle(projectId, styleText) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to save style");
    }

    try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
            artDirectionStyle: styleText,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error saving art direction style:", error);
        throw error;
    }
}

/**
 * Get Art Direction Style for a project
 */
export async function getArtDirectionStyle(projectId) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to get style");
    }

    try {
        const projectRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(projectRef);

        if (docSnap.exists()) {
            return docSnap.data().artDirectionStyle || "";
        }
        return "";
    } catch (error) {
        console.error("Error getting art direction style:", error);
        throw error;
    }
}
