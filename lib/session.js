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
 *                                                                           *
 *****************************************************************************/

const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Your GitHub username (where the gist is hosted)
const GITHUB_USERNAME = 'Stanytz378';

/**
 * Save credentials from GitHub Gist to session/creds.json
 * @param {string} txt - Session ID in format "Stanytz378/IAMLEGEND_<gistId>"
 */
async function SaveCreds(txt) {
    const __dirname = path.dirname(__filename);

    // Extract the Gist ID by removing the prefix "Stanytz378/IAMLEGEND_"
    const gistId = txt.replace('Stanytz378/IAMLEGEND_', '');
    const gistUrl = `https://gist.githubusercontent.com/${GITHUB_USERNAME}/${gistId}/raw/creds.json`;

    try {
        const response = await axios.get(gistUrl);
        const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        
        const sessionDir = path.join(__dirname, '..', 'session');
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        
        const credsPath = path.join(sessionDir, 'creds.json');
        fs.writeFileSync(credsPath, data);

        console.log('✅ Session credentials downloaded and saved successfully.');
    } catch (error) {
        console.error('❌ Error downloading or saving credentials:', error.message);
        if (error.response) {
            console.error('❌ Status:', error.response.status);
            console.error('❌ Response:', error.response.data);
        }
        throw error;
    }
}

module.exports = SaveCreds;