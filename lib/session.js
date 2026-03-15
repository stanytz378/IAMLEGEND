/*****************************************************************************
 *                                                                           *
 *                     Developed By STANY TZ                                 *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/Stanytz378                             *
 *  ▶️  YouTube  : https://youtube.com/@STANYTZ                              *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p     *
 *                                                                           *
 *    © 2026 STANY TZ. All rights reserved.                                 *
 *                                                                           *
 *    Description: Session downloader for ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ ⱽ¹.⁰.⁰                *
 *                 Fetches creds.json from GitHub Gist using session ID.    *
 *                 Supports format: Stanytz378/IAMLEGEND_<gistId>           *
 *                                                                           *
 *****************************************************************************/

const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Your GitHub username (where the gist is hosted)
const GITHUB_USERNAME = 'Stanytz378';
const SESSION_PREFIX = 'IAMLEGEND_';
const TIMEOUT = 15000; // 15 seconds

/**
 * Extract Gist ID from SESSION_ID
 * Supports multiple formats:
 * - "Stanytz378/IAMLEGEND_9uyLfafD"
 * - "9uyLfafD"
 * - "IAMLEGEND_9uyLfafD"
 */
function extractGistId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('SESSION_ID must be a non-empty string');
    }

    console.log(`📝 Raw SESSION_ID: ${sessionId}`);

    // If it's just the gist ID (alphanumeric)
    if (!sessionId.includes('/') && !sessionId.includes('_') && sessionId.length > 5) {
        console.log(`✓ Detected format: Direct Gist ID`);
        return sessionId;
    }

    // If it has the full format: Stanytz378/IAMLEGEND_9uyLfafD
    if (sessionId.includes('/')) {
        const parts = sessionId.split('/');
        if (parts.length >= 2) {
            const secondPart = parts.slice(1).join('/'); // In case there are more slashes
            console.log(`✓ Detected format: GitHub path format`);
            
            if (secondPart.includes('_')) {
                const gistId = secondPart.split('_').pop();
                console.log(`✓ Extracted Gist ID: ${gistId}`);
                return gistId;
            }
            return secondPart;
        }
    }

    // If it has IAMLEGEND_ prefix: IAMLEGEND_9uyLfafD
    if (sessionId.includes('_')) {
        const gistId = sessionId.split('_').pop();
        console.log(`✓ Detected format: IAMLEGEND_ prefix`);
        console.log(`✓ Extracted Gist ID: ${gistId}`);
        return gistId;
    }

    console.log(`✓ Using as direct Gist ID`);
    return sessionId;
}

/**
 * Validate Gist ID format
 */
function isValidGistId(gistId) {
    // Gist IDs are typically alphanumeric, can have hyphens
    return /^[a-z0-9\-]+$/i.test(gistId) && gistId.length > 5;
}

/**
 * Save credentials from GitHub Gist to session/creds.json
 * @param {string} txt - Session ID in format "Stanytz378/IAMLEGEND_<gistId>"
 * @returns {Promise<void>}
 */
async function SaveCreds(txt) {
    const __dirname = path.dirname(__filename);

    try {
        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║    🔐 SESSION INITIALIZATION STARTING 🔐   ║');
        console.log('╚═══════════════════════════════════════════╝\n');

        // Extract the Gist ID
        let gistId;
        try {
            gistId = extractGistId(txt);
        } catch (error) {
            throw new Error(`Failed to extract Gist ID: ${error.message}`);
        }

        if (!gistId || gistId.length === 0) {
            throw new Error(`Invalid SESSION_ID format. Could not extract Gist ID from: ${txt}`);
        }

        if (!isValidGistId(gistId)) {
            throw new Error(`Invalid Gist ID format: ${gistId}. Expected alphanumeric string with hyphens.`);
        }

        console.log(`✅ Gist ID validated: ${gistId}`);

        // Build the GitHub raw URL
        const gistUrl = `https://gist.githubusercontent.com/${GITHUB_USERNAME}/${gistId}/raw/creds.json`;
        console.log(`🔗 Fetching from URL: ${gistUrl}`);

        // Fetch credentials from GitHub Gist with timeout and retries
        let response;
        let lastError;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`\n📥 Attempt ${attempt}/${maxRetries}...`);

                response = await axios.get(gistUrl, {
                    timeout: TIMEOUT,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'IAMLEGEND-Bot/1.0'
                    }
                });

                console.log(`✅ Successfully fetched from Gist`);
                break;

            } catch (error) {
                lastError = error;

                if (error.response) {
                    console.error(`❌ HTTP ${error.response.status}: ${error.response.statusText}`);

                    if (error.response.status === 404) {
                        throw new Error(`Gist not found! Verify:\n  1. Gist ID is correct: ${gistId}\n  2. Gist is PUBLIC (not Secret)\n  3. Gist URL is accessible`);
                    } else if (error.response.status === 403) {
                        throw new Error(`Access denied to Gist. Check GitHub permissions and rate limits.`);
                    }
                } else if (error.code === 'ENOTFOUND') {
                    console.error(`❌ Network error: Cannot reach GitHub`);
                } else if (error.code === 'ECONNABORTED') {
                    console.error(`❌ Connection timeout: GitHub took too long to respond`);
                } else {
                    console.error(`❌ Error: ${error.message}`);
                }

                if (attempt < maxRetries) {
                    const waitTime = attempt * 2000;
                    console.log(`⏳ Retrying in ${waitTime}ms...`);
                    await new Promise(r => setTimeout(r, waitTime));
                }
            }
        }

        if (!response) {
            throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
        }

        // Validate response data
        if (!response.data) {
            throw new Error('Empty response received from Gist');
        }

        // Convert to string
        const data = typeof response.data === 'string' 
            ? response.data 
            : JSON.stringify(response.data);

        if (!data || data.trim().length === 0) {
            throw new Error('Received empty credentials from Gist');
        }

        // Validate JSON format
        console.log(`\n🔍 Validating credentials JSON...`);
        let credsData;
        try {
            credsData = JSON.parse(data);
        } catch (e) {
            throw new Error(`Invalid JSON in Gist credentials: ${e.message}`);
        }

        // Verify required fields
        const requiredFields = ['noiseKey', 'signedIdentityKey', 'signedPreKey', 'registrationId'];
        const missingFields = requiredFields.filter(field => !credsData[field]);

        if (missingFields.length > 0) {
            console.warn(`⚠️  Missing fields: ${missingFields.join(', ')}`);
            console.warn(`   (Some fields may not be required on first run)`);
        }

        console.log(`✅ Credentials JSON is valid`);

        // Ensure session directory exists
        const sessionDir = path.join(__dirname, '..', 'session');
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
            console.log(`✅ Created session directory: ${sessionDir}`);
        }

        // Write credentials to file
        const credsPath = path.join(sessionDir, 'creds.json');
        fs.writeFileSync(credsPath, data);
        console.log(`✅ Saved credentials to: ${credsPath}`);

        // Verify file was written
        if (!fs.existsSync(credsPath)) {
            throw new Error(`Failed to verify credentials file at ${credsPath}`);
        }

        const fileSize = fs.statSync(credsPath).size;
        console.log(`✅ File size: ${(fileSize / 1024).toFixed(2)} KB`);

        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║  ✅ SESSION SETUP SUCCESSFUL! ✅           ║');
        console.log('║     Bot is ready to connect                ║');
        console.log('╚═══════════════════════════════════════════╝\n');

        return true;

    } catch (error) {
        console.error('\n╔═══════════════════════════════════════════╗');
        console.error('║  ❌ SESSION SETUP FAILED ❌               ║');
        console.error('╚═══════════════════════════════════════════╝\n');

        console.error(`Error: ${error.message}\n`);

        // Helpful troubleshooting
        console.error('📋 TROUBLESHOOTING STEPS:\n');
        console.error('1. Verify SESSION_ID format:');
        console.error('   ✓ Should be: Stanytz378/IAMLEGEND_<gistId>');
        console.error('   ✓ Or just: <gistId>\n');

        console.error('2. Check if Gist is PUBLIC:');
        console.error('   ✓ Go to https://gist.github.com/Stanytz378');
        console.error('   ✓ Verify creds.json is PUBLIC, not Secret\n');

        console.error('3. Verify Gist has creds.json:');
        console.error('   ✓ Gist must have a file named "creds.json"\n');

        console.error('4. Test Gist URL manually:');
        const testUrl = `https://gist.githubusercontent.com/${GITHUB_USERNAME}/YOUR_GIST_ID/raw/creds.json`;
        console.error(`   ✓ Open in browser: ${testUrl}\n`);

        console.error('5. Check network connection:');
        console.error('   ✓ Ensure you can access GitHub.com\n');

        throw error;
    }
}

module.exports = SaveCreds;