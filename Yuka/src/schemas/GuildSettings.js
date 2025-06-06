// src/schemas/GuildSettings.js (Contoh menggunakan Mongoose)
const { Schema, model } = require('mongoose');

const guildSettingsSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    // ID channel untuk pesan selamat datang
    welcomeChannelId: {
        type: String,
        default: null, // Default null, artinya tidak diatur
    },
    // ID channel untuk pesan selamat tinggal
    goodbyeChannelId: {
        type: String,
        default: null,
    },
    // Anda bisa tambahkan pengaturan lain di sini
    // prefix: {
    //     type: String,
    //     default: '!',
    // },
});

module.exports = model('GuildSettings', guildSettingsSchema);