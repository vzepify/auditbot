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

    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    try {
        // Wait 2 seconds to allow Discord's Audit Log to update
        await new Promise(resolve => setTimeout(resolve, 2000));

        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: actionType });
        const auditEntry = fetchedLogs.entries.first();
        if (!auditEntry) return;

        const { executor } = auditEntry;

        // Force fetch the member to ensure we have their latest roles/permissions
        const member = await guild.members.fetch(executor.id).catch(() => null);
        
        if (!member) return;

        // CHECK: Does this person have ANY role with 'Administrator' enabled?
        // This includes the owner and anyone with an Admin-level role.
        if (!member.permissions.has('Administrator')) return;

        // Skip if they are on the exclusion list
        if (excludedUsers.includes(executor.id)) return;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Admin Action Log')
            .setColor(0x5865F2)
            .addFields(
                { name: 'Admin User', value: `${executor.tag} (\`${executor.id}\`)`, inline: true },
                { name: 'Action Taken', value: `Changed ${target}`, inline: true },
                { name: 'Timestamp', value: moment().format('YYYY-MM-DD HH:mm:ss') }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    } catch (err) {
        console.error("Audit log error:", err);
    }
}

// Listeners
client.on(Events.GuildRoleUpdate, (oldR, newR) => logAction(newR.guild, AuditLogEvent.RoleUpdate, `Role: ${newR.name}`));
client.on(Events.ChannelUpdate, (oldC, newC) => logAction(newC.guild, AuditLogEvent.ChannelUpdate, `Channel: ${newC.name}`));
client.on(Events.GuildMemberRemove, (member) => logAction(member.guild, AuditLogEvent.MemberKick, `Member: ${member.user.tag}`));

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

client.login(process.env.DISCORD_TOKEN);

require('./server.js');
