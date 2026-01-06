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
const { createCanvas, loadImage } = require("canvas");

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
const TIER_COLORS = {
  "Tier 1": "#ff4d4d",
  "Tier 2": "#ff944d",
  "Tier 3": "#ffd24d",
  "Tier 4": "#4dd2ff",
  "Tier 5": "#4dff88",
  "Deshabilitado": "#666666"
};
const killersData = {
  Nurse: { display: "The Nurse", spanish: "Enfermera", aliases: ["Sally Smithson"], image: "https://deadbydaylight.wiki.gg/images/3/3b/K04_TheNurse_Portrait.png" },
  Blight: { display: "The Blight", spanish: "Deterioro", aliases: ["Talbot Grimes"], image: "https://deadbydaylight.wiki.gg/images/K21_TheBlight_Portrait.png" },
  Hillbilly: { display: "The Hillbilly", spanish: "Pueblerino", aliases: ["Max Thompson Jr."], image: "https://deadbydaylight.wiki.gg/images/2/24/K03_TheHillbilly_Portrait.png" },
  Ghoul: { display: "The Ghoul", spanish: "-", aliases: ["Ken Kaneki", "Rize Kamishiro"], image: "https://deadbydaylight.wiki.gg/images/K39_TheGhoul_Portrait.png" },
  Krasue: { display: "The Krasue", spanish: "-", aliases: ["Burong Sukapat"], image: "https://deadbydaylight.wiki.gg/images/K41_TheKrasue_Portrait.png" },
  Singularity: { display: "The Singularity", spanish: "Singularidad", aliases: ["HUX-A7-13"], image: "https://deadbydaylight.wiki.gg/images/2/24/K32_TheSingularity_Portrait.png" },
  Spirit: { display: "The Spirit", spanish: "Espíritu", aliases: ["Rin Yamaoka"], image: "https://deadbydaylight.wiki.gg/images/f/f1/K13_TheSpirit_Portrait.png" },
  Twins: { display: "The Twins", spanish: "Mellizos", aliases: ["Charlotte & Victor Deshayes"], image: "https://deadbydaylight.wiki.gg/images/1/17/K22_TheTwins_Portrait.png" },
  DarkLord: { display: "The Dark Lord", spanish: "Señor Oscuro", aliases: ["Drácula"], image: "https://deadbydaylight.wiki.gg/images/K37_TheDarkLord_Portrait.png" },
  Oni: { display: "The Oni", spanish: "-", aliases: ["Kazan Yamoka"], image: "https://deadbydaylight.wiki.gg/images/8/80/K18_TheOni_Portrait.png" },
  Huntress: { display: "The Huntress", spanish: "Cazadora", aliases: ["Anna"], image: "https://deadbydaylight.wiki.gg/images/f/f1/K08_TheHuntress_Portrait.png" },
  Artist: { display: "The Artist", spanish: "Artista", aliases: ["Carmina Mora"], image: "https://deadbydaylight.wiki.gg/images/0/01/K26_TheArtist_Portrait.png" },
  Mastermind: { display: "The Mastermind", spanish: "Mente Maestra", aliases: ["Albert Wesker"], image: "https://deadbydaylight.wiki.gg/images/e/ec/K29_TheMastermind_Portrait.png" },
  Cenobite: { display: "The Cenobite", spanish: "Cenobita", aliases: ["Elliot Spencer"], image: "https://deadbydaylight.wiki.gg/images/K25_TheCenobite_Portrait.png" },
  Plague: { display: "The Plague", spanish: "Plaga", aliases: ["Adiris"], image: "https://deadbydaylight.wiki.gg/images/f/fe/K15_ThePlague_Portrait.png" },
  Doctor: { display: "The Doctor", spanish: "-", aliases: ["Herman Carter"], image: "https://deadbydaylight.wiki.gg/images/5/58/K07_TheDoctor_Portrait.png" },
  Clown: { display: "The Clown", spanish: "Payaso", aliases: ["Kenneth Chase", "Jeffrey Hawk"], image: "https://deadbydaylight.wiki.gg/images/d/d1/K12_TheClown_Portrait.png" },
  Nightmare: { display: "The Nightmare", spanish: "Pesadilla", aliases: ["Freddy Krueger"], image: "https://deadbydaylight.wiki.gg/images/d/d5/K10_TheNightmare_Portrait.png" },
  Executioner: { display: "The Executioner", spanish: "Ejecutor", aliases: ["Pyramid Head"], image: "https://deadbydaylight.wiki.gg/images/c/c9/K20_TheExecutioner_Portrait.png" },
  Xenomorph: { display: "The Xenomorph", spanish: "Xenomorfo", aliases: [], image: "https://deadbydaylight.wiki.gg/images/6/64/K33_TheXenomorph_Portrait.png" },
  Unknown: { display: "The Unknown", spanish: "Desconocido", aliases: [], image: "https://deadbydaylight.wiki.gg/images/5/51/K35_TheUnknown_Portrait.png" },
  GoodGuy: { display: "The Good Guy", spanish: "Chico Bueno", aliases: ["Chucky", "Charles Lee Ray"], image: "https://deadbydaylight.wiki.gg/images/8/81/K34_TheGoodGuy_Portrait.png" },
  Lich: { display: "The Lich", spanish: "Liche", aliases: ["Vecna"], image: "https://deadbydaylight.wiki.gg/images/K36_TheLich_Portrait.png" },
  Houndmaster: { display: "The Houndmaster", spanish: "Adiestradora Canina", aliases: ["Portia Maye"], image: "https://deadbydaylight.wiki.gg/images/9/96/K38_TheHoundmaster_Portrait.png" },
  Wraith: { display: "The Wraith", spanish: "Espectro", aliases: ["Phillip Ojomo"], image: "https://deadbydaylight.wiki.gg/images/c/c2/K02_TheWraith_Portrait.png" },
  Deathslinger: { display: "The Deathslinger", spanish: "Arponero de la Muerte", aliases: ["Caleb Quinn"], image: "https://deadbydaylight.wiki.gg/images/a/ac/K19_TheDeathslinger_Portrait.png" },
  Animatronic: { display: "The Animatronic", spanish: "Animatrónico", aliases: ["Springtrap", "William Afton"], image: "https://deadbydaylight.wiki.gg/images/0/02/K40_TheAnimatronic_Portrait.png" },
  Demogorgon: { display: "The Demogorgon", spanish: "-", aliases: [], image: "https://deadbydaylight.wiki.gg/images/7/75/K17_TheDemogorgon_Portrait.png" },
  Dredge: { display: "The Dredge", spanish: "Draga", aliases: [], image: "https://deadbydaylight.wiki.gg/images/7/7e/K28_TheDredge_Portrait.png" },
  Onryo: { display: "The Onryō", spanish: "-", aliases: ["Sadako Yamamura"], image: "https://deadbydaylight.wiki.gg/images/5/5f/K27_TheOnryo_Portrait.png" },
  Trickster: { display: "The Trickster", spanish: "Embaucador", aliases: ["Ji-Woon Hak"], image: "https://deadbydaylight.wiki.gg/images/c/c9/K23_TheTrickster_Portrait.png" },
  Legion: { display: "The Legion", spanish: "Legión", aliases: ["Frank", "Julie", "Susie", "Joey"], image: "https://deadbydaylight.wiki.gg/images/5/53/K14_TheLegion_Portrait.png" },
  Cannibal: { display: "The Cannibal", spanish: "Caníbal", aliases: ["Leatherface", "Bubba Sawyer"], image: "https://deadbydaylight.wiki.gg/images/6/6f/K09_TheCannibal_Portrait.png" },
  Hag: { display: "The Hag", spanish: "Bruja", aliases: ["Lisa Sherwood"], image: "https://deadbydaylight.wiki.gg/images/c/c7/K06_TheHag_Portrait.png" },
  Pig: { display: "The Pig", spanish: "Cerda", aliases: ["Amanda Young"], image: "https://deadbydaylight.wiki.gg/images/5/5c/K11_ThePig_Portrait.png" },
  GhostFace: { display: "The GhostFace", spanish: "-", aliases: ["Danny Johnson"], image: "https://deadbydaylight.wiki.gg/images/d/d1/K16_TheGhostFace_Portrait.png" },
  Trapper: { display: "The Trapper", spanish: "Trampero", aliases: ["Evan MacMillan"], image: "https://deadbydaylight.wiki.gg/images/8/81/K01_TheTrapper_Portrait.png" },
  Nemesis: { display: "The Nemesis", spanish: "Némesis", aliases: [], image: "https://deadbydaylight.wiki.gg/images/K24_TheNemesis_Portrait.png"},
  Knight: { display: "The Knight", spanish: "Caballero", aliases: ["Tarhos Kovács"], image: "https://deadbydaylight.wiki.gg/images/6/69/K30_TheKnight_Portrait.png"},
  SkullMerchant: { display: "The Skull Merchant", spanish: "Comerciante de Calaveras", aliases: ["Adriana Imai"], image: "https://deadbydaylight.wiki.gg/images/6/64/K31_TheSkullMerchant_Portrait.png"},
  Shape: { display: "The Shape", spanish: "La Forma", aliases: ["Michael Myers"], image: "https://deadbydaylight.wiki.gg/images/b/b5/K05_TheShape_Portrait.png"}
};

/* =====================
   LISTAS PICK & BAN
===================== */
const lists = {
  tier1: ["Nurse","Blight","Hillbilly","Ghoul","Krasue","Singularity","Spirit"],
  tier2: ["Twins","Dark Lord","Oni","Huntress","Artist","Mastermind","Cenobite"],
  tier3: ["Plague","Doctor","Clown","Nightmare","Executioner","Xenomorph","Unknown","Good Guy","Lich","Houndmaster"],
  tier4: ["Wraith","Deathslinger","Animatronic","Demogorgon","Dredge","Onryo"],
  tier5: ["Trickster","Legion","Cannibal","Hag","Pig","GhostFace","Trapper"],
  deshabilitado:["Shape", "Skull Merchant", "Knight", "Nemesis"]
};

const pickRandom = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

/* =====================
   BOTONES
===================== */
function createButtons(remaining, action) {
  const rows = [];
  let row = new ActionRowBuilder();
  remaining.forEach((k, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${action}:${k}`)
        .setLabel(k)
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
function normalizeKillerKey(name) {
  return name
    .replace(/\s/g, "")
    .replace("ō", "o");
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
async function generateTierListImage() {
  const iconSize = 88;
  const padding = 24;
  const rowHeight = iconSize + 28;
  const width = 1500;

  const tiers = [
    { label: "Tier 1", killers: lists.tier1 },
    { label: "Tier 2", killers: lists.tier2 },
    { label: "Tier 3", killers: lists.tier3 },
    { label: "Tier 4", killers: lists.tier4 },
    { label: "Tier 5", killers: lists.tier5 },
    { label: "Deshabilitado", killers: lists.deshabilitado }
  ];

  const height = tiers.length * rowHeight + padding * 2;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  /* =====================
     FONDO GENERAL
  ===================== */
  ctx.fillStyle = "#2b0f14"; // rojo oscuro
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 30px sans-serif";
  ctx.textBaseline = "middle";

  /* Fondo base de retratos (wiki) */
  const portraitBG = await loadImage(
    "https://deadbydaylight.wiki.gg/images/CharPortrait_roleBG.webp"
  );

  let y = padding;

  for (const tier of tiers) {
    /* =====================
       FONDO DE FILA
    ===================== */
    ctx.fillStyle = "#161012"; // casi negro
    ctx.fillRect(0, y - 6, width, rowHeight);

    /* Barra de color del tier */
    ctx.fillStyle = TIER_COLORS[tier.label] || "#ffffff";
    ctx.fillRect(0, y - 6, 14, rowHeight);

    /* Texto del tier */
    ctx.fillStyle = "#ffffff";
    ctx.fillText(tier.label, 30, y + iconSize / 2);

    let x = 200;

    for (const killerKey of tier.killers) {
      const key = normalizeKillerKey(killerKey);
      const data = killersData[key];
      if (!data) continue;

      try {
        /* =====================
           FONDO DE RETRATO
        ===================== */
        ctx.drawImage(portraitBG, x, y, iconSize, iconSize);

        /* TINTE ROJO OSCURO */
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = "rgba(90, 10, 15, 0.65)";
        ctx.fillRect(x, y, iconSize, iconSize);
        ctx.globalCompositeOperation = "source-over";

        /* KILLER ENCIMA */
        const img = await loadImage(data.image);
        ctx.drawImage(img, x, y, iconSize, iconSize);

        x += iconSize + 14;
      } catch {
        // ignora errores de imagen
      }
    }

    y += rowHeight;
  }

  return canvas.toBuffer("image/png");
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
     .setDescription("Selecciona un killer")
     .setRequired(true)
     .setAutocomplete(true)
  );

const tierListCommand = new SlashCommandBuilder()
  .setName("tier-list")
  .setDescription("Genera una imagen con la tier list actual");
/* =====================
   REGISTRO
===================== */
client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: [pickBanCommand.toJSON(), infoKillerCommand.toJSON(), tierListCommand.toJSON()] }
  );
  console.log("🤖 Bot listo");
});

/* =====================
   INTERACCIONES
===================== */
client.on("interactionCreate", async interaction => {

  /* AUTOCOMPLETE */
  if (interaction.isAutocomplete()) {
    if (interaction.commandName !== "info-killer") return;
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = Object.entries(killersData)
      .filter(([k, d]) =>
        k.toLowerCase().includes(focused) ||
        d.display.toLowerCase().includes(focused) ||
        d.aliases.some(a => a.toLowerCase().includes(focused))
      )
      .slice(0, 25)
      .map(([k, d]) => ({ name: d.display, value: k }));
    await interaction.respond(choices);
    return;
  }

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "tier-list") {
      await interaction.deferReply();
    
      const buffer = await generateTierListImage();
    
      return interaction.editReply({
        files: [{ attachment: buffer, name: "tierlist.png" }]
      });
    }
    /* INFO KILLER */
    if (interaction.commandName === "info-killer") {
      const key = interaction.options.getString("killer");
      const killer = killersData[key];
      if (!killer) return interaction.reply({ content: "❌ Killer no encontrado.", ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle(killer.display.toUpperCase())
        .setColor(0x5865F2)
        .setThumbnail(killer.image)
        .addFields(
          { name: "🌎 Nombre en español", value: killer.spanish || "—", inline: true },
          { name: "🧠 Alias", value: killer.aliases.length ? killer.aliases.join(", ") : "—", inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    }

    /* PICK & BAN */
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

  /* BOTONES */
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
