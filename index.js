const { 
    Client, 
    GatewayIntentBits, 
    Events, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    REST,
    Routes,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const config = require('./config.json');
const ui = require('./utils/ui');

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ]
});

/**
 * Verification Session Tracker
 */
const verificationSessions = new Map();

/**
 * Generate a simple random math task
 */
function generateMath() {
    const operators = ['+', '-'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    const num1 = Math.floor(Math.random() * 30) + 10;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    let question, answer;
    if (op === '+') {
        question = `${num1} + ${num2}`;
        answer = num1 + num2;
    } else {
        question = `${num1} - ${num2}`;
        answer = num1 - num2;
    }
    
    return { question, answer: answer.toString() };
}

// Command Definitions
const commands = [
    {
        name: 'setup',
        description: config.commands.setup.description,
        default_member_permissions: PermissionFlagsBits.ManageRoles.toString()
    },
    {
        name: 'help',
        description: config.commands.help.description,
    }
];

/**
 * Register Slash Commands
 */
async function registerCommands(guildId) {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        if (guildId) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body: commands }
            );
        }
    } catch (error) {
        console.error(`[REST Error] Guild ${guildId}:`, error.message);
    }
}

client.once(Events.ClientReady, async c => {
    console.log(`✅ ${c.user.tag} is online!`);
    console.log(`🤖 Bot is ready - Karczak Scripts Pro Edition`);
    
    const guilds = c.guilds.cache.map(g => g.id);
    for (const guildId of guilds) {
        await registerCommands(guildId);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    // Safety check: Only handle interactions in guilds
    if (!interaction.guild) return;

    const logsChannel = interaction.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);

    try {
        // ---------------------------------------------------------
        // HANDLE SLASH COMMANDS
        // ---------------------------------------------------------
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'setup') {
                const setupButton = new ButtonBuilder()
                    .setCustomId('verify_init')
                    .setLabel('🛡️ Start Verification')
                    .setStyle(ButtonStyle.Success);

                const row = new ActionRowBuilder().addComponents(setupButton);

                const setupEmbed = ui.createEmbed({
                    title: 'Karczak Scripts Security',
                    description: 'To gain access to the server, please complete our security verification.\n\n' +
                                 '**Instructions:**\n' +
                                 '1. Click the button below.\n' +
                                 '2. Solve the simple math task in the popup.\n' +
                                 '3. Submit the answer to get verified.',
                    fields: [
                        { name: 'Security', value: 'Interactive Math Verification', inline: true },
                        { name: 'Access', value: 'Instant Server Entrance', inline: true }
                    ]
                });

                await interaction.reply({ content: '✅ System deployed.', flags: [MessageFlags.Ephemeral] });
                await interaction.channel.send({ embeds: [setupEmbed], components: [row] });
            }

            if (interaction.commandName === 'help') {
                const helpEmbed = ui.createEmbed({
                    title: 'Help Center',
                    description: 'Manage your server verification with ease.',
                    fields: [
                        { name: '/setup', value: 'Deploy verification embed' },
                        { name: '/help', value: 'Show this info' }
                    ]
                });
                await interaction.reply({ embeds: [helpEmbed], flags: [MessageFlags.Ephemeral] });
            }
        }

        // ---------------------------------------------------------
        // HANDLE BUTTONS
        // ---------------------------------------------------------
        if (interaction.isButton()) {
            if (interaction.customId === 'verify_init') {
                // Check Account Age
                const minAgeDays = config.serverSettings.verificationMinAgeDays || 7;
                const accountAgeDays = Math.floor((Date.now() - interaction.user.createdTimestamp) / (1000 * 60 * 60 * 24));

                if (accountAgeDays < minAgeDays) {
                    return await interaction.reply({ 
                        embeds: [ui.error('Security Block', `Account must be at least **${minAgeDays} days** old.\nYour account age: **${accountAgeDays} days**`)], 
                        flags: [MessageFlags.Ephemeral] 
                    });
                }

                // Check Role
                if (interaction.member.roles.cache.has(process.env.VERIFICATION_ROLE_ID)) {
                    return await interaction.reply({ 
                        embeds: [ui.warning('Already Verified', 'You already have full access!')], 
                        flags: [MessageFlags.Ephemeral] 
                    });
                }

                // Generate Challenge
                const { question, answer } = generateMath();
                verificationSessions.set(interaction.user.id, answer);

                const modal = new ModalBuilder()
                    .setCustomId('math_modal')
                    .setTitle('Security Challenge');

                const mathInput = new TextInputBuilder()
                    .setCustomId('math_answer')
                    .setLabel(`What is ${question}?`)
                    .setPlaceholder('Enter the answer here...')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(mathInput));
                await interaction.showModal(modal);
            }
        }

        // ---------------------------------------------------------
        // HANDLE MODAL SUBMIT
        // ---------------------------------------------------------
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'math_modal') {
                const userAnswer = interaction.fields.getTextInputValue('math_answer').trim();
                const expectedAnswer = verificationSessions.get(interaction.user.id);

                if (userAnswer === expectedAnswer) {
                    verificationSessions.delete(interaction.user.id);
                    await completeVerification(interaction, logsChannel, `Answered ${userAnswer} (Correct)`);
                } else {
                    const failEmbed = ui.error('Verification Failed', 'Incorrect answer. Please try again with a new problem.');
                    await interaction.reply({ embeds: [failEmbed], flags: [MessageFlags.Ephemeral] });
                    
                    if (logsChannel) {
                        const failLog = ui.createEmbed({
                            title: '❌ Verification Failed',
                            description: `${interaction.user.tag} entered wrong answer: **${userAnswer}** (Expected: **${expectedAnswer}**)`,
                            color: config.serverSettings.branding.errorColor
                        });
                        await logsChannel.send({ embeds: [failLog] });
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Interaction Error]:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ An internal error occurred.', flags: [MessageFlags.Ephemeral] }).catch(() => {});
        }
    }
});

/**
 * Finalize role assignment
 */
async function completeVerification(interaction, logsChannel, extraInfo = '') {
    try {
        const roleId = process.env.VERIFICATION_ROLE_ID;
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            return await interaction.reply({ 
                embeds: [ui.error('Role Missing', 'System error: Verification role not found.')], 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        await interaction.member.roles.add(role);

        const successEmbed = ui.success('Verified!', 'You now have full access to Karczak Scripts. Welcome!');
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [successEmbed], flags: [MessageFlags.Ephemeral] });
        } else {
            await interaction.reply({ embeds: [successEmbed], flags: [MessageFlags.Ephemeral] });
        }

        if (logsChannel) {
            const logEntry = ui.createEmbed({
                title: '👤 User Verified',
                description: `${interaction.user.tag} successfully joined.`,
                color: config.serverSettings.branding.successColor,
                fields: [
                    { name: 'Verification Data', value: extraInfo },
                    { name: 'Joined On', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                ]
            });
            await logsChannel.send({ embeds: [logEntry] });
        }
    } catch (error) {
        console.error('Finalize error:', error);
    }
}

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('❌ Login Error:', err.message);
});

// Global Error Handlers
process.on('unhandledRejection', error => console.error('❌ Unhandled rejection:', error));
process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});
