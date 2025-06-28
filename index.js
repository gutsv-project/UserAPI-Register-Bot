const {
    Client,
    GatewayIntentBits,
    Collection,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const { spawn } = require("child_process");
const config = require("./config.js");
const fs = require("fs");
const path = require("path");
const logger = require("./utils/logger");
const fetch = require("node-fetch");

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
            `Sunucumuza hoş geldin, ${member}!\n\nAşağıdaki **Kayıt Ol** butonuna tıklayarak sunucumuzdaki geçmiş tüm sunuculardaki verilerinize göre otomatik olarak kayıt olabilirsin.\n\nEğer otomatik kayıt başarısız olursa, lütfen sesli teyit odalarına geçerek bir yetkiliye danış.`
        )
        .setThumbnail(member.user.displayAvatarURL());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("otom_kayit_button").setLabel("Kayıt Ol").setStyle(ButtonStyle.Success).setEmoji("📝")
    );

    await welcomeChannel.send({
        content: `${member}`,
        embeds: [embed],
        components: [row],
    });
});

client.once("ready", () => {
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

    if (config.Guild.Channels.voiceChannel) {
        const voiceChannel = client.channels.cache.get(config.Guild.Channels.voiceChannel);
        if (voiceChannel?.isVoiceBased()) {
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
            });
            logger.info(`${voiceChannel.name} sesli kanalına girildi.`);
        }
    }

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
    if (interaction.isButton() && interaction.customId === "otom_kayit_button") {
        const member = interaction.member;
        await interaction.deferReply({ ephemeral: true });

        if (!config.Api.useCheck || !config.Api.url) {
            return interaction.editReply({
                content: "API hizmeti şu anda devre dışı.",
            });
        }

        let data;
        try {
            const res = await fetch(`${config.Api.url}${member.id}`);
            if (res.ok) {
                data = await res.json();
            } else {
                throw new Error(`API'den geçerli bir yanıt alınamadı. Status: ${res.status}`);
            }
        } catch (error) {
            logger.error({ error: { stack: error.stack } }, "Otomatik Kayıt API Hatası");
            return interaction.editReply({
                content: "Otomatik kayıt sırasında bir sorun oluştu. Lütfen bir yetkili ile görüşün.",
            });
        }

        if (!data || !data.base || !data.base.gender || !data.base.topName || !data.base.topAge) {
            return interaction.editReply({
                content: "Geçmiş verileriniz bulunamadığı için otomatik kayıt yapılamadı. Lütfen bir yetkili ile görüşün.",
            });
        }

        const gender = data.base.gender.toLowerCase();
        const name = data.base.topName;
        const age = data.base.topAge;
        let roleToGive;
        let genderName;

        if (gender === "e" || gender === "erkek") {
            roleToGive = config.Guild.Roles.Man;
            genderName = "Erkek";
        } else if (gender === "k" || gender === "kadın") {
            roleToGive = config.Guild.Roles.Woman;
            genderName = "Kadın";
        } else {
            return interaction.editReply({
                content: `Cinsiyet veriniz ("${data.base.gender}") tanınamadığı için kayıt yapılamadı. Lütfen bir yetkili ile görüşün.`,
            });
        }

        try {
            const setName = `${
                config.Guild.Settings.tags.some((x) => member.user.username.includes(x))
                    ? config.Guild.Settings.tags[0]
                    : config.Guild.Settings.unTag
            } ${name} | ${age}`;

            await member.setNickname(setName);
            await member.roles.remove(config.Guild.Roles.Unregister);
            await member.roles.add(roleToGive);

            const logChannel = interaction.guild.channels.cache.get(config.Guild.Channels.registerLog);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(genderName === "Erkek" ? "Blue" : "Fuchsia")
                    .setDescription(
                        `**Otomatik Kayıt Gerçekleşti**\n\n• **Kaydedilen Üye:** ${member} (\`${member.id}\`)\n• **Verilen Rol:** <@&${roleToGive[0]}>\n• **Yeni İsim:** \`${setName}\`\n• **İşlemi Yapan:** ${client.user.username} (Otomatik Sistem)`
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }

            const chatChannel = interaction.guild.channels.cache.get(config.Guild.Channels.chat);
            if (chatChannel) {
                chatChannel
                    .send({
                        content: `${member}, aramıza katıldı! Otomatik olarak kayıt edildi.`,
                    })
                    .then((m) => setTimeout(() => m.delete().catch(() => {}), 15000));
            }

            await interaction.editReply({
                content: `Başarıyla kayıt oldun! Sunucumuza tekrar hoş geldin, **${name}**.`,
            });

            if (interaction.message.deletable) {
                await interaction.message.delete();
            }
        } catch (error) {
            logger.error({ error: { stack: error.stack } }, "Otomatik kayıt sırasında rol/isim atama hatası");
            await interaction.editReply({
                content: "Rolleriniz veya isminiz ayarlanırken bir hata oluştu. Lütfen bir yetkiliye bildirin.",
            });
        }
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
