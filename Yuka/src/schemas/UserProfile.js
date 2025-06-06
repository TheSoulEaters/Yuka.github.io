// src/schemas/UserProfile.js

const { Schema, model } = require('mongoose');

// Definisi skema untuk profil pengguna
const userProfileSchema = new Schema({
    // ID unik pengguna Discord (ID pengguna Discord itu sendiri)
    userId: {
        type: String,
        required: true,
        unique: true, // Setiap pengguna hanya memiliki satu profil
    },
    // Jumlah poin atau mata uang bot
    points: {
        type: Number,
        default: 0, // Nilai default ketika profil baru dibuat
    },
    // Level pengguna
    level: {
        type: Number,
        default: 1, // Pengguna dimulai dari level 1
    },
    // Jumlah XP (Experience Points) pengguna
    xp: {
        type: Number,
        default: 0,
    },
    // Contoh pengaturan pribadi pengguna
    // Misalnya, apakah pengguna ingin menerima DM notifikasi dari bot
    receiveDMs: {
        type: Boolean,
        default: true,
    },
    // Waktu terakhir pengguna melakukan sesuatu yang memberikan XP/poin
    // Berguna untuk cooldown XP/poin
    lastXpEarned: {
        type: Date,
        default: null,
    },
    // Anda bisa menambahkan properti lain sesuai kebutuhan bot Anda
    // Misalnya:
    // inventory: {
    //     type: Map, // Untuk menyimpan item dan jumlahnya (misal: { 'sword': 1, 'potion': 5 })
    //     of: Number,
    //     default: new Map(),
    // },
    // dailyStreak: {
    //     type: Number,
    //     default: 0,
    // },
    // lastDailyClaim: {
    //     type: Date,
    //     default: null,
    // },
}, {
    // Opsi Schema:
    // timestamps: true akan otomatis menambahkan createdAt dan updatedAt fields
    timestamps: true,
});

// Mengekspor model Mongoose berdasarkan skema ini
// 'UserProfile' akan menjadi nama koleksi di database Anda (plural: 'userprofiles')
module.exports = model('UserProfile', userProfileSchema);