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

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function drawGlowText(ctx, text, x, y, {
  size = 20,
  color = "#ff2b2b",
  glow = 12,
  bold = true,
  font = "sans-serif"
} = {}) {
  ctx.font = `${bold ? "bold" : ""} ${size}px ${font}`;
  ctx.fillStyle = color;

  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillText(text, x, y);

  // Reset (MUY IMPORTANTE)
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

function getMapsForKiller(killer) {
  return killer.maps
    .map(name => Object.values(MAPS_DATA).find(m => m.name === name))
    .filter(Boolean);
}

function drawTierText(ctx, text, x, y, color) {
  ctx.font = "bold 30px sans-serif";

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;

  // Stroke
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000000";
  ctx.strokeText(text, x, y);

  // Fill
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  // Reset
  ctx.shadowBlur = 0;
}

const { createCanvas, loadImage } = require("canvas");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const fs = require("fs");
const LEADERBOARD_FILE = "./leaderboard.json";

function loadLeaderboard() {
  if (!fs.existsSync(LEADERBOARD_FILE)) return {};
  return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, "utf8"));
}

function saveLeaderboard(data) {
  fs.writeFileSync(
    LEADERBOARD_FILE,
    JSON.stringify(data, null, 2)
  );
}
/* =====================
   ESTADO DEL JUEGO
===================== */
const games = new Map();

/* =====================
   KILLERS DATA
===================== */
const TIER_COLORS = {
  "TIER 1": "#ff4d4d",
  "TIER 2": "#ff944d",
  "TIER 3": "#ffd24d",
  "TIER 4": "#4dd2ff",
  "TIER 5": "#4dff88",
  "Deshabilitado": "#666666"
};
const killersData = {
  Nurse: { display: "The Nurse", spanish: "La Enfermera", aliases: ["Sally Smithson"], maps: ["Coal Tower 1"], image: "https://deadbydaylight.wiki.gg/images/3/3b/K04_TheNurse_Portrait.png" },
  Blight: { display: "The Blight", spanish: "El Deterioro", aliases: ["Talbot Grimes"], maps: ["Suffocation Pit 1", "Blood Lodge"], image: "https://deadbydaylight.wiki.gg/images/K21_TheBlight_Portrait.png" },
  Hillbilly: { display: "The Hillbilly", spanish: "El Pueblerino", aliases: ["Max Thompson Jr."], maps: ["Blood Lodge"], image: "https://deadbydaylight.wiki.gg/images/2/24/K03_TheHillbilly_Portrait.png" },
  Ghoul: { display: "The Ghoul", spanish: "El Ghoul", aliases: ["Ken Kaneki", "Rize Kamishiro"], maps: ["Suffocation Pit 1", "Blood Lodge"], image: "https://deadbydaylight.wiki.gg/images/K39_TheGhoul_Portrait.png" },
  Krasue: { display: "The Krasue", spanish: "La Krasue", aliases: ["Burong Sukapat"], maps: ["Suffocation Pit 1", "Blood Lodge"], image: "https://deadbydaylight.wiki.gg/images/K41_TheKrasue_Portrait.png" },
  Singularity: { display: "The Singularity", spanish: "La Singularidad", aliases: ["HUX-A7-13"], maps: ["Dead Dawg Saloon"], image: "https://deadbydaylight.wiki.gg/images/2/24/K32_TheSingularity_Portrait.png" },
  Spirit: { display: "The Spirit", spanish: "El Espíritu", aliases: ["Rin Yamaoka"], maps: ["Wrecker's Yard"], image: "https://deadbydaylight.wiki.gg/images/f/f1/K13_TheSpirit_Portrait.png" },
  Twins: { display: "The Twins", spanish: "Los Gemelos", aliases: ["Charlotte & Victor Deshayes"], maps: ["Suffocation Pit 1"], image: "https://deadbydaylight.wiki.gg/images/1/17/K22_TheTwins_Portrait.png" },
  DarkLord: { display: "The Dark Lord", spanish: "El Señor Oscuro", aliases: ["Drácula"], maps: ["Wrecker's Yard", "Wretched Shop"], image: "https://deadbydaylight.wiki.gg/images/K37_TheDarkLord_Portrait.png" },
  Oni: { display: "The Oni", spanish: "-", aliases: ["Kazan Yamoka"], maps: ["Coal Tower 1"],  image: "https://deadbydaylight.wiki.gg/images/8/80/K18_TheOni_Portrait.png" },
  Huntress: { display: "The Huntress", spanish: "La Cazadora", aliases: ["Anna"], maps: ["Wrecker's Yard"], image: "https://deadbydaylight.wiki.gg/images/f/f1/K08_TheHuntress_Portrait.png" },
  Artist: { display: "The Artist", spanish: "La Artista", aliases: ["Carmina Mora"], maps: ["Wretched Shop"], image: "https://deadbydaylight.wiki.gg/images/0/01/K26_TheArtist_Portrait.png" },
  Mastermind: { display: "The Mastermind", spanish: "La Mente Maestra", aliases: ["Albert Wesker"], maps: ["Coal Tower 1"],  image: "https://deadbydaylight.wiki.gg/images/e/ec/K29_TheMastermind_Portrait.png" },
  Cenobite: { display: "The Cenobite", spanish: "El Cenobita", aliases: ["Elliot Spencer"], maps: ["Dead Dawg Saloon"], image: "https://deadbydaylight.wiki.gg/images/K25_TheCenobite_Portrait.png" },
  Plague: { display: "The Plague", spanish: "La Plaga", aliases: ["Adiris"], maps: ["Dead Dawg Saloon"], image: "https://deadbydaylight.wiki.gg/images/f/fe/K15_ThePlague_Portrait.png" },
  Doctor: { display: "The Doctor", spanish: "El Doctor", aliases: ["Herman Carter"], maps: ["Wretched Shop"], image: "https://deadbydaylight.wiki.gg/images/5/58/K07_TheDoctor_Portrait.png" },
  Clown: { display: "The Clown", spanish: "El Payaso", aliases: ["Kenneth Chase", "Jeffrey Hawk"], maps: ["Wrecker's Yard"], image: "https://deadbydaylight.wiki.gg/images/d/d1/K12_TheClown_Portrait.png" },
  Nightmare: { display: "The Nightmare", spanish: "La Pesadilla", aliases: ["Freddy Krueger"], maps: ["Dead Dawg Saloon"], image: "https://deadbydaylight.wiki.gg/images/d/d5/K10_TheNightmare_Portrait.png" },
  Executioner: { display: "The Executioner", spanish: "El Ejecutor", aliases: ["Pyramid Head"], maps: ["Wrecker's Yard"], image: "https://deadbydaylight.wiki.gg/images/c/c9/K20_TheExecutioner_Portrait.png" },
  Xenomorph: { display: "The Xenomorph", spanish: "El Xenomorfo", aliases: ["Alien"], maps: ["Wretched Shop"], image: "https://deadbydaylight.wiki.gg/images/6/64/K33_TheXenomorph_Portrait.png" },
  Unknown: { display: "The Unknown", spanish: "Lo Desconocido", aliases: [], maps: ["Wrecker's Yard"], image: "https://deadbydaylight.wiki.gg/images/5/51/K35_TheUnknown_Portrait.png" },
  GoodGuy: { display: "The Good Guy", spanish: "El Chico Bueno", aliases: ["Chucky", "Charles Lee Ray"], maps: ["Wrecker's Yard"], image: "https://deadbydaylight.wiki.gg/images/8/81/K34_TheGoodGuy_Portrait.png" },
  Lich: { display: "The Lich", spanish: "El Liche", aliases: ["Vecna"], maps: ["Dead Dawg Saloon"], image: "https://deadbydaylight.wiki.gg/images/K36_TheLich_Portrait.png" },
  Houndmaster: { display: "The Houndmaster", spanish: "Adiestradora Canina", aliases: ["Portia Maye"], maps: ["Coal Tower 1"], image: "https://deadbydaylight.wiki.gg/images/9/96/K38_TheHoundmaster_Portrait.png" },
  Wraith: { display: "The Wraith", spanish: "El Espectro", aliases: ["Phillip Ojomo"], maps: ["Dead Dawg Saloon", "The Underground Complex"], image: "https://deadbydaylight.wiki.gg/images/c/c2/K02_TheWraith_Portrait.png" },
  Deathslinger: { display: "The Deathslinger", spanish: "El Arponero de la Muerte", aliases: ["Caleb Quinn"], maps: ["Suffocation Pit 1"], image: "https://deadbydaylight.wiki.gg/images/a/ac/K19_TheDeathslinger_Portrait.png" },
  Animatronic: { display: "The Animatronic", spanish: "El Animatrónico", aliases: ["Springtrap", "William Afton"], maps: ["Wretched Shop"], image: "https://deadbydaylight.wiki.gg/images/0/02/K40_TheAnimatronic_Portrait.png" },
  Demogorgon: { display: "The Demogorgon", spanish: "El Demogorgon", aliases: [], maps: ["Coal Tower 1"], image: "https://deadbydaylight.wiki.gg/images/7/75/K17_TheDemogorgon_Portrait.png" },
  Dredge: { display: "The Dredge", spanish: "La Draga", aliases: [], maps: ["Midwich Elementary School"], image: "https://deadbydaylight.wiki.gg/images/7/7e/K28_TheDredge_Portrait.png" },
  Onryo: { display: "The Onryō", spanish: "La Onryō", aliases: ["Sadako Yamamura"], maps: ["Midwich Elementary School"], image: "https://deadbydaylight.wiki.gg/images/5/5f/K27_TheOnryo_Portrait.png" },
  Trickster: { display: "The Trickster", spanish: "El Embaucador", aliases: ["Ji-Woon Hak"], maps: ["Coal Tower 1"], image: "https://deadbydaylight.wiki.gg/images/c/c9/K23_TheTrickster_Portrait.png" },
  Legion: { display: "The Legion", spanish: "La Legión", aliases: ["Frank", "Julie", "Susie", "Joey"], maps: ["Dead Dawg Saloon"], image: "https://deadbydaylight.wiki.gg/images/5/53/K14_TheLegion_Portrait.png" },
  Cannibal: { display: "The Cannibal", spanish: "El Caníbal", aliases: ["Leatherface", "Bubba Sawyer"], maps: ["Dead Dawg Saloon"], image: "https://deadbydaylight.wiki.gg/images/6/6f/K09_TheCannibal_Portrait.png" },
  Hag: { display: "The Hag", spanish: "La Bruja", aliases: ["Lisa Sherwood"], maps: ["Midwich Elementary School"], image: "https://deadbydaylight.wiki.gg/images/c/c7/K06_TheHag_Portrait.png" },
  Pig: { display: "The Pig", spanish: "La Cerda", aliases: ["Amanda Young"], maps: ["Midwich Elementary School"], image: "https://deadbydaylight.wiki.gg/images/5/5c/K11_ThePig_Portrait.png" },
  GhostFace: { display: "The Ghost Face", spanish: "Ghost Face", aliases: ["Danny Johnson"], maps: ["Lery's Memorial Institute"], image: "https://deadbydaylight.wiki.gg/images/d/d1/K16_TheGhostFace_Portrait.png" },
  Trapper: { display: "The Trapper", spanish: "El Trampero", aliases: ["Evan MacMillan"], maps: ["Coal Tower 1", "Grim Pantry"], image: "https://deadbydaylight.wiki.gg/images/8/81/K01_TheTrapper_Portrait.png" },
  Nemesis: { display: "The Nemesis", spanish: "Némesis", aliases: [], maps: [], image: "https://deadbydaylight.wiki.gg/images/K24_TheNemesis_Portrait.png"},
  Knight: { display: "The Knight", spanish: "El Caballero", aliases: ["Tarhos Kovács"], maps: [], image: "https://deadbydaylight.wiki.gg/images/6/69/K30_TheKnight_Portrait.png"},
  SkullMerchant: { display: "The Skull Merchant", spanish: "La Comerciante de Calaveras", maps: [], aliases: ["Adriana Imai"], image: "https://deadbydaylight.wiki.gg/images/6/64/K31_TheSkullMerchant_Portrait.png"},
  Shape: { display: "The Shape", spanish: "La Forma", aliases: ["Michael Myers"], maps: [], image: "https://deadbydaylight.wiki.gg/images/b/b5/K05_TheShape_Portrait.png"},
  First: { display: "The First", spanish: "El Primero", aliases: ["Vecna", "Henry Creel", "Uno"], maps: [], image: "https://deadbydaylight.wiki.gg/images/K42_TheFirst_Portrait.png?90c96a"}
};

const MAPS_DATA = {
  coal_tower_1: {
    key: "coal_tower_1",
    realm: "The MacMillan Estate",
    name: "Coal Tower 1",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Ind_CoalTower.png/320px-IconMap_Ind_CoalTower.png?52447f"
  },
  blood_lodge: {
    key: "blood_lodge",
    realm: "Autohaven Wreckers",
    name: "Blood Lodge",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Jnk_Lodge.png/320px-IconMap_Jnk_Lodge.png?56a299"
  },
  suffocation_pit_1: {
    key: "suffocation_pit_1",
    realm: "The MacMillan Estate",
    name: "Suffocation Pit 1",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Ind_Mine.png/320px-IconMap_Ind_Mine.png?97408e"
  },
  wrecker_yard: {
    key: "wrecker_yard",
    realm: "Autohaven Wreckers",
    name: "Wrecker's Yard",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Jnk_Scrapyard.png/320px-IconMap_Jnk_Scrapyard.png?405905"
  },
  wretched_shop: {
    key: "wretched_shop",
    realm: "Autohaven Wreckers",
    name: "Wretched Shop",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Jnk_Garage.png/320px-IconMap_Jnk_Garage.png?838630"
  },
  dead_dawg_saloon: {
    key: "dead_dawg_saloon",
    realm: "Grave of Glenvale",
    name: "Dead Dawg Saloon",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Ukr_Saloon.png/320px-IconMap_Ukr_Saloon.png?85f881"
  },
  midwich: {
    key: "midwich",
    realm: "Silent Hill",
    name: "Midwich Elementary School",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Wal_Level01.png/320px-IconMap_Wal_Level01.png?bf4eec"
  },
  lerys: {
    key: "lerys",
    realm: "Léry's Memorial Institute",
    name: "Treatment Theatre",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Hos_Treatment.png/320px-IconMap_Hos_Treatment.png?3f0e48"
  },
  grim_pantry: {
    key: "grim_pantry",
    realm: "Backwater Swamp",
    name: "Grim Pantry",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Swp_GrimPantry.png/320px-IconMap_Swp_GrimPantry.png?f474d9"
  },
  underground_complex: {
    key: "underground_complex",
    realm: "Hawkins National Laboratory",
    name: "The Underground Complex",
    image: "https://deadbydaylight.wiki.gg/images/thumb/IconMap_Qat_Laboratory.png/320px-IconMap_Qat_Laboratory.png?ee4b93"
  }
};

/* =====================
   LISTAS PICK & BAN
===================== */
const lists = {
  tier1: ["Nurse","Blight","Hillbilly","Ghoul","Krasue","Singularity","Spirit"],
  tier2: ["Twins","Dark Lord","Oni","Huntress","Artist","Mastermind","Cenobite"],
  tier3: ["Plague","Doctor","Clown","Nightmare","Executioner","Xenomorph","Unknown","Good Guy","Lich","Houndmaster"],
  tier4: ["Wraith","Deathslinger","Animatronic","Demogorgon","Dredge","Onryo", "Cannibal"],
  tier5: ["Trickster","Legion", "Hag","Pig","GhostFace","Trapper"],
  deshabilitado:["Shape", "Skull Merchant", "Knight", "Nemesis", "First"]
};

const pickRandom = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

/* =====================
   BOTONES
===================== */
function createButtons(killersState, action) {
  const available = killersState.filter(k => k.status === "available");
  const rows = [];
  let row = new ActionRowBuilder();

  available.forEach((k, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${action}:${k.name}`)
        .setLabel(k.name)
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

function renderKillers(killersState) {
  return killersState
    .map(k => {
      if (k.status === "banned") return `❌ ${k.name}`;
      if (k.status === "picked") return `✅ ${k.name}`;
      return k.name;
    })
    .join("\n");
}

function normalizeKillerKey(name) {
  return name
    .replace(/\s/g, "")
    .replace("ō", "o");
}

function normalizeMapKey(name) {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+$/, "");
}

function createMapButtons(killerKey, killer) {
  const maps = getMapsForKiller(killer);
  if (!maps.length) return [];

  const row = new ActionRowBuilder();

  maps.forEach(map => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`map:${killerKey}:${map.key}`)
        .setLabel(`🗺 ${map.name}`)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  return [row];
}
/* =====================
   EMBED PICK & BAN
===================== */
function buildPickBanEmbed(game, turnTarget, action, coin = null) {
  const mention =
    game.mode === "roles"
      ? `<@&${turnTarget}>`
      : `<@${turnTarget}>`;

  const embed = new EmbedBuilder()
    .setTitle("🎮 Pick & Ban")
    .setColor(action === "pick" ? 0x57F287 : 0xED4245)
    .addFields(
      { name: "🟢 Partida 1", value: game.pick1 ?? "*Sin definir*", inline: true },
      { name: "🔵 Partida 2", value: game.pick2 ?? "*Sin definir*", inline: true },
      { name: "🩸 Killers", value: renderKillers(game.killersState) },
      { name: "🎮 Turno", value: `${mention} — **${action.toUpperCase()}**` }
    );

  if (coin) embed.setDescription(`🪙 **Lanzamiento de moneda:** ${coin}`);
  return embed;
}

async function generateTierListImage(selectedTier = "full") {
  const iconSize = 120;
  const padding = 16;
  const rowHeight = iconSize + 20;
  const width = 1500;

  const ALL_TIERS = [
    { label: "TIER 1", key: "tier1", killers: lists.tier1 },
    { label: "TIER 2", key: "tier2", killers: lists.tier2 },
    { label: "TIER 3", key: "tier3", killers: lists.tier3 },
    { label: "TIER 4", key: "tier4", killers: lists.tier4 },
    { label: "TIER 5", key: "tier5", killers: lists.tier5 },
    { label: "DESHAB.", key: "deshabilitado", killers: lists.deshabilitado }
  ];
  const tiers = selectedTier === "full"
    ? ALL_TIERS
    : ALL_TIERS.filter(t => t.key === selectedTier);

  const height = tiers.length * rowHeight + padding * 2;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  /* Fondo general */
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  
  ctx.font = "bold 30px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";

  const portraitBaseBG = await loadImage(
    "https://deadbydaylight.wiki.gg/images/4/42/CharPortrait_bg.webp"
  );
  const portraitShadowBG = await loadImage(
    "https://deadbydaylight.wiki.gg/images/c/cb/CharPortrait_shadowBG.webp"
  );
  const portraitBG = await loadImage(
    "https://deadbydaylight.wiki.gg/images/CharPortrait_roleBG.webp"
  );

  let y = padding;

  for (const tier of tiers) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, y - 6, width, rowHeight);

    /* barra de color */
    ctx.fillStyle = TIER_COLORS[tier.label] || "#ffffff";
    ctx.fillRect(0, y - 6, 14, rowHeight);

    /* texto del tier */
    ctx.fillStyle = "#ffffff";
    drawTierText(
      ctx,
      tier.label.toUpperCase(),
      30,
      y + iconSize / 2,
      TIER_COLORS[tier.label] || "#ffffff"
    );

    let x = 200;

    for (const killerKey of tier.killers) {
      const key = normalizeKillerKey(killerKey);
      const data = killersData[key];
      if (!data) continue;

      try {
       /* fondo base */
      ctx.drawImage(portraitBaseBG, x, y, iconSize, iconSize);
      /* sombra */
      ctx.drawImage(portraitShadowBG, x, y, iconSize, iconSize);
      /* portrait BG (wiki) */
      ctx.drawImage(portraitBG, x, y, iconSize, iconSize);
      
      /* tinte SOLO al portrait BG */
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(120, 10, 15, 0.85)";
      ctx.fillRect(x, y, iconSize, iconSize);
      ctx.globalCompositeOperation = "source-over";
      
      /* retrato del killer (sin modificar) */
      const img = await loadImage(data.image);
      ctx.drawImage(img, x, y, iconSize, iconSize);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, iconSize, iconSize);
      x += iconSize + 6;
      } catch (e) {
        console.error("Error dibujando killer:", key, e);
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
  .setDescription("Genera una imagen con la tier list")
  .addStringOption(o =>
    o.setName("tier")
      .setDescription("Selecciona qué tier mostrar")
      .setRequired(false)
      .addChoices(
        { name: "Full", value: "full" },
        { name: "Tier 1", value: "tier1" },
        { name: "Tier 2", value: "tier2" },
        { name: "Tier 3", value: "tier3" },
        { name: "Tier 4", value: "tier4" },
        { name: "Tier 5", value: "tier5" },
        { name: "Deshabilitado", value: "deshabilitado" }
      )
  );

const matchCommand = new SlashCommandBuilder()
  .setName("match")
  .setDescription("Crea un canal de Pick & Ban entre dos equipos")
  .addRoleOption(o =>
    o.setName("equipo1")
     .setDescription("Rol del Equipo 1")
     .setRequired(true)
  )
  .addRoleOption(o =>
    o.setName("equipo2")
     .setDescription("Rol del Equipo 2")
     .setRequired(true)
  );

const setHorarioCommand = new SlashCommandBuilder()
  .setName("set-horario")
  .setDescription("Define el horario del match (solo Staff)")
  .addStringOption(o =>
    o.setName("dia")
      .setDescription("Día (Ej: Lun, Mar, Mié)")
      .setRequired(true)
  )
  .addIntegerOption(o =>
    o.setName("numero")
      .setDescription("Número de día")
      .setRequired(true)
  )
  .addStringOption(o =>
    o.setName("hora")
      .setDescription("Hora en formato 24hrs (Ej: 20:00)")
      .setRequired(true)
  );

const leaderboardCommand = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Gestión de la leaderboard del torneo")
  .addSubcommand(sub =>
    sub
      .setName("show")
      .setDescription("Muestra la tabla de posiciones")
  )
  .addSubcommand(sub =>
    sub
      .setName("update")
      .setDescription("Actualiza puntos de un equipo")
      .addRoleOption(o =>
        o.setName("equipo")
          .setDescription("Rol del equipo")
          .setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("puntos")
          .setDescription("Puntos a sumar (0 para agregar equipo)")
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("reset")
      .setDescription("Reinicia la leaderboard (solo Staff)")
  );

/* =====================
   REGISTRO
===================== */
client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: [pickBanCommand.toJSON(), infoKillerCommand.toJSON(), tierListCommand.toJSON(), matchCommand.toJSON(), leaderboardCommand.toJSON(), setHorarioCommand.toJSON()] }
  );
  console.log("🤖 Bot listo");
});
async function generateInfoKillerImage(killer) {
  const canvasWidth = 800;
  const canvasHeight = 320;
  const portraitSize = 256;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  /* fondo general */
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  /* =====================
     TEXTO (IZQUIERDA)
  ===================== */
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#ff2b2b";
  
  /* Glow */
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  /* Texto */
  ctx.fillText(killer.display.toUpperCase(), 32, 48);
  
  /* Reset sombras (MUY IMPORTANTE) */
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;


  drawGlowText(ctx, "Nombre en español:", 32, 96, {
    size: 20,
    glow: 10
  });
  ctx.fillText(killer.spanish || "—", 32, 124);

  drawGlowText(ctx, "Alias(es):", 32, 168, {
    size: 20,
    glow: 10
  });
  ctx.fillText(
    killer.aliases.length ? killer.aliases.join(", ") : "—",
    32,
    196
  );
  drawGlowText(ctx, "Mapas:", 32, 232, {
    size: 20,
    glow: 10
  });
  

  const mapsText =
    killer.maps && killer.maps.length
      ? killer.maps.join(", ")
      : "—";
  
  /* Texto multilínea automático */
  wrapText(ctx, mapsText, 32, 260, 460, 22);
  /* =====================
     RETRATO (DERECHA)
  ===================== */
  const x = canvasWidth - portraitSize - 32;
  const y = 32;

  const portraitBaseBG = await loadImage(
    "https://deadbydaylight.wiki.gg/images/4/42/CharPortrait_bg.webp"
  );
  const portraitShadowBG = await loadImage(
    "https://deadbydaylight.wiki.gg/images/c/cb/CharPortrait_shadowBG.webp"
  );
  const portraitBG = await loadImage(
    "https://deadbydaylight.wiki.gg/images/CharPortrait_roleBG.webp"
  );

  /* base */
  ctx.drawImage(portraitBaseBG, x, y, portraitSize, portraitSize);
   /* sombra */
  ctx.drawImage(portraitShadowBG, x, y, portraitSize, portraitSize);

  /* portrait BG */
  ctx.drawImage(portraitBG, x, y, portraitSize, portraitSize);

  /* multiply SOLO al portraitBG */
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(120, 10, 15, 0.85)";
  ctx.fillRect(x, y, portraitSize, portraitSize);
  ctx.globalCompositeOperation = "source-over";

  /* killer intacto */
  const img = await loadImage(killer.image);
  ctx.drawImage(img, x, y, portraitSize, portraitSize);
  const framePadding = 10;

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 8;
  ctx.strokeRect(
    x - framePadding,
    y - framePadding,
    portraitSize + framePadding * 2,
    portraitSize + framePadding * 2
  );
  return canvas.toBuffer("image/png");
}



/* =====================
   INTERACCIONES
===================== */
client.on("interactionCreate", async interaction => {

  /* AUTOCOMPLETE */
  if (interaction.isAutocomplete()) {
    if (interaction.commandName !== "info-killer") return;
  
    const focused = interaction.options.getFocused().toLowerCase();
  
    const choices = Object.entries(killersData)
      .filter(([key, data]) =>
        key.toLowerCase().includes(focused) ||
        data.display.toLowerCase().includes(focused) ||
        data.aliases.some(a => a.toLowerCase().includes(focused))
      )
      .slice(0, 25)
      .map(([key, data]) => ({
        name: data.display,
        value: key
      }));
  
    await interaction.respond(choices);
    return;
  }



  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "tier-list") {
      await interaction.deferReply();
    
      const selectedTier =
        interaction.options.getString("tier") ?? "full";
    
      const buffer = await generateTierListImage(selectedTier);
    
      return interaction.editReply({
        files: [{ attachment: buffer, name: "tierlist.png" }]
      });
    }

    /* INFO KILLER */
    if (interaction.commandName === "info-killer") {
      const killerKey = interaction.options.getString("killer");
      const killer = killersData[killerKey];
    
      if (!killer) {
        return interaction.reply({
          content: "❌ Killer no encontrado.",
          ephemeral: true
        });
      }
    
      await interaction.deferReply();
    
      const buffer = await generateInfoKillerImage(killer);
    
      const embed = new EmbedBuilder()
        .setColor(0x8b0000)
        .setImage("attachment://killer.png");
    
      const mapButtons = createMapButtons(killerKey, killer);
    
      return interaction.editReply({
        embeds: [embed],
        files: [{ attachment: buffer, name: "killer.png" }],
        components: mapButtons
      });
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
    
      games.set(interaction.channelId, {
        mode: "users",
        killersState: pool.map(k => ({
          name: k,
          status: "available"
        })),
        pick1: null,
        pick2: null,
        step: 0,
        players: [starter, starter === cara ? cruz : cara],
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
        components: createButtons(game.killersState, step.action)
      });
    }

    if (interaction.commandName === "match") {
      const equipo1 = interaction.options.getRole("equipo1");
      const equipo2 = interaction.options.getRole("equipo2");
      const coin = Math.random() < 0.5 ? "CARA" : "CRUZ";
      const starterRole = coin === "CARA" ? equipo1 : equipo2;
      const otherRole   = coin === "CARA" ? equipo2 : equipo1;
      const STAFF_ROLE_ID = "1451359299392508128";
    
      const category = interaction.channel.parent;
      if (!category) {
        return interaction.reply({
          content: "❌ Este comando debe usarse dentro de una categoría.",
          ephemeral: true
        });
      }
    
      const channelName = `p&b-horario-${equipo1.name}-vs-${equipo2.name}`
        .toLowerCase()
        .replace(/\s+/g, "-");
    
      const channel = await interaction.guild.channels.create({
        name: channelName,
        type: 0, // GUILD_TEXT
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.members.me.id,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
          },
          {
            id: interaction.guild.id, // @everyone
            deny: ["ViewChannel"]
          },
          {
            id: "1451075715511357472",
            deny: ["ViewChannel"]
          },
          {
            id: equipo1.id,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
          },
          {
            id: equipo2.id,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
          },
          {
            id: STAFF_ROLE_ID,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
          }
        ]
      });
      await interaction.reply({
        content: `✅ Canal creado: ${channel}`,
        ephemeral: true
      });
      games.set(channel.id, {
        mode: "roles",
        equipo1: equipo1.id,
        equipo2: equipo2.id,
        staff: STAFF_ROLE_ID,
        killersState: [
          ...pickRandom(lists.tier1, 1),
          ...pickRandom(lists.tier2, 2),
          ...pickRandom(lists.tier3, 2),
          ...pickRandom(lists.tier4, 2),
          ...pickRandom(lists.tier5, 2)
        ].map(k => ({
          name: k,
          status: "available"
        })),
        pick1: null,
        pick2: null,
        step: 0,
        order: [
          { action: "ban", role: starterRole.id },
          { action: "ban", role: otherRole.id },
          { action: "pick", role: starterRole.id },
          { action: "pick", role: otherRole.id },
          { action: "ban", role: starterRole.id },
          { action: "ban", role: otherRole.id },
          { action: "ban", role: starterRole.id },
          { action: "ban", role: otherRole.id }
        ]
      });

      await channel.send({
        content:
          `🛑 **Sala de texto creada**
          🎮 **Pick & Ban + Horario**
          
          👥 <@&${equipo1.id}> vs <@&${equipo2.id}>
          `,
        allowedMentions: {
          roles: [equipo1.id, equipo2.id]
        }
      });
      await channel.send({
        content:
          `🪙 **Lanzamiento de moneda:** ${coin}\n` +
          `🎮 **Empieza:** <@&${starterRole.id}>`
      });
      const game = games.get(channel.id);
      const firstStep = game.order[0];
      
      await channel.send({
        embeds: [buildPickBanEmbed(
          game,
          firstStep.role,
          firstStep.action
        )],
        components: createButtons(game.killersState, firstStep.action)
      });
    }
    if (interaction.commandName === "set-horario") {
      const STAFF_ROLE_ID = "1451359299392508128";
    
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
        return interaction.reply({
          content: "⛔ Solo el Staff puede usar este comando.",
          flags: 64
        });
      }
      const game = games.get(interaction.channelId);

      if (!game) {
        return interaction.reply({
          content: "⛔ Este comando debe usarse dentro de un canal de match.",
          flags: 64
        });
      }
      const dia = interaction.options.getString("dia");
      const numero = interaction.options.getInteger("numero");
      const hora = interaction.options.getString("hora");
      game.horario = `${dia}-${numero}-${hora}`;
    
      const embed = new EmbedBuilder()
        .setTitle("⏰ Horario definido")
        .setColor(0x57F287)
        .addFields(
          { name: "📅 Día", value: `${dia} ${numero}`, inline: true },
          { name: "🕒 Hora", value: hora, inline: true }
        );
    
      return interaction.reply({ embeds: [embed] });
    }
    if (interaction.commandName === "leaderboard") {
      const sub = interaction.options.getSubcommand();
      const STAFF_ROLE_ID = "1451359299392508128";
      const leaderboard = loadLeaderboard();
    
      /* =====================
         SHOW
      ===================== */
      if (sub === "show") {
        const entries = Object.values(leaderboard);
    
        if (!entries.length) {
          return interaction.reply({
            content: "📭 La leaderboard aún está vacía.",
            ephemeral: true
          });
        }
    
        entries.sort((a, b) => b.points - a.points);
    
        const ranking = entries.map((team, i) => {
          const medal =
            i === 0 ? "🥇" :
            i === 1 ? "🥈" :
            i === 2 ? "🥉" :
            `#${i + 1}`;
    
          return `${medal} **${team.name}** — **${team.points} pts**`;
        }).join("\n");
    
        const embed = new EmbedBuilder()
          .setTitle("🏆 Leaderboard del Torneo")
          .setColor(0xF1C40F)
          .setDescription(ranking)
          .setFooter({ text: "Formato liga • DBD LATAM" });
    
        return interaction.reply({ embeds: [embed] });
      }
    
      /* =====================
         UPDATE
      ===================== */
      if (sub === "update") {
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
          return interaction.reply({
            content: "⛔ Solo el Staff puede actualizar la leaderboard.",
            ephemeral: true
          });
        }
    
        const role = interaction.options.getRole("equipo");
        const points = interaction.options.getInteger("puntos");
    
        if (!leaderboard[role.id]) {
          leaderboard[role.id] = {
            name: role.name,
            points: 0
          };
        }
    
        leaderboard[role.id].points += points;
        saveLeaderboard(leaderboard);
    
        return interaction.reply({
          content: `✅ **${role.name}** ahora tiene **${leaderboard[role.id].points} puntos**.`
        });
      }
    
      /* =====================
         RESET
      ===================== */
      if (sub === "reset") {
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
          return interaction.reply({
            content: "⛔ Solo el Staff puede reiniciar la leaderboard.",
            ephemeral: true
          });
        }
    
        saveLeaderboard({});
        return interaction.reply({
          content: "🧹 Leaderboard reiniciada correctamente."
        });
      }
    }

  }

  /* BOTONES */
  if (interaction.isButton()) {
    const parts = interaction.customId.split(":");
  
      /* =====================
         MAP PREVIEW
      ===================== */
  
    /* =====================
       MAP SELECCIONADO
    ===================== */
    if (parts[0] === "map" || parts[0] === "map-random") {
      const killerKey = parts[1];
      const killer = killersData[killerKey];
      if (!killer) return;
  
      const maps = getMapsForKiller(killer);
      if (!maps.length) return;
  
      const map =
        parts[0] === "map"
          ? maps.find(m => m.key === parts[2])
          : maps[Math.floor(Math.random() * maps.length)];
  
      if (!map) return;
  
      const mapEmbed = new EmbedBuilder()
        .setTitle(`${map.realm} — ${map.name}`)
        .setColor(0x8b0000)
        .setImage(map.image);
  
      const controls = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`back:${killerKey}`)
          .setLabel("⬅ Volver al Killer")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`map-random:${killerKey}`)
          .setLabel("🔁 Siguiente mapa")
          .setStyle(ButtonStyle.Success)
      );
  
      return interaction.update({
        embeds: [
          interaction.message.embeds[0], // killer canvas
          mapEmbed
        ],
        components: [controls],
        files: []
      });
    }
  
    /* =====================
       BACK TO KILLER
    ===================== */
    if (parts[0] === "back") {
      const killerKey = parts[1];
      const killer = killersData[killerKey];
      if (!killer) return;
  
      const mapButtons = createMapButtons(killerKey, killer);
  
      return interaction.update({
        embeds: [interaction.message.embeds[0]],
        components: mapButtons,
        files: []
      });
    }
      
    /* =====================
       PICK & BAN
    ===================== */
    const [action, killerName] = parts;
    const game = games.get(interaction.channelId);
    if (!game) return;
  
    const step = game.order[game.step];
    const member = interaction.member;
  
    if (game.mode === "roles" && !member.roles.cache.has(step.role)) {
      return interaction.reply({
        content: "⛔ No es el turno de tu equipo.",
        flags: 64
      });
    }
  
    if (game.mode === "users") {
      const playerId = game.players[step.player - 1];
      if (interaction.user.id !== playerId) {
        return interaction.reply({
          content: "⛔ No es tu turno.",
          flags: 64
        });
      }
    }
  
    const target = game.killersState.find(k => k.name === killerName);
    if (!target || target.status !== "available") {
      return interaction.reply({
        content: "⛔ Killer ya utilizado.",
        flags: 64
      });
    }
  
    if (action === "ban") target.status = "banned";
    if (action === "pick") {
      target.status = "picked";
      if (!game.pick1) game.pick1 = killerName;
      else game.pick2 = killerName;
    }
  
    game.step++;
  
    const disponibles = game.killersState.filter(k => k.status === "available");
  
    if (disponibles.length === 1) {
      disponibles[0].status = "picked";
  
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🏁 Resultado Final")
            .setColor(0xFEE75C)
            .addFields(
              { name: "🟢 Partida 1", value: game.pick1, inline: true },
              { name: "🔵 Partida 2", value: game.pick2, inline: true },
              { name: "🔥 Desempate", value: disponibles[0].name }
            )
        ],
        components: []
      });
    }
  
    const next = game.order[game.step];
    const nextTarget =
      game.mode === "roles"
        ? next.role
        : game.players[next.player - 1];
  
    return interaction.update({
      embeds: [buildPickBanEmbed(game, nextTarget, next.action)],
      components: createButtons(game.killersState, next.action)
    });
  }
  


});

client.login(process.env.TOKEN);
