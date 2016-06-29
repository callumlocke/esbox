import 'babel-polyfill';

import builtins from 'builtin-modules';
import cc from 'cli-color';
import excerpt from './excerpt';
import fs from 'fs';
import isAbsolute from 'is-absolute';
import minimist from 'minimist';
import path, { dirname } from 'path';
import pathExists from 'path-exists';
import readableStack from './readableStack';
import stackTrace from 'stack-trace';
import subdir from 'subdir';
import { Module } from 'module';

const flags = minimist(process.argv.slice(2));

// register babel require hook
{
  // choose optimal config for the current engine
  const presets = [require('babel-preset-stage-0'), require('babel-preset-react')];
  const nodeVersion = Number(process.versions.node.split('.')[0]);
  const shouldUseCustomBabelConfig = (flags.babelrc !== 'false');
  const customBabelConfigPath = (flags.babelrc === '') ? dirname(flags.file) : flags.babelrc;
  const customBabelConfigFile = path.resolve(customBabelConfigPath, '.babelrc');
  const defaultBabelConfig = {
    ignore: /node_modules/,
    presets: [],
  };
  let effectiveBabelConfig = {};

  if (nodeVersion > 4) presets.push(require('babel-preset-es2015-node5'));
  else if (nodeVersion === 4) presets.push(require('babel-preset-es2015-node4'));
  else presets.push(require('babel-preset-es2015'));
  defaultBabelConfig.presets = presets;

  if (shouldUseCustomBabelConfig) {
    effectiveBabelConfig = {
      extends: customBabelConfigFile,
    };
  }
  else {
    effectiveBabelConfig = defaultBabelConfig;
  }

  require('babel-register')(effectiveBabelConfig);
}

// make magic imports work
{
  const oldNodeModulePaths = Module._nodeModulePaths;
  const esboxRoot = path.resolve(__dirname, '..', '..');
  const esboxNodeModules = path.join(esboxRoot, 'node_modules');

  Module._nodeModulePaths = function _modifiedNodeModulePaths(fromWhere, ...args) {
    const paths = oldNodeModulePaths.call(this, fromWhere, ...args);
    paths.push(esboxNodeModules);
    return paths;
  };
}

// catch global errors and present them nicely
process.on('uncaughtException', error => {
  const cwd = process.cwd();

  let line;
  let column;
  let message;
  let fileName;

  if (error._babel) {
    [fileName, message] = error.message.split(': ');

    line = error.loc.line;
    column = error.loc.column;
  }
  else {
    const stack = stackTrace.parse(error);
    const first = stack[0];

    line = first.getLineNumber();
    column = first.getColumnNumber();
    fileName = first.getFileName();
    message = error.message;
  }

  const fileRelative = (fileName && subdir(cwd, fileName))
    ? path.relative(cwd, fileName)
    : (fileName || '[null]')
  ;

  if (error._babel) {
    console.log(
      `\nCompile error: ${fileRelative}\n` +
      excerpt({
        line, column,
        contents: fs.readFileSync(fileName),
      }) + '\n' + cc.red(message.trim())
    );
  }
  else {
    // try to determine if it's a local file (as opposed to a builtin)
    if (
      fileName && (
        isAbsolute(fileName) || (
          builtins.indexOf(path.basename(fileName, '.js')) === -1 &&
          pathExists.sync(path.resolve(cwd, fileName))
        )
      )
    ) {
      console.log(
        `\nRuntime error: ${fileRelative}\n` +
        excerpt({
          line, column,
          contents: fs.readFileSync(fileName),
        }) + '\n'
      );
    }

    console.log(
      cc.red(message.trim()) + '\n' +
      readableStack(error) + '\n'
    );
  }

  process.exit(1);
});

// make sure promise rejections don't get swallowed
process.on('unhandledRejection', reason => {
  if (reason && reason instanceof Error) throw reason;

  const error = new Error('Unhandled rejection');
  error.reason = error;
  throw error;
});

// run the user's script
require(flags.file);
