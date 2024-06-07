import { mkdirp } from 'mkdirp';
import  fs from 'fs';
import path from 'path';

import  {
  loadSpreadsheet,
  localesPath,
  ns,
  lngs,
  sheetId,
  columnKeyToHeader,
  NOT_AVAILABLE_CELL,
} from './index.js';

function preStringify(node) {
  for (let key in node) {
    if (typeof node[key] === 'object' && node[key] !== null) {
      preStringify(node[key]);
    } else {
      node[key] = String(node[key]);
    }
  }
}

async function fetchTranslationsFromSheetToJson(doc) {
  const sheet = doc.sheetsById[sheetId];
  if (!sheet) {
    return {};
  }

  const lngsMap = {};
  const rows = await sheet.getRows();

  rows.forEach((row) => {
    const key = row[columnKeyToHeader.key];
    lngs.forEach((lng) => {
      const translation = row[columnKeyToHeader[lng]];
      if (translation === NOT_AVAILABLE_CELL) return;
      if (!lngsMap[lng]) lngsMap[lng] = {};

      try {
        const raw = JSON.parse(translation);
        if (typeof raw === 'object' && raw !== null) {
          preStringify(raw);
        }
        lngsMap[lng][key] = raw;
      } catch (error) {
        lngsMap[lng][key] = translation || '';
      }
    });
  });

  return lngsMap;
}

async function checkAndMakeLocaleDir(dirPath, subDirs) {
  await Promise.all(subDirs.map(async (subDir) => {
    await mkdirp(path.join(dirPath, subDir));
  }));
}


async function updateJsonFromSheet() {
  await checkAndMakeLocaleDir(localesPath, lngs);

  const doc = await loadSpreadsheet();
  const lngsMap = await fetchTranslationsFromSheetToJson(doc);

  fs.readdir(localesPath, (error, lngs) => {
    if (error) {
      throw error;
    }
    lngs.forEach((lng) => {
      console.log(localesPath);
      const localeJsonFilePath = `${localesPath}/${lng}/${ns}.json`;
      const jsonString = JSON.stringify(lngsMap[lng], null, 2);
      fs.writeFile(localeJsonFilePath, jsonString, 'utf8', (err) => { if (err) throw err; });
    });
  });
}

export default updateJsonFromSheet;