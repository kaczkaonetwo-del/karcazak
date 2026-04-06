const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

/**
 * Utility for creating premium Discord embeds
 */
const ui = {
    /**
     * Designer-Grade Standard Embed
     */
    createEmbed: ({ title, description, fields = [], color = config.serverSettings.branding.primaryColor, thumbnail = true, footer = true }) => {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`\n${description}\n\u200B`)
            .setColor(color)
            .setTimestamp();

        if (fields.length > 0) {
            embed.addFields(fields.map(f => ({ ...f, name: `🔹 ${f.name}` })));
        }

        if (thumbnail && config.serverSettings.branding.thumbnailUrl) {
            embed.setThumbnail(config.serverSettings.branding.thumbnailUrl);
        }

        if (footer) {
            embed.setFooter({ text: `🛡️ ${config.serverSettings.branding.footerText} • v2.2` });
        }

        return embed;
    },

    /**
     * Math Challenge Prompt
     */
    mathPrompt: (question) => {
        return ui.createEmbed({
            title: 'Math Verification',
            description: `To verify you're human, solve the problem below:\n\n**${question}**`,
            color: '#3498db',
            thumbnail: false
        });
    },

    /**
     * Success Embed
     */
    success: (title, description, fields = []) => {
        return ui.createEmbed({
            title: `✅ ${title}`,
            description,
            fields,
            color: config.serverSettings.branding.successColor
        });
    },

    /**
     * Error Embed
     */
    error: (title, description) => {
        return ui.createEmbed({
            title: `❌ ${title}`,
            description,
            color: config.serverSettings.branding.errorColor,
            thumbnail: false
        });
    },

    /**
     * Warning Embed
     */
    warning: (title, description) => {
        return ui.createEmbed({
            title: `⚠️ ${title}`,
            description,
            color: config.serverSettings.branding.warningColor,
            thumbnail: false
        });
    }
};

module.exports = ui;
