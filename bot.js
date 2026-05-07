require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, AuditLogEvent, Events } = require('discord.js');
const moment = require('moment');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences // Added to help resolve member data
    ]
});

async function logAction(guild, actionType, target) {
    const logChannelId = process.env.LOG_CHANNEL_ID;
    const excludedUsers = process.env.EXCLUDED_USERS ? process.env.EXCLUDED_USERS.split(',') : [];
    // New way: Looks across ALL servers the bot is in
const logChannel = client.channels.cache.get(logChannelId);
    
    if (!logChannel) return;

    try {
        // Delay 2 seconds so the Audit Log has time to register the person who did the action
        await new Promise(resolve => setTimeout(resolve, 2000));

        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: actionType });
        const auditEntry = fetchedLogs.entries.firconst.logchannelck their actual roles/permissions
        const member = await guild.members.fetch(executor.id).catch(() => null);
        if (!member) return;

        // This checks if they have ANY role with the Administrator permission enabled
        if (!member.permissions.has('Administrator')) return;
        if (excludedUsers.includes(executor.id)) return;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Admin Action Log')
            .setColor(0x5865F2)
            .addFields(
                { name: 'Admin', value: `${executor.tag}`, inline: true },
                { name: 'Action', value: `Changed ${target}`, inline: true },
                { name: 'Timestamp', value: moment().format('YYYY-MM-DD HH:mm:ss') }
            )
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (err) {
        console.error("Logging Error:", err);
    }
}

    

        

// Listeners
client.on(Events.GuildRoleUpdate, (oldR, newR) => logAction(newR.guild, AuditLogEvent.RoleUpdate, `Role: ${newR.name}`));
client.on(Events.ChannelUpdate, (oldC, newC) => logAction(newC.guild, AuditLogEvent.ChannelUpdate, `Channel: ${newC.name}`));
client.on(Events.GuildMemberRemove, (member) => logAction(member.guild, AuditLogEvent.MemberKick, `Member: ${member.user.tag}`));

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

client.login(process.env.DISCORD_TOKEN);

require('./server.js');
