// src/events/message/messageCreate.js

const { Events } = require('discord.js');
const { prefix } = require('../../config'); // Ambil prefiks dari konfigurasi bot Anda
const { handleCommandError } = require('../../utils/errorHandler'); // Impor handler error
const logger = require('../../utils/logger'); // Impor modul logger

module.exports = {
    // Nama event yang akan didengarkan oleh Discord.js
    name: Events.MessageCreate,

    /**
     * Fungsi yang akan dieksekusi setiap kali ada pesan baru.
     * @param {import('discord.js').Message} message - Objek pesan yang baru dibuat.
     */
    async execute(message) {
        // --- 1. Filter Awal Pesan ---
        // Abaikan pesan dari bot lain untuk menghindari loop atau respons yang tidak perlu.
        if (message.author.bot) {
            return;
        }

        // Abaikan pesan yang bukan dari guild (server Discord), misalnya DM.
        // Hapus baris ini jika Anda ingin bot merespons perintah di DM.
        if (!message.guild) {
            return;
        }

        // Pastikan pesan dimulai dengan prefiks yang ditentukan dalam konfigurasi bot.
        if (!message.content.startsWith(prefix)) {
            return;
        }

        // --- 2. Parsing Perintah dan Argumen ---
        // Potong prefiks dari pesan, hapus spasi ekstra di awal/akhir, lalu pisahkan menjadi array.
        // Contoh: "!play despacito" menjadi ["play", "despacito"]
        const args = message.content.slice(prefix.length).trim().split(/ +/);

        // Ambil nama perintah (elemen pertama) dan ubah ke huruf kecil untuk konsistensi.
        // Contoh: "play" dari ["play", "despacito"]
        const commandName = args.shift().toLowerCase();

        // --- 3. Mencari Perintah ---
        // Cari perintah yang sesuai di koleksi 'prefixCommands' yang dimuat oleh client (di index.js).
        const command = message.client.prefixCommands.get(commandName);

        // Jika perintah tidak ditemukan dalam koleksi, abaikan pesan tersebut.
        if (!command) {
            return;
        }

        // --- 4. Eksekusi Perintah dan Penanganan Error ---
        try {
            // Jalankan fungsi 'execute' dari perintah yang ditemukan.
            // Objek 'message' dan array 'args' diteruskan sebagai parameter.
            await command.execute(message, args);

            // Catat ke log bahwa perintah prefiks berhasil dieksekusi.
            logger.info(`Executed prefix command: '${commandName}' by ${message.author.tag} in #${message.channel.name} (${message.guild.name})`);

        } catch (error) {
            // Tangani error yang terjadi selama eksekusi perintah.
            logger.error(`Error executing prefix command '${commandName}' by ${message.author.tag}:`, error);

            // Beri tahu pengguna bahwa ada masalah saat menjalankan perintah.
            // Menggunakan `ephemeral: true` jika balasan bersifat pribadi (hanya terlihat oleh pengguna).
            // Namun, untuk perintah prefiks, balasan publik lebih umum. Sesuaikan sesuai kebutuhan.
            await message.reply({ content: 'Maaf, terjadi kesalahan saat mencoba menjalankan perintah itu!' })
                            .catch(e => logger.error("Failed to send error reply in messageCreate catch block:", e));
        }
    },
};