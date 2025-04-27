const { program } = require('commander');
const http = require('http');
const fs = require('fs').promises; 
const path = require('path');
const { Builder } = require('xml2js'); 

// параметри 
program
  .requiredOption('-h, --host <type>', 'Server host is required')
  .requiredOption('-p, --port <number>', 'Server port is required')
  .requiredOption('-i, --input <path>', 'Input file path is required');

program.parse(process.argv);

const options = program.opts();
const inputFilePath = path.resolve(options.input);

// перетворення json у xml
async function readAndConvertJSONtoXML() {
  try {
    const data = await fs.readFile(inputFilePath, 'utf8');
    const jsonData = JSON.parse(data);

    const auctions = Array.isArray(jsonData) ? jsonData : jsonData.data || [];

    const formattedData = {
      data: {
        auction: auctions.map(item => ({
          code: item.r030,           // використовуємо r030 для коду
          currency: item.cc,         // використовуємо cc для валюти
          attraction: item.rate      // використовуємо rate для розміру
        }))
      }
    };

    // створюємо xml
    const builder = new Builder({ headless: true });
    const xml = builder.buildObject(formattedData);

    return xml;

  } catch (err) {
    console.error('Error processing file:', err.message);
    throw err;
  }
}

// створюємо сервер
const server = http.createServer(async (req, res) => {
  try {
    const xml = await readAndConvertJSONtoXML(); // викликаємо правильну функцію

    res.setHeader('Content-Type', 'application/xml');
    res.end(xml);

  } catch (err) {
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

// запуск сервера
server.listen(options.port, options.host, () => {
  console.log(`Server is running at http://${options.host}:${options.port}`);
});
