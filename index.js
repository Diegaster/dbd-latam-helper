require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* =====================
   ESTADO DEL JUEGO
===================== */
const games = new Map();

/* =====================
   KILLERS DATA
===================== */
const killersData = {
  Nurse: { display: "Nurse", spanish: "Enfermera", aliases: ["Sally Smithson"], image: "https://deadbydaylight.wiki.gg/images/3/3b/K04_TheNurse_Portrait.png?f00131" },
  Blight: { display: "Blight", spanish: "Deterioro", aliases: ["Talbot Grimes"], image: "https://deadbydaylight.wiki.gg/images/K21_TheBlight_Portrait.png?bb5b92" },
  Hillbilly: { display: "Hillbilly", spanish: "Pueblerino", aliases: ["Max Thompson Jr."], image: "https://deadbydaylight.wiki.gg/images/2/24/K03_TheHillbilly_Portrait.png?b1fa3b" },
  Ghoul: { display: "Ghoul", spanish: "-", aliases: ["Ken Kaneki", "Rize Kamishiro"], image: "https://deadbydaylight.wiki.gg/images/K39_TheGhoul_Portrait.png?fbb95c" },
  Krasue: { display: "Krasue", spanish: "-", aliases: ["Burong Sukapat"], image: "https://deadbydaylight.wiki.gg/images/K41_TheKrasue_Portrait.png?3513ba" },
  Singularity: { display: "Singularity", spanish: "Singularidad", aliases: [], image: "https://deadbydaylight.wiki.gg/images/2/24/K32_TheSingularity_Portrait.png?3d6300" },
  Spirit: { display: "Spirit", spanish: "Espíritu", aliases: ["Rin Yamaoka"], image: "https://deadbydaylight.wiki.gg/images/f/f1/K13_TheSpirit_Portrait.png?c6efeb" },

  Twins: { display: "Twins", spanish: "Mellizos", aliases: ["Charlotte & Victor Deshayes"], image: "https://deadbydaylight.wiki.gg/images/1/17/K22_TheTwins_Portrait.png?71ef1c" },
  DarkLord: { display: "Dark Lord", spanish: "Señor Oscuro", aliases: ["Drácula"], image: "https://deadbydaylight.wiki.gg/images/K37_TheDarkLord_Portrait.png?d391a7" },
  Oni: { display: "Oni", spanish: "-", aliases: ["Kazan Yamoka"], image: "https://deadbydaylight.wiki.gg/images/8/80/K18_TheOni_Portrait.png?22e37f" },
  Huntress: { display: "Huntress", spanish: "Cazadora", aliases: ["Anna"], image: "https://deadbydaylight.wiki.gg/images/f/f1/K08_TheHuntress_Portrait.png?194544" },
  Artist: { display: "Artist", spanish: "Artista", aliases: ["Carmina Mora"], image: "https://deadbydaylight.wiki.gg/images/0/01/K26_TheArtist_Portrait.png?594628" },
  Mastermind: { display: "Mastermind", spanish: "Mente Maestra", aliases: ["Albert Wesker"], image: "https://deadbydaylight.wiki.gg/images/e/ec/K29_TheMastermind_Portrait.png?84582c" },
  Cenobite: { display: "Cenobite", spanish: "Cenobita", aliases: ["Elliot Spencer"], image: "https://deadbydaylight.wiki.gg/images/K25_TheCenobite_Portrait.png?6b9046" },

  Plague: { display: "Plague", spanish: "Plaga", aliases: ["Adiris"], image: "https://deadbydaylight.wiki.gg/images/f/fe/K15_ThePlague_Portrait.png?e5926a" },
  Doctor: { display: "Doctor", spanish: "-", aliases: ["Herman Carter"], image: "https://deadbydaylight.wiki.gg/images/5/58/K07_TheDoctor_Portrait.png?9b025f" },
  Clown: { display: "Clown", spanish: "Payaso", aliases: ["Kenneth Chase", "Jeffrey Hawk"], image: "https://deadbydaylight.wiki.gg/images/d/d1/K12_TheClown_Portrait.png?26bd2a" },
  Nightmare: { display: "Nightmare", spanish: "Pesadilla", aliases: ["Freddy Krueger"], image: "https://deadbydaylight.wiki.gg/images/d/d5/K10_TheNightmare_Portrait.png?8dfa33" },
  Executioner: { display: "Executioner", spanish: "Ejecutor", aliases: ["Pyramid Head"], image: "https://deadbydaylight.wiki.gg/images/c/c9/K20_TheExecutioner_Portrait.png?286cd2" },
  Xenomorph: { display: "Xenomorph", spanish: "Xenomorfo", aliases: [], image: "https://deadbydaylight.wiki.gg/images/6/64/K33_TheXenomorph_Portrait.png?17ff7e"" },
  Unknown: { display: "Unknown", spanish: "Desconocido", aliases: [], image: "https://deadbydaylight.wiki.gg/images/5/51/K35_TheUnknown_Portrait.png?88bbed" },
  GoodGuy: { display: "Good Guy", spanish: "Chico Bueno", aliases: ["Chucky", "Charles Lee Ray"], image: "https://deadbydaylight.wiki.gg/images/8/81/K34_TheGoodGuy_Portrait.png?4dc7a9" },
  Lich: { display: "Lich", spanish: "Liche", aliases: ["Vecna"], image: "https://deadbydaylight.wiki.gg/images/K36_TheLich_Portrait.png?25df98" },
  Houndmaster: { display: "Houndmaster", spanish: "Adiestradora Canina", aliases: ["Portia Maye"], image: "https://deadbydaylight.wiki.gg/images/9/96/K38_TheHoundmaster_Portrait.png?6e438f" },

  Wraith: { display: "Wraith", spanish: "Espectro", aliases: ["Phillip Ojomo"], image: "https://deadbydaylight.wiki.gg/images/c/c2/K02_TheWraith_Portrait.png?fbb21b" },
  Deathslinger: { display: "Deathslinger", spanish: "Arponero de la Muerte", aliases: ["Caleb Quinn"], image: "https://deadbydaylight.wiki.gg/images/a/ac/K19_TheDeathslinger_Portrait.png?52fc47" },
  Animatronic: { display: "Animatronic", spanish: "Animatrónico", aliases: ["Springtrap", "William Afton"], image: "https://deadbydaylight.wiki.gg/images/0/02/K40_TheAnimatronic_Portrait.png?636799" },
  Demogorgon: { display: "Demogorgon", spanish: "-", aliases: [], image: "https://deadbydaylight.wiki.gg/images/7/75/K17_TheDemogorgon_Portrait.png?20c7d0" },
  Dredge: { display: "Dredge", spanish: "Draga", aliases: [], image: "https://deadbydaylight.wiki.gg/images/7/7e/K28_TheDredge_Portrait.png?66319e" },
  Onryo: { display: "Onryō", spanish: "-", aliases: ["Sadako Yamamura"], image: "https://deadbydaylight.wiki.gg/images/5/5f/K27_TheOnryo_Portrait.png?50d2b8" },

  Trickster: { display: "Trickster", spanish: "Embaucador", aliases: ["Ji-Woon Hak"], image: "https://deadbydaylight.wiki.gg/images/c/c9/K23_TheTrickster_Portrait.png?e4204c" },
  Legion: { display: "Legion", spanish: "Legión", aliases: ["Frank", "Julie", "Susie", "Joey"], image: "https://deadbydaylight.wiki.gg/images/5/53/K14_TheLegion_Portrait.png?f9a179" },
  Cannibal: { display: "Cannibal", spanish: "Caníbal", aliases: ["Bubba Sawyer", "Leatherface"], image: "https://deadbydaylight.wiki.gg/images/6/6f/K09_TheCannibal_Portrait.png?2b9b38" },
  Hag: { display: "Hag", spanish: "Bruja", aliases: ["Lisa Sherwood"], image: "https://deadbydaylight.wiki.gg/images/c/c7/K06_TheHag_Portrait.png?60f88f" },
  Pig: { display: "Pig", spanish: "Cerda", aliases: ["Amanda Young"], image: "https://deadbydaylight.wiki.gg/images/5/5c/K11_ThePig_Portrait.png?893de3" },
  GhostFace: { display: "Ghost Face", spanish: "-", aliases: ["Danny Johnson"], image: "https://deadbydaylight.wiki.gg/images/d/d1/K16_TheGhostFace_Portrait.png?5a4629" },
  Trapper: { display: "Trapper", spanish: "Trampero", aliases: ["Evan MacMillan"], image: "https://deadbydaylight.wiki.gg/images/8/81/K01_TheTrapper_Portrait.png?564c1d" },

  Nemesis: { display: "Nemesis", spanish: "Némesis", aliases: [], image: "https://deadbydaylight.wiki.gg/images/K24_TheNemesis_Portrait.png?891941" },
  Shape: { display: "Shape", spanish: "Forma", aliases: ["Michael Myers"], image: "https://deadbydaylight.wiki.gg/images/b/b5/K05_TheShape_Portrait.png?f9bf22" },
  Knight: { display: "Knight", spanish: "Caballero", aliases: ["Tarhos Kovács"], image: "https://deadbydaylight.wiki.gg/images/6/69/K30_TheKnight_Portrait.png?b89c9d" },
  SkullMerchant: { display: "Skull Merchant", spanish: "Comerciante de Calaveras", aliases: ["Adriana Imai"], image: "https://deadbydaylight.wiki.gg/images/6/64/K31_TheSkullMerchant_Portrait.png?91edf3" },
};

/* =====================
   LISTAS PICK & BAN
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
   EMBED PICK & BAN
===================== */
function buildPickBanEmbed(game, player, action, coin = null) {
  const embed = new EmbedBuilder()
    .setTitle("🎮 Pick & Ban")
    .setColor(action === "pick" ? 0x57F287 : 0xED4245)
    .addFields(
      { name: "🟢 Partida 1", value: game.pick1 ?? "*Sin definir*", inline: true },
      { name: "🔵 Partida 2", value: game.pick2 ?? "*Sin definir*", inline: true },
      { name: "🩸 Killers restantes", value: game.remaining.join("\n") },
      { name: "🎮 Turno", value: `<@${player}> — **${action.toUpperCase()}**` }
    );

  if (coin) embed.setDescription(`🪙 **Lanzamiento de moneda:** ${coin}`);
  return embed;
}

/* =====================
   SLASH COMMANDS
===================== */
const pickBanCommand = new SlashCommandBuilder()
  .setName("pick-and-ban")
  .setDescription("Genera el pool y lanza la moneda")
  .addUserOption(o => o.setName("cara").setDescription("Jugador CARA").setRequired(true))
  .addUserOption(o => o.setName("cruz").setDescription("Jugador CRUZ").setRequired(true));

const infoKillerCommand = new SlashCommandBuilder()
  .setName("info-killer")
  .setDescription("Muestra información de un killer")
  .addStringOption(o =>
    o.setName("killer")
     .setDescription("Clave del killer (ej: Nurse, GhostFace)")
     .setRequired(true));

/* =====================
   REGISTRO
===================== */
client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: [pickBanCommand.toJSON(), infoKillerCommand.toJSON()] }
  );
  console.log("🤖 Bot listo (Pick & Ban + Info Killer)");
});

/* =====================
   INTERACCIONES
===================== */
client.on("interactionCreate", async interaction => {

  if (interaction.isChatInputCommand()) {

    /* ----- /info-killer ----- */
    if (interaction.commandName === "info-killer") {
      const key = interaction.options.getString("killer");
      const killer = killersData[key];

      if (!killer)
        return interaction.reply({ content: "❌ Killer no encontrado.", ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle(killer.display.toUpperCase())
        .setColor(0x5865F2)
        .setImage(killer.image)
        .addFields(
          { name: "🌎 Nombre en español", value: killer.spanish || "—" },
          { name: "🧠 Alias", value: killer.aliases.length ? killer.aliases.join(", ") : "—" }
        );

      return interaction.reply({ embeds: [embed] });
    }

    /* ----- /pick-and-ban ----- */
    if (interaction.commandName === "pick-and-ban") {
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
      const other = starter === cara ? cruz : cara;

      games.set(interaction.channelId, {
        remaining: [...pool],
        pick1: null,
        pick2: null,
        step: 0,
        players: [starter, other],
        order: [
          { action: "ban", player: 1 },
          { action: "ban", player: 2 },
          { action: "pick", player: 1 },
          { action: "pick", player: 2 },
          { action: "ban", player: 1 },
          { action: "ban", player: 2 },
          { action: "ban", player: 1 },
          { action: "ban", player: 2 }
        ]
      });

      const game = games.get(interaction.channelId);
      const step = game.order[0];

      return interaction.reply({
        embeds: [buildPickBanEmbed(game, starter, step.action, coin)],
        components: createButtons(pool, step.action)
      });
    }
  }

  /* ----- BOTONES ----- */
  if (interaction.isButton()) {
    const [action, killer] = interaction.customId.split(":");
    const game = games.get(interaction.channelId);
    if (!game) return;

    const step = game.order[game.step];
    const player = game.players[step.player - 1];

    if (interaction.user.id !== player || action !== step.action) return;

    if (action === "pick") {
      if (!game.pick1) game.pick1 = killer;
      else game.pick2 = killer;
    }

    game.remaining = game.remaining.filter(k => k !== killer);
    game.step++;

    if (game.remaining.length === 1) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🏁 Resultado Final")
            .setColor(0xFEE75C)
            .addFields(
              { name: "🟢 Partida 1", value: game.pick1, inline: true },
              { name: "🔵 Partida 2", value: game.pick2, inline: true },
              { name: "🔥 Desempate", value: game.remaining[0] }
            )
        ],
        components: []
      });
    }

    const next = game.order[game.step];
    const nextPlayer = game.players[next.player - 1];

    return interaction.update({
      embeds: [buildPickBanEmbed(game, nextPlayer, next.action)],
      components: createButtons(game.remaining, next.action)
    });
  }
});

client.login(process.env.TOKEN);
