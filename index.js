const { Client, GatewayIntentBits, Partials, PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType, User } = require('discord.js');
const { token, prefix } = require('./config.json');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.Channel, Partials.User]
});

const allowedRoles = [
  '986565804051013692',
  '1077133650732257374',
  '1037403602127433789' 
];

const categoryId = '1241718363458375741'; 

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity('💖'); 
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}ticketconfig`)) {
    const embed = new EmbedBuilder()
      .setTitle('Création de Ticket')
      .setDescription('Cliquez sur le bouton 📩 ci-dessous pour créer un ticket.');

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('📩 Créer un ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
      .addComponents(button);

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'create_ticket') {
    const user = interaction.user;
    const guild = interaction.guild;
    const creator = await guild.members.fetch(user.id);
    
    await interaction.reply({
      content: 'Veuillez vérifier vos messages privés pour fournir une raison pour ouvrir un ticket.',
      ephemeral: true
    });

    try {
      const dmChannel = await user.createDM();
      await dmChannel.send('Veuillez fournir une raison pour ouvrir un ticket :');

      const filter = response => response.author.id === user.id;

      const collected = await dmChannel.awaitMessages({
        filter,
        max: 1,
        time: 60000,
        errors: ['time']
      });
      const reason = collected.first().content;

      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        },
        {
          id: client.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        }
      ];

      allowedRoles.forEach(roleId => {
        permissionOverwrites.push({
          id: roleId,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        });
      });

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        topic: `Ticket de ${user.username} - Raison: ${reason}`,
        permissionOverwrites: permissionOverwrites,
        parent: categoryId 
      });

      const closeEmbed = new EmbedBuilder()
        .setTitle('Ticket Créé')
        .setDescription(`Ticket créé par ${user}\nRaison: ${reason}`);

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Fermer le ticket')
        .setStyle(ButtonStyle.Danger);

      const closeRow = new ActionRowBuilder()
        .addComponents(closeButton);

      await ticketChannel.send({
        embeds: [closeEmbed],
        components: [closeRow]
      });

      await dmChannel.send(`Votre ticket a été créé : ${ticketChannel}`);
      
      await ticketChannel.send(`<@${creator.id}>, <@&1241572376249110680>`)
        .then(msg => msg.delete());

      await interaction.deleteReply();
    } catch (error) {
      console.error('Erreur lors de la création du canal de ticket:', error);
      if (error.code === 'time') {
        await user.send('Vous n\'avez pas fourni de raison à temps. Veuillez réessayer.');
      } else {
        await user.send('Une erreur est survenue lors de la création du canal de ticket.');
      }
    }
  } else if (interaction.customId === 'close_ticket') {
    const channel = interaction.channel;

    try {
      await channel.delete();
      await interaction.reply('Le ticket a été fermé avec succès.');
    } catch (error) {
      console.error('Erreur lors de la fermeture du canal de ticket:', error);
      await interaction.reply('Une erreur est survenue lors de la fermeture du ticket.');
    }
  }
});

client.login(token);