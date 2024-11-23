// Import delle librerie
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs'); // Per leggere/scrivere il file JSON

// Variabili di ambiente
const clientId = '1003810106422612009'; // Il tuo client ID
const guildId = '1309645718717202463';  // Il tuo server ID
const token = process.env.DISCORD_TOKEN; // Il token del bot

// Creazione del client Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] // Aggiungi intent per i membri
});

// Funzione per caricare il file JSON contenente i welcome role per ogni server
function loadWelcomeRoles() {
  try {
    const data = fs.readFileSync('welcomeRoles.json');
    return JSON.parse(data);
  } catch (error) {
    return {}; // Se il file non esiste o è vuoto, ritorna un oggetto vuoto
  }
}

// Funzione per salvare il file JSON con i welcome role
function saveWelcomeRoles(welcomeRoles) {
  try {
    fs.writeFileSync('welcomeRoles.json', JSON.stringify(welcomeRoles, null, 2));
  } catch (error) {
    console.error('Errore nel salvataggio dei welcome role:', error);
  }
}

// Avvio del bot
client.login(token);

// Evento ready: Il bot è online
client.on('ready', () => {
  console.log(`Il bot è ora online con il tag: ${client.user.tag}`);
  client.user.setActivity('/listacomandi', { type: 'WATCHING' });  // WATCHING indica che il bot sta guardando qualcosa
});

// Gestione evento per aggiungere il ruolo di benvenuto a nuovi membri
client.on('guildMemberAdd', async (member) => {
  const welcomeRoles = loadWelcomeRoles();
  const welcomeRoleId = welcomeRoles[member.guild.id];

  if (welcomeRoleId) {
    try {
      const role = member.guild.roles.cache.get(welcomeRoleId);
      if (role) {
        await member.roles.add(role); // Aggiungi il ruolo al membro
        console.log(`Ruolo di benvenuto aggiunto a ${member.user.tag}`);
      } else {
        console.log('Ruolo di benvenuto non trovato!');
      }
    } catch (error) {
      console.error('Errore nell\'aggiungere il ruolo:', error);
    }
  }
});

// Creazione dei comandi
const commands = [
  // Comando ping
  new SlashCommandBuilder().setName('ping').setDescription('🌌 Mostra la latenza del bot'),

  // Comando avatar
  new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('📷 Mostra l\'avatar di un utente')
    .addUserOption(option =>
      option.setName('utente')
        .setDescription('L\'utente di cui visualizzare l\'avatar')
        .setRequired(false)
    ),

  // Comando serverid
  new SlashCommandBuilder()
    .setName('serverid')
    .setDescription('🆔 Visualizza l\' ID del server'),

  // Comando userid
  new SlashCommandBuilder()
    .setName('userid')
    .setDescription('🆔 Visualizza il tuo id')
    .addUserOption(option =>
      option.setName('utente')
        .setDescription('L\'utente di cui visualizzare l\' id')
        .setRequired(true)
    ),

  // Lista comandi
  new SlashCommandBuilder()
    .setName('listacomandi')
    .setDescription('📚 Visualizza tutti i comandi del bot'),

  // Nuovo comando /setwelcomerole
  new SlashCommandBuilder()
    .setName('setwelcomerole')
    .setDescription('🎉 Imposta il ruolo di benvenuto per questo server')
    .addRoleOption(option =>
      option.setName('ruolo')
        .setDescription('Il ruolo di benvenuto da assegnare ai nuovi membri')
        .setRequired(true)
    )
    .setDMPermission(false), // Disabilita l’esecuzione in DM

  // Comando /listacomandi2 (solo per un utente specifico)
  new SlashCommandBuilder()
    .setName('listacomandi2')
    .setDescription('❌ Questo comando è riservato a m.attex.')
];

// Registrazione dei comandi
const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Inizio registrazione dei comandi slash...');

    // Registrazione dei comandi nella guild specificata
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Comandi slash registrati con successo!');
  } catch (error) {
    console.error(error);
  }
})();

// Gestione dei comandi
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Comando /ping
  if (commandName === 'ping') {
    const latency = Date.now() - interaction.createdTimestamp;
    let color = '#00ff00'; // Default: verde

    if (latency > 300) color = '#ff0000'; // Rosso per latenza alta
    else if (latency > 100) color = '#ffff00'; // Giallo per latenza media

    const pingEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🏓 Pong!')
      .setDescription(`La latenza del bot è di: *${latency}ms*.`)
      .setFooter({ text: `Richiesto da ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [pingEmbed] });
  }

  // Comando /avatar
  if (commandName === 'avatar') {
    const user = interaction.options.getUser('utente') || interaction.user;

    const avatarEmbed = new EmbedBuilder()
      .setColor('#008080')
      .setTitle(`Ecco l'avatar di: ${user.tag}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setFooter({ text: `Richiesto da ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [avatarEmbed] });
  }

  // Comando /serverid
  if (commandName === 'serverid') {
    const serverId = interaction.guild.id;

    const idEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Ecco l\'id di questo server:')
      .setDescription(serverId)
      .setFooter({ text: '🔵 m.attex' })
      .setTimestamp();

    await interaction.reply({ embeds: [idEmbed], ephemeral: true });
  }

  // Comando /userid
  if (commandName === 'userid') {
    const user = interaction.options.getUser('utente') || interaction.user;

    const userEmbed = new EmbedBuilder()
      .setColor('Blurple')
      .setTitle('Ecco l\'ID dell\'utente:')
      .setDescription(user.id)
      .setFooter({ text: '🔵 m.attex' })
      .setTimestamp();

    await interaction.reply({ embeds: [userEmbed], ephemeral: true });
  }

  // Comando /listacomandi
  if (commandName === 'listacomandi') {
    const embedComandi = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('📚 Lista comandi del bot')
      .setDescription('*/avatar* - Ti mostra l\' avatar dell\' utente specificato\n */ping* - Ti mostra la latenza attuale del bot \n */serverid* - Ti mostra l\' id del server \n */userid* - Ti mostra l\' id dell\' utente specificato')

    await interaction.reply({embeds: [embedComandi], ephemeral: true});
  }

  // Comando /setwelcomerole
  if (commandName === 'setwelcomerole') {
    // Verifica che l'utente sia il proprietario del server
    if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== '893226260786978856') {
      return interaction.reply({
        content: '❌ Solo il proprietario del server e m.attex possono eseguire questo comando.',
        ephemeral: true,
      });
    }

    // Ottieni il ruolo scelto
    const role = interaction.options.getRole('ruolo');
    if (role) {
      const welcomeRoles = loadWelcomeRoles();
      welcomeRoles[interaction.guild.id] = role.id; // Imposta l'ID del ruolo per questo server
      saveWelcomeRoles(welcomeRoles); // Salva le modifiche nel file

      await interaction.reply({
        content: `✅ Ruolo di benvenuto impostato correttamente a: ${role.name}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: '❌ Ruolo non valido.',
        ephemeral: true,
      });
    }
  }

});
