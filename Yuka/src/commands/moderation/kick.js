// src/commands/moderation/kick.js

const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Definisi perintah slash menggunakan SlashCommandBuilder
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Mengeluarkan anggota dari server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Anggota yang ingin dikeluarkan.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Alasan mengeluarkan anggota.')
                .setRequired(false)), // Alasan tidak wajib

    /**
     * Fungsi yang akan dieksekusi saat perintah /kick digunakan.
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - Objek interaksi perintah slash.
     */
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'Tidak ada alasan yang diberikan.';
        const member = interaction.guild.members.cache.get(target.id); // Dapatkan objek GuildMember dari User

        // --- 1. Validasi Izin ---
        // Periksa apakah pengguna yang menjalankan perintah memiliki izin 'KickMembers'.
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({
                content: '❌ Anda tidak memiliki izin untuk mengeluarkan anggota.',
                ephemeral: true
            });
        }

        // Periksa apakah bot memiliki izin 'KickMembers'.
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({
                content: '❌ Saya tidak memiliki izin untuk mengeluarkan anggota. Pastikan saya memiliki peran dengan izin "Tendang Anggota".',
                ephemeral: true
            });
        }

        // Periksa apakah target adalah anggota guild dan dapat dikeluarkan.
        if (!member) {
            return interaction.reply({
                content: '❌ Anggota tersebut tidak ditemukan di server ini.',
                ephemeral: true
            });
        }

        // Periksa apakah bot dapat mengeluarkan anggota tersebut (hierarki peran).
        if (!member.kickable) {
            return interaction.reply({
                content: `❌ Saya tidak bisa mengeluarkan **${target.tag}**. Mungkin peran mereka lebih tinggi atau sama dengan peran saya.`,
                ephemeral: true
            });
        }

        // Periksa apakah pengguna tidak mencoba mengeluarkan dirinya sendiri.
        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Anda tidak bisa mengeluarkan diri sendiri!',
                ephemeral: true
            });
        }

        // --- 2. Konfirmasi (Opsional, tapi Bagus) ---
        // Anda bisa menambahkan konfirmasi di sini sebelum kick dilakukan.
        // Contoh: Membuat tombol konfirmasi. Untuk kesederhanaan, kita langsung kick.

        // --- 3. Eksekusi Kick ---
        try {
            await member.kick(reason);

            const kickEmbed = new EmbedBuilder()
                .setColor('#FFA500') // Warna Oranye
                .setTitle('👋 Anggota Dikeluarkan')
                .setDescription(`**${target.tag}** telah dikeluarkan dari server.`)
                .addFields(
                    { name: 'Oleh', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Alasan', value: reason, inline: true }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `ID Pengguna: ${target.id}` })
                .setTimestamp();

            await interaction.reply({ embeds: [kickEmbed] });
            logger.info(`Kicked ${target.tag} (${target.id}) from guild ${interaction.guild.name} by ${interaction.user.tag}. Reason: ${reason}`);

        } catch (error) {
            logger.error(`Error kicking ${target.tag} in guild ${interaction.guild.name}:`, error);
            await interaction.reply({
                content: 'Terjadi kesalahan saat mencoba mengeluarkan anggota ini.',
                ephemeral: true
            });
        }
    },
};