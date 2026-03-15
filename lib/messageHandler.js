/*****************************************************************************
 *                                                                           *
 *                     Developed By STANY TZ                                 *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/Stanytz378                             *
 *  ▶️  YouTube  : https://youtube.com/@STANYTZ01                            *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p     *
 *                                                                           *
 *    © 2026 STANY TZ. All rights reserved.                                 *
 *                                                                           *
 *****************************************************************************/

const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const store = require('./lightweight_store');
const commandHandler = require('./commandHandler');
const { printMessage, printLog } = require('./print');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363404317544295@newsletter',
            newsletterName: 'ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ',
            serverMessageId: -1
        }
    }
};

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);

// Safe require with fallback
function safeRequire(modulePath, defaultValue = {}) {
    try {
        const mod = require(modulePath);
        return mod || defaultValue;
    } catch (e) {
        console.warn(`⚠️  Could not load ${modulePath}: ${e.message}`);
        return defaultValue;
    }
}

// Load optional plugins safely
const { isBanned } = safeRequire('./isBanned', { isBanned: () => false });
const { isSudo } = safeRequire('./isSudo', { isSudo: () => false });
const isOwnerOrSudo = safeRequire('./isOwner', () => false);
const isAdmin = safeRequire('./isAdmin', () => false);
const { handleAutoread } = safeRequire('../plugins/autoread', { handleAutoread: async () => {} });
const { handleAutotypingForMessage } = safeRequire('../plugins/autotyping', { handleAutotypingForMessage: async () => {} });
const { handleBadwordDetection } = safeRequire('./antibadword', { handleBadwordDetection: async () => {} });
const { handleLinkDetection } = safeRequire('../plugins/antilink', { handleLinkDetection: async () => {} });
const { handleTagDetection } = safeRequire('../plugins/antitag', { handleTagDetection: async () => {} });
const { handleMentionDetection } = safeRequire('../plugins/mention', { handleMentionDetection: async () => {} });
const { handleChatbotResponse } = safeRequire('../plugins/chatbot', { handleChatbotResponse: async () => {} });

/**
 * Main message handler
 */
async function handleMessages(sock, messageUpdate) {
    try {
        const { messages, type } = messageUpdate;
        
        // Only process notifications
        if (type !== 'notify') {
            return;
        }

        const message = messages[0];
        
        // Validate message
        if (!message || !message.message || !message.key) {
            return;
        }

        // Print message for logging
        try {
            await printMessage(message, sock);
        } catch (e) {
            console.error('Error printing message:', e.message);
        }

        // Extract key information
        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const fromMe = message.key.fromMe;

        if (!chatId || !senderId) {
            return;
        }

        // Get message text
        let messageText = '';
        const messageContent = message.message;

        if (messageContent?.conversation) {
            messageText = messageContent.conversation;
        } else if (messageContent?.extendedTextMessage?.text) {
            messageText = messageContent.extendedTextMessage.text;
        } else if (messageContent?.text) {
            messageText = messageContent.text;
        }

        if (!messageText || typeof messageText !== 'string') {
            return;
        }

        messageText = messageText.trim();

        // Check if user is banned
        try {
            if (await isBanned(senderId)) {
                printLog('warning', `Banned user message ignored: ${senderId}`);
                return;
            }
        } catch (e) {
            console.error('Error checking banned status:', e.message);
        }

        // Auto read messages
        try {
            const ghostMode = await store.getSetting('global', 'stealthMode');
            if (!ghostMode || !ghostMode.enabled) {
                await handleAutoread(sock, message);
            }
        } catch (e) {
            console.error('Error in autoread:', e.message);
        }

        // Check if it's a command
        const usedPrefix = settings.prefixes.find(p => messageText.startsWith(p));
        
        if (!usedPrefix) {
            // Not a command, ignore
            return;
        }

        // Extract command
        const messageWithoutPrefix = messageText.slice(usedPrefix.length).trim();
        const parts = messageWithoutPrefix.split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (!commandName) {
            return;
        }

        // Get command
        const command = commandHandler.commands.get(commandName) || 
                       commandHandler.aliases.get(commandName);

        if (!command) {
            printLog('warning', `Unknown command: ${commandName}`);
            return;
        }

        // Check bot mode
        const botMode = await store.getBotMode();
        let isAllowed = true;

        try {
            const isOwner = await isOwnerOrSudo(senderId, sock);
            
            if (!isOwner) {
                switch (botMode) {
                    case 'private':
                    case 'self':
                        isAllowed = false;
                        break;
                    case 'groups':
                        isAllowed = isGroup;
                        break;
                    case 'inbox':
                        isAllowed = !isGroup;
                        break;
                    case 'public':
                    default:
                        isAllowed = true;
                }
            }
        } catch (e) {
            console.error('Error checking permissions:', e.message);
            isAllowed = true; // Allow by default if error
        }

        if (!isAllowed) {
            printLog('warning', `User not allowed in mode ${botMode}`);
            return;
        }

        // Prepare context
        const context = {
            chatId,
            senderId,
            isGroup,
            fromMe,
            messageText,
            usedPrefix,
            args,
            channelInfo
        };

        // Execute command
        try {
            printLog('info', `Executing command: ${commandName}`);
            
            await command.handler(sock, message, args, context);

        } catch (error) {
            printLog('error', `Command error: ${error.message}`);
            console.error(error);
            
            try {
                await sock.sendMessage(chatId, {
                    text: `❌ Error executing command: ${error.message}`,
                    ...channelInfo
                }, { quoted: message });
            } catch (e) {
                console.error('Error sending error message:', e.message);
            }
        }

    } catch (error) {
        printLog('error', `Message handler error: ${error.message}`);
        console.error(error);
    }
}

/**
 * Handle group participants update
 */
async function handleGroupParticipantUpdate(sock, update) {
    try {
        console.log('Group participant update:', update);
    } catch (error) {
        console.error('Error handling participant update:', error.message);
    }
}

/**
 * Handle status updates
 */
async function handleStatus(sock, messageUpdate) {
    try {
        console.log('Status update received');
    } catch (error) {
        console.error('Error handling status:', error.message);
    }
}

/**
 * Handle call
 */
async function handleCall(sock, call) {
    try {
        console.log('Call received:', call);
    } catch (error) {
        console.error('Error handling call:', error.message);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus,
    handleCall
};