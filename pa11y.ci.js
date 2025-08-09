module.exports = {
  defaults: {
    chromeLaunchConfig: {
      args: ['--no-sandbox', '--disable-gpu'],
    },
    timeout: 30000,
    standard: 'WCAG2AA',
    level: 'serious', // fail only on serious issues
  },
  urls: (function () {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const urls = [
      `${base}/`,
      `${base}/vehicles`,
    ];
    const pub = process.env.PUBLIC_VEHICLE_ID;
    const gar = process.env.GARAGE_ID;
    if (pub) urls.push(`${base}/v/${pub}`);
    if (gar) urls.push(`${base}/garage/${gar}/members`);
    return urls;
  })(),
};
