const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

// تكوين البوت
const config = {
    token: process.env.TOKEN,
    logChannelId: process.env.CHANNEL_ID
};

client.once('ready', () => {
    console.log(`تم تسجيل الدخول كـ ${client.user.tag}`);
});

// مراقبة تغييرات حالة الصوت
client.on('voiceStateUpdate', async (oldState, newState) => {
    const logChannel = client.channels.cache.get(config.logChannelId);
    if (!logChannel) return;

    const member = newState.member || oldState.member;
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setAuthor({
            name: member.user.tag,
            iconURL: member.user.displayAvatarURL()
        })
        .setTimestamp();

    // حالة الميوت
    if (oldState.serverMute !== newState.serverMute) {
        const auditLogs = await newState.guild.fetchAuditLogs({
            type: 24, // MEMBER_UPDATE
            limit: 1,
        });
        const muteLog = auditLogs.entries.first();
        const moderator = muteLog?.executor;

        embed.setTitle('تغيير حالة الميوت')
            .setDescription(`${member} تم ${newState.serverMute ? 'إعطاؤه' : 'إزالة'} الميوت`)
            .addFields({ 
                name: 'بواسطة',
                value: moderator ? `${moderator.tag} (${moderator.id})` : 'غير معروف'
            });
        await logChannel.send({ embeds: [embed] });
    }

    // حالة الديفن
    if (oldState.serverDeaf !== newState.serverDeaf) {
        const auditLogs = await newState.guild.fetchAuditLogs({
            type: 24, // MEMBER_UPDATE
            limit: 1,
        });
        const deafLog = auditLogs.entries.first();
        const moderator = deafLog?.executor;

        embed.setTitle('تغيير حالة الديفن')
            .setDescription(`${member} تم ${newState.serverDeaf ? 'إعطاؤه' : 'إزالة'} الديفن`)
            .addFields({ 
                name: 'بواسطة',
                value: moderator ? `${moderator.tag} (${moderator.id})` : 'غير معروف'
            });
        await logChannel.send({ embeds: [embed] });
    }

    // تسجيل نقل الأعضاء بين الرومات
    if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        const auditLogs = await newState.guild.fetchAuditLogs({
            type: 26, // MEMBER_MOVE
            limit: 1,
        });
        const moveLog = auditLogs.entries.first();
        const moderator = moveLog?.executor;

        embed.setTitle('نقل عضو')
            .setDescription(`${member} تم نقله من ${oldState.channel.name} إلى ${newState.channel.name}`)
            .addFields({ 
                name: 'بواسطة',
                value: moderator ? `${moderator.tag} (${moderator.id})` : 'غير معروف'
            });
        await logChannel.send({ embeds: [embed] });
    }

    // الطرد من الروم الصوتي
    if (oldState.channel && !newState.channel) {
        const auditLogs = await newState.guild.fetchAuditLogs({
            type: 27, // MEMBER_DISCONNECT
            limit: 1,
        });
        const disconnectLog = auditLogs.entries.first();
        const moderator = disconnectLog?.executor;

        embed.setTitle('مغادرة الروم الصوتي')
            .setDescription(`${member} غادر الروم الصوتي ${oldState.channel.name}`)
            .addFields({ 
                name: moderator ? 'تم الطرد بواسطة' : 'نوع المغادرة',
                value: moderator ? `${moderator.tag} (${moderator.id})` : 'مغادرة ذاتية'
            });
        await logChannel.send({ embeds: [embed] });
    }
});

// تسجيل دخول البوت
client.login(config.token); 