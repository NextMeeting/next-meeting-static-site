// Imports

const { src, watch, dest, series, parallel } = require('gulp');

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


const defaultTask = series(
  removePreviousBuild,
  buildCss,
  buildHtml
)

function removePreviousBuild() {
  return src('tmp', {read: false})
    .pipe(clean());
}

async function buildHtml() {
  src('src/index.html').
  pipe(replace("<!-- TAILWIND_DEV -->", "<link rel=\"stylesheet\" src=\"../dev_static/tailwind_full.css\">")).
  pipe(dest('tmp'));
}

async function buildCss (cb) {
  return src('src/styles.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('tmp/styles.css'));
}

exports.default = defaultTask