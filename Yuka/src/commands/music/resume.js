// src/commands/music/resume.js

const { useMainPlayer } = require('discord-player');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Nama perintah yang akan digunakan oleh pengguna (misalnya, !resume).
    name: 'resume',
    // Deskripsi singkat tentang fungsi perintah.
    description: 'Melanjutkan pemutaran musik yang sebelumnya dijeda.',
    // Penggunaan perintah (opsional, tapi bagus untuk perintah !help).
    usage: '!resume',

    /**
     * Fungsi yang akan dieksekusi saat perintah !resume digunakan.
     * @param {import('discord.js').Message} message - Objek pesan yang memicu perintah.
     * @param {string[]} args - Argumen setelah nama perintah (tidak digunakan untuk resume).
     */
    async execute(message, args) {
        // Mendapatkan instance pemain musik utama.
        const player = useMainPlayer();

        // Mendapatkan antrean musik untuk guild (server) tempat perintah ini dipicu.
        const queue = player.queues.get(message.guild.id);

        // --- 1. Validasi Kondisi ---
        // Periksa apakah ada antrean musik atau apakah ada musik yang sedang diputar/dijeda.
        if (!queue || !queue.tracks.data.length && !queue.currentTrack) {
            return message.reply('❌ Tidak ada musik yang sedang diputar atau dijeda.');
        }

        // Periksa apakah pengguna berada di saluran suara yang sama dengan bot.
        if (message.member.voice.channelId !== queue.channel.id) {
            return message.reply('Anda harus berada di saluran suara yang sama dengan bot untuk melanjutkan musik.');
        }
        
        // Periksa apakah antrean sedang dijeda.
        if (!queue.node.isPaused()) {
            return message.reply('Musik saat ini tidak dijeda.');
        }

        // --- 2. Melanjutkan Pemutaran ---
        try {
            // Lanjutkan pemutaran lagu.
            queue.node.resume();

            // Kirim pesan konfirmasi ke channel.
            await message.reply('▶️ Musik telah dilanjutkan!');
            logger.info(`Resumed music in guild ${message.guild.name} by ${message.author.tag}.`);

        } catch (error) {
            // Tangani error jika terjadi masalah saat melanjutkan musik.
            logger.error(`Error resuming music in guild ${message.guild.name}:`, error);
            await message.reply('Terjadi kesalahan saat melanjutkan musik.');
        }
    },
};
