# 📦 esbox

[![NPM version][npm-image]][npm-url] [![Linux Build Status][travis-image]][travis-url] [![Windows Build Status][appveyor-image]][appveyor-url] [![Dependency Status][depstat-image]][depstat-url]

#### ES.next in a box™

Zero-config REPL for experimenting with next-generation JavaScript.

It automatically compiles and re-runs your script every time you save. Think  of it as a JSBin-like setup for your local editor and terminal – with full access to Node APIs and modules.

![demo-gif]

As well as for experimenting, esbox may be useful in situations like workshops and screencasts – it makes it easy to do live code demos in ES2016 and beyond, without getting bogged down in build systems.

## Install

```sh
> npm install -g esbox
```

## Usage

To run `script.js` in a box:

```sh
> esbox script.js
```

Every time you save the file, esbox clears the terminal display and runs your script again. Any uncaught errors get pretty-printed for easy debugging.

For more options, see `esbox --help`.

## Automatic Babel compilation

You can use any proposed ECMAScript features that Babel supports ([stage-0](http://babeljs.io/docs/plugins/preset-stage-0/) and above), including async/await, destructuring, rest/spread, etc.

## Magic imports

For a number of popular libraries, you can just `import` them without the need to install them first.

This includes lodash, bluebird, chalk, chai, express, request – and anything else listed under `dependencies` in esbox's own [package.json](./package.json).

This is made possible by rewiring `require()` to use esbox's own node_modules folder as an extra possible module source. (Your own locally installed modules still take precedence if found.)

For example, a script like this just works in esbox:

```js
import cheerio from 'cheerio';
import fetch from 'isomorphic-fetch';
import { cyan } from 'chalk';

(async () => {
  const result = await fetch('https://www.nytimes.com');
  console.assert(result.ok);

  const $ = cheerio.load(await result.text());

  console.log('The New York Times headlines:');

  $('.story-heading').each((i, element) => {
    console.log(' ', cyan($(element).text().trim()));
  });
})();
```

## Using custom .babelrc files

You may decided to use a custom babelrc file to configure babel in esbox. There are two methods to accomplush this.

You may have esbox attempt to located the babelrc file in the same directory as the file that you're executing. This method used is the same method as Babel. 

```
esbox --babelrc -- script.js
```

The second method of using a custom babelrc is to point esbox directly to the path which contains the file.

```
esbox --babelrc /path/to/babelrc -- script.js
```

Using this method, relative paths are mapped in relation to the current working directory (cwd).



---

## License

[MIT](./LICENSE) © [Callum Locke](https://twitter.com/callumlocke)

[demo-gif]: demo.gif

[npm-url]: https://npmjs.org/package/esbox
[npm-image]: https://img.shields.io/npm/v/esbox.svg?style=flat-square

[travis-url]: https://travis-ci.org/callumlocke/esbox
[travis-image]: https://img.shields.io/travis/callumlocke/esbox.svg?style=flat-square&label=Linux

[appveyor-url]: https://ci.appveyor.com/project/callumlocke/esbox
[appveyor-image]: https://img.shields.io/appveyor/ci/callumlocke/esbox/master.svg?style=flat-square&label=Windows

[depstat-url]: https://david-dm.org/callumlocke/esbox
[depstat-image]: https://img.shields.io/david/callumlocke/esbox.svg?style=flat-square
