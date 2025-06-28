const { ActivityType } = require("discord.js");

module.exports = {
    Client: {
        PresenceStatus: {
            name: "Powered by GutsV",
            type: ActivityType.Playing,
            status: "idle",
        },
        Prefixes: ["."],
        Developers: ["340047062068494337"],
        GuildEmbedColor: "FAFAFA",
        token: "",
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
        GuildId: "1251101772680921098",
        Channels: {
            voiceChannel: "1338504831438028823",
            registerLog: "1340309415609237625",
            chat: "CHAT_KANAL_ID",
            welcome: "WELCOME_KANAL_ID",
        },
        Roles: {
            RegisterHammer: ["YETKILI_ROL_ID_1", "YETKILI_ROL_ID_2"],
            Founding: ["KURUCU_ROL_ID_1"],
            Man: ["ERKEK_ROL_ID_1", "ERKEK_ROL_ID_2"],
            Woman: ["KADIN_ROL_ID_1", "KADIN_ROL_ID_2"],
            Unregister: ["KAYITSIZ_ROL_ID"],
            Booster: "BOOSTER_ROL_ID",
            Vip: "VIP_ROL_ID",
            Tag: "TAG_ALAN_ROL_ID",
            Suspect: "SUPHELI_ROL_ID",
            Jailed: "CEZALI_ROL_ID",
            BannedTag: "YASAKLI_TAG_ROL_ID",
        },
        Settings: {
            tagMode: false,
            tags: ["[TAG]"],
            unTag: "[UNTAG]",
        },
    },
    Api: {
        useCheck: true,
        url: "https://api.gutsv.xyz/api/users/",
    },
};
