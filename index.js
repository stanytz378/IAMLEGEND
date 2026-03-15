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
 *    Description: Main entry file for ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ ⱽ¹.⁰.⁰ WhatsApp Bot      *
 *                 Unauthorized copying or distribution is prohibited.      *
 *                                                                           *
 *****************************************************************************/

// DIAGNOSTICS - Run checks first
const diagnostics = require('./lib/botDiagnostics');
diagnostics.runDiagnostics().catch(err => {
    console.error('❌ Diagnostics error:', err.message);
});

/* process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; */

require('./config');
require('./settings');

const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const FileType = require('file-type');
const syntaxerror = require('syntax-error');
const path = require('path');
const axios = require('axios');
const PhoneNumber = require('awesome-phonenumber');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif');
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    Browsers,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const pino = require("pino");
const readline = require("readline");
const { parsePhoneNumber } = require("libphonenumber-js");
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics');
const { rmSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const store = require('./lib/lightweight_store');
const SaveCreds = require('./lib/session');
const { app, server, PORT } = require('./lib/server');
const { printLog } = require('./lib/print');
const { 
    handleMessages, 
    handleGroupParticipantUpdate, 
    handleStatus,
    handleCall 
} = require('./lib/messageHandler');

const settings = require('./settings');
const commandHandler = require('./lib/commandHandler');

// ==================== FIXED IMPORTS ====================
const { isSudo } = require('./lib/isSudo');
const isOwnerOrSudo = require('./lib/isOwner');
const isAdmin = require('./lib/isAdmin');
// =======================================================

// Initialize store
store.readFromFile();
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000);

// Load commands
commandHandler.loadCommands();
console.log(chalk.greenBright(`✅ Loaded ${commandHandler.commands.size} Plugins`));

// Garbage collection
setInterval(() => {
    if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection completed');
    }
}, 60_000);

// Store cleanup
setInterval(() => {
    store.cleanupData();
}, 60_000);

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    printLog('error', `Uncaught Exception: ${err.message}`);
    console.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
    printLog('error', `Unhandled Rejection: ${reason}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    printLog('warning', 'Bot shutting down gracefully...');
    store.writeToFile();
    process.exit(0);
});

function ensureSessionDirectory() {
    const sessionPath = path.join(__dirname, 'session');
    if (!existsSync(sessionPath)) {
        mkdirSync(sessionPath, { recursive: true });
    }
    return sessionPath;
}

function hasValidSession() {
    try {
        const credsPath = path.join(__dirname, 'session', 'creds.json');
        
        if (!existsSync(credsPath)) {
            return false;
        }
        
        const fileContent = fs.readFileSync(credsPath, 'utf8');
        if (!fileContent || fileContent.trim().length === 0) {
            printLog('warning', 'creds.json exists but is empty');
            return false;
        }
        
        try {
            const creds = JSON.parse(fileContent);
            if (!creds.noiseKey || !creds.signedIdentityKey || !creds.signedPreKey) {
                printLog('warning', 'creds.json is missing required fields');
                return false;
            }
            if (creds.registered === false) {
                printLog('warning', 'Session credentials exist but are not registered');
                try {
                    rmSync(path.join(__dirname, 'session'), { recursive: true, force: true });
                } catch (e) {}
                return false;
            }
            
            printLog('success', 'Valid and registered session credentials found');
            return true;
        } catch (parseError) {
            printLog('warning', 'creds.json contains invalid JSON');
            return false;
        }
    } catch (error) {
        printLog('error', `Error checking session validity: ${error.message}`);
        return false;
    }
}

async function initializeSession() {
    ensureSessionDirectory();
    
    const txt = global.SESSION_ID || process.env.SESSION_ID;

    if (!txt) {
        printLog('warning', 'No SESSION_ID found in environment variables');
        if (hasValidSession()) {
            printLog('success', 'Existing session found. Using saved credentials');
            return true;
        }
        printLog('warning', 'No existing session found. Pairing code will be required');
        return false;
    }
    
    if (hasValidSession()) {
        return true;
    }
    
    try {
        printLog('info', 'Downloading session credentials...');
        await SaveCreds(txt);
        await delay(2000);
        
        if (hasValidSession()) {
            printLog('success', 'Session file verified and valid');
            await delay(1000);
            return true;
        } else {
            printLog('error', 'Session file not valid after download');
            return false;
        }
    } catch (error) {
        printLog('error', `Error downloading session: ${error.message}`);
        return false;
    }
}

server.listen(PORT, () => {
    printLog('success', `Server listening on port ${PORT}`);
});

async function startQasimDev() {
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion();
        
        ensureSessionDirectory();
        await delay(1000);

        // Validate environment
        const sessionReady = await initializeSession();
        if (!sessionReady) {
            printLog('error', 'Session initialization failed. Please check your SESSION_ID.');
            await delay(3000);
            return startQasimDev(); // Retry
        }
        
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);
        const msgRetryCounterCache = new NodeCache();

        const hasRegisteredCreds = state.creds && state.creds.registered !== undefined;
        printLog('info', `Credentials loaded. Registered: ${state.creds?.registered || false}`);

        const ghostMode = await store.getSetting('global', 'stealthMode');
        const isGhostActive = ghostMode && ghostMode.enabled;
        
        if (isGhostActive) {
            printLog('info', '👻 STEALTH MODE IS ACTIVE - Starting in stealth mode');
        }

        const QasimDev = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS("Chrome"),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            msgRetryCounterCache,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 30000,
            mobile: false
        });

        const originalQuery = QasimDev.query;
        
        QasimDev.query = async function(node, ...args) {
            const ghostMode = await store.getSetting('global', 'stealthMode');
            if (ghostMode && ghostMode.enabled) {
                if (node && node.tag === 'receipt') {
                    return;
                }
                if (node && node.attrs && (node.attrs.type === 'read' || node.attrs.type === 'read-self')) {
                    return;
                }
            }
            return originalQuery.apply(this, [node, ...args]);
        };
        
        QasimDev.isGhostMode = async () => {
            const ghostMode = await store.getSetting('global', 'stealthMode');
            return ghostMode && ghostMode.enabled;
        };

        QasimDev.ev.on('creds.update', saveCreds);
        store.bind(QasimDev.ev);
        
        QasimDev.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.message) return;
                
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') 
                    ? mek.message.ephemeralMessage.message 
                    : mek.message;

                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    await handleStatus(QasimDev, chatUpdate);
                    return;
                }

                if (!QasimDev.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                    const isGroup = mek.key?.remoteJid?.endsWith('@g.us');
                    if (!isGroup) return;
                }

                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;

                if (QasimDev?.msgRetryCounterCache) {
                    QasimDev.msgRetryCounterCache.clear();
                }

                try {
                    await handleMessages(QasimDev, chatUpdate);
                } catch (err) {
                    printLog('error', `Error in handleMessages: ${err.message}`);
                    if (mek.key && mek.key.remoteJid) {
                        try {
                            await QasimDev.sendMessage(mek.key.remoteJid, {
                                text: '❌ An error occurred while processing your message.',
                                contextInfo: {
                                    forwardingScore: 1,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: '120363404317544295@newsletter',
                                        newsletterName: 'ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ',
                                        serverMessageId: -1
                                    }
                                }
                            }).catch(console.error);
                        } catch (e) {
                            console.error('Failed to send error message:', e);
                        }
                    }
                }
            } catch (err) {
                printLog('error', `Error in messages.upsert: ${err.message}`);
            }
        });

        QasimDev.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return decode.user && decode.server && decode.user + '@' + decode.server || jid;
            } else return jid;
        };

        QasimDev.ev.on('contacts.update', update => {
            for (let contact of update) {
                let id = QasimDev.decodeJid(contact.id);
                if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
            }
        });

        QasimDev.getName = (jid, withoutContact = false) => {
            id = QasimDev.decodeJid(jid);
            withoutContact = QasimDev.withoutContact || withoutContact;
            let v;
            if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
                v = store.contacts[id] || {};
                if (!(v.name || v.subject)) v = QasimDev.groupMetadata(id) || {};
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
            });
            else v = id === '0@s.whatsapp.net' ? {
                id,
                name: 'WhatsApp'
            } : id === QasimDev.decodeJid(QasimDev.user.id) ?
                QasimDev.user :
                (store.contacts[id] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
        };

        QasimDev.public = true;
        QasimDev.serializeM = (m) => smsg(QasimDev, m, store);

        const isRegistered = state.creds?.registered === true;
        
        if (!isRegistered && !hasRegisteredCreds) {
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            rl.question('Press Enter to continue without pairing code, or enter pairing number: ', async (answer) => {
                if (answer && answer.trim()) {
                    try {
                        const code = await QasimDev.requestPairingCode(answer);
                        console.log('Pairing code:', code);
                    } catch (e) {
                        printLog('error', `Pairing code error: ${e.message}`);
                    }
                }
                if (rl && !rl.closed) {
                    rl.close();
                    rl = null;
                }
            });
        } else {
            if (rl && !rl.closed) {
                rl.close();
                rl = null;
            }
        }

        QasimDev.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect, qr } = s;
            
            if (qr) {
                printLog('info', 'QR Code generated. Please scan with WhatsApp');
            }
            
            if (connection === 'connecting') {
                printLog('connection', 'Connecting to WhatsApp...');
            }
            
            if (connection == "open") {
                printLog('success', 'Bot connected successfully!');
                const { startAutoBio } = require('./plugins/setbio');
                
                try {
                    startAutoBio(QasimDev);
                } catch (e) {
                    console.log('Note: setbio plugin not available');
                }
                
                const ghostMode = await store.getSetting('global', 'stealthMode');
                if (ghostMode && ghostMode.enabled) {
                    printLog('info', '👻 STEALTH MODE ACTIVE - Bot is in stealth mode');
                    console.log(chalk.gray('• No online status'));
                    console.log(chalk.gray('• No typing indicators'));
                }
                
                console.log(chalk.yellow(`\n🌿 Connected to => ` + JSON.stringify(QasimDev.user, null, 2)));

                try {
                    const botNumber = QasimDev.user.id.split(':')[0] + '@s.whatsapp.net';
                    const ghostStatus = (ghostMode && ghostMode.enabled) ? '\n👻 Stealth Mode: ACTIVE' : '';
                    
                    await QasimDev.sendMessage(botNumber, {
                        text: `🤖 Bot Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!${ghostStatus}\n\n✅ Join our channel`,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363404317544295@newsletter',
                                newsletterName: 'MEGA MD',
                                serverMessageId: -1
                            }
                        }
                    });
                } catch (error) {
                    printLog('error', `Failed to send connection message: ${error.message}`);
                }

                 await delay(1999);
                console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'IAMLEGEND'} ]`)}\n\n`));
                console.log(chalk.cyan(`< ================================================== >`));
                console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: STANY TZ`));
                console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: Stanytz378`));
                console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${settings.ownerNumber}`));
                console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`));
                console.log(chalk.blue(`Bot Version: ${settings.version}`));
                console.log(chalk.cyan(`Loaded Commands: ${commandHandler.commands.size}`));
                console.log(chalk.cyan(`Prefixes: ${settings.prefixes.join(', ')}`));
                console.log(chalk.gray(`Mode: ${await store.getBotMode()}`));
                console.log();
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                printLog('warning', `Connection closed. Reconnect: ${shouldReconnect}`);
                
                if (shouldReconnect) {
                    await delay(3000);
                    startQasimDev();
                } else {
                    printLog('error', 'Bot logged out');
                    process.exit(0);
                }
            }
        });

        QasimDev.ev.on('group-participants.update', (update) => handleGroupParticipantUpdate(QasimDev, update));

    } catch (err) {
        printLog('error', `Fatal error: ${err.message}`);
        console.error(err);
        await delay(5000);
        startQasimDev();
    }
}

startQasimDev().catch(err => {
    printLog('error', `Startup error: ${err.message}`);
    console.error(err);
});