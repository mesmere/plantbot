import process from 'node:process';

process.on('SIGINT', exit);
process.on('SIGTERM', exit);

function exit(signal) {
  console.log(`Received ${signal} - exiting...`);
  process.exit();
}

console.log("Hi.");
