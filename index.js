require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* =====================
   ESTADO DEL JUEGO
===================== */
const games = new Map();

/* =====================
   LISTAS
===================== */
const lists = {
  tier1: ["Nurse","Blight","Hillbilly","Ghoul","Krasue","Singularity","Spirit"],
  tier2: ["Twins","Dark Lord","Oni","Huntress","Artist","Mastermind","Cenobite"],
  tier3: ["Plague","Doctor","Clown","Nightmare","Executioner","Xenomorph","Unknown","Good Guy","Lich","Houndmaster"],
  tier4: ["Wraith","Deathslinger","Animatronic","Demogorgon","Dredge","Onryo"],
  tier5: ["Trickster","Legion","Cannibal","Hag","Pig","GhostFace","Trapper"]
};

const pickRandom = (arr, n) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);

/* =====================
   BOTONES
===================== */
function createButtons(remaining, action) {
  const rows = [];
  let row = new ActionRowBuilder();

  remaining.forEach((killer, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${action}:${killer}`)
        .setLabel(killer)
        .setStyle(action === "pick"
          ? ButtonStyle.Success
          : ButtonStyle.Danger)
    );

    if ((i + 1) % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder();
    }
  });

  if (row.components.length) rows.push(row);
  return rows;
}

/* =====================
   MENSAJE DE ESTADO
===================== */
function buildStatusMessage(game, currentPlayer, action) {
  const p1 = game.pick1 ?? "<sin definir>";
  const p2 = game.pick2 ?? "<sin definir>";

  return (
    `🟢 **Partida 1**: ${p1}\n` +
    `🔵 **Partida 2**: ${p2}\n\n` +
    `🩸 **Killers restantes (${game.remaining.length})**:\n` +
    game.remaining.map(k => `• ${k}`).join("\n") +
    `\n\n🎮 Turno de <@${currentPlayer}>\n` +
    `Acción: **${action.toUpperCase()}**`
  );
}

/* =====================
   COMANDO /pool
===================== */
const poolCommand = new SlashCommandBuilder()
  .setName("pool")
  .setDescription("Genera el pool y lanza la moneda")
  .addUserOption(o =>
    o.setName("cara")
     .setDescription("Jugador asignado a CARA")
     .setRequired(true))
  .addUserOption(o =>
    o.setName("cruz")
     .setDescription("Jugador asignado a CRUZ")
     .setRequired(true));

/* =====================
   REGISTRO SLASH
===================== */
client.once("ready", async () => {
  console.log(`🤖 Conectado como ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: [poolCommand.toJSON()] }
  );

  console.log("✅ Slash command registrado");
});

/* =====================
   INTERACCIONES
===================== */
client.on("interactionCreate", async interaction => {

  /* ----- /pool ----- */
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== "pool") return;

    const cara = interaction.options.getUser("cara").id;
    const cruz = interaction.options.getUser("cruz").id;

    const pool = [
      ...pickRandom(lists.tier1, 1),
      ...pickRandom(lists.tier2, 2),
      ...pickRandom(lists.tier3, 2),
      ...pickRandom(lists.tier4, 2),
      ...pickRandom(lists.tier5, 2)
    ];

    const coin = Math.random() < 0.5 ? "CARA" : "CRUZ";
    const starter = coin === "CARA" ? cara : cruz;
    const other   = coin === "CARA" ? cruz : cara;

    games.set(interaction.channelId, {
      remaining: [...pool],
      pick1: null,
      pick2: null,
      decider: null,
      step: 0,
      players: [starter, other], // jugador 1 = ganador moneda
      order: [
        { action: "ban",  player: 1 },
        { action: "ban",  player: 2 },
        { action: "pick", player: 1 },
        { action: "pick", player: 2 },
        { action: "ban",  player: 1 },
        { action: "ban",  player: 2 },
        { action: "ban",  player: 1 },
        { action: "ban",  player: 2 }
      ]
    });

    const game = games.get(interaction.channelId);
    const firstStep = game.order[0];

    await interaction.reply({
      content:
        `🪙 **LANZAMIENTO DE MONEDA**\n` +
        `Resultado: **${coin}**\n\n` +
        buildStatusMessage(game, starter, firstStep.action),
      components: createButtons(pool, firstStep.action)
    });
  }

  /* ----- BOTONES ----- */
  if (interaction.isButton()) {
    const [action, killer] = interaction.customId.split(":");
    const game = games.get(interaction.channelId);

    if (!game)
      return interaction.reply({ content: "❌ No hay partida activa", ephemeral: true });

    const stepData = game.order[game.step];
    const expectedAction = stepData.action;
    const expectedPlayer = game.players[stepData.player - 1];

    if (interaction.user.id !== expectedPlayer)
      return interaction.reply({ content: "⏳ No es tu turno", ephemeral: true });

    if (action !== expectedAction)
      return interaction.reply({ content: `❌ Ahora toca ${expectedAction.toUpperCase()}`, ephemeral: true });

    if (!game.remaining.includes(killer))
      return interaction.reply({ content: "❌ Opción inválida", ephemeral: true });

    if (action === "pick") {
      if (!game.pick1) game.pick1 = killer;
      else game.pick2 = killer;
    }

    game.remaining = game.remaining.filter(k => k !== killer);
    game.step++;

    /* FINAL */
    if (game.remaining.length === 1) {
      game.decider = game.remaining[0];

      return interaction.update({
        content:
          `🏁 **RESULTADO FINAL**\n\n` +
          `🟢 **Partida 1**: ${game.pick1}\n` +
          `🔵 **Partida 2**: ${game.pick2}\n` +
          `🔥 **Desempate**: ${game.decider}`,
        components: []
      });
    }

    /* SIGUIENTE PASO */
    const nextStep = game.order[game.step];
    const nextPlayer = game.players[nextStep.player - 1];

    await interaction.update({
      content: buildStatusMessage(game, nextPlayer, nextStep.action),
      components: createButtons(game.remaining, nextStep.action)
    });
  }
});

client.login(process.env.TOKEN);
