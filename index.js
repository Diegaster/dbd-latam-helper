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
        .setStyle(action === "pick" ? ButtonStyle.Success : ButtonStyle.Danger)
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
   COMANDO /pool
===================== */
const poolCommand = new SlashCommandBuilder()
  .setName("pool")
  .setDescription("Genera el pool y comienza el draft")
  .addUserOption(o =>
    o.setName("player1").setDescription("Jugador 1").setRequired(true))
  .addUserOption(o =>
    o.setName("player2").setDescription("Jugador 2").setRequired(true));

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

    const p1 = interaction.options.getUser("player1").id;
    const p2 = interaction.options.getUser("player2").id;

    const pool = [
      ...pickRandom(lists.tier1, 1),
      ...pickRandom(lists.tier2, 2),
      ...pickRandom(lists.tier3, 2),
      ...pickRandom(lists.tier4, 2),
      ...pickRandom(lists.tier5, 2)
    ];

    const starter = Math.random() < 0.5 ? p1 : p2;

    games.set(interaction.channelId, {
      pool,
      remaining: [...pool],
      pick1: null,
      pick2: null,
      decider: null,
      phase: "pick1",
      turn: starter,
      starter,
      players: [p1, p2]
    });

    await interaction.reply({
      content:
        `🪙 **LANZAMIENTO DE MONEDA**\n` +
        `Resultado: **${coin}**\n\n` +
        `🎲 **POOL GENERADO**\n` +
        pool.map(k => `• ${k}`).join("\n") +
        `\n\n👉 Empieza <@${starter}>`,
      components: createButtons(pool, "pick")
    });
  }

  /* ----- BOTONES ----- */
  if (interaction.isButton()) {
    const [action, killer] = interaction.customId.split(":");
    const game = games.get(interaction.channelId);

    if (!game)
      return interaction.reply({ content: "❌ No hay partida activa", ephemeral: true });

    if (interaction.user.id !== game.turn)
      return interaction.reply({ content: "⏳ No es tu turno", ephemeral: true });

    if (!game.remaining.includes(killer))
      return interaction.reply({ content: "❌ Opción inválida", ephemeral: true });

    /* PICK */
    if (action === "pick") {
      if (game.phase === "pick1") {
        game.pick1 = killer;
        game.phase = "pick2";
        game.turn = game.players.find(p => p !== game.turn);
      } else if (game.phase === "pick2") {
        game.pick2 = killer;
        game.phase = "ban";
        game.turn = game.players.find(p => p !== game.starter);
      } else {
        return interaction.reply({ content: "❌ No se puede pickear ahora", ephemeral: true });
      }
    }

    /* BAN */
    if (action === "ban") {
      if (game.phase !== "ban")
        return interaction.reply({ content: "❌ No se puede banear ahora", ephemeral: true });

      game.turn = game.players.find(p => p !== game.turn);
    }

    game.remaining = game.remaining.filter(k => k !== killer);

    /* FINAL */
    if (game.phase === "ban" && game.remaining.length === 1) {
      game.decider = game.remaining[0];
      game.phase = "finished";

      return interaction.update({
        content:
          `🏁 **RESULTADO FINAL**\n\n` +
          `🟢 Partida 1: **${game.pick1}**\n` +
          `🔵 Partida 2: **${game.pick2}**\n` +
          `🔥 Desempate: **${game.decider}**`,
        components: []
      });
    }

    const nextAction = game.phase === "ban" ? "ban" : "pick";

    await interaction.update({
      content:
        `🎮 Turno de <@${game.turn}>\n` +
        `Fase: **${game.phase.toUpperCase()}**`,
      components: createButtons(game.remaining, nextAction)
    });
  }
});

client.login(process.env.TOKEN);
