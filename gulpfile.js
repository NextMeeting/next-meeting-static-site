// Imports

const fs = require("fs");
const { src, watch, symlink, dest, series, parallel } = require('gulp');
const  { execSync } = require("child_process");

var sass = require('gulp-dart-sass')
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

function getRandomText(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const BUILD_ID = getRandomText(8);

const productionBuild = series(
  removeProductionBuild,
  buildProdHtml,
  buildProdJs,
  buildProdCss,  
)


function buildProdCss() {
  return src(['src/*.scss', 'src/*.css'])
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      require('tailwindcss'),
      require('autoprefixer'),
    ])).
    pipe(concat(`styles.${BUILD_ID}.css`)).
    pipe(uglifycss())
    .pipe(dest('dist'));
}

function buildProdJs() {
  return src([
    "node_modules/alpinejs/dist/cdn.js",
    "node_modules/clipboard/dist/clipboard.js",
    "node_modules/body-scroll-lock/lib/bodyScrollLock.js"
  ]).
    pipe(concat(`scripts.${BUILD_ID}.js`)).
    pipe(terser()).
    pipe(dest("dist"))
}

async function buildProdHtml() {
  src('./assets/favicons/apple-touch-icon.png')
    .pipe(symlink('dist'));

  src('./assets/images/*')
    .pipe(symlink('dist'));

  const sessionCardPartial = fs.readFileSync("./src/partials/meeting-card.html").toString();
  const sessionDetailsModalPartial = fs.readFileSync("./src/partials/session-details-modal.html").toString();

  const javascriptToInline = [
    "./src/javascript/timeDifference.js",
    "./src/javascript/categorizeSessions.js",
    "./src/javascript/atcb.js"
  ].map(filePath => fs.readFileSync(filePath).toString()).
  join(" ");

  const minified = await minify(javascriptToInline, { sourceMap: false });
  const inlinedJsScriptTag = `<script>${minified.code}</script>`;

  const commitHash = execSync('git rev-parse HEAD').toString();

  const buildInfo = {
    buildType: "prod",
    builtAt: new Date().toISOString(),
    commitHash: commitHash
  }

  const googleAnalyticsSnippet = `
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TBFL2F31JY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(){dataLayer.push(arguments);}
      
      gtag('js', new Date());
    
      gtag('config', 'G-TBFL2F31JY');
    </script>
  `

  const cloudflareAnalyticsSnippet = `
    <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "2413c82530e24ed0bc714ed3595cd6c4"}'></script>
  `

  return src('src/index.html').
    pipe(replace("<!-- JS_LIBS -->", `<script src="scripts.${BUILD_ID}.js"></script>`)).
    pipe(replace("<!-- CSS -->", `<link rel="stylesheet" href="styles.${BUILD_ID}.css">`)).
    pipe(replace("<!-- FONTS -->", `<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">`)).
    pipe(replace("<!-- SESSION_CARD -->", sessionCardPartial)).
    pipe(replace("<!-- INJECT_SESSION_DETAILS_MODAL -->", sessionDetailsModalPartial)).
    pipe(replace("<!-- JS_INLINE -->", inlinedJsScriptTag)).
    pipe(replace("<!-- GOOGLE_ANALYTICS -->", googleAnalyticsSnippet + cloudflareAnalyticsSnippet)).
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

    src('src/atcb.css')
    .pipe(symlink('tmp/'));

  src("node_modules/alpinejs/dist/cdn.js")
    .pipe(symlink('tmp/'));
  
    src("node_modules/clipboard/dist/clipboard.js")
    .pipe(symlink('tmp/'));

    src("node_modules/body-scroll-lock/lib/bodyScrollLock.js")
      .pipe(symlink('tmp/'));

    src('./assets/favicons/apple-touch-icon.png')
      .pipe(symlink('tmp'));
    
    src('./assets/images/*')
      .pipe(symlink('dist'));
  
    
    const scheduleJson = (fs.readFileSync("./test_data/meetingsNext24Hours.json").toString());
  
    const jsonToInject = `const JSON_SCHEDULE=${scheduleJson}`

    const sessionCardPartial = fs.readFileSync("./src/partials/meeting-card.html").toString();
    const sessionDetailsModalPartial = fs.readFileSync("./src/partials/session-details-modal.html").toString();
  
    const javascriptToInline = [
      "./src/javascript/timeDifference.js",
      "./src/javascript/categorizeSessions.js",
      "./src/javascript/atcb.js"
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
      pipe(replace("<!-- JS_LIBS -->", `<script src=\"cdn.js\"></script><script src=\"clipboard.js\"></script><script src=\"bodyScrollLock.js\"></script>`)).
      pipe(replace("<!-- FONTS -->", `<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">`)).
      pipe(replace("<!-- CSS -->", `
        <link rel="stylesheet" href="styles.css">
        <link rel="stylesheet" href="atcb.css">
      `)).
      pipe(replace("/* INJECT_SCHEDULE_JSON */", jsonToInject)).
      pipe(replace("<!-- SESSION_CARD -->", sessionCardPartial)).
      pipe(replace("<!-- INJECT_SESSION_DETAILS_MODAL -->", sessionDetailsModalPartial)).
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