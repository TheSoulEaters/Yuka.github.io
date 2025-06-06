// src/events/client/ready.js

const { Events } = require('discord.js');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Nama event yang akan didengarkan. 'Events.ClientReady' berarti bot sudah siap.
    name: Events.ClientReady,
    // Properti 'once: true' menandakan bahwa event ini hanya akan dijalankan satu kali.
    once: true,

    /**
     * Fungsi yang akan dieksekusi saat bot berhasil online dan siap.
     * @param {import('discord.js').Client} client - Objek klien Discord bot Anda.
     */
    execute(client) {
        // Catat ke log bahwa bot telah berhasil login dan online.
        logger.info(`Bot ${client.user.tag} is online and ready!`);
        logger.info(`Bot is serving ${client.guilds.cache.size} guilds.`);

        // Mengatur status aktivitas bot
        // Anda bisa mengubahnya menjadi:
        // - Playing: client.user.setActivity('dengan API Discord', { type: ActivityType.Playing });
        // - Streaming: client.user.setActivity('live di Twitch', { type: ActivityType.Streaming, url: 'URL_TWITCH_ANDA' });
        // - Listening: client.user.setActivity('lagu', { type: ActivityType.Listening });
        // - Watching: client.user.setActivity('film', { type: ActivityType.Watching });
        // - Custom: client.user.setActivity('...', { type: ActivityType.Custom });
        // ActivityType perlu diimpor: const { Events, ActivityType } = require('discord.js');
        // Contoh:
        // client.user.setActivity('dengan user', { type: ActivityType.Playing });

        // Contoh status yang lebih dinamis (jika Anda ingin)
        // const activities = [
        //     `di ${client.guilds.cache.size} servers`,
        //     `dengan ${client.users.cache.size} pengguna`, // Hati-hati dengan jumlah pengguna besar tanpa intents yang tepat
        //     `perintah /help`
        // ];
        // let i = 0;
        // setInterval(() => {
        //     client.user.setActivity(activities[i++ % activities.length], { type: ActivityType.Watching });
        // }, 15000); // Ganti status setiap 15 detik


        // Anda bisa menambahkan logika lain yang perlu dijalankan saat bot pertama kali online.
        // Contoh:
        // - Mendaftarkan perintah slash secara global (jika tidak menggunakan deploy-commands.js terpisah)
        // - Memeriksa status database
        // - Mengirim pesan startup ke saluran log khusus
    },
};