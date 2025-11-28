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
 * @param {string} assetId - Asset ID
 * @param {string} imageUrl - Download URL of the image
 */
export async function updateAssetImageUrl(projectId, assetId, imageUrl) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to update asset");
    }

    try {
        const assetRef = doc(db, "assets", assetId);
        await updateDoc(assetRef, {
            imageUrl: imageUrl,
            imageUploadedAt: new Date().toISOString()
        });
        console.log("Asset image URL updated in Firestore");
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
