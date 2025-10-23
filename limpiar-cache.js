/**
 * Script para limpiar el caché
 */

const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, 'cache');

console.log('🧹 Limpiando caché...');

if (fs.existsSync(cacheDir)) {
  const files = fs.readdirSync(cacheDir);
  let eliminados = 0;
  
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(cacheDir, file);
      fs.unlinkSync(filePath);
      eliminados++;
    }
  });
  
  console.log(`✅ ${eliminados} archivos de caché eliminados`);
} else {
  console.log('⚠️ No existe el directorio de caché');
}

console.log('✅ Caché limpiado correctamente');

