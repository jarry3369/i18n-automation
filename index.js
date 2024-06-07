import p from 'path';
import r from 'readline';
import f, { promises as fs, writeFileSync as w  } from 'fs';
import  { GoogleSpreadsheet as gss }  from 'google-spreadsheet';

import scanner_config from './scanner.cjs';
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
const lngs = scanner_config.options.lngs;
const loadPath = scanner_config.options.resource.loadPath;
const localesPath = loadPath.replace('/{{lng}}/{{ns}}.json', '');
const rePluralPostfix = new RegExp(/_plural|_[\d]/g);
const sheetId = 0;
const NOT_AVAILABLE_CELL = '_N/A';
const columnKeyToHeader = {
  key: 'key',
  'ko': 'ko',
  'en': 'en',
};
let doc,o,d, n

async function loadSpreadsheet() {
  const { spreadsheet_doc_id, ...creds  } = JSON.parse(await fs.readFile(__cp, 'utf-8'));

  if(spreadsheet_doc_id) {
    doc  = new gss(spreadsheet_doc_id);
  }else {
    const url = await qes('please enter the sheet url: ');
    const s = url.match(/\/d\/([a-zA-Z0-9-_]+)\/edit/)[1];
    n = 'spago.creds.json'
    d = f.readFileSync(n);
    o = JSON.parse(d) || {};
    o.spreadsheet_doc_id = s;
    w(n, JSON.stringify(o, 0, /\t/.test(d) ? '\t' : 2) + '\n')

    doc = new gss(s);
  }
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();

  return doc;
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