const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const cloudscraper = require('cloudscraper');
const config = require("../config.js");

module.exports = {
    name: "kontrol",
    description: "Kullanıcıyı GutsV API ile kontrol eder.",
    data: new SlashCommandBuilder()
        .setName('kontrol')
        .setDescription('Kullanıcıyı GutsV API ile kontrol eder.')
        .addUserOption(option => 
            option.setName('kullanici')
            .setDescription('Kontrol edilecek kullanıcı')
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    execute: async (client, message, args) => {
        try {
            let userId;
            let userObj;
            if (message.options) {
                userObj = message.options.getUser('kullanici');
                userId = userObj.id;
            } else {
                userObj = message.mentions.users.first() || null;
                userId = userObj?.id || args[0];
            }

            if (!userId) {
                return message.reply({ content: `${config.Client.Emojis.Iptal} Geçerli bir kullanıcı belirtilmedi.`, flags: 64 });
            }

            const response = await cloudscraper.get(`https://api.gutsv.xyz/api/users/${userId}`);
            const data = JSON.parse(response);

            if (!data || data.status !== 'success') {
                return message.reply({ content: `${config.Client.Emojis.Iptal} Kullanıcı bulunamadı veya API hatası.`, flags: 64 });
            }

            const username = userObj ? `${userObj.tag} (${userObj.id})` : `${data.username || 'Bilinmiyor'} (${data.id})`;
            const avatarURL = userObj ? userObj.displayAvatarURL({ dynamic: true }) : (data.avatar ? (data.avatar.startsWith('http') ? data.avatar : `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`) : null);
            const durum = data.status || 'Yok';
            const gutsvUsername = data.username || 'Yok';
            const gutsvIsim = data.base?.topName || 'Yok';
            const gutsvYas = data.base?.topAge || 'Yok';
            const gutsvCinsiyet = data.base?.gender || 'Yok';
            const serverList = data.guilds?.length
                ? data.guilds.map((g) => `• ${g.serverName}: \`${g.displayName}\``).join("\n")
                : "Yok";

            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle("Kullanıcı Kontrol Sonucu")
                .setThumbnail(avatarURL)
                .addFields(
                    { name: "👤 Kullanıcı", value: username, inline: false },
                    { name: "📊 Durum", value: durum, inline: true },
                    { name: "🆔 GutsV Username", value: gutsvUsername, inline: true },
                    { name: "📝 GutsV İsim", value: gutsvIsim, inline: true },
                    { name: "🎂 GutsV Yaş", value: String(gutsvYas), inline: true },
                    { name: "⚧️ GutsV Cinsiyet", value: gutsvCinsiyet, inline: true },
                    { name: `🏠 Sunuculardaki İsimleri (${data.guilds ? data.guilds.length : 0})`, value: serverList, inline: false }
                )
                .setFooter({ text: `GutsV API • bugün saat ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` });

            await message.reply({ embeds: [embed], flags: 64 });

            const logChannel = message.guild.channels.cache.get(config.Guild.Channels.registerLog);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setDescription(
                        `**GutsV Kontrol Gerçekleşti**\n\n• **Kontrol Eden:** ${message.member || message.user} (\`${message.member?.id || message.user.id}\`)\n• **Kontrol Edilen:** <@${userId}> (\`${userId}\`)\n• **Kullanıcı Adı:** ${data.username || 'Bilinmiyor'}\n• **Durum:** ${data.status || 'Bilinmiyor'}`
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        } catch (error) {
            console.error("Kontrol Error:", error);
            const errorMessage = error.message || "Bilinmeyen hata";
            const shortError = errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage;
            await message.reply({ content: `${config.Client.Emojis.Iptal} Kontrol sırasında hata oluştu: ${shortError}`, flags: 64 });
        }
    },
}; 