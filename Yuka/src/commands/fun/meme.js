// src/commands/fun/meme.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Definisi perintah slash menggunakan SlashCommandBuilder
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Mengirimkan gambar meme acak.'),

    /**
     * Fungsi yang akan dieksekusi saat perintah /meme digunakan.
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - Objek interaksi perintah slash.
     */
    async execute(interaction) {
        // Balas interaksi segera dengan pesan "Memuat..." sementara bot mengambil meme.
        // Ini menghindari peringatan "interaction failed" dari Discord.
        await interaction.deferReply();

        try {
            // --- 1. Mengambil Data Meme dari API ---
            const response = await fetch('https://meme-api.com/gimme'); // Mengambil meme dari API Reddit
            const data = await response.json();

            // Periksa apakah API mengembalikan data yang valid dan gambar.
            if (!response.ok || !data || !data.url) {
                logger.error('Failed to fetch meme from API:', data);
                return interaction.editReply('Maaf, saya tidak bisa menemukan meme saat ini. Coba lagi nanti!');
            }

            const memeEmbed = new EmbedBuilder()
                .setColor('#FFD700') // Warna Emas
                .setTitle(data.title) // Judul meme dari API
                .setURL(data.postLink) // Link ke postingan Reddit asli
                .setImage(data.url) // URL gambar meme
                .setFooter({ text: `Subreddit: r/${data.subreddit} | Upvotes: ${data.ups}` })
                .setTimestamp();

            // --- 2. Mengirim Meme ke Channel ---
            await interaction.editReply({ embeds: [memeEmbed] });
            logger.info(`Sent meme by ${interaction.user.tag} in #${interaction.channel.name} (${interaction.guild.name}).`);

        } catch (error) {
            // Tangani error jika terjadi masalah saat mengambil atau mengirim meme.
            logger.error(`Error fetching or sending meme in guild ${interaction.guild.name}:`, error);
            await interaction.editReply('Terjadi kesalahan saat mencoba mengirim meme. Silakan coba lagi.');
        }
    },
};