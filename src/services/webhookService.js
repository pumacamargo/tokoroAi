// Webhook configuration for different steps and environments
const WEBHOOKS = {
    script: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genScript",
        test: "https://n8n.lemonsushi.com/webhook/tokoroAi_genScript_test"
    },
    artDirection: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genArtDirection",
        test: "https://n8n.lemonsushi.com/webhook/tokoroAi_genArtDirection_test"
    },
    imageGeneration: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genImages",
        test: "https://n8n.lemonsushi.com/webhook/tokoroAi_genImages_test"
    },
    videoGeneration: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genVideo",
        test: "https://n8n.lemonsushi.com/webhook/tokoroAi_genVideo_test"
    },
    soundFX: {
        production: "https://n8n.lemonsushi.com/webhook/tokoroAi_genSound",
        test: "https://n8n.lemonsushi.com/webhook/tokoroAi_genSound_test"
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
 * Send form data to n8n webhook
 * @param {number} stepId - The step ID (1-5)
 * @param {object} formData - The form values to send
 * @param {string} environment - "production" or "test"
 * @returns {Promise} Promise with the webhook response
 */
export const sendToWebhook = async (stepId, formData, environment = "production") => {
    try {
        const webhookUrl = getWebhookUrl(stepId, environment);

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

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error sending to webhook:", error);
        throw error;
    }
};
