// src/commands/music/stop.js

// Impor pustaka yang diperlukan untuk fungsionalitas musik.
// 'discord-player' adalah contoh pustaka yang kuat untuk manajemen antrean dan pemutaran.
const { useMainPlayer } = require('discord-player');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Nama perintah yang akan digunakan oleh pengguna (misalnya, !stop).
    name: 'stop',
    // Deskripsi singkat tentang fungsi perintah.
    description: 'Menghentikan pemutaran musik dan membersihkan antrean.',
    // Penggunaan perintah (opsional, tapi bagus untuk perintah !help).
    usage: '!stop',

    /**
     * Fungsi yang akan dieksekusi saat perintah !stop digunakan.
     * @param {import('discord.js').Message} message - Objek pesan yang memicu perintah.
     * @param {string[]} args - Argumen setelah nama perintah (tidak digunakan untuk stop).
     */
    async execute(message, args) {
        // Mendapatkan instance pemain musik utama.
        const player = useMainPlayer();

        // Mendapatkan antrean musik untuk guild (server) tempat perintah ini dipicu.
        const queue = player.queues.get(message.guild.id);

        // --- 1. Validasi Kondisi ---
        // Periksa apakah ada antrean atau apakah ada musik yang sedang diputar.
        if (!queue || !queue.isPlaying()) {
            return message.reply('❌ Tidak ada musik yang sedang diputar atau dalam antrean.');
        }

        // Periksa apakah pengguna berada di saluran suara yang sama dengan bot.
        if (message.member.voice.channelId !== queue.channel.id) {
            return message.reply('Anda harus berada di saluran suara yang sama dengan bot untuk menghentikan musik.');
        }

        // --- 2. Hentikan Pemutaran dan Bersihkan Antrean ---
        try {
            // Hentikan pemutaran dan hancurkan antrean.
            // Ini akan membuat bot meninggalkan saluran suara.
            queue.destroy();

            // Kirim pesan konfirmasi ke channel.
            await message.reply('⏹️ Pemutaran musik telah dihentikan dan antrean dibersihkan. Bot telah meninggalkan saluran suara.');
            logger.info(`Stopped music in guild ${message.guild.name} by ${message.author.tag}.`);

        } catch (error) {
            // Tangani error jika terjadi masalah saat menghentikan musik.
            logger.error(`Error stopping music in guild ${message.guild.name}:`, error);
            await message.reply('Terjadi kesalahan saat menghentikan musik.');
        }
    },
};  