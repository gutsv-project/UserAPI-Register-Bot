const {
    Client,
    GatewayIntentBits,
    Collection,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    REST,
    Routes,
    PermissionsBitField,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const { spawn } = require("child_process");
const config = require("./config.js");
const fs = require("fs");
const path = require("path");
const logger = require("./utils/logger");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { User, Log, Queue } = require('./utils/db');
const { registerHelper } = require("./utils/functions.js");
const { registerQueue } = require('./utils/queue.js');

const client = new Client({
    intents: Object.values(GatewayIntentBits),
    partials: Object.values(Partials),
});

client.config = config;
client.commands = new Collection();

const loadCommands = () => {
    const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    }
};

client.on("guildMemberAdd", async (member) => {
    if (member.guild.id !== config.Guild.GuildId) return;
    if (member.user.bot) return;

    const welcomeChannel = member.guild.channels.cache.get(config.Guild.Channels.welcome);
    if (!welcomeChannel) {
        logger.error("Otomatik kayıt için karşılama kanalı ('welcome') config dosyasında bulunamadı.");
        return;
    }

    member.roles.add(config.Guild.Roles.Unregister).catch((error) => {
        logger.error(
            {
                error: {
                    stack: error.stack,
                },
            },
            "Otomatik kayıt sırasında 'Unregister' rolü eklenemedi"
        );
    });

    const embed = new EmbedBuilder()
        .setColor(config.Client.GuildEmbedColor)
        .setAuthor({
            name: `${member.guild.name} | Otomatik Kayıt Sistemi`,
            iconURL: member.guild.iconURL(),
        })
        .setDescription(
            `Sunucumuza hoş geldin, ${member}!\n\nAşağıdaki menüden kayıt işlemini başlatabilirsin.\n\nEğer otomatik kayıt başarısız olursa, lütfen sesli teyit odalarına geçerek bir yetkiliye danış.`
        )
        .setThumbnail(member.user.displayAvatarURL());

    const container = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("otom_kayit_container")
            .setPlaceholder("Kayıt işlemi için seçim yapın")
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel("Otomatik Kayıt Ol")
                    .setDescription("GutsV verilerinize göre otomatik kayıt olun")
                    .setValue("otom_kayit")
                    .setEmoji("📝"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Manuel Kayıt")
                    .setDescription("Yetkili ile manuel kayıt olun")
                    .setValue("manuel_kayit")
                    .setEmoji("👤"),
            ])
    );

    await welcomeChannel.send({
        content: `${member}`,
        embeds: [embed],
        components: [container],
    });

    const suspectRole = config.Guild.Roles.Suspect;
    const logChannelId = config.Guild.Channels.registerLog;
    const logChannel = member.guild.channels.cache.get(logChannelId);
    const accountAgeMs = Date.now() - member.user.createdAt.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (accountAgeMs < sevenDaysMs) {
        if (suspectRole) {
            await member.roles.add(suspectRole).catch(() => {});
        }
        if (logChannel) {
            const suspectEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Şüpheli Hesap Tespit Edildi!")
                .setDescription(`${member} (
                ${member.id}) sunucuya katıldı ve hesabı 7 günden küçük olduğu için şüpheli olarak işaretlendi.`)
                .addFields(
                    { name: "Hesap Açılış Tarihi", value: `<t:${Math.floor(member.user.createdAt.getTime()/1000)}:F>`, inline: true },
                    { name: "Kullanıcı", value: `${member.user.tag}`, inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();
            logChannel.send({ embeds: [suspectEmbed] });
        }
        try {
            await member.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Dikkat!")
                        .setDescription(`Hesabınız 7 günden küçük olduğu için sunucuda şüpheli olarak işaretlendiniz. Yetkililer sizinle ilgilenecektir.`)
                ]
            });
        } catch (e) {}
    }
 


    const kontrolChannel = member.guild.channels.cache.get(config.Guild.Channels.welcome);
    if (!kontrolChannel) return;

    const kontrolEmbed = new EmbedBuilder()
        .setColor("DarkGreen")
        .setAuthor({
            name: `GutsV | ${member.user.tag} (${member.id})`,
            iconURL: member.user.displayAvatarURL(),
        })
        .setDescription(
            `@${member.user.username} sunucuya yeni katıldı. Kullanıcıyı GutsV ile kontrol etmek için aşağıdaki menüyü kullanın.`
        )
        .setThumbnail(member.user.displayAvatarURL());

    const kontrolContainer = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`kontrol_gutsv_${member.id}`)
            .setPlaceholder("Kullanıcı kontrol işlemi seçin")
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel("GutsV Kontrol")
                    .setDescription("Kullanıcıyı GutsV API ile kontrol et")
                    .setValue("gutsv_kontrol")
                    .setEmoji("🔍"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Hızlı Panel")
                    .setDescription("Yetkili panelini aç")
                    .setValue("hizli_panel")
                    .setEmoji("⚡"),
            ])
    );

    await kontrolChannel.send({
        embeds: [kontrolEmbed],
        components: [kontrolContainer],
        allowedMentions: { users: [member.id] },
    });


    const bannedTagRole = config.Guild.Roles.BannedTag;
    const quarantineRole = config.Guild.Roles.Quarantine;
    const modLogChannel = member.guild.channels.cache.get(config.Guild.Channels.modLog);
    const bannedTags = config.Guild.Settings.tags || [];
    let isBannedTag = bannedTags.some(tag => member.user.username.includes(tag));
    let isNewAccount = (Date.now() - member.user.createdAt.getTime()) < (7 * 24 * 60 * 60 * 1000);

    if (isBannedTag) {
        await member.ban({ reason: "Yasaklı tag ile giriş" }).catch(() => {});
        try {
            await User.findOneAndUpdate(
                { userId: member.id },
                {
                    userId: member.id,
                    username: member.user.tag,
                    $push: {
                        banHistory: {
                            date: new Date(),
                            reason: 'Yasaklı tag ile giriş',
                            staff: 'BOT'
                        }
                    }
                },
                { upsert: true, new: true }
            );
            await Log.create({
                type: 'ban',
                userId: member.id,
                staff: 'BOT',
                date: new Date(),
                details: { reason: 'Yasaklı tag ile giriş' }
            });
        } catch (e) {}
        if (modLogChannel) {
            const banEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Otomatik Ban - Yasaklı Tag")
                .setDescription(`${member} (
${member.id}) sunucuya yasaklı tag ile katıldığı için otomatik olarak banlandı.`)
                .addFields(
                    { name: "Kullanıcı", value: `${member.user.tag}`, inline: true },
                    { name: "Tag", value: bannedTags.find(tag => member.user.username.includes(tag)) || 'Bilinmiyor', inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();
            modLogChannel.send({ embeds: [banEmbed] });
        }
        return;
    }


    if (isNewAccount) {
        if (quarantineRole) {
            await member.roles.add(quarantineRole).catch(() => {});
        }
        try {
            await User.findOneAndUpdate(
                { userId: member.id },
                {
                    userId: member.id,
                    username: member.user.tag,
                    $push: {
                        quarantineHistory: {
                            date: new Date(),
                            reason: 'Çok yeni hesap',
                            staff: 'BOT'
                        }
                    }
                },
                { upsert: true, new: true }
            );
            await Log.create({
                type: 'quarantine',
                userId: member.id,
                staff: 'BOT',
                date: new Date(),
                details: { reason: 'Çok yeni hesap' }
            });
        } catch (e) {}
        if (modLogChannel) {
            const quarantineEmbed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("Karantina - Yeni Hesap")
                .setDescription(`${member} (
${member.id}) sunucuya katıldı ve hesabı çok yeni olduğu için karantinaya alındı.`)
                .addFields(
                    { name: "Hesap Açılış Tarihi", value: `<t:${Math.floor(member.user.createdAt.getTime()/1000)}:F>`, inline: true },
                    { name: "Kullanıcı", value: `${member.user.tag}`, inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();
            modLogChannel.send({ embeds: [quarantineEmbed] });
        }
        try {
            await member.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle("Karantina!")
                        .setDescription(`Hesabınız çok yeni olduğu için sunucuda karantinaya alındınız. Yetkililer sizinle ilgilenecektir.`)
                ]
            });
        } catch (e) {}
    }
});


async function registerSlashCommands() {
    const commands = [];
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.data) {
            commands.push(command.data.toJSON());
        }
    }
    const rest = new REST({ version: '10' }).setToken(config.Client.token);
    try {
        await rest.put(
            Routes.applicationGuildCommands(config.Client.id, config.Guild.GuildId),
            { body: commands }
        );
        logger.info('Slash komutları başarıyla yüklendi!');
    } catch (error) {
        logger.error(error, 'Slash komut yükleme hatası');
    }
}

client.once("ready", async () => {
    await registerSlashCommands();
    logger.info(`${client.user.tag} devrede!`);
    client.user.setPresence({
        status: config.Client.PresenceStatus.status,
        activities: [
            {
                name: config.Client.PresenceStatus.name,
                type: config.Client.PresenceStatus.type,
            },
        ],
    });

    setInterval(async () => {
        try {
            const guild = client.guilds.cache.get(config.Guild.GuildId);
            const channel = guild?.channels.cache.get(config.Guild.Channels.registerLog);

            if (channel) {
                const stats = {
                    ping: client.ws.ping,
                    cpu: Math.floor(process.cpuUsage().system / 1024),
                    ram: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024),
                };

                await channel.send({
                    content: `ℹ️ <t:${Math.floor(Date.now() / 1000)}:R> bot yeniden başlatılıyor... Anlık ping: ${
                        stats.ping
                    }ms | CPU: ${stats.cpu}% | RAM: ${stats.ram}MB`,
                });
            }

            logger.info("Bot yeniden başlatılıyor...");
            client.destroy();
            spawn("node", ["index.js"], { detached: true, stdio: "inherit" });
            process.exit(0);
        } catch (error) {
            logger.error(
                {
                    error: {
                        stack: error.stack,
                    },
                },
                "Yeniden başlatma hatası"
            );
        }
    }, 24 * 60 * 60 * 1000);
});

client.on("messageCreate", (message) => {
    if (message.author.bot || message.guild === null) return;

    const prefix = config.Client.Prefixes.find((p) => message.content.startsWith(p));
    if (!prefix) return;

    const [cmd, ...args] = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = cmd.toLowerCase();
    const command = client.commands.get(commandName);

    if (command) command.execute(client, message, args);
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error({ error: { stack: error.stack } }, `Slash command hatası: ${interaction.commandName}`);
            const errorMessage = 'Komut çalıştırılırken bir hata oluştu.';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, flags: 64 });
            } else {
                await interaction.reply({ content: errorMessage, flags: 64 });
            }
        }
        return;
    }

    if (interaction.isButton() && interaction.customId === "otom_kayit_button") {
        return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("kontrol_gutsv_")) {
        return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('panel_')) {
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "otom_kayit_container") {
        const member = interaction.member;
        const isYetkili =
            config.Guild.Roles.RegisterHammer.some((r) => member.roles.cache.has(r)) ||
            config.Guild.Roles.Founding.some((r) => member.roles.cache.has(r)) ||
            member.permissions.has("Administrator");
        if (isYetkili) {
            await interaction.reply({
                content: "Yetkililer otomatik kayıt menüsünü kullanamaz.",
                ephemeral: true,
            });
            return;
        }
        const selectedValue = interaction.values[0];
        
        if (selectedValue === "otom_kayit") {
            await interaction.deferReply({ flags: 64 });

            if (!config.Api.useCheck || !config.Api.url) {
                return interaction.editReply({
                    content: "API hizmeti şu anda devre dışı.",
                });
            }

            let data;
            let retryCount = 0;
            const maxRetries = 3;
            while (retryCount < maxRetries) {
                try {
                    const res = await fetch(`${config.Api.url}${interaction.member.id}`);
                    if (res.ok) {
                        data = await res.json();
                        break;
                    } else {
                        throw new Error(`API'den geçerli bir yanıt alınamadı. Status: ${res.status}`);
                    }
                } catch (error) {
                    retryCount++;
                    logger.error({ error: { stack: error.stack } }, `Otomatik Kayıt API Hatası (Deneme ${retryCount}/${maxRetries})`);
                    if (retryCount >= maxRetries) {
                        let errorMessage = "Otomatik kayıt sırasında bir sorun oluştu. Lütfen bir yetkili ile görüşün.";
                        if (error.name === 'AbortError') {
                            errorMessage = "API yanıt vermediği için otomatik kayıt yapılamadı. Lütfen bir yetkili ile görüşün.";
                        } else if (error.message) {
                            errorMessage = `API Hatası: ${error.message}`;
                        }
                        return interaction.editReply({
                            content: errorMessage,
                        });
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            if (!data?.base || typeof data.base.topName !== 'string' || !data.base.topName.trim() || (typeof data.base.topAge !== 'number' && (typeof data.base.topAge !== 'string' || !data.base.topAge.toString().trim())) || data.base.gender == null) {
                return interaction.editReply({
                    content: "Geçmiş verileriniz bulunamadığı için otomatik kayıt yapılamadı. Lütfen bir yetkili ile görüşün.",
                });
            }
            const gender = data.base.gender.toLowerCase();
            const name = data.base.topName;
            const age = data.base.topAge;
            let roleToGive;
            let genderName;
            const unknownGenders = [
                "unisex isim ağa bilemedim",
                "belirsiz",
                "unknown",
                "tanımsız",
                "?",
                "none",
                "not set",
                "yok"
            ];
            if (typeof data.base.gender === "string" && unknownGenders.includes(gender)) {
                const genderContainer = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`cinsiyet_secim_${interaction.member.id}`)
                        .setPlaceholder("Cinsiyet seçiniz")
                        .addOptions([
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Erkek")
                                .setDescription("Erkek olarak kayıt et")
                                .setValue("erkek")
                                .setEmoji("👨"),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Kadın")
                                .setDescription("Kadın olarak kayıt et")
                                .setValue("kadin")
                                .setEmoji("👩"),
                        ])
                );
                
                await interaction.editReply({
                    content: `${interaction.member} için cinsiyet seçimi yapınız:`,
                    components: [genderContainer],
                });
                return;
            }
            if (gender === "e" || gender === "erkek") {
                roleToGive = config.Guild.Roles.Man;
                genderName = "Erkek";
            } else if (gender === "k" || gender === "kadın") {
                roleToGive = config.Guild.Roles.Woman;
                genderName = "Kadın";
            } else {
                const genderContainer = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`cinsiyet_secim_${interaction.member.id}`)
                        .setPlaceholder("Cinsiyet seçiniz")
                        .addOptions([
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Erkek")
                                .setDescription("Erkek olarak kayıt et")
                                .setValue("erkek")
                                .setEmoji("👨"),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Kadın")
                                .setDescription("Kadın olarak kayıt et")
                                .setValue("kadin")
                                .setEmoji("👩"),
                        ])
                );
                
                await interaction.editReply({
                    content: `${interaction.member} için cinsiyet seçimi yapınız:`,
                    components: [genderContainer],
                });
                return;
            }
            try {
                const setName = `${config.Guild.Settings.tags.some((x) => interaction.member.user.username.includes(x)) ? config.Guild.Settings.tags[0] : config.Guild.Settings.unTag} ${name} | ${age}`;
                await Promise.all([
                    interaction.member.setNickname(setName),
                    interaction.member.roles.remove(config.Guild.Roles.Unregister),
                    interaction.member.roles.add(roleToGive)
                ]);
                const logChannel = interaction.guild.channels.cache.get(config.Guild.Channels.registerLog);
                const chatChannel = interaction.guild.channels.cache.get(config.Guild.Channels.chat);
                const promises = [];
                if (logChannel) {
                    let infData = {};
                    try {
                        const res = await fetch(`https://api.gutsv.xyz/api/inf/${interaction.member.id}`);
                        if (res.ok) infData = await res.json();
                    } catch (e) {}
                    let guildTag = infData.guild_tag || 'Yok';
                    let bio = infData.bio || 'Yok';
                    let hitap = infData.pronouns || 'Yok';
                    let userData = {};
                    try {
                        const res = await fetch(`${config.Api.url}${interaction.member.id}`);
                        if (res.ok) userData = await res.json();
                    } catch (e) {}
                    let gutsvUsername = userData.username || 'Yok';
                    let gutsvStatus = userData.status !== undefined ? String(userData.status) : 'Yok';
                    const logEmbed = new EmbedBuilder()
                        .setColor(genderName === "Erkek" ? "Blue" : "Fuchsia")
                        .setDescription(
                            `**Otomatik Kayıt Gerçekleşti**\n\n• **Kaydedilen Üye:** ${interaction.member} (\`${interaction.member.id}\`)\n• **Verilen Rol:** <@&${roleToGive}>\n• **Yeni İsim:** \`${setName}\`\n• **İşlemi Yapan:** ${client.user.username} (Otomatik Sistem)\n• **Biosu:** ${bio}\n• **Hitap:** ${hitap}\n• **Guild Tagı:** ${guildTag}\n• **GutSv Username:** ${gutsvUsername}\n• **GutSv Status:** ${gutsvStatus}`
                        )
                        .setTimestamp();
                    promises.push(logChannel.send({ embeds: [logEmbed] }));
                }
                if (chatChannel) {
                    promises.push(
                        chatChannel
                            .send({
                                content: `${interaction.member}, aramıza katıldı! Otomatik olarak kayıt edildi.`,
                            })
                            .then((m) => setTimeout(() => m.delete().catch(() => {}), 15000))
                    );
                }
                await Promise.all(promises);
                await interaction.editReply({
                    content: `Başarıyla kayıt oldun! Sunucumuza tekrar hoş geldin, **${name}**.`,
                });
                if (interaction.message.deletable) {
                    interaction.message.delete().catch(() => {});
                }
            } catch (error) {
                logger.error({ error: { stack: error.stack } }, "Otomatik kayıt sırasında rol/isim atama hatası");
                await interaction.editReply({
                    content: "Rolleriniz veya isminiz ayarlanırken bir hata oluştu. Lütfen bir yetkiliye bildirin.",
                });
            }
            return;
        } else if (selectedValue === "manuel_kayit") {
            const guild = interaction.guild;
            const unregisterRole = config.Guild.Roles.Unregister;
            const hasUnregister = Array.isArray(unregisterRole)
                ? unregisterRole.some(roleId => interaction.member.roles.cache.has(roleId))
                : interaction.member.roles.cache.has(unregisterRole);
            if (!hasUnregister) {
                await interaction.reply({ content: 'Sadece kayıtsız (Unregister) rolüne sahip kullanıcılar kayıt kuyruğuna alınabilir.', ephemeral: true });
                return;
            }
            await Queue.updateOne(
                { userId: String(interaction.user.id) },
                { $set: { status: 'pending', requestedAt: new Date() } },
                { upsert: true }
            );
            const yeniKuyruk = await Queue.find();
            const validRegisterHammerIds = config.Guild.Roles.RegisterHammer.filter(id => /^\d+$/.test(id));
            const registerHammerMentions = validRegisterHammerIds.map(id => `<@&${id}>`).join(' ');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`kayıt_onayla_${interaction.user.id}`)
                    .setLabel('Onayla')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`kayıt_reddet_${interaction.user.id}`)
                    .setLabel('Reddet')
                    .setStyle(ButtonStyle.Danger)
            );
            const replyMsg = await interaction.reply({
                content: `${registerHammerMentions}\n${interaction.user} kayıt olmak istiyor! Lütfen onaylayın veya reddedin.`,
                allowedMentions: { roles: validRegisterHammerIds, users: [interaction.user.id] },
                components: [row],
                flags: 0
            });
            const queueItem = await Queue.findOne({ userId: interaction.user.id });
            if (queueItem) queueItem.messageId = (await interaction.fetchReply()).id;
            setTimeout(async () => {
                const item = await Queue.findOne({ userId: interaction.user.id });
                if (!item || item.status !== 'pending') return;
                item.status = 'timeout';
                try {
                    const channel = interaction.channel;
                    const msg = await channel.messages.fetch(item.messageId).catch(() => null);
                    if (msg && msg.edit) {
                        const row = msg.components[0];
                        if (row) {
                            const newRow = new ActionRowBuilder().addComponents(
                                row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                            );
                            await msg.edit({ components: [newRow] });
                        }
                    }
                } catch (e) {}
                try {
                    const member = await guild.members.fetch(interaction.user.id).catch(() => null);
                    if (member) {
                        await member.send('Kayıt isteğiniz zaman aşımına uğradı. Lütfen tekrar deneyin.').catch(() => {});
                    }
                } catch (e) {}
                try {
                    await interaction.followUp({ content: `${interaction.user} kullanıcısının kayıt isteği zaman aşımına uğradı.`, allowedMentions: { users: [interaction.user.id] } });
                } catch (e) {}
            }, 5 * 60 * 1000);
            return;
        }
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("cinsiyet_secim_")) {
        const userId = interaction.customId.replace("cinsiyet_secim_", "");
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        const selectedGender = interaction.values[0];
        
        if (!member) {
            return interaction.reply({ content: "Kullanıcı bulunamadı.", flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });

        let apiData = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                const res = await fetch(`${config.Api.url}${member.id}`);
                
                if (res.ok) {
                    apiData = await res.json();
                    break;
                }
            } catch (error) {
                retryCount++;
                console.error(`API Error (Deneme ${retryCount}/${maxRetries}):`, error);
                
                if (retryCount >= maxRetries) {
                    apiData = null;
                    break;
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        const name = apiData?.base?.topName || "Otomatik";
        const age = apiData?.base?.topAge || 0;
        const auth = interaction.user;
        
        if (selectedGender === "erkek") {
            await registerHelper(member, auth, name, age, "man", interaction, true);
            await interaction.editReply({ content: `${member} başarıyla Erkek olarak kayıt edildi! (${name} | ${age})` });
        } else if (selectedGender === "kadin") {
            await registerHelper(member, auth, name, age, "woman", interaction, true);
            await interaction.editReply({ content: `${member} başarıyla Kadın olarak kayıt edildi! (${name} | ${age})` });
        }
        
        if (interaction.message.deletable) {
            interaction.message.delete().catch(() => {});
        }
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("kontrol_gutsv_")) {
        const userId = interaction.customId.replace("kontrol_gutsv_", "");
        const selectedValue = interaction.values[0];
        
        if (selectedValue === "gutsv_kontrol") {
            await interaction.deferReply({ flags: 64 });
            try {
                const res = await fetch(`https://api.gutsv.xyz/api/users/${userId}`);
                if (!res.ok) throw new Error(`API yanıtı başarısız: ${res.status}`);
                const data = await res.json();

                if (!data || !data.username) {
                    await interaction.editReply({ content: 'Kullanıcı bulunamadı veya API hatası.', flags: 64 });
                    return;
                }

                let guildsText = 'Yok';
                if (data.guilds && data.guilds.length > 0) {
                    guildsText = data.guilds.map((g, index) => 
                        `${index + 1}. **${g.serverName || 'Bilinmeyen Sunucu'}**\n   └ ${g.displayName || 'İsim yok'}`
                    ).join('\n\n');
                }

                const base = data.base || {};
                const topName = base.topName || 'Bilinmiyor';
                const topAge = base.topAge || 'Bilinmiyor';
                const gender = base.gender || 'Bilinmiyor';

                const embed = new EmbedBuilder()
                    .setTitle(`🔍 GutsV Kontrol Sonucu: ${data.username}`)
                    .setThumbnail(data.avatar ? (data.avatar.startsWith('http') ? data.avatar : `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`) : null)
                    .addFields(
                        { name: '🆔 Discord ID', value: data.id ? String(data.id) : 'Bilinmiyor', inline: true },
                        { name: '🌐 Global Adı', value: data.globalName ? String(data.globalName) : 'Yok', inline: true },
                        { name: '👤 GutsV Username', value: data.username ? String(data.username) : 'Bilinmiyor', inline: true },
                        { name: '📝 Top İsim', value: topName ? String(topName) : 'Bilinmiyor', inline: true },
                        { name: '🎂 Top Yaş', value: topAge ? String(topAge) : 'Bilinmiyor', inline: true },
                        { name: '⚧ Cinsiyet', value: gender ? String(gender) : 'Bilinmiyor', inline: true },
                        { name: `🏠 Sunuculardaki İsimleri (${data.guilds ? data.guilds.length : 0})`, value: guildsText, inline: false }
                    )
                    .setColor('Blurple')
                    .setFooter({ text: 'GutsV API' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                let msg = '❌ API üzerinden veri alınamadı.';
                if (err && err.message) {
                    msg += '\n\n' + String(err.message).slice(0, 500);
                }
                await interaction.editReply({ content: msg, flags: 64 });
            }
        } else if (selectedValue === "hizli_panel") {
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            if (!member) {
                return interaction.reply({ content: 'Kullanıcı bulunamadı.', flags: 64 });
            }
            const isYetkili =
                config.Guild.Roles.RegisterHammer.some((r) => interaction.member.roles.cache.has(r)) ||
                config.Guild.Roles.Founding.some((r) => interaction.member.roles.cache.has(r)) ||
                interaction.member.permissions.has("Administrator");
            if (!isYetkili) {
                await interaction.reply({ content: "Bu paneli kullanamazsın.", ephemeral: true });
                return;
            }
            const panelContainer = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`panel_${userId}`)
                    .setPlaceholder("Panel işlemi seçin")
                    .addOptions([
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Karantinaya Al")
                            .setDescription("Kullanıcıyı karantinaya al")
                            .setValue("karantina")
                            .setEmoji("🚫"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Banla")
                            .setDescription("Kullanıcıyı banla")
                            .setValue("ban")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Geçmiş")
                            .setDescription("Kullanıcı geçmişini göster")
                            .setValue("gecmis")
                            .setEmoji("📋"),
                    ])
            );
            const embed = new EmbedBuilder()
                .setTitle('Yetkili Paneli')
                .setDescription(`Aşağıdaki menüden ${member} için işlem seçin.`)
                .setThumbnail(member.user.displayAvatarURL())
                .setColor('Blurple');
            await interaction.reply({ embeds: [embed], components: [panelContainer], flags: 64 });
        }
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("panel_")) {
        const requester = interaction.member;
        const isYetkili =
            config.Guild.Roles.RegisterHammer.some((r) => requester.roles.cache.has(r)) ||
            config.Guild.Roles.Founding.some((r) => requester.roles.cache.has(r)) ||
            requester.permissions.has("Administrator");

        if (isYetkili) {
            await interaction.reply({
                content: "Bu paneli yetkililer kullanamaz.",
                ephemeral: true,
            });
            return;
        }

        const userId = interaction.customId.replace("panel_", "");
        const selectedAction = interaction.values[0];
        const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);
        const modLogChannel = interaction.guild.channels.cache.get(config.Guild.Channels.modLog);
        
        if (!targetMember) {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Kullanıcı bulunamadı.', flags: 64 });
            }
            return;
        }
        
        if (!targetMember.manageable) {
            await interaction.reply({
                content: "Bu kullanıcıya işlem yapmak için yetkim yok.",
                ephemeral: true,
            });
            return;
        }
        
        if (selectedAction === 'kontrol') {
            await interaction.deferReply({ flags: 64 });
            
            let data = null;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    const res = await fetch(`${config.Api.url}${userId}`);
                    
                    if (res.ok) {
                        data = await res.json();
                        break;
                    } else {
                        throw new Error(`API'den geçerli bir yanıt alınamadı. Status: ${res.status}`);
                    }
                } catch (error) {
                    retryCount++;
                    console.error(`Panel Kontrol API Hatası (Deneme ${retryCount}/${maxRetries}):`, error);
                    
                    if (retryCount >= maxRetries) {
                        let errorMessage = "❌ API ile iletişimde bir hata oluştu.";
                        
                        if (error.name === 'AbortError') {
                            errorMessage = "❌ API yanıt vermediği için kontrol yapılamadı.";
                        } else if (error.message) {
                            errorMessage = `❌ API Hatası: ${error.message}`;
                        }
                        
                        await interaction.editReply({ content: errorMessage, flags: 64 });
                        return;
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            let guildsText = 'Yok';
            if (data?.data?.guilds && data.data.guilds.length > 0) {
                guildsText = data.data.guilds.map((g, index) => 
                    `${index + 1}. **${g.serverName || 'Bilinmeyen Sunucu'}**\n   └ ${g.displayName || 'İsim yok'}`
                ).join('\n\n');
            }
            
            let kontrolEmbed = new EmbedBuilder()
                .setTitle('🔍 Kullanıcı Kontrol Sonucu')
                .setThumbnail(targetMember.user.displayAvatarURL())
                .addFields(
                    { name: '👤 Kullanıcı', value: targetMember.user ? `${targetMember.user.tag} (${targetMember.user.id})` : 'Bilinmiyor' },
                    { name: '📊 Durum', value: data?.status ? String(data.status) : 'Bilinmiyor', inline: true },
                    { name: '🌐 GutsV Username', value: data?.data?.username ? String(data.data.username) : 'Bilinmiyor', inline: true },
                    { name: '📝 GutsV İsim', value: data?.data?.base?.topName ? String(data.data.base.topName) : 'Bilinmiyor', inline: true },
                    { name: '🎂 GutsV Yaş', value: data?.data?.base?.topAge ? String(data.data.base.topAge) : 'Bilinmiyor', inline: true },
                    { name: '⚧ GutsV Cinsiyet', value: data?.data?.base?.gender ? String(data.data.base.gender) : 'Bilinmiyor', inline: true },
                    { name: `🏠 Sunuculardaki İsimleri (${data?.data?.guilds ? data.data.guilds.length : 0})`, value: guildsText, inline: false }
                )
                .setColor(data?.status === 'success' ? 'Green' : 'Red')
                .setFooter({ text: 'GutsV API' })
                .setTimestamp();
            await interaction.editReply({ embeds: [kontrolEmbed] });
            if (modLogChannel) modLogChannel.send({ embeds: [kontrolEmbed] });
        } else if (selectedAction === 'karantina') {
            await interaction.deferReply({ flags: 64 });
            const quarantineRole = config.Guild.Roles.Quarantine;
            if (quarantineRole) {
                await targetMember.roles.add(quarantineRole).catch(() => {});
                await interaction.editReply({ content: `${targetMember} karantinaya alındı.`, flags: 64 });
                if (modLogChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('Orange')
                        .setTitle('Karantina İşlemi')
                        .setDescription(`${targetMember} (${targetMember.id}) karantinaya alındı.`)
                        .setTimestamp();
                    modLogChannel.send({ embeds: [embed] });
                }
            } else {
                await interaction.editReply({ content: 'Karantina rolü ayarlanmamış.', flags: 64 });
            }
            return;
        } else if (selectedAction === 'ban') {
            await interaction.deferReply({ flags: 64 });
            await targetMember.ban({ reason: 'Yetkili panelinden banlandı.' }).catch(() => {});
            await interaction.editReply({ content: `${targetMember} banlandı.`, flags: 64 });
            if (modLogChannel) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Ban İşlemi')
                    .setDescription(`${targetMember} (${targetMember.id}) yetkili panelinden banlandı.`)
                    .setTimestamp();
                modLogChannel.send({ embeds: [embed] });
            }
            return;
        } else if (selectedAction === 'gecmis') {
            await interaction.deferReply({ flags: 64 });
            const user = targetMember.user;
            let apiData = null;
            try {
                const res = await fetch(`${config.Api.url}${user.id}`);
                if (res.ok) apiData = await res.json();
            } catch (e) {}
            const dbUser = await User.findOne({ userId: user.id });
            let kayitlar = dbUser?.registerHistory || [];
            let banlar = dbUser?.banHistory || [];
            let karantinalar = dbUser?.quarantineHistory || [];
            let kayitText = kayitlar.length ? kayitlar.map(k => `• [${k.date.toLocaleString()}] Kayıt: ${k.name} | ${k.age} (${k.gender}) - <@${k.staff}>`).join('\n') : 'Yok';
            let banText = banlar.length ? banlar.map(b => `• [${b.date.toLocaleString()}] Ban: ${b.reason} - <@${b.staff}>`).join('\n') : 'Yok';
            let karantinaText = karantinalar.length ? karantinalar.map(q => `• [${q.date.toLocaleString()}] Karantina: ${q.reason} - <@${q.staff}>`).join('\n') : 'Yok';
            const embed = new EmbedBuilder()
                .setTitle('Kullanıcı Geçmişi')
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'Kullanıcı', value: user ? `${user.tag} (${user.id})` : 'Bilinmiyor' },
                    { name: 'GutSv Username', value: apiData?.data?.username ? String(apiData.data.username) : 'Bilinmiyor', inline: true },
                    { name: 'GutSv Status', value: apiData?.status ? String(apiData.status) : 'Bilinmiyor', inline: true },
                    { name: 'Kayıt Geçmişi', value: kayitText ? String(kayitText) : 'Yok' },
                    { name: 'Ban Geçmişi', value: banText ? String(banText) : 'Yok' },
                    { name: 'Karantina Geçmişi', value: karantinaText ? String(karantinaText) : 'Yok' }
                )
                .setColor('Blurple')
                .setTimestamp();
            await interaction.editReply({ embeds: [embed], flags: 64 });
            return;
        }
        return;
    }

    if (interaction.isButton() && (interaction.customId.startsWith('kayıt_onayla_') || interaction.customId.startsWith('kayıt_reddet_'))) {
        const userId = interaction.customId.split('_').pop();
        const targetUser = await interaction.guild.members.fetch(userId).catch(() => null);
        const yetkili = interaction.member;
        const validRegisterHammerIds = config.Guild.Roles.RegisterHammer.filter(id => /^\d+$/.test(id));
        const isRegisterYetkili = validRegisterHammerIds.some(id => yetkili.roles.cache.has(id));
        if (!isRegisterYetkili) {
            await interaction.reply({ content: 'Bu butonları sadece kayıt yetkilileri kullanabilir.', ephemeral: true });
            return;
        }
        if (interaction.message && interaction.message.edit) {
            const row = interaction.message.components[0];
            if (row) {
                const newRow = new ActionRowBuilder().addComponents(
                    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                );
                await interaction.message.edit({ components: [newRow] });
            }
        }
        if (!targetUser) {
            await interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
            return;
        }
        if (interaction.customId.startsWith('kayıt_onayla_')) {
            let randomVoiceChannel = null;
            if (config.registerCategory) {
                const category = interaction.guild.channels.cache.get(config.registerCategory);
                if (category) {
                    const voiceChannels = interaction.guild.channels.cache.filter(c => c.parentId === category.id && c.type === 2);
                    const arr = Array.from(voiceChannels.values());
                    if (arr.length > 0) {
                        randomVoiceChannel = arr[Math.floor(Math.random() * arr.length)];
                    }
                }
            }
            const channelMention = randomVoiceChannel ? `<#${randomVoiceChannel.id}>` : `<#${interaction.channel.id}>`;
            try {
                await targetUser.send(`Kayıt isteğin onaylandı! Seni ${channelMention} kanalında ${yetkili} bekliyor.`);
            } catch (e) {}
            await interaction.deferUpdate();
            await interaction.followUp({ content: `${targetUser}, kayıt isteğin onaylandı! Seni ${channelMention} kanalında ${yetkili} bekliyor.`, allowedMentions: { users: [targetUser.id, yetkili.id] } });
        } else if (interaction.customId.startsWith('kayıt_reddet_')) {
            try {
                await targetUser.send('Kayıt isteğin reddedildi. Lütfen tekrar denemek için bir süre bekle.');
            } catch (e) {}
            await interaction.deferUpdate();
            await interaction.followUp({ content: `${targetUser} kullanıcısının kayıt isteği reddedildi.`, allowedMentions: { users: [targetUser.id] }, ephemeral: true });
        }
        const idx = await Queue.deleteOne({ userId });
        return;
    }

    if (interaction.isButton() && (interaction.customId.startsWith('kuyruk_onayla_') || interaction.customId.startsWith('kuyruk_reddet_'))) {
        const userId = interaction.customId.split('_').pop();
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        const yetkili = interaction.member;
        const isYetkili = config.Guild.Roles.RegisterHammer.some((r) => yetkili.roles.cache.has(r)) ||
            config.Guild.Roles.Founding.some((r) => yetkili.roles.cache.has(r)) ||
            yetkili.permissions.has('Administrator');
        if (!isYetkili) {
            await interaction.reply({ content: 'Bu butonları sadece kayıt yetkilileri kullanabilir.', ephemeral: true });
            return;
        }
        const queueItem = await Queue.findOne({ userId });
        await Queue.deleteOne({ userId });
        try {
            if (queueItem && queueItem.messageId) {
                const channel = interaction.channel;
                const msg = await channel.messages.fetch(queueItem.messageId).catch(() => null);
                if (msg && msg.edit) {
                    const row = msg.components[0];
                    if (row) {
                        const newRow = new ActionRowBuilder().addComponents(
                            row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                        );
                        await msg.edit({ components: [newRow] }).catch(() => {});
                    }
                }
            }
        } catch (e) {  }
        if (!member) {
            await interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
            return;
        }
        const registerLogChannel = interaction.guild.channels.cache.get(config.Guild.Channels.welcome);
        await interaction.deferUpdate();
        if (interaction.customId.startsWith('kuyruk_onayla_')) {
            let randomVoiceChannel = null;
            if (config.registerCategory) {
                const category = interaction.guild.channels.cache.get(config.registerCategory);
                if (category) {
                    const voiceChannels = interaction.guild.channels.cache.filter(c => c.parentId === category.id && c.type === 2);
                    const arr = Array.from(voiceChannels.values());
                    if (arr.length > 0) {
                        randomVoiceChannel = arr[Math.floor(Math.random() * arr.length)];
                    }
                }
            }
            const channelMention = randomVoiceChannel ? `<#${randomVoiceChannel.id}>` : 'bir ses kanalı';
            try {
                await member.send(`Kayıt isteğin onaylandı! Seni ${channelMention} kanalında ${yetkili} bekliyor.`);
            } catch (e) {}
            if (registerLogChannel) {
                await registerLogChannel.send({ content: `${member}, kayıt isteğin onaylandı! Seni ${channelMention} kanalında ${yetkili} bekliyor.`, allowedMentions: { users: [member.id, yetkili.id] } });
            }
            await interaction.followUp({ content: `${member} kullanıcısının kayıt isteği onaylandı!`, allowedMentions: { users: [member.id] }, ephemeral: true });
        } else if (interaction.customId.startsWith('kuyruk_reddet_')) {
            try {
                await member.send('Kayıt isteğin reddedildi. Lütfen tekrar denemek için bir süre bekle.');
            } catch (e) {}
            if (registerLogChannel) {
                await registerLogChannel.send({ content: `${member} kullanıcısının kayıt isteği reddedildi.`, allowedMentions: { users: [member.id] } });
            }
            await interaction.followUp({ content: `${member} kullanıcısının kayıt isteği reddedildi.`, allowedMentions: { users: [member.id] }, ephemeral: true });
        }
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'kuyruk_secim') {
        const userId = interaction.values[0];
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!member) {
            await interaction.deferUpdate();
            await interaction.followUp({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
            return;
        }
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`kuyruk_onayla_${userId}`)
                .setLabel('Onayla')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`kuyruk_reddet_${userId}`)
                .setLabel('Reddet')
                .setStyle(ButtonStyle.Danger)
        );
        await interaction.deferUpdate();
        await interaction.followUp({
            content: `${member} için işlem paneli:`,
            components: [row],
            allowedMentions: { users: [userId] },
            ephemeral: true
        });
        return;
    }
});

loadCommands();
client.login(config.Client.token);

process.on("unhandledRejection", (error) => {
    logger.error(
        {
            error: {
                stack: error.stack,
            },
        },
        "unhandledRejection"
    );
});
