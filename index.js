const { program } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');

program
  .requiredOption('-h, --host <type>', 'Server host is required')
  .requiredOption('-p, --port <number>', 'Server port is required')
  .requiredOption('-i, --input <path>', 'Input file path is required');

program.parse(process.argv);

const options = program.opts();

const inputFilePath = path.resolve(options.input);

if (!fs.existsSync(inputFilePath)) {
  console.error('Cannot find input file');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.end('Server error reading input file');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    }
  });
});

server.listen(options.port, options.host, () => {
  console.log(`Server is running at http://${options.host}:${options.port}`);
});
