"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const output = path.join(dist, `${manifest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${manifest.version}.zip`);
const files = [
  "manifest.json",
  "src/background.js",
  "src/routing.js",
  "options/options.html",
  "options/options.css",
  "options/options.js",
  "icons/icon.svg"
];

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function localHeader(name, data, info) {
  const nameBuffer = Buffer.from(name);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt16LE(info.dosTime, 10);
  header.writeUInt16LE(info.dosDate, 12);
  header.writeUInt32LE(info.crc, 14);
  header.writeUInt32LE(info.compressedSize, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(nameBuffer.length, 26);
  return Buffer.concat([header, nameBuffer]);
}

function centralHeader(name, data, info, offset) {
  const nameBuffer = Buffer.from(name);
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(8, 10);
  header.writeUInt16LE(info.dosTime, 12);
  header.writeUInt16LE(info.dosDate, 14);
  header.writeUInt32LE(info.crc, 16);
  header.writeUInt32LE(info.compressedSize, 20);
  header.writeUInt32LE(data.length, 24);
  header.writeUInt16LE(nameBuffer.length, 28);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, nameBuffer]);
}

fs.mkdirSync(dist, { recursive: true });

const localParts = [];
const centralParts = [];
let offset = 0;

for (const file of files) {
  const fullPath = path.join(root, file);
  const data = fs.readFileSync(fullPath);
  const compressed = zlib.deflateRawSync(data);
  const stats = fs.statSync(fullPath);
  const info = {
    ...dosDateTime(stats.mtime),
    crc: crc32(data),
    compressedSize: compressed.length
  };
  const local = localHeader(file, data, info);
  localParts.push(local, compressed);
  centralParts.push(centralHeader(file, data, info, offset));
  offset += local.length + compressed.length;
}

const centralOffset = offset;
const central = Buffer.concat(centralParts);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(central.length, 12);
end.writeUInt32LE(centralOffset, 16);

fs.writeFileSync(output, Buffer.concat([...localParts, central, end]));
console.log(`Built ${path.relative(root, output)}`);
