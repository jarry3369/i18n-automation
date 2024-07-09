import p from 'path';
import r from 'readline';
import f, { promises as fs, writeFileSync as w  } from 'fs';
import  { GoogleSpreadsheet as gss }  from 'google-spreadsheet';

const __cp = p.resolve('./spago.creds.json');
const rl = r.createInterface({
	input: process.stdin,
	output: process.stdout
});
function qes(query) {
	return new Promise((resolve) => {
		rl.question(query, (answer) => {
			resolve(answer);
		});
	});
}

const ns = 'translation'
const loadPath = 'src/i18n/locales/{{lng}}/{{ns}}.json';
const localesPath = loadPath.replace('/{{lng}}/{{ns}}.json', '');
const rePluralPostfix = new RegExp(/_plural|_[\d]/g);
const sheetId = 0;
const NOT_AVAILABLE_CELL = '_N/A';
let doc, o, d, n, lngs, columnKeyToHeader;

async function loadSpreadsheet(skipFlag = false) {
  const { spreadsheet_doc_id, ...creds  } = JSON.parse(await fs.readFile(__cp, 'utf-8'));

  let spreadsheetId;
  if(spreadsheet_doc_id) {
    spreadsheetId = spreadsheet_doc_id;
  } else {
    const url = await qes('please enter the sheet url: ');
    spreadsheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)\/edit/)[1];
    n = 'spago.creds.json'
    d = f.readFileSync(n);
    o = JSON.parse(d) || {};
    o.spreadsheet_doc_id = spreadsheetId;
    w(n, JSON.stringify(o, 0, /\t/.test(d) ? '\t' : 2) + '\n')
  }

  doc = new gss(spreadsheetId);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[sheetId];
  await sheet.loadHeaderRow();
  const headers = sheet.headerValues;

  lngs = headers.filter(header => header !== 'key');
  console.log('Loaded spreadsheet with detected languages:', lngs.join(', ', '\n'));
  
  columnKeyToHeader = { key: 'key' };
  for (const lng of lngs) {
    columnKeyToHeader[lng] = lng;
  }

  if(!skipFlag) await generateResourceFile();

  return doc;
}

async function generateResourceFile() {
  const imports = lngs.map(lng => `import ${lng} from "./locales/${lng}/translation.json";`).join('\n');
  const resourceObject = lngs.map(lng => `  ${lng}: { translation: ${lng} }`).join(',\n');
  
  const content = `
  ${imports}
  
  export const resources = {
  ${resourceObject}
  } as const;
  
  export default resources;
    `.trim();

  const resourcePath = p.resolve('./src/i18n/resource.ts');
  await fs.writeFile(resourcePath, content);
  console.log(`resource.ts file has been generated at ${resourcePath}`);
}


function getPureKey(key = '') {
  return key.replace(rePluralPostfix, '');
}

export {
  localesPath,
  loadSpreadsheet,
  getPureKey,
  ns,
  lngs,
  sheetId,
  columnKeyToHeader,
  NOT_AVAILABLE_CELL,
}