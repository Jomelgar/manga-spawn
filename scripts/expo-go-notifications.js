#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(path.dirname(process.argv[1]), '..');
const PATCH_NAME = 'expo-notifications+57.0.21.patch';
const SOURCE = path.join(ROOT, 'tools', 'patches', PATCH_NAME);
const PATCHES_DIR = path.join(ROOT, 'patches');
const TARGET = path.join(PATCHES_DIR, PATCH_NAME);
const ENV_FILE = path.join(ROOT, '.env');
const ENV_KEY = 'EXPO_PUBLIC_EXPO_GO_NOTIFICATIONS';

function runPatchPackage(args) {
  execFileSync('npx', ['patch-package', ...args], { cwd: ROOT, stdio: 'inherit' });
}

function setEnv(value) {
  const existing = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8').split('\n') : [];
  const kept = existing.filter(
    (line) => line.trim() !== '' && !line.startsWith(`${ENV_KEY}=`),
  );
  kept.push(`${ENV_KEY}=${value}`);
  fs.writeFileSync(ENV_FILE, `${kept.join('\n')}\n`);
}

const mode = process.argv[2];

if (mode === 'on') {
  if (!fs.existsSync(SOURCE)) {
    console.error(`No se encontró el patch en ${SOURCE}`);
    process.exit(1);
  }
  fs.mkdirSync(PATCHES_DIR, { recursive: true });
  fs.copyFileSync(SOURCE, TARGET);
  runPatchPackage([]);
  setEnv('1');
  console.log(
    '\n✅ Notificaciones locales activadas para Expo Go (Android).' +
      '\n   Reinicia Metro con: npx expo start --clear\n',
  );
} else if (mode === 'off') {
  if (fs.existsSync(TARGET)) {
    runPatchPackage(['--reverse']);
    fs.rmSync(TARGET);
  }
  setEnv('0');
  console.log('\n✅ Notificaciones de Expo Go (Android) desactivadas.\n');
} else {
  console.error('Uso: node scripts/expo-go-notifications.js <on|off>');
  process.exit(1);
}
