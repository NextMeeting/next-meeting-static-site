

// Imports

// Load env vars
require('dotenv').config()


const fs = require("fs");
const path = require("path");
const { src, watch, symlink, dest, series, parallel } = require('gulp');
const  { execSync } = require("child_process");
var es = require('event-stream');


var sass = require('gulp-dart-sass')
const postcss = require('gulp-postcss');

const replace = require('gulp-replace');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const uglifycss = require('gulp-uglifycss');
const terser = require('gulp-terser');
const rename = require("gulp-rename");

const { minify }  = require("terser");


function batchReplace(arr) {
  console.log('batchReplace')
  console.log(arr)
  var doReplace = function(file, callback) {


    var isStream = file.contents && typeof file.contents.on === 'function' && typeof file.contents.pipe === 'function';
    var isBuffer = file.contents instanceof Buffer;


    if (isStream)
    {
      file.contents = file.contents.pipe(es.map(function(chunk,cb){
        for( var i=0, max = arr.length; i<max; i++ ){
          var search  = arr[i][0],
              replace = arr[i][1];

          var isRegExp = search instanceof RegExp;

          var result = isRegExp
          ? String( chunk ).replace( search, replace )
          : String( chunk ).split( search ).join( replace );
          chunk = Buffer.from(result);
        };
        cb(null,chunk);
      }));
    }

    else if(isBuffer)

    {
      for( var i=0, max = arr.length; i<max; i++ ){
        var search  = arr[i][0],
            replace = arr[i][1];

        file.contents = search instanceof RegExp
        ? Buffer.from( String( file.contents ).replace( search, replace ) )
        : Buffer.from( String( file.contents ).split( search ).join( replace ) );
      }
    }

    callback(null,file);
  };


  return es.map(doReplace);
};


const TEXT_REPLACEMENT_CONFIG_FILE = process.env.BUILD_CONFIG_FILE;

// const TEXT_REPLACEMENT_CONFIG = require(path.join('./configs/', TEXT_REPLACEMENT_CONFIG_FILE))
const TEXT_REPLACEMENT_CONFIG = require('./configs/' + TEXT_REPLACEMENT_CONFIG_FILE).default

/* Dev
1. Link Tailwind
2. Compile + link SCSS
3. Link JS libs (Alpine, clipboard)
4. Link custom libs

*/

// Fonts
// Production: <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">

function applyTextReplacements(targetText, replacements) {
  let workingCopy = targetText + '';
  Object.entries(replacements).forEach(([token, replacement]) => {
    workingCopy.replace(token, replacement);
  })
  return workingCopy;
}


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
  src('./assets/favicons/*')
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
    <script src="https://motivating-amazing.nextmeeting.org/script.js" data-site="RKQQQQFN" defer></script>
  `

  const cloudflareAnalyticsSnippet = '' //`<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "2413c82530e24ed0bc714ed3595cd6c4"}'></script>`
  
  const honeybadgerSnipper = `
  <script src="//js.honeybadger.io/v3.2/honeybadger.min.js" type="text/javascript"></script>
 
  <script type="text/javascript">
    window.addEventListener('DOMContentLoaded', () => {
      Honeybadger.configure({
        apiKey: 'hbp_xCeyuneJsGRpTaU0r3yzsj0xhBnF8M46Coyg',
        environment: 'production'
      });
    });
  </script>
  `

  return src('src/index.html').
    
    pipe(replace("<!-- JS_LIBS -->", `<script src="scripts.${BUILD_ID}.js"></script>`)).
    pipe(replace("<!-- CSS -->", `<link rel="stylesheet" href="styles.${BUILD_ID}.css">`)).
    pipe(replace("<!-- FONTS -->", `<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">`)).
    pipe(replace("<!-- SESSION_CARD -->", sessionCardPartial)).
    pipe(replace("<!-- INJECT_SESSION_DETAILS_MODAL -->", sessionDetailsModalPartial)).
    pipe(replace("<!-- JS_INLINE -->", inlinedJsScriptTag)).
    pipe(replace("<!-- GOOGLE_ANALYTICS -->", googleAnalyticsSnippet + cloudflareAnalyticsSnippet)).
    pipe(replace("<!-- HONEYBADGER -->", honeybadgerSnipper)).
    pipe(replace("/* INJECT_BUILD_INFO */", `window.BUILD_INFO=${JSON.stringify(buildInfo)}`)).
    pipe(batchReplace(Object.entries(TEXT_REPLACEMENT_CONFIG))).
    // pipe(replace("/* INJECT_SCHEDULE_JSON */", scheduleJson)). // Schedule is injected by automated rebuild Lambda
    pipe(rename(`${TEXT_REPLACEMENT_CONFIG['$DEPLOY_ID']}.template.html`)).
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

function timesMap(n, fn) {
  return Array.from({length: n}).map(fn);
}

function generateFakeMeetingSchedule() {
  const generatedMeetings = timesMap(10, generateMeeting);
  const schedule = {
      "metadata": {
      "scheduleType": "next24Hours",
      "generatedAt": new Date().toISOString(),
    },
    meetings: generatedMeetings
  }
  return schedule;
}

function generateMeeting(_,seq) {
  if(seq == undefined) seq = 1;
  const meetingTime = getCurrentTimestampWithAddedMinutes(20 * (seq))
  return {
    "name": `Example Meeting #${seq}`,
    "nextOccurrence": meetingTime,
    "connectionDetails": {
      "platform": "zoom",
      "mustContactForConnectionInfo": false,
      "meetingId": "123 456 7890",
      "password": "monkey1",
      "joinUrl": "https://zoom.us"
    },
    "notes": "",
    "participantCount": "",
    "durationMinutes": 60,
    "metadata": {
      "hostLocation": "",
      "language": "en",
      "fellowship": "any",
      "restrictions": {
        "openMeeting": false,
        "gender": "ALL"
      }
    }
  }
}

function getCurrentTimestampWithAddedMinutes(minutes) {
  const currentMillisecondsSinceEpoch = new Date().getTime();
  const millisecondsToAdd = minutes * 60 * 1000;
  const totalMilliseconds = currentMillisecondsSinceEpoch + millisecondsToAdd;
  return new Date(totalMilliseconds).toISOString();
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
  
    
    const scheduleJson = generateFakeMeetingSchedule(); //(fs.readFileSync("./test_data/meetingsNext24Hours.json").toString());
  
    const jsonToInject = `const JSON_SCHEDULE=${JSON.stringify(scheduleJson)}`

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
      pipe(batchReplace(Object.entries(TEXT_REPLACEMENT_CONFIG))).
      pipe(dest('tmp'));
}


async function buildCss (cb) {
  return src('src/styles.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('tmp'));
}


exports.default = defaultTask
exports.build = productionBuild;