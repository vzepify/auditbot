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
    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel) return;

    try {
        // 1. Wait a moment for the log to write
        await new Promise(resolve => setTimeout(resolve, 2000));

        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: actionType });
        const auditEntry = fetchedLogs.entries.first();
        
        if (!auditEntry) return;

        const { executor, createdTimestamp } = auditEntry;

        // 2. THE "RIGHT NOW" FILTER
        // Ignore any audit log entry older than 15 seconds
        const fifteenSecondsAgo = Date.now() - 15000;
        if (createdTimestamp < fifteenSecondsAgo) {
            // This was an old action from earlier today or yesterday, ignore it.
            return; 
        }

        // 3. Admin Check (Optional: keep this if you only want Admin actions)
        const member = await guild.members.fetch(executor.id).catch(() => null);
        if (!member || !member.permissions.has('Administrator')) return;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Live Admin Log')
            .setDescription(`Recent action in: **${guild.name}**`)
            .setColor(0x00FF00) // Green for live logs
            .addFields(
                { name: 'User', value: `${executor.tag}`, inline: true },
                { name: 'Action', value: `Changed ${target}`, inline: true }
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
