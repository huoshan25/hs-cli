// @ts-nocheck
export const themes = {
  dark: {
    screen: { bg: 'black', fg: 'white' },
    box: { border: 'cyan', fg: 'white', bg: 'black' },
    selected: { fg: 'black', bg: 'cyan' },
    title: 'cyan',
    muted: 'gray',
    accent: 'yellow',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    footerBg: 'blue',
    footerFg: 'white'
  },
  light: {
    screen: { bg: 'white', fg: 'black' },
    box: { border: 'blue', fg: 'black', bg: 'white' },
    selected: { fg: 'white', bg: 'blue' },
    title: 'blue',
    muted: 'gray',
    accent: 'magenta',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    footerBg: 'gray',
    footerFg: 'black'
  }
};

export function getTheme(name = 'dark') {
  return themes[name] || themes.dark;
}
