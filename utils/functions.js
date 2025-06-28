const { Message } = require("discord.js");

function getEmoji(guild, emojiName) {
    const emoji = guild.emojis.cache.find((emoji) => emoji.name === emojiName);
    return emoji ? emoji.toString() : "";
}

/**
 * @this {Promise<Message>}
 */
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

module.exports = {
    getEmoji,
};
