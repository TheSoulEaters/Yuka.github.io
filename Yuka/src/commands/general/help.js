// src/commands/general/help.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger'); // Impor logger Anda

module.exports = {
    // Definisi perintah slash menggunakan SlashCommandBuilder
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Menampilkan semua perintah bot ini atau informasi tentang perintah tertentu.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Nama perintah yang ingin Anda ketahui lebih lanjut.')
                .setRequired(false)), // Tidak wajib, pengguna bisa hanya mengetik /help

    /**
     * Fungsi yang akan dieksekusi saat perintah help digunakan.
     * @param {import('discord.js').Interaction} interaction - Objek interaksi Discord.
     */
    async execute(interaction) {
        const commandName = interaction.options.getString('command');
        const { client } = interaction; // Mengakses klien bot dari interaksi

        // --- Jika pengguna meminta bantuan untuk perintah tertentu ---
        if (commandName) {
            // Cari perintah slash
            const slashCommand = client.commands.get(commandName.toLowerCase());
            // Cari perintah prefiks
            const prefixCommand = client.prefixCommands.get(commandName.toLowerCase());

            // Jika perintah tidak ditemukan
            if (!slashCommand && !prefixCommand) {
                return interaction.reply({
                    content: `Maaf, saya tidak dapat menemukan perintah dengan nama \`${commandName}\`.`,
                    ephemeral: true
                });
            }

            const commandEmbed = new EmbedBuilder()
                .setColor('#0099ff') // Warna biru
                .setTitle(`Bantuan untuk Perintah: /${commandName} atau !${commandName}`)
                .setFooter({ text: `Diminta oleh ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            if (slashCommand) {
                commandEmbed.addFields(
                    { name: 'Nama Perintah', value: `\`/${slashCommand.data.name}\``, inline: true },
                    { name: 'Deskripsi', value: slashCommand.data.description || 'Tidak ada deskripsi tersedia.', inline: true },
                );
                // Jika perintah slash memiliki opsi, tampilkan
                if (slashCommand.data.options && slashCommand.data.options.length > 0) {
                    const optionsDescription = slashCommand.data.options.map(option => {
                        const required = option.required ? ' (Wajib)' : '';
                        return `\`<${option.name}>\` - ${option.description}${required}`;
                    }).join('\n');
                    commandEmbed.addFields({ name: 'Opsi', value: optionsDescription });
                }
            } else if (prefixCommand) {
                commandEmbed.addFields(
                    { name: 'Nama Perintah', value: `\`!${prefixCommand.name}\``, inline: true },
                    { name: 'Deskripsi', value: prefixCommand.description || 'Tidak ada deskripsi tersedia.', inline: true },
                );
                if (prefixCommand.usage) {
                    commandEmbed.addFields({ name: 'Penggunaan', value: `\`${prefixCommand.usage}\`` });
                }
            }

            return interaction.reply({ embeds: [commandEmbed], ephemeral: true });
        }

        // --- Jika pengguna hanya mengetik /help (menampilkan semua perintah) ---
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Daftar Perintah Bot Anda')
            .setDescription('Gunakan `/help <nama_perintah>` untuk informasi lebih lanjut tentang perintah tertentu.')
            .setFooter({ text: `Diminta oleh ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        // Mengumpulkan perintah slash
        const slashCommandsField = client.commands
            .map(command => `\`/${command.data.name}\``)
            .sort()
            .join(', ');

        // Mengumpulkan perintah prefiks
        const prefixCommandsField = client.prefixCommands
            .map(command => `\`!${command.name}\``)
            .sort()
            .join(', ');

        if (slashCommandsField) {
            helpEmbed.addFields({ name: 'Perintah Slash (/)', value: slashCommandsField });
        }
        if (prefixCommandsField) {
            helpEmbed.addFields({ name: 'Perintah Musik (!)', value: prefixCommandsField });
        }

        if (!slashCommandsField && !prefixCommandsField) {
            helpEmbed.addFields({ name: 'Tidak Ada Perintah', value: 'Sepertinya belum ada perintah yang terdaftar.' });
        }

        logger.info(`Displayed help command for ${interaction.user.tag} in guild ${interaction.guild.name}.`);
        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    },
};