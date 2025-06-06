// src/commands/music/skip.js

const { useMainPlayer } = require('discord-player');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Nama perintah yang akan digunakan oleh pengguna (misalnya, !skip).
    name: 'skip',
    // Deskripsi singkat tentang fungsi perintah.
    description: 'Melewati lagu yang sedang diputar ke lagu berikutnya di antrean.',
    // Penggunaan perintah (opsional, tapi bagus untuk perintah !help).
    usage: '!skip',

    /**
     * Fungsi yang akan dieksekusi saat perintah !skip digunakan.
     * @param {import('discord.js').Message} message - Objek pesan yang memicu perintah.
     * @param {string[]} args - Argumen setelah nama perintah (tidak digunakan untuk skip).
     */
    async execute(message, args) {
        // Mendapatkan instance pemain musik utama.
        const player = useMainPlayer();

        // Mendapatkan antrean musik untuk guild (server) tempat perintah ini dipicu.
        const queue = player.queues.get(message.guild.id);

        // --- 1. Validasi Kondisi ---
        // Periksa apakah ada antrean atau apakah ada musik yang sedang diputar.
        if (!queue || !queue.isPlaying()) {
            return message.reply('❌ Tidak ada musik yang sedang diputar untuk dilewati.');
        }

        // Periksa apakah pengguna berada di saluran suara yang sama dengan bot.
        if (message.member.voice.channelId !== queue.channel.id) {
            return message.reply('Anda harus berada di saluran suara yang sama dengan bot untuk melewati lagu.');
        }

        // Periksa apakah ada lagu berikutnya di antrean.
        if (queue.tracks.data.length === 0 && !queue.currentTrack) {
            // Jika antrean kosong setelah lagu saat ini, anggap tidak ada yang bisa dilewati
            return message.reply('Tidak ada lagu berikutnya di antrean untuk dilewati.');
        }

        // --- 2. Melewati Lagu ---
        try {
            const currentTrack = queue.currentTrack; // Simpan lagu saat ini sebelum dilewati

            // Lewati lagu yang sedang diputar.
            // Metode `skip()` akan memainkan lagu berikutnya di antrean jika ada.
            const skipped = queue.skip();

            if (skipped) {
                await message.reply(`⏭️ Berhasil melewati **${currentTrack.title}**.`);
                logger.info(`Skipped "${currentTrack.title}" in guild ${message.guild.name} by ${message.author.tag}.`);

                // Opsional: Jika Anda ingin memberitahu lagu berikutnya yang akan diputar
                if (queue.currentTrack) {
                    await message.channel.send(`🎵 Sekarang memutar: **${queue.currentTrack.title}**`);
                } else {
                    await message.channel.send('Antrean kosong. Bot akan meninggalkan saluran suara.');
                }
            } else {
                await message.reply('Gagal melewati lagu. Mungkin antrean sudah kosong atau ada masalah.');
                logger.warn(`Failed to skip music in guild ${message.guild.name}.`);
            }

        } catch (error) {
            // Tangani error jika terjadi masalah saat melewati lagu.
            logger.error(`Error skipping music in guild ${message.guild.name}:`, error);
            await message.reply('Terjadi kesalahan saat melewati lagu.');
        }
    },
};