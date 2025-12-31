const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outPath =
  outIndex !== -1 && args[outIndex + 1]
    ? args[outIndex + 1]
    : path.join('coverage', 'lcov.info');
const inputFiles =
  outIndex === -1 ? args : args.slice(0, outIndex).filter(Boolean);

if (inputFiles.length === 0) {
  console.error('Usage: node scripts/merge-coverage.js <lcov...> --out <path>');
  process.exit(1);
}

const addCount = (map, key, count) => {
  map.set(key, (map.get(key) || 0) + count);
};

const parseNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseLcov = (content) => {
  const records = [];
  let current = null;

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line) {
      continue;
    }
    if (line.startsWith('SF:')) {
      if (current) {
        records.push(current);
      }
      current = {
        file: line.slice(3),
        lines: new Map(),
        branches: new Map(),
        functions: new Map(),
        fnDefs: new Map(),
      };
      continue;
    }
    if (!current) {
      continue;
    }
    if (line.startsWith('DA:')) {
      const parts = line.slice(3).split(',');
      const lineNo = parseNumber(parts[0]);
      const count = parseNumber(parts[1]);
      addCount(current.lines, lineNo, count);
      continue;
    }
    if (line.startsWith('FN:')) {
      const parts = line.slice(3).split(',');
      const lineNo = parseNumber(parts[0]);
      const name = parts.slice(1).join(',');
      if (name) {
        current.fnDefs.set(name, lineNo);
      }
      continue;
    }
    if (line.startsWith('FNDA:')) {
      const parts = line.slice(5).split(',');
      const count = parseNumber(parts[0]);
      const name = parts.slice(1).join(',');
      if (name) {
        addCount(current.functions, name, count);
      }
      continue;
    }
    if (line.startsWith('BRDA:')) {
      const parts = line.slice(5).split(',');
      const lineNo = parts[0];
      const block = parts[1];
      const branch = parts[2];
      const takenRaw = parts[3];
      const count = takenRaw === '-' ? 0 : parseNumber(takenRaw);
      addCount(current.branches, `${lineNo},${block},${branch}`, count);
      continue;
    }
    if (line === 'end_of_record') {
      records.push(current);
      current = null;
    }
  }

  if (current) {
    records.push(current);
  }

  return records;
};

const mergeRecords = (records) => {
  const merged = new Map();

  for (const record of records) {
    const existing = merged.get(record.file) || {
      file: record.file,
      lines: new Map(),
      branches: new Map(),
      functions: new Map(),
      fnDefs: new Map(),
    };

    for (const [lineNo, count] of record.lines.entries()) {
      addCount(existing.lines, lineNo, count);
    }

    for (const [key, count] of record.branches.entries()) {
      addCount(existing.branches, key, count);
    }

    for (const [name, count] of record.functions.entries()) {
      addCount(existing.functions, name, count);
    }

    for (const [name, lineNo] of record.fnDefs.entries()) {
      if (!existing.fnDefs.has(name)) {
        existing.fnDefs.set(name, lineNo);
      }
    }

    merged.set(record.file, existing);
  }

  return merged;
};

const writeMergedLcov = (merged, destination) => {
  const output = [];
  const files = Array.from(merged.keys()).sort();

  for (const file of files) {
    const record = merged.get(file);
    if (!record) {
      continue;
    }

    output.push(`SF:${record.file}`);

    const functionNames = new Set([
      ...record.fnDefs.keys(),
      ...record.functions.keys(),
    ]);
    const fnEntries = Array.from(functionNames).map((name) => [
      name,
      record.fnDefs.get(name) || 0,
    ]);
    fnEntries.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));

    for (const [name, lineNo] of fnEntries) {
      output.push(`FN:${lineNo},${name}`);
    }

    const fnCounts = Array.from(record.functions.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [name, count] of fnCounts) {
      output.push(`FNDA:${count},${name}`);
    }

    output.push(`FNF:${fnEntries.length}`);
    output.push(
      `FNH:${fnCounts.filter(([, count]) => count > 0).length}`,
    );

    const lineEntries = Array.from(record.lines.entries()).sort(
      (a, b) => a[0] - b[0],
    );
    for (const [lineNo, count] of lineEntries) {
      output.push(`DA:${lineNo},${count}`);
    }
    output.push(`LF:${lineEntries.length}`);
    output.push(`LH:${lineEntries.filter(([, count]) => count > 0).length}`);

    const branchEntries = Array.from(record.branches.entries())
      .map(([key, count]) => {
        const [lineNo, block, branch] = key.split(',').map(parseNumber);
        return { lineNo, block, branch, count };
      })
      .sort(
        (a, b) =>
          a.lineNo - b.lineNo ||
          a.block - b.block ||
          a.branch - b.branch,
      );

    for (const entry of branchEntries) {
      output.push(
        `BRDA:${entry.lineNo},${entry.block},${entry.branch},${entry.count}`,
      );
    }

    output.push(`BRF:${branchEntries.length}`);
    output.push(`BRH:${branchEntries.filter((entry) => entry.count > 0).length}`);
    output.push('end_of_record');
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, output.join('\n'), 'utf8');
};

const contents = inputFiles
  .filter((file) => fs.existsSync(file))
  .map((file) => fs.readFileSync(file, 'utf8'));

if (contents.length === 0) {
  console.error('No coverage files found to merge.');
  process.exit(1);
}

const records = contents.flatMap(parseLcov);
const merged = mergeRecords(records);
writeMergedLcov(merged, outPath);
