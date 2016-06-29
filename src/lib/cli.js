#!/usr/bin/env node

import cc from 'cli-color';
import execa from 'execa';
import minimist from 'minimist';
import path from 'path';
import pathExists from 'path-exists';
import pkg from '../../package.json';
import updateNotifier from 'update-notifier';
import { clearScreen } from 'ansi-escapes';
import { debounce } from 'lodash';
import { tick, cross } from 'figures';

const isMac = /^darwin/.test(process.platform);

process.title = 'esbox';

updateNotifier({ pkg }).notify();

const red = cc.red;
const black = cc.black;
const bgWhite = cc.xtermSupported ? cc.bgXterm(250) : cc.bgWhite;
const brown = cc.xtermSupported ? cc.xterm(137) : cc.yellow;
const grey = cc.xtermSupported ? cc.xterm(241) : cc.blackBright;

const help = `
  ${bgWhite('                       ')}
  ${bgWhite(`  ${isMac ? '📦' : ''}  ${black('ES2016 in a box')}   `)}
  ${bgWhite(`     ${grey('git.io/esbox')}      `)}
  ${bgWhite('                       ')}

  ${brown('Usage')}
    ${grey('>')} esbox ${grey('FILENAME')}

  ${brown('Options')}
    --cwd=${grey('DIRECTORY')}     run in a different directory
    --no-watch          only run your script once
    --no-clear          disable clearing the display before each run
    --version           show esbox version
    --poll              poll file system when watching files
    --babelrc           look for a custom babelrc in FILENAME's dir
    --babelrc=${grey('DIRECTORY')} use an explicit, custom babelrc`;

// get input from command line
const { _: input, ...flags } = minimist(process.argv.slice(2), {
  default: {
    cwd: null,
    clear: true,
    watch: true,
    help: false,
    version: false,
    poll: false,
    babelrc: false,
  },
  string: ['cwd', 'babelrc'],
  boolean: ['clear', 'watch', 'help', 'version', 'poll'],
  alias: {
    v: 'version',
    h: 'help',
  },
});

// output version
if (flags.version) {
  console.log(pkg.version);
  process.exit(0);
}

// output help
if (flags.help || input.length !== 1) {
  console.log(help);
  process.exit(0);
}

// unpack flags
const { clear, watch, babelrc } = flags;
const cwd = flags.cwd
  ? path.resolve(flags.cwd)
  : process.cwd();

// determine the real path to the user's script
const userScript = (() => {
  let name = path.resolve(cwd, input[0]);

  // add .js extension if necessary
  if (!pathExists.sync(name)) name = `${name}.js`;

  // give up if not found
  if (!pathExists.sync(name)) {
    console.error(red(`Not found: ${input[0]}`));
    process.exit(1);
  }
  return name;
})();


// function to clear the display and run the user's script
const run = (() => {
  const runner = path.resolve(__dirname, 'run.js');

  let childProcess;

  return debounce(() => {
    if (clear) process.stdout.write(clearScreen);

    console.log(brown(`${isMac ? '📦 ' : 'esbox'} ${path.relative(process.cwd(), userScript)}\n`));

    if (childProcess) childProcess.kill();

    childProcess = execa.spawn('node', [
      runner,
      '--file', userScript,
      '--clear', clear,
      '--babelrc', babelrc,
    ], { cwd, stdio: 'inherit' });

    childProcess.on('close', code => {
      if (code !== null && code !== 143) {
        console.log(brown(`\n${(code === 0 ? tick : cross)} exited with code ${code}`));

        if (!clear) console.log();
      }
    });

    return;
  }, 10, { maxWait: 1000 });
})();

// start up
if (watch) {
  const sane = require('sane');

  const onFileEvent = (name, root) => {
    if (!/\.js$/.test(name)) return;

    delete require.cache[path.resolve(root, name)];

    run();
  };

  const watcher = sane(cwd, { poll: flags.poll });

  watcher.on('add', onFileEvent);
  watcher.on('change', onFileEvent);
  watcher.on('delete', onFileEvent);

  watcher.on('ready', run);
}
else run();
