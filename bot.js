require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, AuditLogEvent, Events } = require('discord.js');
const moment = require('moment');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMembers
    ]
});

async function logAction(guild, actionType, target) {
    const logChannelId = process.env.LOG_CHANNEL_ID;
    const excludedUsers = process.env.EXCLUDED_USERS ? process.env.EXCLUDED_USERS.split(',') : [];
    
    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    // Wait a moment for audit logs to process
    setTimeout(async () => {
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: actionType,
        });

        const auditEntry = fetchedLogs.entries.first();
        if (!auditEntry) return;

        const { executor } = auditEntry;

        // Logic: Only log if executor is Admin AND not in the exclusion list
        const member = await guild.members.fetch(executor.id);
        if (!member.permissions.has('Administrator')) return;
        if (excludedUsers.includes(executor.id)) return;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Custom Audit Log')
            .setColor(0x5865F2)
            .addFields(
                { name: 'Executor', value: `${executor.tag} (\`${executor.id}\`)`, inline: true },
                { name: 'Action', value: `Changed ${target}`, inline: true },
                { name: 'Timestamp', value: moment().format('YYYY-MM-DD HH:mm:ss') }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    }, 2000); // 2 second delay ensures audit logs are populated
}

// Event Listeners
client.on(Events.GuildRoleUpdate, (oldR, newR) => logAction(newR.guild, AuditLogEvent.RoleUpdate, `Role: ${newR.name}`));
client.on(Events.ChannelUpdate, (oldC, newC) => logAction(newC.guild, AuditLogEvent.ChannelUpdate, `Channel: ${newC.name}`));
client.on(Events.GuildMemberRemove, (member) => logAction(member.guild, AuditLogEvent.MemberKick, `Member: ${member.user.tag}`));

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.login(process.env.DISCORD_TOKEN);
