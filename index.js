const { 
  Client, GatewayIntentBits, Partials, PermissionsBitField, 
  ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
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
  '1241572376249110680', 
  '1241574653177364590' 
];

const categoryId = '1241698488102948884'; 

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
  client.user.setActivity('Préparer vos commandes', { status: 'online', afk: false, status: 'dnd' });
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
    const guildId = interaction.guildId;
    
    await interaction.reply({
      content: 'Veuillez vérifier vos messages privés pour fournir une raison pour ouvrir un ticket.',
      ephemeral: true
    });

    try {
      const dmChannel = await user.createDM();
      
      const reasonEmbed = new EmbedBuilder()
        .setTitle('Raison du Ticket')
        .setDescription('Veuillez sélectionner une raison pour ouvrir un ticket :');

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`reason_⛏Mineur_${guildId}`)
            .setLabel('⛏ Mineur')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`reason_🌱Farmeur_${guildId}`)
            .setLabel('🌱 Farmeur')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`reason_⚔Hunter_${guildId}`)
            .setLabel('⚔ Hunter')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`reason_🎈Autres_${guildId}`)
            .setLabel('🎈 Autres')
            .setStyle(ButtonStyle.Primary)   
        );

      await dmChannel.send({
        embeds: [reasonEmbed],
        components: [row]
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du DM:', error);
      await interaction.followUp({ content: 'Une erreur est survenue lors de l\'envoi du message privé.', ephemeral: true });
    }
  } else if (interaction.customId.startsWith('reason_')) {
    const [_, reason, guildId] = interaction.customId.split('_');
    const user = interaction.user;
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      await interaction.reply({ content: 'Impossible de trouver la guilde.', ephemeral: true });
      return;
    }
    
    try {
      const creator = await guild.members.fetch(user.id);
      
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

      await user.send(`Votre ticket a été créé : ${ticketChannel}`);
      
      await ticketChannel.send(`<@${creator.id}>, <@&1241572376249110680>`)
        .then(msg => msg.delete());

    } catch (error) {
      console.error('Erreur lors de la création du canal de ticket:', error);
      await user.send('Une erreur est survenue lors de la création du canal de ticket.');
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

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}mineur`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Mineur')
      .setDescription(
        `
        Quantité Maximal par personne : 1500
        
        <:amethystore:1239655998101127178> Amethyst Ore **→ 18$/u**
        <:amethystingot:1239656055986851931> Amethyst Ingot **→ 7$/u**
        <:amethystblock:1239812254090792990> Amethyst Block **→ 63$/u**

        <:titaneore:1239656102153683065> Titane Ore **→ 28$/u**
        <:titaneingot:1239656146940461143> Titane Ingot **→ 24$/u**
        <:titaneblock:1239812307769364540> Titane Block **→ 216$/u**

        <:paladiumore:1239656246840131644> Paladium Ore **→ 55$/u**
        <:paladiumingot:1239656286619041862> Paladium Ingot **→ 32$/u**
        <:paladiumblock:1239812363213869086> Paladium Block **→ 265$/u**

        <:findium:1239656335826616361> Findium **→ 169$/u**
        <:trixium:1239656439287382067> Trixium **→ 17$/u**
        <:mixedendium:1239656381146075146> Endium Mixed **→ 3,4k$/u**
        <:palavert:1242386497949143142> Green Paladium Ingot **→ 110$/u**
        <:endiumnugget:1239656479582195723> Endium Nugget **→ 85k$/u**
        <:or:1242386483730714694> Gold Ingot **→ 8$/u**
        <:goldblock:1241534011353075835> Gold Block **→ 35$/u**
        <:fer:1242386470669647933> Iron Ingot  **→ 2$/u**
        <:goldore:1241529655136092160> Gold Ore **→ 30$/u**

        <:dancarok:1242389113517117450> Dancarok LVL 10 **→ 16k$/u**
        <:paladiumhopper:1241532941251772426> Paladium Hopper **→ 8k$/u**
        <:voidstone_minage:1241511614906241198> Minage Voidstone **→ 13k$/u**
        <:moula_stone:1241513121181470730> Dollars Stone **→ 4k$/u**
        <:corneenpaladium:1241533540647174165> Paladium Cornes **→ 23k$/u**
        <:bottle:1242389098317086800> Pré Stack Mineur  **→ 10$/u**
        <:bottle:1242389098317086800> Bottle 1K XP Mineur **→ 360$/u**

        <:amethystbuilderhand:1240417572705407170> Amethyst Builder Hand **→ 360$/u**
        <:titanebuilderhand:1240417635334754417> Titane Builder Hand **→ 799$/u**
        <:paladiumbuilderhand:1240417676325683201> Paladium Builder Hand **→ 3,4k$/u** 

        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}hunter`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Hunter')
      .setDescription(
        `       
        <:Spawnerr:1242397115855142993> Broken Spawner **→ 6k$/u**
        <:Spawnerr:1242397115855142993> Spawner Vide **→ 16k$/u**
        <:Spawner_with_fire:1242397385704079382> T4 **→ Sur mesure**
        <:palasword:1242396898741190656> Paladium Sword Farm **→ Sur mesure**
        <:bottle:1242389098317086800> Pré Stack Hunter **→ 18$/u**
        <:bottle:1242389098317086800> 1K XP Hunter **→ 260$/u**
        <:bouf:1242396897399013416> Nourriture Non Cuite **→ Sur mesure**
        <:pierreca:1242400633793937440> Stone De Capture **→ 5k$/u**
        <:sworddd:1242400635144638484> Capture Sword **→ 8k$/u**
        <:sworddd:1242400635144638484> Capture Sword (T5 , U3) **→ 11k$/u**
        <:rod:1242396896077676545> Fishing Rod **→ 150$/u**
        <:palarod:1242396895033167903>  Paladium Fishing Rod  **→ 300$/u**
        <:Cod:1242399072355352647> Tout Type De Fish **→ Sur mesure**
        
        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}soon`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Bientôt..')
      .setDescription(
        `       
        
        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}farmeur`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Farmeur')
      .setDescription(
        `       
        <:dirty:1242406564703240202> Dirt **→ 2$/u**
        <:Farmland_:1242411117226098688> Dirt Ferty **→ 6$/u**
        <:glowstonemc:1242406563323318395> Glow Stone **→ 18$/u**
        <:elevatorr:1242409484127567893> Elevator **→ 120$/u**
        <:totemmm:1242409483012014101> Totem **→ 6k$/u**

        <:graineble:1242406570164228117> Seed **→ 1$/u**
        <:pastequemc:1242406566267977798> Pastèque **→ 2$/u**
        <:watermelone:1241801223418413208> Block de Pastèque **→ 9$/u**
        <:eggplantseed:1242409485348110376> EggPlante Seed **→ 1$/u**
        \🍆 EggPlante **→ Sur mesure**
        <:seedjsp:1242409486245822466> Chervil Seed  **→ 2$/u**
        <:seedkiwano:1242409487910965299> Kiwano Seed **→ 6$/u**
        <:kiwano:1242409488963600410> Kiwano **→ 2$/u**

        <:bottle:1242389098317086800> Pré Stack Farmer **→ 25$/u**
        <:bottle:1242389098317086800> 1K XP Farmeur **→ 49$/u**

        <:seedam:1242409495670427720> Amethyst Seed Planteur **→ 2k$/u**
        <:seedti:1242409541958631435> Titane Seed Planteur **→ 6k$/u**
        <:seedpal:1242409492243546162> Paladium Seed Planteur **→ 12k$/u**
        <:seedpalvert:1242409490716954676> Green Paladium Seed Planteur **→ 21k$/u**

        <:ble:1242406567475806229> Blé **→ 1$/u**
        <:Breadd:1242406568935428109> Pain **→ 2$/u**
        <:mixedcoal:1242408044264951908> Mixed Colal **→ Sur mesure**
        
        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}baseclaim`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Base Claim')
      .setDescription(
        `       
        <:obsidian:1244229774763884574> Tout Type D'obsienne **→ Sur mesure**
        <:palaanvil:1244229773694337024> Tout Type D'enclume **→ Sur mesure**
        <:fakewater:1244229772180197397> Fake Water **→ 40$/u**
        
        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}grinder`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Grinder')
      .setDescription(
        `       
        <:grinderr:1244232885515321397> Grinder Complet **→ Sur mesure**
        <:lavabucket:1244232886920548373> Lava Bucket **→ 50$/u**

        <:paternsocket:1244232887977508915> Socket Patern **→ 400$/u**
        
        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}monture`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Montures et Golems')
      .setDescription(
        `       
        <:golemblockk:1244238263280074783> Boite à Golem **→ Sur mesure**
        <:golemblock:1244238264467062837> Boite à Golem en pièce **→ Sur mesure**

        <:foodgolem:1244238265616302122> Food **→ 2$/u**
        <:minigolem:1244238266824396821> Mini Golem **→ Sur mesure**

        <:enclotpala:1244238268191739914> Barn Entier **→ Sur mesure**
        <:monture:1244238269068349463> Monture **→ Sur mesure**
        
        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}service`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Services')
      .setDescription(
        `       
        **╰┈➤ Pour les services de construction:**
        Si les ressources sont fournies il y aura que la mains d'œuvre a payé. 

        <:bottle:1242389098317086800> Construction d'une ferme XP Miner/Farmer **→ Sur mesure**
        <:drawbridge:1242921394199597178> Construction d'une ferme à Fleurs **→ Sur mesure**
        <:kiwanoseed:1243207549872771072> Construction d'une ferme à Graines **→ Sur mesure**
        <:Spawnerr:1242397115855142993> Construction d'une ferme à T4 **→ Sur mesure**
        <:dyeningmachine:1243214464128647280> Coloration d'un Item **→ Sur mesure**
        
        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}alchimist`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Alchimist')
      .setDescription(
        `       
        <:cauldronblock:1242921342215524443> Cauldron Block **→ 950$/u**
        <:cauldroncore:1242921358741209202> Cauldron Core **→ 800$/u**
        <:cauldronblock:1242921342215524443> Chaudron Complet **→ 54k$/u**

        <:drawer:1242921411891167262> Drawer remplie de Popy **→ Sur mesure**
        <:drawer:1242921411891167262> Drawer remplie de Dandelion **→ Sur mesure**
        <:popy:1242921500730720267> Popy **→ 3$/u**
        <:dandelion:1242921374821908481>  Dandelions **→ 3$/u**

        <:jacarandalog:1242921464374624388> Jacaranda Logs **→ 3$/u**
        <:judecresiewood:1242921231582363658> Judecerises Logs **→ 3$/u**
        <:extractor:1242921439208935546> Extractor **→ 120$/u**
        <:amethysttank:1242921324108578867> Tank Vide **→ Sur mesure**
        <:titanetank:1242921558847262840> Tank Rempli **→ Sur mesure**

        <:amethystportail:1242921301715193986> Portail en Amethyst **→ Sur mesure**
        <:titanepartaille:1242921528384032830> Portail en Titane **→ Sur mesure**
        <:paladiumportail:1241769399065509910> Portail En Paladium **→ Sur mesure**
        <:drawbridge:1242921394199597178> Draw Bridge **→ Sur mesure**
        
        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}outils`)) {
    const mineurEmbed = new EmbedBuilder()
      .setTitle('Outils')
      .setDescription(
        `       
        <:paldiumpickaxe:1242937762735325264> Paladium Pickaxe **→ Sur mesure**
        <:paladiumaxe:1242936962650865704> Paladium Axe **→ Sur mesure**
        <:paladiumshovel:1242937041071640746> Paladium Shovel **→ Sur mesure**
        <:paladiumhammer:1242936941809504320> Paladium Hammer **→ Sur mesure**

        <:pickaxeofthegod:1242937721651986492> POG **→ Sur mesure**
        <:pickaxeofthegod:1242937721651986492> LVL de POG **→ Sur mesure**

        <:amethystescavator:1242937624046338110> Amethyst Escavator **→ 200$/u**
        <:titaneexcavator:1242937653171847178> Titane Escavator **→ 300$/u**
        <:paladiumescavator:1242937681709895750> Paladium Escavator **→ 850$/u**
        
        **╰┈➤ Si vous souhaitez passer commandes:**
        **<#1241583608653680722>**
          `
      )
      .setImage('https://cdn.discordapp.com/attachments/949992561278341180/1242393444509421669/Black_Gradient_Minimalist_Corporate_Business_Personal_Profile_New_LinkedIn_Banner.png?ex=664dac8f&is=664c5b0f&hm=6778fa61d7d7905574fa24b1bc6c2dbab3547ea3bcf68b863b16ed5ec8951214&') 
      .setFooter({ text: 'Cordialement - PaldiShop' });

    await message.channel.send({ embeds: [mineurEmbed] });
  }
});

client.login(token);