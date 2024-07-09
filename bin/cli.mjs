#!/usr/bin/env node
import f, { writeFileSync as w } from "fs";
import download from "../download.js";
import upload from "../upload.js";
import path from "path";
import { execSync } from 'child_process'

import { executeWithTimeout } from "../utils/executeWithTimeout.js";

// 일단 shuttle 레포지토리 기준으로 고정
const dependencies = [
  "dayjs@1.11.7",
  "i18next@22.4.9",
  "react-i18next@12.1.4",
  "i18next-browser-languagedetector@7.0.1"
];

let p, a, n, s, o, d;

p = process;
a = p.argv[2];

let config = JSON.parse(
  f.readFileSync(new URL("../config.json", import.meta.url), "utf8")
);

function copyDirectory(source, destination) {
  if (!f.existsSync(destination)) {
    f.mkdirSync(destination, { recursive: true });
  }

  const files = f.readdirSync(source);
  for (const file of files) {
    const srcPath = path.join(source, file);
    const destPath = path.join(destination, file);

    if (f.lstatSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      f.copyFileSync(srcPath, destPath);
    }
  }
}

d = (c) => console.error(`${c} command is deprecated`);
if (["add", "set", "uninstall"].includes(a)) {
  d(a);
  p.exit(1);
}
if (a == "install") d(a);

function usage() {
  console.log("Usage: spago <command>");
  console.log("Available commands:");
  console.log("  init      - initialize project with i18n configuration");
  console.log("  download  - Download translations from linked sheet");
  console.log("  upload    - Upload translations to linked sheet and automatically download to sync local files");
}

async function run(c){
  switch (c) {
    case "init":
      try {
        console.log('Installing dependencies...');
        execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
      } catch (error) {
        console.error('Failed to install dependencies:', error);
        p.exit(1);
      }

      console.log("Starting init action...");

      f.copyFileSync(
        new URL(`../${config.credentials}`, import.meta.url),
        config.outputCredentialsName
      );

      n = config.packageJson;
      s = f.readFileSync(n);
      o = JSON.parse(s);
      (o.scripts ||= {}).sl = config.downloadScript;
      w(n, JSON.stringify(o, 0, /\t/.test(s) ? "\t" : 2) + "\n");

      const sourceDir = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        `../${config.i18nSourceDir}`
      );
      const destDir = path.resolve(p.cwd(), config.i18nDestDir);
      copyDirectory(sourceDir, destDir);

      console.log("Init action completed.");

      p.exit();
      break;
    case "download":
      console.log("Starting download action...");
      try {
        await executeWithTimeout(download);
        console.log("Download action completed.");
      } catch (error) {
        console.error("Download action failed:", error?.message ?? 'unknown issue');
        p.exit(1);
      }
      p.exit();
      break;
    case "upload":
      console.log("Starting upload action...");
      try {
        await executeWithTimeout(upload);
        console.log("Upload action completed successfully.");
        console.log("Starting automatic download to sync local files...");
        await run("download");
      } catch (error) {
        console.error("Upload action failed:", error?.message ?? 'unknown issue');
        p.exit(1);
      }
      p.exit();
      break;
    case undefined:
    case "--help":
    case "-h":
      usage();
      process.exit(0);
    default:
      printUsage();
      d(c);
  }
}

(async () => {
  try {
    await run(a);
    p.exit(0);
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    p.exit(1);
  }
})();