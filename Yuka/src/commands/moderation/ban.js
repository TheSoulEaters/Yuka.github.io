// src/commands/moderation/ban.js

const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Definisi perintah slash menggunakan SlashCommandBuilder
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Memblokir anggota dari server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Anggota yang ingin diblokir.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Alasan memblokir anggota.')
                .setRequired(false)) // Alasan tidak wajib
        .addIntegerOption(option =>
            option.setName('deletemessages')
                .setDescription('Jumlah hari pesan target akan dihapus (0-7 hari).')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)), // Opsi penghapusan pesan tidak wajib

    /**
     * Fungsi yang akan dieksekusi saat perintah /ban digunakan.
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - Objek interaksi perintah slash.
     */
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'Tidak ada alasan yang diberikan.';
        const deleteMessagesDays = interaction.options.getInteger('deletemessages') || 0;
        const member = interaction.guild.members.cache.get(target.id); // Dapatkan objek GuildMember dari User

        // --- 1. Validasi Izin ---
        // Periksa apakah pengguna yang menjalankan perintah memiliki izin 'BanMembers'.
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({
                content: '❌ Anda tidak memiliki izin untuk memblokir anggota.',
                ephemeral: true
            });
        }

        // Periksa apakah bot memiliki izin 'BanMembers'.
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({
                content: '❌ Saya tidak memiliki izin untuk memblokir anggota. Pastikan saya memiliki peran dengan izin "Blokir Anggota".',
                ephemeral: true
            });
        }

        // Periksa apakah target adalah anggota guild dan dapat diblokir.
        if (member && !member.bannable) {
            return interaction.reply({
                content: `❌ Saya tidak bisa memblokir **${target.tag}**. Mungkin peran mereka lebih tinggi atau sama dengan peran saya.`,
                ephemeral: true
            });
        }

        // Periksa apakah pengguna tidak mencoba memblokir dirinya sendiri.
        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Anda tidak bisa memblokir diri sendiri!',
                ephemeral: true
            });
        }

        // --- 2. Eksekusi Ban ---
        try {
            // Memblokir pengguna dari guild.
            // options.deleteMessageSeconds adalah dalam detik, jadi kita kalikan hari dengan 86400 (detik dalam sehari).
            await interaction.guild.members.ban(target.id, {
                reason: reason,
                deleteMessageSeconds: deleteMessagesDays * 86400
            });

            const banEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Warna Merah
                .setTitle('🚫 Anggota Diblokir')
                .setDescription(`**${target.tag}** telah diblokir dari server.`)
                .addFields(
                    { name: 'Oleh', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Alasan', value: reason, inline: true },
                    { name: 'Pesan Dihapus', value: `${deleteMessagesDays} hari`, inline: true }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `ID Pengguna: ${target.id}` })
                .setTimestamp();

            await interaction.reply({ embeds: [banEmbed] });
            logger.info(`Banned ${target.tag} (${target.id}) from guild ${interaction.guild.name} by ${interaction.user.tag}. Reason: ${reason}. Messages deleted: ${deleteMessagesDays} days.`);

        } catch (error) {
            logger.error(`Error banning ${target.tag} in guild ${interaction.guild.name}:`, error);
            await interaction.reply({
                content: 'Terjadi kesalahan saat mencoba memblokir anggota ini.',
                ephemeral: true
            });
        }
    },
};