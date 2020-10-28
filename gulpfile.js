// Imports

const { src, watch, symlink, dest, series, parallel } = require('gulp');

var sass = require('gulp-sass');
sass.compiler = require('node-sass');

const postcss = require('gulp-postcss');

const replace = require('gulp-replace');
const clean = require('gulp-clean');

/* Dev
1. Link Tailwind
2. Compile + link SCSS
3. Link JS libs (Alpine, clipboard)
4. Link custom libs

*/

// Fonts
// Production: <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">


const defaultTask = function() {
  watch('src/*', series(
      removePreviousBuild,
      buildCss,
      buildHtml
    )
  );
}

function removePreviousBuild() {
  return src('tmp', {read: false, allowEmpty: true})
    .pipe(clean());
}


async function buildHtml() {
  
  // Symlink the prebuild Tailwind file into /tmp #perfmatters
  src('dev_static/tailwind_full.css')
    .pipe(symlink('tmp/'));

  src("node_modules/alpinejs/dist/alpine.js")
    .pipe(symlink('tmp/'));
  
    src("node_modules/clipboard/dist/clipboard.js")
    .pipe(symlink('tmp/'));

  // Inject a link to the stylesheet into the HTML
  src('src/index.html').
    pipe(replace("<!-- TAILWIND_DEV -->", "<link rel=\"stylesheet\" href=\"tailwind_full.css\">")).
    pipe(replace("<!-- JS_DEV -->", `<script src=\"alpine.js\"></script><script src=\"clipboard.js\"></script>`)).
    pipe(replace("<!-- FONTS -->", `<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">`)).
    pipe(replace("<!-- CSS -->", `<link rel="stylesheet" href="styles.css">`)).
    pipe(dest('tmp'));
}


async function buildCss (cb) {
  return src('src/styles.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('tmp'));
}


exports.default = defaultTask