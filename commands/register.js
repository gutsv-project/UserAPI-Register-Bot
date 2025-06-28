const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, inlineCode } = require("discord.js");
const fetch = require("node-fetch");
const config = require("./config.js");

module.exports = {
    name: "kayıt",
    description: "Sunucu içerisi kayıt yapmanızı sağlar.",
    aliases: ["e", "k", "erkek", "kadın", "man", "woman", "kız"],
    execute: async (client, message, args) => {
        try {
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

            if (
                !config.Guild.Roles.RegisterHammer.some((oku) => message.member.roles.cache.has(oku)) &&
                !config.Guild.Roles.Founding.some((oku) => message.member.roles.cache.has(oku)) &&
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
            ) {
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.NoAuth}` });
            }

            if (!member)
                return message.reply({
                    content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.Member} ${inlineCode(
                        `${config.Client.Prefixes[0]}kayıt <@Kullanıcı/ID> <Isim> <Yaş>`
                    )}`,
                });
            if (message.author.id === member.id)
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.ItSelf}` });
            if (member.user.bot) return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.Bot}` });
            if (!member.manageable) return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.NoYt}` });
            if (
                config.Guild.Roles.Man.some((x) => member.roles.cache.has(x)) ||
                config.Guild.Roles.Woman.some((x) => member.roles.cache.has(x))
            )
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.Registered}` });
            if (message.member.roles.highest.position <= member.roles.highest.position)
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.SAuth}` });

            if (
                config.Guild.Settings.tagMode &&
                !config.Guild.Settings.tags.some((a) => member.user.username.includes(a)) &&
                !member.roles.cache.has(config.Guild.Roles.Booster) &&
                !member.roles.cache.has(config.Guild.Roles.Vip) &&
                !member.roles.cache.has(config.Guild.Roles.Tag) &&
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
                !config.Guild.Roles.Founding.some((oku) => message.member.roles.cache.has(oku))
            ) {
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.TagMode}` });
            }
            if (
                (member.roles.cache.has(config.Guild.Roles.Suspect) ||
                    member.roles.cache.has(config.Guild.Roles.Jailed) ||
                    member.roles.cache.has(config.Guild.Roles.BannedTag)) &&
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
                !config.Guild.Roles.Founding.some((oku) => message.member.roles.cache.has(oku))
            ) {
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.PunUser}` });
            }

            args = args.filter((a) => a !== "" && a !== " ").splice(1);
            let name = args
                .filter((arg) => isNaN(arg))
                .map((arg) => arg.charAt(0).replace(/i/g, "İ").toUpperCase() + arg.slice(1))
                .join(" ");
            let age = args.filter((arg) => !isNaN(arg))[0];

            if (!name || !age) return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.NoName}` });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("buttonerkek").setLabel("Erkek").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("buttonkadın").setLabel("Kadın").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("buttoniptal").setLabel("İptal").setStyle(ButtonStyle.Danger)
            );

            let data = null;
            if (config.Api.useCheck) {
                try {
                    const res = await fetch(`${config.Api.url}${member.id}`);
                    if (res.ok) data = await res.json();
                } catch (error) {
                    console.error("API Error:", error);
                }
            }

            const baseEmbed = new EmbedBuilder()
                .setColor(config.Client.GuildEmbedColor)
                .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setFooter({
                    text: `İşlem 30 saniye içerisinde otomatik iptal edilecektir.`,
                    iconURL: message.member.displayAvatarURL({ dynamic: true }),
                });

            let msg;
            if (data?.base && (data.base.topName.toLowerCase() !== name.toLowerCase() || parseInt(data.base.topAge) != age)) {
                row.addComponents(
                    new ButtonBuilder().setCustomId("buttonveri").setLabel("Verileri Göster").setStyle(ButtonStyle.Secondary)
                );
                baseEmbed
                    .setColor("Red")
                    .setDescription(
                        `⚠️ Kullanıcının geçmiş verileri ile girilen bilgiler eşleşmiyor!\n\n• Girilen İsim: **${name}**, En Çok Kullandığı: **${data.base.topName}**\n• Girilen Yaş: **${age}**, En Çok Kullandığı: **${data.base.topAge}**\n\nLütfen aşağıdaki **Verileri Göster** butonuna tıklayarak bilgileri kontrol edin ve ardından kayıt işlemine devam edin.`
                    );
                msg = await message.channel.send({ embeds: [baseEmbed], components: [row] });
            } else {
                baseEmbed.setDescription(
                    `${member} (\`${member.id}\`) kullanıcısının kaydını tamamlamak için aşağıdaki butonları kullanın!`
                );
                msg = await message.channel.send({ embeds: [baseEmbed], components: [row] });
            }

            const collector = msg.createMessageComponentCollector({
                filter: (button) => button.user.id === message.author.id,
                time: 30000,
            });

            collector.on("collect", async (button) => {
                await button.deferUpdate();
                row.components.forEach((comp) => comp.setDisabled(true));

                if (button.customId === "buttonveri") {
                    const serverList = data.guilds?.length
                        ? data.guilds.map((g) => `• ${g.serverName}: \`${g.displayName}\``).join("\n")
                        : "Veri bulunamadı.";
                    await button.followUp({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Yellow")
                                .setDescription(
                                    `Aşağıda ${member} kullanıcısının diğer sunuculardaki isimleri listelenmektedir.\n\n${serverList}`
                                ),
                        ],
                        ephemeral: true,
                    });
                    row.components.forEach((comp) => comp.setDisabled(false));
                    row.components.find((c) => c.data.custom_id === "buttonveri").setDisabled(true);
                    await msg.edit({ components: [row] });
                    collector.resetTimer();
                    return;
                }

                collector.stop();

                if (button.customId === "buttonerkek") {
                    await msg.edit({
                        components: [row],
                        embeds: [
                            baseEmbed
                                .setColor("Green")
                                .setDescription(
                                    `${config.Client.Emojis.Onay} ${member} kullanıcısı başarıyla **ERKEK** olarak kayıt edildi!`
                                ),
                        ],
                    });
                    await registerHelper(member, message.member, name, age, "man", message);
                } else if (button.customId === "buttonkadın") {
                    await msg.edit({
                        components: [row],
                        embeds: [
                            baseEmbed
                                .setColor("Green")
                                .setDescription(
                                    `${config.Client.Emojis.Onay} ${member} kullanıcısı başarıyla **KADIN** olarak kayıt edildi!`
                                ),
                        ],
                    });
                    await registerHelper(member, message.member, name, age, "woman", message);
                } else if (button.customId === "buttoniptal") {
                    await msg.edit({
                        components: [row],
                        embeds: [baseEmbed.setColor("Red").setDescription(`${config.Client.Emojis.Iptal} Kayıt işlemi iptal edildi.`)],
                    });
                }
            });

            collector.on("end", (collected, reason) => {
                if (reason === "time") {
                    if (msg.editable) {
                        row.components.forEach((comp) => comp.setDisabled(true));
                        msg.edit({
                            embeds: [
                                baseEmbed.setColor("Red").setDescription("İşlem süresi dolduğu için kayıt oturumu iptal edildi."),
                            ],
                            components: [row],
                        }).catch(() => {});
                    }
                }
            });
        } catch (error) {
            console.error("Command Error:", error);
            await message.reply(`${config.Client.Emojis.Iptal} ${config.Client.Messages.Error}`);
        }
    },
};

async function registerHelper(member, auth, name, age, gender, message) {
    let cinsiyet;
    if (gender === "man") {
        await member.roles.add(config.Guild.Roles.Man).catch(console.error);
        cinsiyet = "Erkek";
    } else if (gender === "woman") {
        await member.roles.add(config.Guild.Roles.Woman).catch(console.error);
        cinsiyet = "Kadın";
    }

    let setName = `${
        config.Guild.Settings.tags.some((x) => member.user.username.includes(x))
            ? config.Guild.Settings.tags[0]
            : config.Guild.Settings.unTag
    } ${name} | ${age}`;
    await member.setNickname(setName).catch(console.error);
    await member.roles.remove(config.Guild.Roles.Unregister).catch(console.error);

    if (config.Guild.Channels.chat) {
        const chat = message.guild.channels.cache.get(config.Guild.Channels.chat);
        if (chat)
            chat.send({ content: `${member}, aramıza hoş geldin! Seninle birlikte daha güçlüyüz!` }).then((m) =>
                setTimeout(() => m.delete().catch(() => {}), 15000)
            );
    }

    const logChannel = message.guild.channels.cache.get(config.Guild.Channels.registerLog);
    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setColor(gender === "man" ? "Blue" : "Fuchsia")
            .setDescription(
                `**Bir Kayıt Gerçekleşti**\n\n• **Kaydeden Yetkili:** ${auth} (\`${auth.id}\`)\n• **Kaydedilen Üye:** ${member} (\`${member.id}\`)\n• **Yeni İsim:** \`${setName}\`\n• **Cinsiyet:** **${cinsiyet}**`
            )
            .setTimestamp();
        logChannel.send({ embeds: [logEmbed] });
    }
}
