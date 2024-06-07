const path = require('path');

const EXTS = '/**/*.{js,jsx,ts,tsx,html}';

module.exports = {
  input: [`src/pages${EXTS}`, `src/components${EXTS}`],
  options: {
    defaultLng: 'ko',
    lngs: ['ko', 'en'],
    func: {
      list: ['i18next.t', 'i18n.t', '$i18n.t'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.html'],
    },
    resource: {
      loadPath: path.join('src/i18n/locales/{{lng}}/{{ns}}.json'),
      savePath: path.join('locales/{{lng}}/{{ns}}.json'),
    },
    defaultValue(lng, ns, key) {
      const keyAsDefaultValue = ['ko'];
      if (keyAsDefaultValue.includes(lng)) {
        const separator = '~~';
        const value = key.includes(separator) ? key.split(separator)[1] : key;
        return value;
      }

      return '';
    },
    keySeparator: false,
    nsSeparator: false,
    prefix: '%{',
    suffix: '}',
  },
};