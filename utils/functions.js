const { Message, EmbedBuilder } = require("discord.js");
const config = require("../config.js");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function getEmoji(guild, emojiName) {
    const emoji = guild.emojis.cache.find((emoji) => emoji.name === emojiName);
    return emoji ? emoji.toString() : "";
}

Promise.prototype.delete = function (options = {}) {
    if (typeof options !== "object") throw new TypeError("Invalid Argument: Options");
    let { timeout = 0 } = options;
    if (timeout && (isNaN(timeout) || timeout.toString().includes("-"))) throw new TypeError("Invalid Option: timeout");

    if (!this) return;

    return this.then((message) => {
        if (!message.deletable) return;
        return new Promise(async (resolve, reject) => {
            try {
                setTimeout(() => {
                    return resolve(message.delete());
                }, timeout);
            } catch (error) {
                return reject(error);
            }
        });
    });
};

async function registerHelper(member, auth, name, age, gender, message, skipApi = false, apiData = null) {
    let cinsiyet;
    if (gender === "man") {
        await member.roles.add(config.Guild.Roles.Man).catch(console.error);
        cinsiyet = "Erkek";
    } else if (gender === "woman") {
        await member.roles.add(config.Guild.Roles.Woman).catch(console.error);
        cinsiyet = "Kadın";
    }

    let tag = config.Guild.Settings.tags.some((x) => member.user.username.includes(x))
        ? config.Guild.Settings.tags[0]
        : config.Guild.Settings.unTag;
    let setName = `${tag} ${name} | ${age}`;
    
    await Promise.all([
        member.setNickname(setName).catch(console.error),
        member.roles.remove(config.Guild.Roles.Unregister).catch(console.error)
    ]);

    let rozetAldı = false;
    
    if (!apiData && config.Api.useCheck && !skipApi) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const res = await fetch(`${config.Api.url}${member.id}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                apiData = await res.json();
            }
        } catch (error) {
            apiData = null;
        }
    }

    if (apiData?.status === 'success') {
        const rolePromises = [];
        if (config.Guild.Roles.Vip) rolePromises.push(member.roles.add(config.Guild.Roles.Vip).catch(() => {}));
        if (config.Guild.Roles.Badge) {
            rolePromises.push(member.roles.add(config.Guild.Roles.Badge).catch(() => {}));
            rozetAldı = true;
        }
        await Promise.all(rolePromises);
    }
    
    let GutSvUsername = apiData?.data?.username || 'Bilinmiyor';
    let GutSvStatus = apiData?.status || 'Bilinmiyor';

    const logChannel = message.guild.channels.cache.get(config.Guild.Channels.registerLog);
    const chatChannel = message.guild.channels.cache.get(config.Guild.Channels.chat);
    
    const promises = [];

    if (logChannel) {
        let infData = {};
        try {
            const res = await fetch(`https://api.gutsv.xyz/api/inf/${member.id}`);
            if (res.ok) infData = await res.json();
        } catch (e) {}
        let guildTag = infData.guild_tag || 'Yok';
        let bio = infData.bio || 'Yok';
        let hitap = infData.pronouns || 'Yok';
        let userData = {};
        try {
            const res = await fetch(`${config.Api.url}${member.id}`);
            if (res.ok) userData = await res.json();
        } catch (e) {}
        let gutsvUsername = userData.username || 'Yok';
        let gutsvStatus = userData.status !== undefined ? String(userData.status) : 'Yok';
        const logEmbed = new EmbedBuilder()
            .setColor(gender === "man" ? "Blue" : "Fuchsia")
            .setDescription(
                `**Bir Kayıt Gerçekleşti**\n\n• **Kaydeden Yetkili:** ${auth} (\`${auth.id}\`)\n• **Kaydedilen Üye:** ${member} (\`${member.id}\`)\n• **Yeni İsim:** \`${setName}\`\n• **Cinsiyet:** **${cinsiyet}**\n• **Biosu:** ${bio}\n• **Hitap:** ${hitap}\n• **Guild Tagı:** ${guildTag}\n• **GutSv Username:** ${gutsvUsername}\n• **GutSv Status:** ${gutsvStatus}\n• **Rozet:** ${rozetAldı ? 'Verildi' : 'Verilmedi'}`
            )
            .setTimestamp();
        promises.push(logChannel.send({ embeds: [logEmbed] }));
    }

    if (chatChannel) {
        promises.push(
            chatChannel.send({ content: `${member}, aramıza hoş geldin! Seninle birlikte daha güçlüyüz!` })
                .then((m) => setTimeout(() => m.delete().catch(() => {}), 15000))
        );
    }

    await Promise.all(promises);

    try {
        member.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("Kayıt Başarılı!")
                    .setDescription(`Sunucumuza başarıyla kayıt oldun!\n\nYeni ismin: **${setName}**\nCinsiyet: **${cinsiyet}**\n${rozetAldı ? 'Ayrıca güvenli kullanıcı olduğun için sana özel rozet rolü verildi!' : 'GutSv API sonucu güvenli kullanıcı olarak işaretlenmediğin için rozet alamadın.'}\nYetkililerimiz seninle ilgilenecek.`)
            ]
        }).catch(() => {});
    } catch (e) {}

    try {
        const { User, Log } = require('./db');
        Promise.all([
            User.findOneAndUpdate(
                { userId: member.id },
                {
                    userId: member.id,
                    username: member.user.tag,
                    $push: {
                        registerHistory: {
                            date: new Date(),
                            name,
                            age,
                            gender,
                            staff: auth.id
                        }
                    }
                },
                { upsert: true, new: true }
            ),
            Log.create({
                type: 'register',
                userId: member.id,
                staff: auth.id,
                date: new Date(),
                details: { name, age, gender }
            })
        ]).catch(() => {});
    } catch (e) { }
}

module.exports = {
    getEmoji,
    registerHelper
}; 