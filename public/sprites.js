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
