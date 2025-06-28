const { EmbedBuilder, inlineCode, bold } = require("discord.js");
const config = require("../config.js");
const { getEmoji } = require("../utils/functions");
const logger = require("../utils/logger");

module.exports = {
    name: "cihaz",
    description: "Sunucuda belirlenen kişinin discorda girdiği platformu gösterir. (Sadece sahipler).",
    /**
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    execute: async (client, message, args) => {
        try {
            if (!config.Client.Developers.includes(message.author.id)) {
                return message.reply(`${getEmoji(message.guild, "gutsv_x_mark")} Bu komutu kullanmaya yetkiniz bulunmuyor.`);
            }

            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
            if (!member) {
                return message.reply(`${getEmoji(message.guild, "gutsv_x_mark")} Geçerli bir kullanıcı belirtilmedi.`);
            }

            if (member.user.bot) {
                return message.reply(`${getEmoji(message.guild, "gutsv_x_mark")} Botların cihaz bilgisi görüntülenemez.`);
            }

            if (!member.presence || member.presence.status === "offline") {
                return message.reply(`${getEmoji(message.guild, "gutsv_x_mark")} ${member} şu anda çevrimdışı.`);
            }

            const clientStatus = member.presence.clientStatus;
            if (!clientStatus || Object.keys(clientStatus).length === 0) {
                return message.reply(`${getEmoji(message.guild, "gutsv_x_mark")} ${member} için cihaz bilgisi bulunamadı.`);
            }

            const DEVICE_TYPES = {
                desktop: "Masaüstü Uygulaması",
                mobile: "Mobil Cihaz",
                web: "İnternet Tarayıcısı",
            };

            const STATUS_TYPES = {
                online: "Çevrim içi",
                dnd: "Rahatsız etmeyin",
                idle: "Boşta",
                offline: "Çevrimdışı",
            };

            const deviceList = Object.entries(clientStatus)
                .map(([device, status]) => {
                    const deviceName = DEVICE_TYPES[device] || device;
                    const statusName = STATUS_TYPES[status] || status;
                    return `${inlineCode("•")} ${deviceName} (${statusName})`;
                })
                .join("\n");

            const embed = new EmbedBuilder()
                .setColor(config.Client.GuildEmbedColor)
                .setAuthor({
                    name: `${member.displayName} (${member.user.id})`,
                    iconURL: member.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription([`${member} üyesinin şu anki cihazları;`, deviceList].join("\n\n"));

            message.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(
                {
                    error: {
                        stack: error.stack,
                    },
                },
                "Cihaz Komutu"
            );
            await message.reply(`${getEmoji(message.guild, "gutsv_x_mark")} Cihaz bilgisi alınırken bir hata oluştu.`);
        }
    },
};
