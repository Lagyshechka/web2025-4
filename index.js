const { program } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { parseStringPromise, Builder } = require('xml2js'); 

program
  .requiredOption('-h, --host <type>', 'Server host is required')
  .requiredOption('-p, --port <number>', 'Server port is required')
  .requiredOption('-i, --input <path>', 'Input file path is required');

program.parse(process.argv);

const options = program.opts();
const inputFilePath = path.resolve(options.input);

async function readAndConvertXML() {
  try {
    const xmlData = await fs.readFile(inputFilePath, 'utf8');

    const jsonData = await parseStringPromise(xmlData);

    const auctions = jsonData.data?.auction || [];

    const formattedData = {
      data: {
        auction: auctions.map(item => ({
          StockCode: item.code?.[0] || '',
          ValCode: item.currency?.[0] || '',
          Attraction: item.attraction?.[0] || ''
        }))
      }
    };

    const builder = new Builder({ headless: true });
    const newXml = builder.buildObject(formattedData);

    return newXml;

  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('Cannot find input file');
    } else {
      console.error('Error processing file:', err.message);
    }
    throw err;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const newXml = await readAndConvertXML();

    res.setHeader('Content-Type', 'application/xml');
    res.end(newXml);

  } catch (err) {
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

// запуск сервера
server.listen(options.port, options.host, () => {
  console.log(`Server is running at http://${options.host}:${options.port}`);
});
