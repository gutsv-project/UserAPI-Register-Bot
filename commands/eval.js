const { codeBlock, EmbedBuilder } = require("discord.js");
const config = require("../config.js");
const { getEmoji } = require("../utils/functions");
const logger = require("../utils/logger");

module.exports = {
    name: "eval",
    description: "eval.",
    /**
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    execute: async (client, message, args) => {
        if (!config.Client.Developers.includes(message.author.id)) {
            return message.reply(`${getEmoji(message.guild, "gutsv_x_mark")} Bu komutu kullanmaya yetkiniz bulunmuyor.`);
        }

        const code = args.join(" ");
        if (!code) {
            return message.reply(`${getEmoji(message.guild, "gutsv_x_mark")} Lütfen çalıştırmak istediğiniz kodu yazın.`);
        }

        try {
            const start = process.hrtime();
            let evaled = await eval(code);
            const diff = process.hrtime(start);
            const time = diff[0] * 1000 + diff[1] / 1000000;

            if (typeof evaled !== "string") {
                evaled = require("util").inspect(evaled, { depth: 0 });
            }

            evaled = evaled.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));

            if (evaled.length > 1990) {
                evaled = evaled.substring(0, 1990) + "...";
            }

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .addFields(
                    { name: "📥 Girdi", value: codeBlock("js", code) },
                    { name: "📤 Çıktı", value: codeBlock("js", evaled) },
                    { name: "⏱️ Süre", value: `${time.toFixed(2)}ms` }
                )
                .setTimestamp()
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

            await message.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(
                {
                    error: {
                        stack: error.stack,
                    },
                },
                "Eval Komutu"
            );

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setDescription(error.message)
                .addFields(
                    { name: "📥 Girdi", value: codeBlock("js", code) },
                    { name: "❌ Hata", value: codeBlock("js", error.message) }
                )
                .setTimestamp()
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

            await message.reply({ embeds: [embed] });
        }
    },
};
