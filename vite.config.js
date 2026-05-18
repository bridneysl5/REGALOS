import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function autoUpdateDataPlugin() {
  const updateDataJs = () => {
    const imagesDir = path.resolve(__dirname, 'public/images');
    const dataFile = path.resolve(__dirname, 'src/data.js');
    
    if (!fs.existsSync(imagesDir) || !fs.existsSync(dataFile)) return;

    let dataContent = fs.readFileSync(dataFile, 'utf-8');
    let hasChanges = false;
    let newItems = '';
    
    let highestId = 0;
    const idRegex = /id:\s*(\d+)/g;
    let match;
    while ((match = idRegex.exec(dataContent)) !== null) {
      const id = parseInt(match[1]);
      if (id > highestId) highestId = id;
    }

    const categories = fs.readdirSync(imagesDir);
    categories.forEach(category => {
      const categoryPath = path.join(imagesDir, category);
      if (fs.statSync(categoryPath).isDirectory()) {
        const files = fs.readdirSync(categoryPath);
        files.forEach(file => {
          if (file.match(/\.(png|jpe?g|svg|gif)$/i)) {
            const imgPath = `/images/${category}/${file}`;
            
            if (!dataContent.includes(imgPath)) {
              hasChanges = true;
              highestId++;
              
              const rawName = file.replace(/\.[^/.]+$/, "");
              const titleCaseName = rawName.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');
              
              const randomPrice = Math.floor(Math.random() * 51) + 80;
              
              let finalCategory = "['" + category + "']";
              let finalOccasion = "['Todos']";
              
              const mappings = {
                'Aniversario_Parejas': { cat: "['Sets y Gift Boxes']", occ: "['Aniversarios y Parejas']" },
                'Bodas y compromisos': { cat: "['Sets y Gift Boxes']", occ: "['Bodas y Compromisos']" },
                'Cumpleanos': { cat: "['Sets y Gift Boxes']", occ: "['Cumpleaños']" },
                'Graduacion': { cat: "['Sets y Gift Boxes']", occ: "['Graducion']" },
                'Nacimientos': { cat: "['Sets y Gift Boxes']", occ: "['Nacimientos / Baby Shower']" },
                'Para El': { cat: "['Sets y Gift Boxes']", occ: "['Para El']" },
                'Para Ella': { cat: "['Sets y Gift Boxes']", occ: "['Para Ella']" },
                'DIA DEL PADRE - EL': { cat: "['Sets y Gift Boxes']", occ: "['Para El']" },
                'Cuadros': { cat: "['Cuadros']", occ: "['Todos']" }
              };

              if (mappings[category]) {
                finalCategory = mappings[category].cat;
                finalOccasion = mappings[category].occ;
              }
              
              newItems += `\n  { id: ${highestId}, name: '${titleCaseName}', price: ${randomPrice}, category: ${finalCategory}, occasion: ${finalOccasion}, img: '${imgPath}' },`;
            }
          }
        });
      }
    });

    if (hasChanges && newItems) {
      const insertionPoint = dataContent.lastIndexOf('];');
      if (insertionPoint !== -1) {
        dataContent = dataContent.slice(0, insertionPoint) + newItems + '\n' + dataContent.slice(insertionPoint);
        fs.writeFileSync(dataFile, dataContent, 'utf-8');
        console.log('✅ data.js automatically updated with new images!');
      }
    }
  };

  return {
    name: 'auto-update-data',
    buildStart() {
      updateDataJs();
    },
    configureServer(server) {
      server.watcher.add(path.resolve(__dirname, 'public/images'));
      server.watcher.on('add', (filePath) => {
        if (filePath.match(/\.(png|jpe?g|svg|gif)$/i)) {
          updateDataJs();
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), autoUpdateDataPlugin()],
})
