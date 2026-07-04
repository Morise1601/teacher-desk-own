const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json';

https.get(url, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const mapped = data.map(c => ({
        name: { common: c.name.common },
        cca2: c.cca2
      }));
      // Sort alphabetically by common name
      mapped.sort((a, b) => a.name.common.localeCompare(b.name.common));

      const fileContent = `// Static list of countries to prevent API downtime or deprecation issues
export interface Country {
  name: {
    common: string;
  };
  cca2: string;
}

export const countries: Country[] = ${JSON.stringify(mapped, null, 2)};
`;
      fs.writeFileSync('lib/countries.ts', fileContent);
      console.log('Successfully generated lib/countries.ts with ' + mapped.length + ' countries!');
    } catch (err) {
      console.error('Failed to parse country data:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('Failed to fetch country data:', err.message);
});
