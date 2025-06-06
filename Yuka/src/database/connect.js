// src/database/connect.js

const mongoose = require('mongoose'); // Impor pustaka Mongoose
const logger = require('../utils/logger'); // Impor modul logger Anda

/**
 * Fungsi untuk menghubungkan bot ke database MongoDB.
 * Mengambil MongoDB URI dari variabel lingkungan (.env).
 */
module.exports = async () => {
    // Ambil MongoDB URI dari variabel lingkungan (process.env.MONGO_URI).
    const mongoUri = process.env.MONGO_URI;

    // Periksa apakah MONGO_URI telah diatur di file .env.
    if (!mongoUri) {
        logger.error('MONGO_URI is not defined in the .env file. Database connection skipped.');
        logger.warn('To enable database features, please add MONGO_URI to your .env file.');
        return; // Berhenti jika URI tidak ada
    }

    try {
        // Coba untuk terhubung ke MongoDB menggunakan Mongoose.
        // Opsi koneksi di sini adalah rekomendasi umum.
        await mongoose.connect(mongoUri, {
            // useNewUrlParser: true,     // Tidak lagi diperlukan di Mongoose 6.0+
            // useUnifiedTopology: true,  // Tidak lagi diperlukan di Mongoose 6.0+
            // useFindAndModify: false,   // Tidak lagi diperlukan di Mongoose 6.0+
            // useCreateIndex: true,      // Tidak lagi diperlukan di Mongoose 6.0+
        });

        logger.info('Successfully connected to MongoDB!');

        // Anda bisa menambahkan listener untuk event koneksi Mongoose di sini
        mongoose.connection.on('error', err => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
            // Anda bisa menambahkan logika rekoneksi otomatis di sini jika diperlukan
            // Atau cukup biarkan driver Mongoose menanganinya
        });

    } catch (error) {
        // Tangani error jika koneksi database gagal.
        logger.error('Could not connect to MongoDB:', error.message);
        logger.error('Please check your MONGO_URI in the .env file and MongoDB server status.');
    }
};