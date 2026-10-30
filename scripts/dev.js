const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const vitePath = path.resolve(path.dirname(require.resolve('vite')), '../../bin/vite.js');
const children = [
  spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, stdio: 'inherit' }),
  spawn(process.execPath, [vitePath, '--host', '0.0.0.0'], { cwd: root, stdio: 'inherit' }),
];

function stop() {
  for (const child of children) if (!child.killed) child.kill();
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) child.on('exit', code => {
  if (code && code !== 0) process.exitCode = code;
});
