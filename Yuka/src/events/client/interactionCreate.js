// src/events/client/interactionCreate.js

const { Events } = require('discord.js');
const { handleCommandError } = require('../../utils/errorHandler'); // Impor handler error
const logger = require('../../utils/logger'); // Impor modul logger

module.exports = {
    // Nama event yang akan didengarkan Discord.js.
    // 'Events.InteractionCreate' dipicu setiap kali ada interaksi.
    name: Events.InteractionCreate,

    /**
     * Fungsi yang akan dieksekusi setiap kali ada interaksi baru.
     * @param {import('discord.js').Interaction} interaction - Objek interaksi Discord.
     */
    async execute(interaction) {
        // --- 1. Filter Interaksi (Hanya Perintah Slash) ---
        // Pastikan interaksi adalah perintah slash (chat input command).
        // Jika bukan, abaikan interaksi ini karena file ini hanya fokus pada perintah slash.
        // Anda bisa menambahkan logika di sini untuk jenis interaksi lain di masa mendatang.
        if (!interaction.isChatInputCommand()) {
            // Contoh: logger.debug(`Received non-slash interaction type: ${interaction.type}`);
            return;
        }

        // --- 2. Mencari Perintah Slash ---
        // Dapatkan objek perintah dari koleksi client.commands berdasarkan nama perintah.
        const command = interaction.client.commands.get(interaction.commandName);

        // Jika perintah tidak ditemukan dalam koleksi (mungkin ada masalah deployment atau nama salah).
        if (!command) {
            logger.error(`No slash command matching ${interaction.commandName} was found.`);
            // Beri tahu pengguna jika perintah tidak ditemukan.
            return interaction.reply({
                content: 'Maaf, perintah ini tidak ditemukan atau belum terdaftar.',
                ephemeral: true // Hanya terlihat oleh pengguna yang mengetik perintah
            }).catch(e => logger.error("Failed to send reply for unknown command:", e));
        }

        // --- 3. Eksekusi Perintah dan Penanganan Error ---
        try {
            // Panggil fungsi 'execute' dari objek perintah.
            // Objek 'interaction' diteruskan sebagai parameter tunggal.
            await command.execute(interaction);

            // Catat ke log bahwa perintah slash berhasil dieksekusi.
            logger.info(`Executed slash command: /${interaction.commandName} by ${interaction.user.tag} in #${interaction.channel.name} (${interaction.guild.name})`);

        } catch (error) {
            // Tangani error yang terjadi selama eksekusi perintah.
            logger.error(`Error executing slash command /${interaction.commandName} by ${interaction.user.tag}:`, error);

            // Beri tahu pengguna tentang error tersebut.
            // Gunakan fungsi handleCommandError dari utils/errorHandler.js.
            // Ini akan mencoba membalas interaksi atau melakukan followUp.
            handleCommandError(error, interaction);
        }
    },
};