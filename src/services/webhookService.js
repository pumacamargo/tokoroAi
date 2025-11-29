// Webhook configuration for different steps and environments
const WEBHOOKS = {
    script: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genScript",
        test: "https://n8n.lemonsushi.com/webhook-test/tokoroAi_genScript"
    },
    artDirection: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genArtDirection",
        test: "https://n8n.lemonsushi.com/webhook-test/tokoroAi_genArtDirection"
    },
    imageGeneration: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genImages",
        test: "https://n8n.lemonsushi.com/webhook-test/tokoroAi_genImages"
    },
    assetImageGeneration: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genImage",
        test: "https://n8n.lemonsushi.com/webhook-test/tokoroAi_genImage"
    },
    nanoImageGeneration: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_nano_genImage",
        test: "https://n8n.lemonsushi.com/webhook-test/tokoroAi_nano_genImage"
    },
    videoGeneration: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genVideo",
        test: "https://n8n.lemonsushi.com/webhook-test/tokoroAi_genVideo"
    },
    soundFX: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genSound",
        test: "https://n8n.lemonsushi.com/webhook-test/tokoroAi_genSound"
    }
};

/**
 * Get the webhook URL for a specific step and environment
 * @param {number} stepId - The step ID (1-5)
 * @param {string} environment - "production" or "test"
 * @returns {string} The webhook URL
 */
export const getWebhookUrl = (stepId, environment = "production") => {
    const stepKeyMap = {
        1: "script",
        2: "artDirection",
        3: "imageGeneration",
        4: "videoGeneration",
        5: "soundFX"
    };

    const stepKey = stepKeyMap[stepId];
    if (!stepKey || !WEBHOOKS[stepKey]) {
        throw new Error(`No webhook configured for step ${stepId}`);
    }

    const webhook = WEBHOOKS[stepKey][environment];
    if (!webhook) {
        throw new Error(`No ${environment} webhook configured for step ${stepId}`);
    }

    return webhook;
};

/**
 * Get the webhook URL by step key name
 * @param {string} stepKey - The step key name (e.g., "assetImageGeneration")
 * @param {string} environment - "production" or "test"
 * @returns {string} The webhook URL
 */
export const getWebhookUrlByKey = (stepKey, environment = "production") => {
    if (!WEBHOOKS[stepKey]) {
        throw new Error(`No webhook configured for step key ${stepKey}`);
    }

    const webhook = WEBHOOKS[stepKey][environment];
    if (!webhook) {
        throw new Error(`No ${environment} webhook configured for step key ${stepKey}`);
    }

    return webhook;
};

/**
 * Send form data to n8n webhook
 * @param {number|string} stepId - The step ID (1-5) or step key name (e.g., "assetImageGeneration")
 * @param {object} formData - The form values to send
 * @param {string} environment - "production" or "test"
 * @returns {Promise} Promise with the webhook response
 */
export const sendToWebhook = async (stepId, formData, environment = "production") => {
    try {
        let webhookUrl;

        // If stepId is a string, use getWebhookUrlByKey; otherwise use getWebhookUrl
        if (typeof stepId === "string") {
            webhookUrl = getWebhookUrlByKey(stepId, environment);
        } else {
            webhookUrl = getWebhookUrl(stepId, environment);
        }

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                stepId,
                environment,
                timestamp: new Date().toISOString(),
                data: formData
            })
        });

        if (!response.ok) {
            throw new Error(`Webhook request failed with status ${response.status}`);
        }

        let result = await response.json();

        // Process the result to extract and clean the output text
        let outputText = "";

        if (Array.isArray(result) && result.length > 0) {
            // If result is an array, get the output from the first element
            const firstItem = result[0];
            if (firstItem.output) {
                outputText = firstItem.output;
            }
        } else if (result.output) {
            // If result has output property directly
            outputText = result.output;
        } else if (typeof result === "string") {
            // If result is already a string
            outputText = result;
        } else if (result.text) {
            // If result has text property
            outputText = result.text;
        }

        // Clean up the text: ensure proper line breaks and trim
        if (outputText) {
            // Replace escaped newlines with actual newlines
            outputText = outputText.replace(/\\n/g, "\n").trim();
            return outputText;
        }

        return result;
    } catch (error) {
        console.error("Error sending to webhook:", error);
        throw error;
    }
};
