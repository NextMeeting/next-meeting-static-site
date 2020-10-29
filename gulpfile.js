// Imports

const fs = require("fs");
const { src, watch, symlink, dest, series, parallel } = require('gulp');
const  { execSync } = require("child_process");

var sass = require('gulp-sass');
sass.compiler = require('node-sass');

const postcss = require('gulp-postcss');

const replace = require('gulp-replace');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const uglifycss = require('gulp-uglifycss');
const terser = require('gulp-terser');
const rename = require("gulp-rename");

const { minify }  = require("terser");

/* Dev
1. Link Tailwind
2. Compile + link SCSS
3. Link JS libs (Alpine, clipboard)
4. Link custom libs

*/

// Fonts
// Production: <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">


const defaultTask = function() {
  watch('src/**/*', series(
      removePreviousBuild,
      buildCss,
      buildHtml
    )
  );
}

const productionBuild = series(
  removeProductionBuild,
  buildProdHtml,
  buildProdJs,
  buildProdCss,  
)


function buildProdCss() {
  return src(['src/*.scss'])
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      require('tailwindcss'),
      require('autoprefixer'),
    ])).
    pipe(concat('styles.css')).
    pipe(uglifycss())
    .pipe(dest('dist'));
}

function buildProdJs() {
  return src([
    "node_modules/alpinejs/dist/alpine.js",
    "node_modules/clipboard/dist/clipboard.js",
  ]).
    pipe(concat("scripts.js")).
    pipe(terser()).
    pipe(dest("dist"))
}

async function buildProdHtml() {
  const jsonSchedule = JSON.parse(fs.readFileSync("./test_data/meetingsNext24Hours.json").toString());
  const scheduleJson = `const JSON_SCHEDULE=${JSON.stringify(jsonSchedule)}`

  const sessionCardPartial = fs.readFileSync("./src/partials/meeting-card.html").toString();

  const javascriptToInline = [
    "./src/javascript/timeDifference.js",
    "./src/javascript/categorizeSessions.js"
  ].map(filePath => fs.readFileSync(filePath).toString()).
  join(" ");

  const minified = await minify(javascriptToInline, { sourceMap: false });
  const inlinedJsScriptTag = `<script>${minified.code}</script>`;

  const stdout = execSync('git rev-parse HEAD').toString();
  console.log(stdout);
  // if(stderr) throw stderr;

  const buildInfo = {
    buildType: "prod",
    builtAt: new Date().toISOString(),
    commitHash: stdout
  }

  return src('src/index.html').
    pipe(replace("<!-- JS_LIBS -->", `<script src="scripts.js"></script>`)).
    pipe(replace("<!-- FONTS -->", `<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">`)).
    pipe(replace("<!-- CSS -->", `<link rel="stylesheet" href="styles.css">`)).
    pipe(replace("<!-- SESSION_CARD -->", sessionCardPartial)).
    pipe(replace("<!-- JS_INLINE -->", inlinedJsScriptTag)).
    pipe(replace("/* INJECT_BUILD_INFO */", `window.BUILD_INFO=${JSON.stringify(buildInfo)}`)).
    // pipe(replace("/* INJECT_SCHEDULE_JSON */", scheduleJson)). // Schedule is injected by automated rebuild Lambda
    pipe(rename("index.template.html")).
    pipe(dest('dist'));
}


function removePreviousBuild() {
  return src('tmp', {read: false, allowEmpty: true})
    .pipe(clean());
}

function removeProductionBuild() {
  return src('dist', {read: false, allowEmpty: true})
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
    const scheduleJson = (fs.readFileSync("./test_data/meetingsNext24Hours.json").toString());
  
    const jsonToInject = `const JSON_SCHEDULE=${scheduleJson}`

    const sessionCardPartial = fs.readFileSync("./src/partials/meeting-card.html").toString();
  
    const javascriptToInline = [
      "./src/javascript/timeDifference.js",
      "./src/javascript/categorizeSessions.js"
    ].map(filePath => fs.readFileSync(filePath).toString()).
    join(" ");
  
    // const minified = await minify(javascriptToInline, { sourceMap: false });
    const inlinedJsScriptTag = `<script>${javascriptToInline}</script>`;
  
    const buildInfo = {
      buildType: "dev",
      builtAt: new Date().toISOString(),
      commitHash: ""
    }

    // Inject a link to the stylesheet into the HTML
    return src('src/index.html').
      pipe(replace("<!-- TAILWIND_DEV -->", "<link rel=\"stylesheet\" href=\"tailwind_full.css\">")).
      pipe(replace("<!-- JS_LIBS -->", `<script src=\"alpine.js\"></script><script src=\"clipboard.js\"></script>`)).
      pipe(replace("<!-- FONTS -->", `<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">`)).
      pipe(replace("<!-- CSS -->", `<link rel="stylesheet" href="styles.css">`)).
      pipe(replace("/* INJECT_SCHEDULE_JSON */", jsonToInject)).
      pipe(replace("<!-- SESSION_CARD -->", sessionCardPartial)).
      pipe(replace("<!-- JS_INLINE -->", inlinedJsScriptTag)).
      pipe(replace("/* INJECT_BUILD_INFO */", `window.BUILD_INFO=${JSON.stringify(buildInfo)};`)).
      pipe(dest('tmp'));
}


async function buildCss (cb) {
  return src('src/styles.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('tmp'));
}


exports.default = defaultTask
exports.build = productionBuild;