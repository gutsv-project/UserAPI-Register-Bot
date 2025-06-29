const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, inlineCode, SlashCommandBuilder, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ContainerBuilder, UserSelectMenuBuilder, MessageFlags } = require("discord.js");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require("../config.js");
const { User, Log, Queue } = require('../utils/db');
const { registerHelper } = require('../utils/functions.js');

module.exports = {
    name: "kayıt",
    description: "Sunucu içerisi kayıt yapmanızı sağlar.",
    aliases: ["e", "k", "erkek", "kadın", "man", "woman", "kız"],
    data: new SlashCommandBuilder()
        .setName('kayıt')
        .setDescription('Sunucu içerisi kayıt yapmanızı sağlar.')
        .addUserOption(option => 
            option.setName('kullanici')
            .setDescription('Kayıt edilecek kullanıcı')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('isim')
            .setDescription('Kullanıcının ismi')
            .setRequired(true))
        .addIntegerOption(option => 
            option.setName('yas')
            .setDescription('Kullanıcının yaşı')
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    execute: async (client, message, args) => {
        try {
            if (message.options) {
                const member = message.options.getMember('kullanici');
                const name = message.options.getString('isim');
                const age = message.options.getInteger('yas');
                
                if (!member) {
                    return message.reply({ content: `${config.Client.Emojis.Iptal} Geçerli bir kullanıcı belirtilmedi.`, flags: 64 });
                }
                
                if (message.user.id === member.id) {
                    return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.ItSelf}`, flags: 64 });
                }
                
                if (member.user.bot) {
                    return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.Bot}`, flags: 64 });
                }
                
                if (!member.manageable) {
                    return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.NoYt}`, flags: 64 });
                }
                
                if (
                    config.Guild.Roles.Man.some((x) => member.roles.cache.has(x)) ||
                    config.Guild.Roles.Woman.some((x) => member.roles.cache.has(x))
                ) {
                    return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.Registered}`, flags: 64 });
                }
                
                if (message.member.roles.highest.position <= member.roles.highest.position) {
                    return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.SAuth}`, flags: 64 });
                }
                
                if (
                    config.Guild.Settings.tagMode &&
                    !config.Guild.Settings.tags.some((a) => member.user.username.includes(a)) &&
                    !member.roles.cache.has(config.Guild.Roles.Booster) &&
                    !member.roles.cache.has(config.Guild.Roles.Vip) &&
                    !member.roles.cache.has(config.Guild.Roles.Tag) &&
                    !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
                    !config.Guild.Roles.Founding.some((oku) => message.member.roles.cache.has(oku))
                ) {
                    return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.TagMode}`, flags: 64 });
                }
                
                if (
                    (member.roles.cache.has(config.Guild.Roles.Suspect) ||
                        member.roles.cache.has(config.Guild.Roles.Jailed) ||
                        member.roles.cache.has(config.Guild.Roles.BannedTag)) &&
                    !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
                    !config.Guild.Roles.Founding.some((oku) => message.member.roles.cache.has(oku))
                ) {
                    return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.PunUser}`, flags: 64 });
                }
                
                await message.deferReply({ flags: 64 });
                await registerHelper(member, message.member, name, age, "man", message);
                await message.editReply({ content: `${config.Client.Emojis.Onay} ${member} kullanıcısı başarıyla **ERKEK** olarak kayıt edildi!` });
                return;
            }
            
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

            if (
                !config.Guild.Roles.RegisterHammer.some((oku) => message.member.roles.cache.has(oku)) &&
                !config.Guild.Roles.Founding.some((oku) => message.member.roles.cache.has(oku)) &&
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
            ) {
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.NoAuth}`, flags: 64 });
            }

            if (!member)
                return message.reply({
                    content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.Member} ${inlineCode(
                        `${config.Client.Prefixes[0]}kayıt <@Kullanıcı/ID> <Isim> <Yaş>`
                    )}`,
                    flags: 64
                });
            if (message.author.id === member.id)
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.ItSelf}`, flags: 64 });
            if (member.user.bot) return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.Bot}`, flags: 64 });
            if (!member.manageable) return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.NoYt}`, flags: 64 });
            if (
                config.Guild.Roles.Man.some((x) => member.roles.cache.has(x)) ||
                config.Guild.Roles.Woman.some((x) => member.roles.cache.has(x))
            )
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.Registered}`, flags: 64 });
            if (message.member.roles.highest.position <= member.roles.highest.position)
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.SAuth}`, flags: 64 });

            if (
                config.Guild.Settings.tagMode &&
                !config.Guild.Settings.tags.some((a) => member.user.username.includes(a)) &&
                !member.roles.cache.has(config.Guild.Roles.Booster) &&
                !member.roles.cache.has(config.Guild.Roles.Vip) &&
                !member.roles.cache.has(config.Guild.Roles.Tag) &&
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
                !config.Guild.Roles.Founding.some((oku) => message.member.roles.cache.has(oku))
            ) {
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.TagMode}`, flags: 64 });
            }
            if (
                (member.roles.cache.has(config.Guild.Roles.Suspect) ||
                    member.roles.cache.has(config.Guild.Roles.Jailed) ||
                    member.roles.cache.has(config.Guild.Roles.BannedTag)) &&
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
                !config.Guild.Roles.Founding.some((oku) => message.member.roles.cache.has(oku))
            ) {
                return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.PunUser}`, flags: 64 });
            }

            args = args.filter((a) => a !== "" && a !== " ").splice(1);
            let name = args
                .filter((arg) => isNaN(arg))
                .map((arg) => arg.charAt(0).replace(/i/g, "İ").toUpperCase() + arg.slice(1))
                .join(" ");
            let age = args.filter((arg) => !isNaN(arg))[0];

            if (!name || !age) return message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.NoName}`, flags: 64 });

            const genderRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('register_gender_selection')
                    .setPlaceholder('Cinsiyet seçiniz')
                    .addOptions([
                        { label: 'Erkek', value: 'erkek', description: 'Erkek olarak kayıt et', emoji: '👨' },
                        { label: 'Kadın', value: 'kadin', description: 'Kadın olarak kayıt et', emoji: '👩' },
                        { label: 'İptal', value: 'iptal', description: 'Kayıt işlemini iptal et', emoji: '❌' }
                    ])
            );


            const dataRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("register_show_data")
                    .setPlaceholder("Veri işlemleri")
                    .addOptions([
                        { label: "Verileri Göster", value: "show_data", description: "Kullanıcının geçmiş verilerini göster", emoji: "📊" }
                    ])
            );


            const disabledGenderRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('register_gender_selection')
                    .setPlaceholder('Cinsiyet seçiniz (Devre Dışı)')
                    .setDisabled(true)
                    .addOptions([
                        { label: 'Erkek', value: 'erkek', description: 'Erkek olarak kayıt et', emoji: '👨' },
                        { label: 'Kadın', value: 'kadin', description: 'Kadın olarak kayıt et', emoji: '👩' },
                        { label: 'İptal', value: 'iptal', description: 'Kayıt işlemini iptal et', emoji: '❌' }
                    ])
            );


            let msg = await message.channel.send({
                content: 'Kayıt işlemi başlatıldı, lütfen bekleyin...'
            });

     
            let data = null;
            if (config.Api.useCheck) {
                let retryCount = 0;
                const maxRetries = 1; // Sadece 1 deneme
                while (retryCount < maxRetries) {
                    try {
                        const res = await fetch(`${config.Api.url}${member.id}`);
                        if (res.ok) {
                            data = await res.json();
                            break;
                        }
                    } catch (error) {
                        retryCount++;
                        if (retryCount >= maxRetries) {
                            data = null;
                            break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
                    }
                }
            }

            if (data?.base && (data.base.topName.toLowerCase() !== name.toLowerCase() || parseInt(data.base.topAge) != age)) {
                await msg.edit({
                    content: `⚠️ Kullanıcının geçmiş verileri ile girilen bilgiler eşleşmiyor!\n\n• Girilen İsim: **${name}**, En Çok Kullandığı: **${data.base.topName}**\n• Girilen Yaş: **${age}**, En Çok Kullandığı: **${data.base.topAge}**\n\nLütfen aşağıdaki **Verileri Göster** seçeneğini kullanarak bilgileri kontrol edin ve ardından kayıt işlemine devam edin.`,
                    components: [genderRow, dataRow]
                });
            } else {
                await msg.edit({
                    content: `${member} ([96m${member.id}[0m) kullanıcısının kaydını tamamlamak için aşağıdaki menüden seçim yapın!`,
                    components: [genderRow]
                });
            }

            const collector = msg.createMessageComponentCollector({
                filter: (interaction) => interaction.user.id === message.author.id,
                time: 30000,
            });

            collector.on("collect", async (interaction) => {
                if (interaction.deferred || interaction.replied) return;
                await interaction.deferUpdate().catch(() => {});
                if (interaction.customId === "register_show_data") {
                    const serverList = data?.guilds?.length
                        ? data.guilds.map((g) => `• ${g.serverName}: \
\`${g.displayName}\``).join("\n")
                        : "Veri bulunamadı.";
                    await interaction.followUp({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Yellow")
                                .setDescription(
                                    `Aşağıda ${member} kullanıcısının diğer sunuculardaki isimleri listelenmektedir.\n\n${serverList}`
                                ),
                        ],
                        flags: 64,
                        ephemeral: true
                    }).catch(() => {});
                    return;
                }

                if (interaction.customId === "register_gender_selection") {
                    const selectedValue = interaction.values[0];
                    collector.stop();

                    if (selectedValue === "erkek") {
                        await msg.edit({
                            content: `${config.Client.Emojis.Onay} ${member} kullanıcısı başarıyla **ERKEK** olarak kayıt edildi!`,
                            components: []
                        });
                        await registerHelper(member, message.member, name, age, "man", message);
                    } else if (selectedValue === "kadin") {
                        await msg.edit({
                            content: `${config.Client.Emojis.Onay} ${member} kullanıcısı başarıyla **KADIN** olarak kayıt edildi!`,
                            components: []
                        });
                        await registerHelper(member, message.member, name, age, "woman", message);
                    } else if (selectedValue === "iptal") {
                        await msg.edit({
                            content: `${config.Client.Emojis.Iptal} Kayıt işlemi iptal edildi.`,
                            components: []
                        });
                    }
                }
            });

            collector.on("end", async (collected, reason) => {
                if (reason === "time") {
                    if (msg.editable) {
                        await msg.edit({
                            content: 'İşlem süresi dolduğu için kayıt oturumu iptal edildi.',
                            components: [disabledGenderRow],
                        }).catch(() => {});
                    }
                }
            });
        } catch (error) {
            console.error("Command Error:", error);
            await message.reply({ content: `${config.Client.Emojis.Iptal} ${config.Client.Messages.Error}`, flags: 64 });
        }
    },
};
