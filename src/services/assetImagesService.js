import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, auth } from "../firebase";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Upload an image for an asset
 * @param {string} projectId - Project ID
 * @param {string} assetId - Asset ID
 * @param {File} file - Image file from input
 * @returns {Promise<string>} - Download URL of the uploaded image
 */
export async function uploadAssetImage(projectId, assetId, file) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to upload images");
    }

    if (!file) {
        throw new Error("No file provided");
    }

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image");
    }

    // Max file size: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error("Image must be smaller than 5MB");
    }

    try {
        // Create storage path: projects/{projectId}/assets/{assetId}/image
        const fileName = `${Date.now()}-${file.name}`;
        const storagePath = `projects/${projectId}/assets/${assetId}/${fileName}`;
        const storageRef = ref(storage, storagePath);

        console.log("Uploading image to:", storagePath);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        console.log("Image uploaded successfully:", snapshot.fullPath);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        console.log("Download URL:", downloadURL);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
}

/**
 * Update asset with image URL in Firestore
 * @param {string} projectId - Project ID
 * @param {string} assetId - Asset ID (can be a local ID like "asset_0" or a Firestore doc ID)
 * @param {string} imageUrl - Download URL of the image
 */
export async function updateAssetImageUrl(projectId, assetId, imageUrl) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to update asset");
    }

    try {
        // If assetId is a local ID (asset_0, asset_1, etc), find the actual Firestore document
        let actualAssetId = assetId;
        let assetData = null;

        if (assetId.startsWith("asset_")) {
            // Extract the index from the local ID
            const assetIndex = parseInt(assetId.split("_")[1]);

            // Get assets for this project to find the correct one
            const { getProjectAssets } = await import("./assetsService.js");
            const assets = await getProjectAssets(projectId);

            if (assets.length > assetIndex && assetIndex >= 0) {
                assetData = assets[assetIndex];
                actualAssetId = assetData.id;
            } else {
                throw new Error(`Asset at index ${assetIndex} not found`);
            }
        }

        const assetRef = doc(db, "assets", actualAssetId);

        // Include userId and projectId to satisfy Firestore rules
        const updateData = {
            imageUrl: imageUrl,
            imageUploadedAt: new Date().toISOString(),
            userId: auth.currentUser.uid,
            projectId: projectId
        };

        console.log("Updating asset with ID:", actualAssetId, "imageUrl:", imageUrl);
        await updateDoc(assetRef, updateData);
        console.log("Asset image URL updated in Firestore successfully");
    } catch (error) {
        console.error("Error updating asset image URL:", error);
        throw error;
    }
}

/**
 * Delete an image from storage
 * @param {string} imagePath - Full path to image in storage
 */
export async function deleteAssetImage(imagePath) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to delete images");
    }

    try {
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
        console.log("Image deleted successfully:", imagePath);
    } catch (error) {
        console.error("Error deleting image:", error);
        throw error;
    }
}

/**
 * Upload image and update asset in one operation
 * @param {string} projectId - Project ID
 * @param {string} assetId - Asset ID
 * @param {File} file - Image file
 * @returns {Promise<string>} - Download URL
 */
export async function uploadAndUpdateAssetImage(projectId, assetId, file) {
    try {
        // Upload image to storage
        const imageUrl = await uploadAssetImage(projectId, assetId, file);

        // Update asset document with image URL
        await updateAssetImageUrl(projectId, assetId, imageUrl);

        return imageUrl;
    } catch (error) {
        console.error("Error in uploadAndUpdateAssetImage:", error);
        throw error;
    }
}

/**
 * Download image from URL and save to Firebase Storage
 * @param {string} projectId - Project ID
 * @param {string} assetId - Asset ID
 * @param {string} imageUrl - URL of the image to download
 * @returns {Promise<string>} - Download URL of the saved image in Firebase
 */
export async function downloadAndSaveGeneratedImage(projectId, assetId, imageUrl) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to save images");
    }

    if (!imageUrl) {
        throw new Error("Image URL is required");
    }

    try {
        console.log("Downloading image from:", imageUrl);

        // Fetch the image from the URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Get the image as a blob
        const blob = await response.blob();
        console.log("Image downloaded, size:", blob.size, "bytes");

        // Create storage path
        const fileName = `${Date.now()}-generated-${Math.random().toString(36).substr(2, 9)}.jpeg`;
        const storagePath = `projects/${projectId}/assets/${assetId}/${fileName}`;
        const storageRef = ref(storage, storagePath);

        console.log("Uploading image to:", storagePath);

        // Upload the blob to Firebase Storage
        const snapshot = await uploadBytes(storageRef, blob);
        console.log("Image uploaded successfully:", snapshot.fullPath);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        console.log("Download URL:", downloadURL);

        return downloadURL;
    } catch (error) {
        console.error("Error downloading and saving generated image:", error);
        throw error;
    }
}
