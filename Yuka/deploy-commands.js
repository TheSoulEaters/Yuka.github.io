// deploy-commands.js

const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config(); // Untuk memuat variabel dari .env

// Pastikan untuk mengimpor clientId dan guildId dari config.js
// token akan diambil dari process.env.BOT_TOKEN
const { clientId, guildId } = require('./src/config');
const logger = require('./src/utils/logger'); // Impor logger Anda

// Array untuk menyimpan definisi perintah slash yang akan didaftarkan
const commands = [];

// --- 1. Membaca Perintah Slash dari Direktori ---
// Path ke folder commands Anda di dalam src
const foldersPath = path.join(__dirname, 'src', 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Iterasi melalui setiap folder perintah (e.g., general, moderation, fun)
for (const folder of commandFolders) {
    // Abaikan folder 'music' karena ini adalah untuk perintah prefiks, bukan slash.
    if (folder === 'music') {
        continue;
    }

    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    // Iterasi melalui setiap file perintah di dalam folder
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        // Pastikan objek perintah memiliki properti 'data' (SlashCommandBuilder) dan 'execute'
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON()); // Tambahkan representasi JSON dari perintah slash
        } else {
            logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property. Skipping.`);
        }
    }
}

// --- 2. Menginisialisasi REST Client Discord ---
// Menggunakan token bot untuk otentikasi dengan Discord API.
const rest = new REST().setToken(process.env.BOT_TOKEN);

// --- 3. Mendaftarkan Perintah Slash ke Discord API ---
// Ini adalah fungsi asinkron yang akan menjalankan proses deployment.
(async () => {
    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);

        // Menggunakan metode 'put' untuk memperbarui semua perintah di guild tertentu.
        // Ini akan menghapus perintah lama yang tidak ada dalam daftar 'commands' dan menambahkan yang baru.
        // Routes.applicationGuildCommands(clientId, guildId) digunakan untuk mendaftarkan perintah ke guild spesifik.
        // Ini bagus untuk pengembangan karena perubahan langsung terlihat.
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId), // Daftar di server tertentu
            // Jika Anda ingin mendaftarkan perintah secara global (tersedia di semua server tempat bot Anda berada):
            // Gunakan Routes.applicationCommands(clientId)
            // Namun, perlu diingat bahwa pendaftaran global bisa memakan waktu hingga satu jam untuk disebarkan.
            // Routes.applicationCommands(clientId),
            { body: commands },
        );

        logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
        logger.info(`Commands reloaded: ${data.map(cmd => cmd.name).join(', ')}`);

    } catch (error) {
        // Tangani dan catat error jika proses deployment gagal.
        logger.error(`Failed to deploy commands:`, error);
    }
})();