const fs = require('fs');
let code = fs.readFileSync('public/sprites.js', 'utf8');
const classesToFlip = ['knight_m', 'knight_f', 'archer_m', 'archer_f', 'rogue_m', 'rogue_f'];
classesToFlip.forEach(cls => {
  const regex = new RegExp(cls + ':\\s*\\[([\\s\\S]*?)\\]');
  const match = code.match(regex);
  if (match) {
    const lines = match[1].split('\n');
    const flippedLines = lines.map(line => {
      const strMatch = line.match(/"([^"]+)"/);
      if (strMatch) {
        return line.replace(strMatch[1], strMatch[1].split('').reverse().join(''));
      }
      return line;
    });
    code = code.replace(match[1], flippedLines.join('\n'));
  }
});
fs.writeFileSync('public/sprites.js', code);
console.log('Successfully flipped sprites!');
