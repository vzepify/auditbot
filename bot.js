const { Client, GatewayIntentBits, EmbedBuilder, AuditLogEvent, Events } = require('discord.js');
const fs = require('fs');
const moment = require('moment');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMembers
    ]
});

// Helper to load config dynamically
function getConfig() {
    return JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
}

async function logAction(guild, actionType, target) {
    const config = getConfig();
    const logChannel = guild.channels.cache.get(config.logChannelId);
    if (!logChannel) return;

    // Fetch the latest audit log entry for this action
    const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: actionType,
    });

    const auditEntry = fetchedLogs.entries.first();
    if (!auditEntry) return;

    const { executor, target: entryTarget } = auditEntry;

    // Logic: Only log if executor is Admin AND not in the exclusion list
    const member = await guild.members.fetch(executor.id);
    if (!member.permissions.has('Administrator')) return;
    if (config.excludedUsers.includes(executor.id)) return;

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
}

// Event Listeners
client.on(Events.GuildRoleUpdate, (oldR, newR) => logAction(newR.guild, AuditLogEvent.RoleUpdate, `Role: ${newR.name}`));
client.on(Events.ChannelUpdate, (oldC, newC) => logAction(newC.guild, AuditLogEvent.ChannelUpdate, `Channel: ${newC.name}`));
client.on(Events.GuildMemberRemove, (member) => logAction(member.guild, AuditLogEvent.MemberKick, `Member: ${member.user.tag}`));

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.login(getConfig().token);

module.exports = client; // Export for dashboard status