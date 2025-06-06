// src/events/guild/guildMemberAdd.js
const { Events, EmbedBuilder } = require('discord.js');
const GuildSettings = require('../../schemas/GuildSettings'); // Opsional: Jika menggunakan database
const logger = require('../../utils/logger'); // Import logger Anda

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        logger.info(`Member joined: ${member.user.tag} (${member.user.id}) in guild ${member.guild.name} (${member.guild.id})`);

        // Anda bisa mengambil pengaturan dari database jika Anda menyimpannya di sana
        // Contoh: Ambil channel ID dari pengaturan guild
        let guildSettings;
        try {
            guildSettings = await GuildSettings.findOne({ guildId: member.guild.id });
        } catch (error) {
            logger.error(`Error fetching guild settings for ${member.guild.name}:`, error);
        }

        const welcomeChannelId = guildSettings?.welcomeChannelId || null; // Dapatkan ID channel dari DB atau atur default

        // Jika tidak ada channel ID yang ditentukan atau channel tidak ditemukan
        if (!welcomeChannelId) {
            // Coba temukan channel default (misalnya 'general' atau channel pertama yang bisa diakses)
            const defaultChannel = member.guild.channels.cache.find(
                channel => channel.type === 0 && // Text channel
                           channel.permissionsFor(member.guild.members.me).has('SendMessages') // Bot bisa kirim pesan
            );

            if (!defaultChannel) {
                logger.warn(`No welcome channel set and no suitable default channel found in guild ${member.guild.name}.`);
                return; // Berhenti jika tidak ada channel
            }
            logger.info(`Using default channel #${defaultChannel.name} for welcome message in guild ${member.guild.name}.`);
            await sendWelcomeMessage(defaultChannel, member);
            return;
        }

        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

        if (!welcomeChannel) {
            logger.warn(`Configured welcome channel ID ${welcomeChannelId} not found or inaccessible in guild ${member.guild.name}.`);
            // Opsional: Coba kirim ke channel default jika channel yang dikonfigurasi tidak ada
            const defaultChannel = member.guild.channels.cache.find(
                channel => channel.type === 0 &&
                           channel.permissionsFor(member.guild.members.me).has('SendMessages')
            );
            if (defaultChannel) {
                logger.info(`Attempting to send welcome message to default channel #${defaultChannel.name} in guild ${member.guild.name}.`);
                await sendWelcomeMessage(defaultChannel, member);
            }
            return;
        }

        // Pastikan bot memiliki izin untuk mengirim pesan di channel ini
        if (!welcomeChannel.permissionsFor(member.guild.members.me).has('SendMessages')) {
            logger.error(`Bot does not have permission to send messages in welcome channel ${welcomeChannel.name} (${welcomeChannel.id}) in guild ${member.guild.name}.`);
            return;
        }

        await sendWelcomeMessage(welcomeChannel, member);
    },
};

async function sendWelcomeMessage(channel, member) {
    try {
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00ff00') // Hijau
            .setTitle('👋 Selamat Datang!')
            .setDescription(`Halo ${member}! Selamat datang di **${member.guild.name}**!\nKami harap kamu menikmati waktumu di sini.`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Anggota Sekarang', value: `${member.guild.memberCount} orang`, inline: true },
                { name: 'Akun Dibuat', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `ID Pengguna: ${member.user.id}` })
            .setTimestamp();

        await channel.send({ content: `Selamat datang, ${member}!`, embeds: [welcomeEmbed] });
        logger.info(`Sent welcome message for ${member.user.tag} in #${channel.name}.`);
    } catch (error) {
        logger.error(`Failed to send welcome message for ${member.user.tag} in #${channel.name}:`, error);
    }
}