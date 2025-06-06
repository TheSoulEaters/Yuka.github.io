// src/commands/music/play.js

// Impor pustaka yang diperlukan dari discord.js dan discord-player.
// 'EmbedBuilder' digunakan untuk membuat pesan yang menarik.
const { EmbedBuilder } = require('discord.js');
const { QueryType, useMainPlayer } = require('discord-player');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Nama perintah yang akan digunakan pengguna (misalnya, !play).
    name: 'play',
    // Deskripsi singkat tentang fungsi perintah.
    description: 'Memutar musik dari YouTube, Spotify, SoundCloud, atau sumber lainnya.',
    // Penggunaan perintah (penting untuk perintah !help).
    usage: '!play <URL atau nama lagu>',

    /**
     * Fungsi yang akan dieksekusi saat perintah !play digunakan.
     * @param {import('discord.js').Message} message - Objek pesan yang memicu perintah.
     * @param {string[]} args - Argumen setelah nama perintah (URL atau nama lagu).
     */
    async execute(message, args) {
        // --- 1. Validasi Input Pengguna ---
        if (!args.length) {
            return message.reply('❌ Anda harus memberikan URL atau nama lagu untuk diputar!');
        }

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('Anda harus berada di saluran suara untuk memutar musik!');
        }

        // --- 2. Validasi Izin Bot ---
        // Periksa izin bot di saluran suara.
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return message.reply('Saya tidak memiliki izin untuk bergabung atau berbicara di saluran suara ini!');
        }

        // --- 3. Mengambil Instance Player ---
        const player = useMainPlayer(); // Mengakses instance utama discord-player.

        // --- 4. Memutar atau Menambahkan Lagu ke Antrean ---
        try {
            const query = args.join(' '); // Gabungkan argumen menjadi satu string query.

            // Cari lagu berdasarkan query (URL atau nama lagu).
            // QueryType.AUTO akan mencoba mendeteksi sumber secara otomatis (YouTube, Spotify, dll.).
            const result = await player.search(query, {
                requestedBy: message.author, // Mencatat siapa yang meminta lagu.
                queryType: QueryType.AUTO
            });

            if (!result || !result.tracks.length) {
                return message.reply('Tidak ada hasil yang ditemukan untuk pencarian Anda.');
            }

            // Dapatkan lagu pertama dari hasil pencarian.
            const track = result.tracks[0];

            // Putar lagu atau tambahkan ke antrean.
            // discord-player akan otomatis bergabung ke voiceChannel jika belum ada.
            await player.play(voiceChannel, track, {
                nodeOptions: {
                    metadata: message,       // Mengirim objek pesan sebagai metadata (berguna untuk event player).
                    leaveOnEmpty: true,      // Bot meninggalkan saluran suara jika tidak ada yang mendengar.
                    leaveOnStop: true,       // Bot meninggalkan saluran suara saat dihentikan.
                    leaveOnEnd: true,        // Bot meninggalkan saluran suara setelah antrean habis.
                }
            });

            // --- 5. Konfirmasi ke Pengguna ---
            const playEmbed = new EmbedBuilder()
                .setColor('#00ff00') // Warna hijau
                .setTitle('🎵 Sedang Memutar Musik')
                .setDescription(`[${track.title}](${track.url})`)
                .addFields(
                    { name: 'Oleh', value: track.author, inline: true },
                    { name: 'Durasi', value: track.duration, inline: true },
                    { name: 'Diminta Oleh', value: `${message.author}`, inline: true }
                )
                .setThumbnail(track.thumbnail)
                .setFooter({ text: `Antrean: ${player.queues.get(message.guild.id).tracks.size} lagu berikutnya` });

            await message.channel.send({ embeds: [playEmbed] });
            logger.info(`Playing: "${track.title}" in guild ${message.guild.name} by ${message.author.tag}`);

        } catch (error) {
            // Tangani error jika terjadi masalah saat memutar musik.
            logger.error(`Error playing music in guild ${message.guild.name}:`, error);
            await message.reply('Terjadi kesalahan saat memutar musik. Pastikan URL valid atau coba nama lagu yang berbeda.');
        }
    },
};