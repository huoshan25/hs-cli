// @ts-nocheck
import fs from 'fs';
import os from 'os';
import path from 'path';

function getConfigFile() {
  return process.env.HS_CLI_CONFIG_PATH || path.join(os.homedir(), '.hs-clirc.json');
}

export function loadPanelUiPreference() {
  const config = readConfig();
  return config?.openspec?.panel?.ui;
}

export function savePanelUiPreference(ui) {
  const config = readConfig();
  if (!config.openspec) config.openspec = {};
  if (!config.openspec.panel) config.openspec.panel = {};
  config.openspec.panel.ui = ui;
  writeConfig(config);
}

function readConfig() {
  try {
    const configFile = getConfigFile();
    if (!fs.existsSync(configFile)) return {};
    const content = fs.readFileSync(configFile, 'utf8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function writeConfig(config) {
  try {
    const configFile = getConfigFile();
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
  } catch {
    // ignore write error, preference is best-effort
  }
}
