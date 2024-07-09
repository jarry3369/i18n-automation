import f, { promises as fs } from 'fs';
import path from 'path';
import {
  loadSpreadsheet,
  localesPath,
  getPureKey,
  ns,
  sheetId,
  NOT_AVAILABLE_CELL,
} from './index.js';

let config = JSON.parse(
  f.readFileSync(new URL("./config.json", import.meta.url), "utf8")
);

function getValidTranslation(value) {
  return (value && value.trim() !== "") ? value : NOT_AVAILABLE_CELL;
}

async function getLocalesFolders(localesPath = `${config.i18nDestDir}/locales`) {
  try {
    const entries = await fs.readdir(localesPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (error) {
    console.error(`Error reading locales folders: ${error.message}`);
    return [];
  }
}

async function addNewSheet(doc, title, sheetId, headerValues) {
  const sheet = await doc.addSheet({
    sheetId,
    title,
    headerValues
  });
  return sheet;
}

async function updateTranslationsFromKeyMapToSheet(doc, keyMap, lngs) {
  const title = 'configure';
  let sheet = doc.sheetsById[sheetId];

  const currentLangs = ['key', ...lngs.sort()];

  if (!sheet) {
    sheet = await addNewSheet(doc, title, sheetId, currentLangs);
  } else {
    await updateSheetHeaders(sheet, currentLangs);
  }

  const updatedHeader = await sheet.headerValues;

  const currentRowCount = sheet.rowCount;
  const currentColumnCount = sheet.columnCount;
  const requiredColumnCount = updatedHeader.length;

  if (requiredColumnCount > currentColumnCount) {
    await sheet.resize({
      rowCount: currentRowCount,
      columnCount: requiredColumnCount
    });
  }

  const chunkSize = 500;
  const keyMapEntries = Object.entries(keyMap);
  const validKeys = new Set(keyMapEntries.map(([key]) => key));

  for (let i = 0; i < currentRowCount; i += chunkSize) {
    await processChunk(sheet, keyMapEntries, validKeys, updatedHeader, i, chunkSize);
  }

  const existingKeys = new Set((await sheet.getRows()).map(row => row.key));
  const addPromises = keyMapEntries
    .filter(([key]) => !existingKeys.has(key))
    .map(([key, translations]) => addNewRow(sheet, key, translations, updatedHeader));

  await Promise.all(addPromises);

  console.log('Sheet updated successfully');
}

async function processChunk(sheet, keyMapEntries, validKeys, header, startIndex, chunkSize) {
  const rows = await sheet.getRows({ offset: startIndex, limit: chunkSize });

  const updatePromises = [];
  const deletePromises = [];

  for (const row of rows) {
    const key = row.key;
    if (validKeys.has(key)) {
      const translations = keyMapEntries.find(([k]) => k === key)[1];
      updatePromises.push(updateRow(row, translations, header));
    } else {
      deletePromises.push(row.delete());
    }
  }

  await Promise.all([...updatePromises, ...deletePromises]);
}

async function updateSheetHeaders(sheet, currentLangs) {
  const currentHeader = await sheet.headerValues;
  const newLangs = currentLangs.filter(lang => !currentHeader.includes(lang));
  const langsToRemove = currentHeader.filter(lang => !currentLangs.includes(lang));

  if (newLangs.length > 0 || langsToRemove.length > 0) {
    const updatedHeader = currentHeader.filter(lang => !langsToRemove.includes(lang));
    updatedHeader.push(...newLangs);
    await sheet.setHeaderRow(updatedHeader);

    if (langsToRemove.length > 0) {
      const rows = await sheet.getRows();
      
      const newRows = rows.map(row => {
        const newRow = {};
        updatedHeader.forEach(header => {
          newRow[header] = row[header];
        });
        return newRow;
      });

      await sheet.clear();
      await sheet.setHeaderRow(updatedHeader);
      await sheet.addRows(newRows);
    }
  }
}

async function updateRow(row, translations, header) {
  let updated = false;
  header.forEach(lang => {
    if (lang !== 'key') {
      const newValue = getValidTranslation(translations[lang]);
      if (newValue !== row[lang]) {
        row[lang] = newValue;
        updated = true;
      }
    }
  });
  if (updated) {
    await row.save();
  }
}

async function addNewRow(sheet, key, translations, header) {
  const newRow = { key };
  header.forEach(lang => {
    if (lang !== 'key') {
      newRow[lang] = getValidTranslation(translations[lang]);
    }
  });
  await sheet.addRow(newRow);
}

function toJson(keyMap) {
  return Object.entries(keyMap).reduce((json, [__, keysByPlural]) => {
    Object.entries(keysByPlural).forEach(([keyWithPostfix, translations]) => {
      json[keyWithPostfix] = { ...translations };
    });
    return json;
  }, {});
}

function gatherKeyMap(keyMap, lng, json) {
  Object.entries(json).forEach(([keyWithPostfix, translated]) => {
    const key = getPureKey(keyWithPostfix);
    if (!keyMap[key]) {
      keyMap[key] = {};
    }
    if (!keyMap[key][keyWithPostfix]) {
      keyMap[key][keyWithPostfix] = {};
    }
    keyMap[key][keyWithPostfix][lng] = translated;
  });
}

async function updateSheetFromJson() {
  try {
    const doc = await loadSpreadsheet(true);
    const lngs = await getLocalesFolders();
    
    const keyMap = {};
    await Promise.all(lngs.map(async (lng) => {
      const localeJsonFilePath = path.join(localesPath, lng, `${ns}.json`);
      const jsonContent = await fs.readFile(localeJsonFilePath, 'utf8');
      gatherKeyMap(keyMap, lng, JSON.parse(jsonContent));
    }));

    await updateTranslationsFromKeyMapToSheet(doc, toJson(keyMap), lngs);
    console.log('Sheet updated successfully');
  } catch (error) {
    console.error('Error updating sheet:', error);
    throw error;
  }
}

export default updateSheetFromJson;
