const { bold } = require("discord.js");
const config = require("../config.js");
const { getEmoji } = require("../utils/functions");
const logger = require("../utils/logger");

module.exports = {
    name: "sil",
    description: "Sunucu içerisi sohbet temizlenize yarar. (Sadece sahipler).",
    /**
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    execute: async (client, message, args) => {
        if (!config.Client.Developers.includes(message.author.id)) {
            return message.channel.send(`${getEmoji(message.guild, "gutsv_x_mark")} Bu komutu kullanmaya yetkiniz bulunmuyor.`);
        }

        const logChannel = client.channels.cache.get(config.Guild.logChannelId);

        try {
            const targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if (targetMember) {
                const limit = parseInt(args[1], 10) || 100;
                if (isNaN(limit) || limit < 1 || limit > 100) {
                    return message.channel.send(
                        `${getEmoji(message.guild, "gutsv_x_mark")} Lütfen ${bold("1-100")} arasında bir sayı belirtin.`
                    );
                }

                const messages = await message.channel.messages.fetch({ limit: 100 });
                const userMessages = messages.filter((m) => m.author.id === targetMember.id && !m.pinned).first(limit);

                if (userMessages.length === 0) {
                    return message.channel.send(
                        `${getEmoji(message.guild, "gutsv_x_mark")} Belirtilen kullanıcıya ait silinebilir mesaj bulunamadı.`
                    );
                }

                await message.channel.bulkDelete(userMessages, true);
                await message.channel.send(
                    `Başarıyla <#${message.channel.id}> (\`${message.channel.id}\`) adlı kanalda ${targetMember} (\`${targetMember.id}\`) kişisine ait (**${userMessages.length}**) adet mesaj silindi!`
                );

                if (logChannel) {
                    await logChannel.send(
                        `${message.author} (\`${message.author.id}\`) tarafından ${targetMember} (\`${targetMember.id}\`) kişisine ait mesajlar silindi!`
                    );
                }
                return;
            }

            const amount = parseInt(args[0], 10);
            if (isNaN(amount) || amount < 1 || amount > 100) {
                return message.channel.send(
                    `${getEmoji(message.guild, "gutsv_x_mark")} Lütfen ${bold("1-100")} arasında bir sayı belirtin.`
                );
            }

            const deletedMessages = await message.channel.bulkDelete(amount, true);
            await message.channel.send(
                `Başarıyla <#${message.channel.id}> (\`${message.channel.id}\`) adlı kanalda (**${deletedMessages.size}**) adet mesaj silindi!`
            );

            if (logChannel) {
                await logChannel.send(
                    `${message.author} (\`${message.author.id}\`) tarafından <#${message.channel.id}> (\`${message.channel.id}\`) adlı kanalda (**${amount}**) adet mesaj silindi!`
                );
            }
        } catch (error) {
            logger.error(
                {
                    error: {
                        stack: error.stack,
                    },
                },
                "Sil Komutu"
            );

            if (error.code === 10008) {
                return message.channel.send(`${getEmoji(message.guild, "gutsv_x_mark")} Silinecek mesaj bulunamadı.`);
            }

            if (error.code === 50034) {
                return message.channel.send(`${getEmoji(message.guild, "gutsv_x_mark")} 14 günden eski mesajlar silinemez.`);
            }

            await message.channel.send(`${getEmoji(message.guild, "gutsv_x_mark")} Mesajları silerken bir hata oluştu.`);
        }
    },
};
