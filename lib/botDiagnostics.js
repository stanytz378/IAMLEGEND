/*****************************************************************************
 *                                                                           *
 *                     BOT DIAGNOSTICS & ERROR FIXER                         *
 *                     Developed By STANY TZ                                 *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/Stanytz378                             *
 *  ▶️  YouTube  : https://youtube.com/@STANYTZ                              *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p     *
 *                                                                           *
 *    © 2026 STANY TZ. All rights reserved.                                 *
 *                                                                           *
 *****************************************************************************/

const fs = require('fs');
const path = require('path');

class BotDiagnostics {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    /**
     * Run complete diagnostics
     */
    async runDiagnostics() {
        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║     🤖 BOT DIAGNOSTICS STARTED 🤖          ║');
        console.log('╚════════════════════════════════════════════╝\n');

        // Check environment variables
        this.checkEnvironment();

        // Check file structure
        this.checkFileStructure();

        // Check plugins
        this.checkPlugins();

        // Check session
        this.checkSession();

        // Print report
        this.printReport();

        return {
            hasErrors: this.errors.length > 0,
            errors: this.errors,
            warnings: this.warnings,
            info: this.info
        };
    }

    /**
     * Check environment variables
     */
    checkEnvironment() {
        console.log('🔍 Checking Environment Variables...\n');

        const required = ['SESSION_ID', 'OWNER_NUMBER', 'BOT_OWNER'];
        const optional = ['COMMAND_MODE', 'PREFIXES', 'BOT_NAME', 'TIMEZONE'];

        // Check required
        for (const env of required) {
            if (!process.env[env]) {
                this.errors.push(`❌ REQUIRED: ${env} not set`);
                console.error(`❌ REQUIRED: ${env} not set`);
            } else {
                this.info.push(`✅ ${env} = ${process.env[env]}`);
                console.log(`✅ ${env} = ${process.env[env]}`);
            }
        }

        // Check COMMAND_MODE
        const mode = process.env.COMMAND_MODE || 'public';
        const validModes = ['public', 'private', 'groups', 'inbox', 'self'];
        if (!validModes.includes(mode)) {
            this.errors.push(`❌ COMMAND_MODE "${mode}" is invalid. Must be: ${validModes.join(', ')}`);
            console.error(`❌ COMMAND_MODE "${mode}" is invalid`);
        } else {
            this.info.push(`✅ COMMAND_MODE = ${mode} (VALID)`);
            console.log(`✅ COMMAND_MODE = ${mode} (VALID)`);
        }

        // Check PREFIXES
        const prefixes = process.env.PREFIXES || '.';
        if (!prefixes || prefixes.trim() === '') {
            this.errors.push(`❌ PREFIXES is empty!`);
            console.error(`❌ PREFIXES is empty!`);
        } else {
            this.info.push(`✅ PREFIXES = ${prefixes}`);
            console.log(`✅ PREFIXES = ${prefixes}`);
        }

        // Check OWNER_NUMBER format
        const ownerNum = process.env.OWNER_NUMBER || '';
        if (ownerNum.includes('+')) {
            this.warnings.push(`⚠️  OWNER_NUMBER has '+' prefix (should not)`);
            console.warn(`⚠️  OWNER_NUMBER has '+' prefix`);
        }
        if (ownerNum.includes(' ')) {
            this.warnings.push(`⚠️  OWNER_NUMBER has spaces (should not)`);
            console.warn(`⚠️  OWNER_NUMBER has spaces`);
        }

        console.log('');
    }

    /**
     * Check file structure
     */
    checkFileStructure() {
        console.log('📁 Checking File Structure...\n');

        const requiredDirs = [
            'session',
            'plugins',
            'lib',
            'data'
        ];

        const requiredFiles = [
            'index.js',
            'settings.js',
            'lib/session.js',
            'lib/messageHandler.js',
            'lib/commandHandler.js'
        ];

        // Check directories
        for (const dir of requiredDirs) {
            const dirPath = path.join(process.cwd(), dir);
            if (fs.existsSync(dirPath)) {
                this.info.push(`✅ Directory exists: ${dir}`);
                console.log(`✅ ${dir}/`);
            } else {
                // Create if missing (except session)
                if (dir !== 'session') {
                    try {
                        fs.mkdirSync(dirPath, { recursive: true });
                        this.warnings.push(`⚠️  Created missing directory: ${dir}`);
                        console.warn(`⚠️  Created: ${dir}/`);
                    } catch (e) {
                        this.errors.push(`❌ Cannot create ${dir}: ${e.message}`);
                        console.error(`❌ Cannot create ${dir}`);
                    }
                }
            }
        }

        console.log('');

        // Check files
        for (const file of requiredFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                this.info.push(`✅ File exists: ${file}`);
                console.log(`✅ ${file}`);
            } else {
                this.errors.push(`❌ FILE MISSING: ${file}`);
                console.error(`❌ ${file}`);
            }
        }

        console.log('');
    }

    /**
     * Check plugins folder
     */
    checkPlugins() {
        console.log('🔌 Checking Plugins...\n');

        const pluginsPath = path.join(process.cwd(), 'plugins');
        
        if (!fs.existsSync(pluginsPath)) {
            this.warnings.push(`⚠️  Plugins folder not found`);
            console.warn(`⚠️  Plugins folder missing`);
            return;
        }

        const plugins = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'));

        if (plugins.length === 0) {
            this.errors.push(`❌ NO PLUGINS FOUND! Bot has no commands.`);
            console.error(`❌ No plugin files (.js) found in plugins/`);
        } else {
            this.info.push(`✅ Found ${plugins.length} plugins`);
            console.log(`✅ Found ${plugins.length} plugins:`);
            plugins.slice(0, 10).forEach(p => console.log(`   • ${p}`));
            if (plugins.length > 10) {
                console.log(`   ... and ${plugins.length - 10} more`);
            }
        }

        console.log('');
    }

    /**
     * Check session credentials
     */
    checkSession() {
        console.log('🔐 Checking Session...\n');

        const sessionPath = path.join(process.cwd(), 'session', 'creds.json');

        if (!fs.existsSync(sessionPath)) {
            this.warnings.push(`⚠️  Session creds.json not found (will be created on first run)`);
            console.warn(`⚠️  creds.json not found (normal on first run)`);
        } else {
            try {
                const creds = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
                
                const required = ['noiseKey', 'signedIdentityKey', 'signedPreKey'];
                const missing = required.filter(k => !creds[k]);

                if (missing.length > 0) {
                    this.errors.push(`❌ Credentials missing fields: ${missing.join(', ')}`);
                    console.error(`❌ Missing required credential fields`);
                } else {
                    this.info.push(`✅ Valid credentials found`);
                    console.log(`✅ Credentials valid`);
                }

                if (creds.registered === false) {
                    this.warnings.push(`⚠️  Credentials not registered yet`);
                    console.warn(`⚠️  Not registered`);
                } else {
                    this.info.push(`✅ Credentials registered`);
                    console.log(`✅ Registered`);
                }

            } catch (e) {
                this.errors.push(`❌ Credentials JSON invalid: ${e.message}`);
                console.error(`❌ Invalid credentials JSON`);
            }
        }

        console.log('');
    }

    /**
     * Print diagnostic report
     */
    printReport() {
        console.log('╔════════════════════════════════════════════╗');
        console.log('║          📊 DIAGNOSTIC REPORT 📊            ║');
        console.log('╚════════════════════════════════════════════╝\n');

        // Errors
        if (this.errors.length > 0) {
            console.error(`\n❌ ERRORS (${this.errors.length}):\n`);
            this.errors.forEach((e, i) => console.error(`   ${i + 1}. ${e}`));
        }

        // Warnings
        if (this.warnings.length > 0) {
            console.warn(`\n⚠️  WARNINGS (${this.warnings.length}):\n`);
            this.warnings.forEach((w, i) => console.warn(`   ${i + 1}. ${w}`));
        }

        // Info
        if (this.info.length > 0) {
            console.log(`\n✅ INFO (${this.info.length}):\n`);
            this.info.slice(0, 5).forEach((i) => console.log(`   • ${i}`));
        }

        // Summary
        console.log('\n╔════════════════════════════════════════════╗');
        if (this.errors.length === 0) {
            console.log('║  ✅ ALL CHECKS PASSED - BOT READY! ✅      ║');
        } else {
            console.log(`║  ❌ ${this.errors.length} CRITICAL ERROR(S) FOUND ❌    ║`);
        }
        console.log('╚════════════════════════════════════════════╝\n');
    }
}

module.exports = new BotDiagnostics();