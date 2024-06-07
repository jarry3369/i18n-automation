#!/usr/bin/env node
import f, { writeFileSync as w } from 'fs'
import download from '../download.js'

let p, a, n, s, o, d

p = process
a = p.argv[2]

switch (a) {
	case 'init':
		f.copyFileSync(new URL('../creds.json', import.meta.url), 'spago.creds.json')
		
		n = 'package.json'
		s = f.readFileSync(n)
		o = JSON.parse(s)
		;(o.scripts ||= {}).sl = 'spago download'
		w(n, JSON.stringify(o, 0, /\t/.test(s) ? '\t' : 2) + '\n')
		p.exit()
		break;
	case 'download':
		download();
		break;
	default:
		console.log('default action')
		break;
}

d = c => console.error(`${c} command is deprecated`)
if (['add', 'set', 'uninstall'].includes(a)) { d(a); p.exit(1) }
if (a == 'install') d(a)