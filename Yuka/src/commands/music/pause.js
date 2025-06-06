// src/commands/music/pause.js

const { useMainPlayer } = require('discord-player');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Nama perintah yang akan digunakan pengguna (misalnya, !pause).
    name: 'pause',
    // Deskripsi singkat tentang fungsi perintah.
    description: 'Menjeda pemutaran musik yang sedang berlangsung.',
    // Penggunaan perintah (opsional, tapi bagus untuk perintah !help).
    usage: '!pause',

    /**
     * Fungsi yang akan dieksekusi saat perintah !pause digunakan.
     * @param {import('discord.js').Message} message - Objek pesan yang memicu perintah.
     * @param {string[]} args - Argumen setelah nama perintah (tidak digunakan untuk pause).
     */
    async execute(message, args) {
        // Mendapatkan instance pemain musik utama.
        const player = useMainPlayer();

        // Mendapatkan antrean musik untuk guild (server) tempat perintah ini dipicu.
        const queue = player.queues.get(message.guild.id);

        // --- 1. Validasi Kondisi ---
        // Periksa apakah ada antrean atau apakah ada musik yang sedang diputar.
        if (!queue || !queue.isPlaying()) {
            return message.reply('❌ Tidak ada musik yang sedang diputar untuk dijeda.');
        }

        // Periksa apakah pengguna berada di saluran suara yang sama dengan bot.
        if (message.member.voice.channelId !== queue.channel.id) {
            return message.reply('Anda harus berada di saluran suara yang sama dengan bot untuk menjeda musik.');
        }

        // Periksa apakah musik sudah dalam keadaan dijeda.
        if (queue.node.isPaused()) {
            return message.reply('Musik saat ini sudah dijeda.');
        }

        // --- 2. Menjeda Pemutaran ---
        try {
            // Jeda pemutaran lagu.
            queue.node.pause();

            // Kirim pesan konfirmasi ke channel.
            await message.reply('⏸️ Musik telah dijeda!');
            logger.info(`Paused music in guild ${message.guild.name} by ${message.author.tag}.`);

        } catch (error) {
            // Tangani error jika terjadi masalah saat menjeda musik.
            logger.error(`Error pausing music in guild ${message.guild.name}:`, error);
            await message.reply('Terjadi kesalahan saat menjeda musik.');
        }
    },
};