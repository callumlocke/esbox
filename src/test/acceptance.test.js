import execa from 'execa';
import path from 'path';
import pkg from '../../package.json';
import test from 'ava';

const cli = path.resolve(__dirname, '..', 'lib', 'cli.js');
const fixture = path.resolve(__dirname, '..', '..', 'fixture');

test('outputs help text when run with no arguments', async t => {
  const result = await execa(cli);

  t.is(result.stderr, '');
  t.regex(result.stdout, /ES2016 in a box/);
});

test('esbox -v outputs version', async t => {
  const result = await execa(cli, ['-v']);

  t.is(result.stderr, '');
  t.is(result.stdout, pkg.version);
});

test('esbox --version outputs version', async t => {
  const result = await execa(cli, ['--version']);

  t.is(result.stderr, '');
  t.is(result.stdout, pkg.version);
});

test('esbox running a script, including imports', async t => {
  const result = await execa(cli, [
    '--no-watch',
    '--cwd', fixture,
    'main',
  ]);

  t.is(result.stderr, '');
  t.regex(result.stdout, /it works/);
});
