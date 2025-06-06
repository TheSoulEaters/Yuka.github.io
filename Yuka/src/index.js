// src/index.js

// Impor modul yang diperlukan
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config(); // Memuat variabel lingkungan dari file .env

// Impor modul internal bot
const { prefix, clientId, guildId } = require('./config'); // Konfigurasi bot (prefiks, ID)
const logger = require('./utils/logger'); // Sistem logging
const connectDB = require('./database/connect'); // Fungsi koneksi database (jika digunakan)

// --- 1. Inisialisasi Klien Discord ---
// Buat instance baru dari klien Discord dengan intent yang diperlukan.
// Intent adalah izin yang diminta bot Anda dari Discord untuk menerima jenis event tertentu.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // Diperlukan untuk mengakses informasi guild (server)
        GatewayIntentBits.GuildMessages,    // Diperlukan untuk menerima event pesan di guild
        GatewayIntentBits.MessageContent,   // Diperlukan untuk membaca konten pesan (penting untuk perintah prefiks!)
        GatewayIntentBits.GuildMembers,     // Diperlukan untuk event guildMemberAdd/Remove dan mengakses informasi anggota
        GatewayIntentBits.GuildVoiceStates, // Diperlukan untuk bot musik agar bisa melihat status suara anggota
    ],
});

// --- 2. Koleksi Perintah ---
// Buat koleksi untuk menyimpan perintah slash dan perintah prefiks.
// Discord.Collection adalah ekstensi dari JavaScript Map, dioptimalkan untuk Discord.js.
client.commands = new Collection();       // Untuk perintah slash (/)
client.prefixCommands = new Collection(); // Untuk perintah prefiks (!)

// --- 3. Memuat Perintah Slash (/) ---
// Membaca file perintah slash dari direktori 'src/commands/'.
const slashCommandsPath = path.join(__dirname, 'commands');
const slashCommandFolders = fs.readdirSync(slashCommandsPath);

for (const folder of slashCommandFolders) {
    // Abaikan folder 'music' karena perintah di dalamnya adalah prefiks, bukan slash.
    if (folder === 'music') {
        continue;
    }

    const currentFolderPath = path.join(slashCommandsPath, folder);
    const commandFiles = fs.readdirSync(currentFolderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(currentFolderPath, file);
        const command = require(filePath);
        // Pastikan perintah memiliki properti 'data' (SlashCommandBuilder) dan 'execute'.
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            logger.warn(`[WARNING] Slash command at ${filePath} is missing 'data' or 'execute' property.`);
        }
    }
}
logger.info(`Loaded ${client.commands.size} slash commands.`);

// --- 4. Memuat Perintah Prefiks (!) ---
// Membaca file perintah prefiks dari direktori 'src/commands/music/'.
const prefixCommandsPath = path.join(__dirname, 'commands', 'music');

// Pastikan folder musik ada sebelum mencoba membacanya.
if (fs.existsSync(prefixCommandsPath)) {
    const prefixCommandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js'));

    for (const file of prefixCommandFiles) {
        const filePath = path.join(prefixCommandsPath, file);
        const command = require(filePath);
        // Perintah prefiks hanya perlu properti 'name' dan 'execute'.
        if ('name' in command && 'execute' in command) {
            client.prefixCommands.set(command.name, command);
        } else {
            logger.warn(`[WARNING] Prefix command at ${filePath} is missing 'name' or 'execute' property.`);
        }
    }
    logger.info(`Loaded ${client.prefixCommands.size} prefix commands.`);
} else {
    logger.warn(`[WARNING] Music commands folder not found at ${prefixCommandsPath}. Prefixed commands will not be available.`);
}

// --- 4. Inisialisasi Discord Player ---
// Inisialisasi discord-player untuk menangani musik.
const player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
            }
});

// --- 5. Memuat Event Listeners ---
// Membaca file event dari direktori 'src/events/'.
const eventsPath = path.join(__dirname, 'events');
const eventFolders = fs.readdirSync(eventsPath);

for (const folder of eventFolders) {
    const currentFolderPath = path.join(eventsPath, folder);
    const eventFiles = fs.readdirSync(currentFolderPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(currentFolderPath, file);
        const event = require(filePath);
        // Tentukan apakah event harus dijalankan sekali (once) atau setiap kali (on).
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        logger.info(`Loaded event: ${event.name}`);
    }
}

// --- 6. Koneksi ke Database (Opsional) ---
// Panggil fungsi koneksi database. Ini akan log status koneksi.
connectDB();

// --- 7. Login Bot ke Discord ---
// Menggunakan BOT_TOKEN dari variabel lingkungan (.env).
client.login(process.env.BOT_TOKEN)
    .then(() => logger.info('Bot is logging in...'))
    .catch(error => logger.error('Failed to log in to Discord:', error));

// --- 8. Penanganan Error Global (Opsional, tapi Sangat Direkomendasikan) ---
// Menangkap error yang tidak tertangani agar bot tidak crash sepenuhnya.
process.on('unhandledRejection', error => {
    logger.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', error);
    // Anda bisa menambahkan logika untuk graceful shutdown di sini jika diperlukan
    // process.exit(1); // Keluar dari proses dengan kode error
});