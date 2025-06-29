const { ActivityType } = require("discord.js");

module.exports = {
    Client: {
        PresenceStatus: {
            name: "Powered by GutsV",
            type: ActivityType.Playing,
            status: "idle",
        },
        Prefixes: ["."],
        Developers: [""],
        GuildEmbedColor: "FAFAFA",
        token: "",
        id: "",
        Messages: {
            NoAuth: "Bu komutu kullanmak için yeterli yetkiye sahip değilsin.",
            Member: "Lütfen geçerli bir kullanıcı etiketleyin veya ID'sini girin.",
            ItSelf: "Kendini kayıt edemezsin.",
            Bot: "Botları kayıt edemezsin.",
            NoYt: "Bu kullanıcının rollerini yönetme yetkim yok.",
            Registered: "Bu kullanıcı zaten sunucuda kayıtlı.",
            SAuth: "Kayıt etmeye çalıştığın kişinin rolü senden daha yüksek veya aynı seviyede.",
            TagMode: "Sunucumuzda tag zorunluluğu bulunmaktadır. Kayıt olmak için isminize tagımızı almalısınız.",
            PunUser: "Bu kullanıcı cezalı olduğu için kayıt edilemez.",
            NoName: "Lütfen geçerli bir isim ve yaş girin.",
            Error: "İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        },
        Emojis: {
            Onay: "✅",
            Iptal: "❌",
        },
    },
    Guild: {
        GuildId: "",
        Channels: {
            voiceChannel: "",
            registerLog: "",
            chat: "",
            welcome: "",
            quarantine: "KARANTINA_KANAL_ID",
            modLog: "MOD_LOG_KANAL_ID"
        },
        Roles: {
            RegisterHammer: [""],
            Founding: ["KURUCU_ROL_ID_1"],
            Man: [""],
            Woman: [""],
            Unregister: [""],
            Booster: "BOOSTER_ROL_ID",
            Vip: "VIP_ROL_ID",
            Tag: "TAG_ALAN_ROL_ID",
            Suspect: "SUPHELI_ROL_ID",
            Jailed: "CEZALI_ROL_ID",
            BannedTag: "YASAKLI_TAG_ROL_ID",
            Quarantine: "KARANTINA_ROL_ID",
            Safe: "GUVENLI_ROL_ID",
            Badge: "ROZET_ROL_ID"
        },
        Settings: {
            tagMode: false,
            tags: ["[TAG]"],
            unTag: "•",
        },
    },
    Api: {
        useCheck: true,
        url: "https://api.gutsv.xyz/api/users/",
        timeout: 3000,
        retries: 1,
    },
    mongoUri: "mongodb://localhost:27017/gutsvbot",
    registerCategory: "1284189766857789511",
};
