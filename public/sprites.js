const SPRITES = {
  // 16x16 Pixel Art Matrices
  // . = transparent, B = black border
  // C = primary color, S = secondary (silver/metal), W = white, D = dark shade
  knight: [
    "....BBBB........",
    "...BSSSSB.......",
    "..BSSWWSSB......",
    "..BSWBBWSSB.....",
    "...BSSSSSB..B...",
    "....BBBB...BBB..",
    "...BCCCCB..BSB..",
    "..BCCCCCCB.BSB..",
    ".BBCCCCCCBBBSB..",
    ".B.BCBCCBCB.B...",
    "...B.CC.B...B...",
    "....B..B........",
    "....B..B........",
    "...BB..BB.......",
    "................",
    "................"
  ],
  mage: [
    "....BBBB........",
    "...BCCCCB.......",
    "..BCCCCCCB......",
    "..BWWWWWWBB.....",
    "...BWBBWWB.B....",
    "....BBBB...BB...",
    "...BCCCCB..BDB..",
    "..BCCCCCCB.BDB..",
    "..BCCCCCCB.BDB..",
    "..BCCCCCCB.BDB..",
    "...BCCCCB..BDB..",
    "...BCCCCB..BBB..",
    "...BCCCCB.......",
    "..BBBBBBBB......",
    "................",
    "................"
  ],
  archer: [
    "....BBBB........",
    "...BCCCCB.......",
    "..BCCWWCCB......",
    "..BCWBBWCB......",
    "...BCCCCCB..B...",
    "....BBBB....B...",
    "...BCCCCB..BDB..",
    "..BCCCCCCB.BDB..",
    ".BBCCCCCCBB.B...",
    ".B.BCBCCB.B.B...",
    "...B.CC.B...B...",
    "....B..B........",
    "....B..B........",
    "...BB..BB.......",
    "................",
    "................"
  ],
  rogue: [
    "....BBBB........",
    "...BDDDDDB......",
    "..BBDWWDBB......",
    "..BDBBBWDB......",
    "...BDDDDDB......",
    "....BBBB........",
    "...BCCCCB.B.....",
    "..BCCCCCCBB.....",
    ".BBCCCCCCBB.....",
    ".B.BCBCCB.B.....",
    "...B.CC.B.......",
    "....B..B........",
    "....B..B........",
    "...BB..BB.......",
    "................",
    "................"
  ],
  slime: [
    "................",
    "................",
    "................",
    "......BBBB......",
    "....BCCCCCCB....",
    "...BCCCCCCCCB...",
    "..BCCWCCCCWCCB..",
    "..BCBWC..CBWCB..",
    ".BCCCCCCCCCCCCB.",
    ".BCCCCCCCCCCCCB.",
    ".BCCCCCCCCCCCCB.",
    "..BCCCCCCCCCCB..",
    "...BBBBBBBBBB...",
    "................",
    "................",
    "................"
  ],
  bat: [
    "................",
    "B..............B",
    "BB............BB",
    "BCB...BBBB...BCB",
    "BCCB.BCCCCB.BCCB",
    "BCCCBCCWWCCBCCCB",
    ".BCCBCBWBCBCBCB.",
    "..BCCCCCCCCCCB..",
    "...BCCCCCCCCB...",
    "....BCCBBCCB....",
    ".....BB..BB.....",
    "................",
    "................",
    "................",
    "................",
    "................"
  ],
  dragon: [
    "................",
    "....B..B..B.....",
    "...BCBBCBBCB....",
    "..BCCCCCCCCCB...",
    "..BCCWCCCWCCB...",
    "..BCCBWCCBWCBB..",
    "...BCCCCCCCCCB..",
    ".BBBCCCCCCCCCB..",
    "BCCCBCCCCCCCB...",
    "BCCCCBCCCCCB....",
    ".BCCCBCCCCB.....",
    "..BBB.BCCB......",
    "......B..B......",
    ".....BB..BB.....",
    "................",
    "................"
  ],
  boss: [
    "................",
    "B..B........B..B",
    "BBBB...BB...BBBB",
    ".BB..BCCCCB..BB.",
    "....BCCCCCCB....",
    "...BCCWCCWCCB...",
    "...BCCBCCBCCB...",
    "...BCCCCCCCCB...",
    "....BCCBBCCB....",
    "....BCCCCCCB....",
    "...BCCCCCCCCB...",
    "..BCCCCCCCCCCB..",
    ".BCCCCCCCCCCCCB.",
    ".BCCBCCCCCCBCCB.",
    "..BB........BB..",
    "................"
  ],
  wolf: [
    "................",
    "................",
    "................",
    "B...B...........",
    "BB.BB...BBBB....",
    "BCBBCBBBCCCCB...",
    "BCCBCCCCCCCCCB..",
    "BCCWCCCCCCCCCBB.",
    "BCCBWCCCCCCCCCCB",
    ".BBBBCCCCCCCCCB.",
    "....BCCCCBCCCB..",
    "....BCCB.BCCB...",
    "....BCCB.BCCB...",
    "....BBBB.BBBB...",
    "................",
    "................"
  ],
  golem: [
    "................",
    "......BBBB......",
    ".....BCCCCB.....",
    "....BCCWWCCB....",
    "....BCCBBCCB....",
    ".....BCCCCB.....",
    "..BBBBCCCCBBBB..",
    ".BCCCCBCCBCCCCB.",
    ".BCCCCBCCBCCCCB.",
    ".BCCCCBCCBCCCCB.",
    "..BBBBCCCCBBBB..",
    ".....BCCCCB.....",
    ".....BCCBCCB....",
    "....BCCB.BCCB...",
    "....BBBB.BBBB...",
    "................"
  ]
};

function renderSprite(ctx, spriteName, x, y, scale, primaryColor, direction = 'down') {
  const sprite = SPRITES[spriteName];
  if (!sprite) return;
  
  const size = sprite.length;
  const pixelSize = scale;
  
  // To center the sprite at x, y
  const offsetX = x - (size * pixelSize) / 2;
  const offsetY = y - (size * pixelSize) / 2;
  
  // Flip context if facing left
  ctx.save();
  if (direction === 'left') {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const char = sprite[r][c];
      if (char === '.') continue;
      
      switch (char) {
        case 'B': ctx.fillStyle = '#1a1412'; break; // Black outline
        case 'C': ctx.fillStyle = primaryColor; break; // Main Color
        case 'S': ctx.fillStyle = '#94a3b8'; break; // Silver/Armor
        case 'W': ctx.fillStyle = '#f8fafc'; break; // White/Eyes
        case 'D': ctx.fillStyle = '#64748b'; break; // Dark/Staff
        default: ctx.fillStyle = primaryColor; break;
      }
      
      // Add slight bobbing if direction is moving
      let bobOffset = 0;
      if (direction !== 'down' && direction !== 'idle') {
        bobOffset = Math.sin(Date.now() / 150) * 2;
      }
      
      ctx.fillRect(offsetX + c * pixelSize, offsetY + r * pixelSize + bobOffset, pixelSize + 0.5, pixelSize + 0.5);
    }
  }
  
  ctx.restore();
}

const PLAYER_SPRITES = {
  knight_m: [
    ".........BBBBBB.....BSBB",
    ".......BB111111BB..BSSSB",
    "......B1111111111B.BSSSB",
    ".....B122111111221BBSSSB",
    ".....B2F2F1111F2F2BBSSSB",
    ".....B2FFWFFFFWFF2BBSSSB",
    ".....B2FFEFFFFEFF2BBSSSB",
    "......BFFFFFFFFFFB.BSSSB",
    ".......BBFFFFFFBB..BSSSB",
    ".........BBBBBB....BSSSB",
    ".......BBLLccLLBB..BSSSB",
    "......BBLCCCCCCLBB.BSSSB",
    ".....BCBcLccccLcBCBBSSSB",
    "...BCCCBcLLCCLLCBCCBBLBB",
    "...BCCCBccLLLLccBCCCBDB.",
    "...BCCCBCCDDDDCCBCCCBDB.",
    "....BBBBDDLLLLDDBBBBBBB.",
    "........BDDccDDB........",
    "......BBLCCCCCCLBB......",
    ".....BBLccBBBBccLBB.....",
    ".....BCCBB....BBCCB.....",
    ".....BCCB......BCCB.....",
    ".....BBBB......BBBB.....",
    "........................"
  ],
  knight_f: [
    "........BBBBBBBB....BSBB",
    "......BB11111111BB.BSSSB",
    "....B111111111111B.BSSSB",
    "....B11F11111111F11BSSSB",
    "....B11FFFWFFFFWFF1BSSSB",
    "....B11FFFEFFFFEFF1BSSSB",
    "....B12FFFFFFFFFF21BSSSB",
    "....B122BBFFFFFFB21BSSSB",
    "....B12222BBBBBB221BSSSB",
    "....B1BBLLccLLBB221BSSSB",
    "...B12BBLccccLBB21BBSSSB",
    "...B11BCBcLLcBCB11BBSSSB",
    "..B11BCCBCLLCBCCB11BBLBB",
    ".....BCCBDDDDBCCB...BDB.",
    ".....BBBBDDLLDDBBBBBBDB.",
    "........BDccDDB..BBBBBB.",
    "......BBLccccLBB........",
    ".....BBLcBBBBcLBB.......",
    ".......BCCB..BCCB.......",
    ".......BCCB..BCCB.......",
    ".......BBBB..BBBB.......",
    "........................",
    "........................",
    "........................"
  ],
  mage_m: [
    "..........BBBB..........",
    "........BBCCCCBB........",
    "......BBCCCCCCCCBB......",
    ".....BCCCCCCCCCCCCB.....",
    "....BBBBBBBBBBBBBBBB....",
    "........B777777B........",
    ".......B7FWFFWF7B.......",
    ".......B7FEFFEFE7B......",
    ".......B7FFFFFF7B.......",
    ".......B77777777B.......",
    ".......B77777777B.......",
    ".......BB7777BB.....BB..",
    ".....BBBBCCCCBBBB..B55B.",
    "...BCCCBCCCCCCCCBCCB5WB.",
    "...BCCCCBCCCCCCCCBCCB55B",
    "...BCCCCBDDDDDDDDBCCB0B.",
    "...BCCCCBDDDDDDDDBBBB0B.",
    "....BBBBDDDDDDDDBB..B0B.",
    "........BCCCCCCCCB..B0B.",
    ".......BBCCCCCCCCBB.B0B.",
    ".......BCCCCCCCCCCB.B0B.",
    ".......BCCCCCCCCCCB.B0B.",
    ".......BBBBBBBBBBBB.BBB.",
    "........................"
  ],
  mage_f: [
    "...........BB...........",
    "..........BCCB..........",
    ".........BCCCCB.........",
    "........BCCCCCCB........",
    "......BBCCCCCCCCBB......",
    "....BBBBBBBBBBBBBBBB....",
    ".......B55555555B.......",
    "......B55F5555F55B......",
    "......B5FFWFFWFF5B......",
    "......B5FFEFFEFE5B......",
    "......B56FFFFFF65B......",
    "......B56BFFFFB65B..BB..",
    "......B556BBBB655B.B55B.",
    "......B55BBCCBB55B.B5WB.",
    ".......B.BCCCCB.B..B55B.",
    ".........BDDDDBBBBBB0B..",
    "........BBCCCCBB...B0B..",
    ".......BCCCCCCCCB..B0B..",
    ".......BCCCCCCCCB..B0B..",
    "........BCCBBCCB...B0B..",
    "........BCCBBCCB...B0B..",
    "........BBBBBBBB...BBB..",
    "........................",
    "........................"
  ],
  archer_m: [
    ".........BBBBBB.........",
    ".......BBCCCCCCBB.......",
    "......BCCCCCCCCCCB......",
    "......BCCCFFFFCCCB......",
    "......BCFFWFFWFCCB......",
    "......BcEFEFFEFCCB......",
    "......BCCCFFFFCCCB......",
    ".......BBCCCCCCBB.......",
    "........BBBBBBBB........",
    "......BBLLCCCCLLBBBB....",
    "......BBCCCCCCCCB000B...",
    "..BCCCBCCCCCCCCBCBS00B..",
    "BCCCBDDDDDDDDBCCCB.S00B.",
    "BCCCBDDDDDDDDBCCCB..S00B",
    "...BBBBDDDDDDDDBBBBBB00B",
    ".......BCCCCCCCCB...S00B",
    "......BBCCCCCCCCBB.S00B.",
    ".......BDDDDDDDDB.S00B..",
    ".....BBDDDDDDDDBB000B...",
    "....BDDDDBBDDDDB.BBB....",
    ".....BDDB....BDDB.......",
    ".....BBBB....BBBB.......",
    "........................",
    "........................"
  ],
  archer_f: [
    ".........BBBBBB.........",
    ".......BB333333BB.......",
    "......B3333333333B......",
    ".....B344333333443B.....",
    ".....B4F4F3333F4F4B.....",
    ".....B4FFWFFFFWFF4B.....",
    ".....B4FFEFFFFEFF4B.....",
    "......BFFFFFFFFFFB......",
    ".......BBFFFFFFBB.......",
    ".........BBBBBB.........",
    "......BBCCCCLLBB.BBB....",
    "....BBCCCCCCLLBBB000B...",
    "....BCBCCCCCCLLBCBS00B..",
    "..BCCCLLDDDDLLCCCB.S00B.",
    "...CCCLLDDDDLLCCCB..S00B",
    "..BDDBBBBBDDDDBBBBBBB00B",
    "..........BCCB......S00B",
    ".........BBCCBB....S00B.",
    "........BDDDDDDB..S00B..",
    ".......BDDDDDDDDB000B...",
    "........BDDBBDDB.BBB....",
    "........BDDBBDDB........",
    "........BBBBBBBB........",
    "........................"
  ],
  rogue_m: [
    ".........BBBBBB.........",
    ".......BBccccccBB.......",
    "......BccccccccccB......",
    ".....Bc88cccccc8ccB.....",
    ".....BcFFFccccFFFcB.....",
    ".....BcFFWFFFFWFFcB.....",
    ".....BcFFEFFFFEFFcB.....",
    "......BccccccccccB......",
    ".......BBccccccBB.......",
    ".........BB88BB.....B...",
    ".......BB888888BB..BSB..",
    "......BBccccccccBB.BSB..",
    "....BCCB88cc88BCCB.BSB..",
    "..BCCB88cccc88BCCBSSSB.",
    "..BCCBccccccccBCCBSSSB.",
    "......BBccDDDDccBBBLSLBB",
    "....BBBBDDLLLLDDBBBBDB..",
    "......BBDDccDDBB...BBB..",
    ".....BBccccccccBB.......",
    ".......Bcc8BB8ccB.......",
    ".......B88B..B88B.......",
    ".......BBBB..BBBB.......",
    "........................",
    "........................"
  ],
  rogue_f: [
    ".........BBBBBB.........",
    ".......BBccccccBB.......",
    "......BccccccccccB......",
    ".....Bc88cccccc8ccB.....",
    ".....BcFFFccccFFFcB.....",
    ".....BcFFWFFFFWFFcB.....",
    ".....BcFFEFFFFEFFcB.....",
    "....8.BccccccccccB.8....",
    "...888.BBccccccBB.888...",
    "...888...BB88BB.....B...",
    "....8..BB888888BB..BSB..",
    "......BBccccccccBB.BSB..",
    "......BCB88cc88BCB.BSB..",
    "....BCB88cccc88BCBSSSB.",
    "..BCCBccccccccBCCBSSSB.",
    ".BBBBBcDDDDcBBBBBLSLBB",
    "........BDLDDB.....BDB..",
    "......BDDccDDBB....BBB..",
    "......Bcc8888ccB........",
    ".....Bc88BBBB88cB.......",
    "......B88B..B88B........",
    "......B88B..B88B........",
    "......BBBB..BBBB........",
    "........................"
  ]
};

function renderPlayerSprite(ctx, player, x, y, scale) {
  const spriteKey = `${player.spriteType || 'knight'}_${player.gender || 'm'}`;
  const sprite = PLAYER_SPRITES[spriteKey] || PLAYER_SPRITES['knight_m'];
  
  const size = 24;
  const pixelSize = scale;
  
  const offsetX = x - (size * pixelSize) / 2;
  const offsetY = y - (size * pixelSize) / 2;
  
  ctx.save();
  if (player.direction === 'left') {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }
  
  let bobOffset = 0;
  if (player.direction !== 'down' && player.direction !== 'idle') {
    bobOffset = Math.sin(Date.now() / 150) * 2;
  }
  
  for (let r = 0; r < size; r++) {
    const row = sprite[r];
    if (!row) continue;
    for (let c = 0; c < size; c++) {
      const char = row[c];
      if (!char || char === '.') continue;
      
      switch (char) {
        case 'B': ctx.fillStyle = '#1a1412'; break; // Outline
        case 'C': ctx.fillStyle = player.color; break; // Primary Color
        case 'c': 
          ctx.fillStyle = player.color; 
          ctx.fillRect(offsetX + c * pixelSize, offsetY + r * pixelSize + bobOffset, pixelSize + 0.5, pixelSize + 0.5);
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; // Darken for shading
          break;
        case 'S': ctx.fillStyle = '#e2e8f0'; break; // Silver/Steel
        case 'D': ctx.fillStyle = '#334155'; break; // Dark Iron/Leather
        case 'F': ctx.fillStyle = '#ffe0bd'; break; // Skin
        case 'E': ctx.fillStyle = '#0f172a'; break; // Eye Pupil
        case 'W': ctx.fillStyle = '#ffffff'; break; // Eye White
        case 'L': ctx.fillStyle = '#fbbf24'; break; // Gold
        // Hair & Accents
        case '1': ctx.fillStyle = '#fef08a'; break; // Blonde Light
        case '2': ctx.fillStyle = '#eab308'; break; // Blonde Dark
        case '3': ctx.fillStyle = '#f87171'; break; // Red Light
        case '4': ctx.fillStyle = '#dc2626'; break; // Red Dark
        case '5': ctx.fillStyle = '#c084fc'; break; // Purple Light
        case '6': ctx.fillStyle = '#9333ea'; break; // Purple Dark
        case '7': ctx.fillStyle = '#9ca3af'; break; // White/Silver Hair
        case '8': ctx.fillStyle = '#4b5563'; break; // Dark Hair
        case '9': ctx.fillStyle = '#fdba74'; break; // Orange Light
        case '0': ctx.fillStyle = '#ea580c'; break; // Orange Dark
        default: ctx.fillStyle = player.color; break;
      }
      
      ctx.fillRect(offsetX + c * pixelSize, offsetY + r * pixelSize + bobOffset, pixelSize + 0.5, pixelSize + 0.5);
    }
  }
  
  ctx.restore();
}
