require('dotenv').config();

const settings = {
  prefixes: process.env.PREFIXES ? process.env.PREFIXES.split(',') : ['.', '!', '/', '#'],
  packname: process.env.PACKNAME || 'ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ',
  author: process.env.AUTHOR || 'STANY TZ',
  timeZone: process.env.TIMEZONE || 'Africa/Nairobi',
  botName: process.env.BOT_NAME || "ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ ⱽ¹.⁰.⁰",
  botOwner: process.env.BOT_OWNER || 'STANY TZ',
  ownerNumber: process.env.OWNER_NUMBER || '255787069580',
  giphyApiKey: process.env.GIPHY_API_KEY || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: process.env.COMMAND_MODE || "public",
  maxStoreMessages: Number(process.env.MAX_STORE_MESSAGES) || 10,
  tempCleanupInterval: Number(process.env.CLEANUP_INTERVAL) || 1 * 60 * 60 * 1000,
  storeWriteInterval: Number(process.env.STORE_WRITE_INTERVAL) || 10000,
  description: process.env.DESCRIPTION || "ᴵ ᴬᴹ ᴸᴱᴳᴱᴺᴰ WhatsApp Bot by STANY TZ – Advanced multi-device bot with powerful features.",
  version: "5.3.0",
  updateZipUrl: process.env.UPDATE_URL || "https://github.com/Stanytz378/IAMLEGEND/archive/refs/heads/main.zip",
  channelLink: process.env.CHANNEL_LINK || "https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p",
  ytch: process.env.YT_CHANNEL || "STANY TZ"
};

module.exports = settings;