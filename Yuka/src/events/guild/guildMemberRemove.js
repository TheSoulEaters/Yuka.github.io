// src/events/guild/guildMemberRemove.js
const { Events, EmbedBuilder } = require('discord.js');
const GuildSettings = require('../../schemas/GuildSettings'); // Opsional: Jika menggunakan database
const logger = require('../../utils/logger'); // Import logger Anda

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        logger.info(`Member left: ${member.user.tag} (${member.user.id}) from guild ${member.guild.name} (${member.guild.id})`);

        // Anda bisa mengambil pengaturan dari database jika Anda menyimpannya di sana
        let guildSettings;
        try {
            guildSettings = await GuildSettings.findOne({ guildId: member.guild.id });
        } catch (error) {
            logger.error(`Error fetching guild settings for ${member.guild.name}:`, error);
        }

        const goodbyeChannelId = guildSettings?.goodbyeChannelId || null; // Dapatkan ID channel dari DB

        // Jika tidak ada channel ID yang ditentukan atau channel tidak ditemukan
        if (!goodbyeChannelId) {
            const defaultChannel = member.guild.channels.cache.find(
                channel => channel.type === 0 &&
                           channel.permissionsFor(member.guild.members.me).has('SendMessages')
            );
            if (!defaultChannel) {
                logger.warn(`No goodbye channel set and no suitable default channel found in guild ${member.guild.name}.`);
                return;
            }
            logger.info(`Using default channel #${defaultChannel.name} for goodbye message in guild ${member.guild.name}.`);
            await sendGoodbyeMessage(defaultChannel, member);
            return;
        }

        const goodbyeChannel = member.guild.channels.cache.get(goodbyeChannelId);

        if (!goodbyeChannel) {
            logger.warn(`Configured goodbye channel ID ${goodbyeChannelId} not found or inaccessible in guild ${member.guild.name}.`);
            const defaultChannel = member.guild.channels.cache.find(
                channel => channel.type === 0 &&
                           channel.permissionsFor(member.guild.members.me).has('SendMessages')
            );
            if (defaultChannel) {
                logger.info(`Attempting to send goodbye message to default channel #${defaultChannel.name} in guild ${member.guild.name}.`);
                await sendGoodbyeMessage(defaultChannel, member);
            }
            return;
        }

        // Pastikan bot memiliki izin untuk mengirim pesan di channel ini
        if (!goodbyeChannel.permissionsFor(member.guild.members.me).has('SendMessages')) {
            logger.error(`Bot does not have permission to send messages in goodbye channel ${goodbyeChannel.name} (${goodbyeChannel.id}) in guild ${member.guild.name}.`);
            return;
        }

        await sendGoodbyeMessage(goodbyeChannel, member);
    },
};

async function sendGoodbyeMessage(channel, member) {
    try {
        const goodbyeEmbed = new EmbedBuilder()
            .setColor('#ff0000') // Merah
            .setTitle('👋 Sampai Jumpa!')
            .setDescription(`**${member.user.tag}** telah meninggalkan **${member.guild.name}**.\nKami akan merindukannya!`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Anggota Tersisa', value: `${member.guild.memberCount} orang`, inline: true }
            )
            .setFooter({ text: `ID Pengguna: ${member.user.id}` })
            .setTimestamp();

        await channel.send({ embeds: [goodbyeEmbed] });
        logger.info(`Sent goodbye message for ${member.user.tag} in #${channel.name}.`);
    } catch (error) {
        logger.error(`Failed to send goodbye message for ${member.user.tag} in #${channel.name}:`, error);
    }
}