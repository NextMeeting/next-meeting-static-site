# Next Meeting Static Site

A static site for browsing a list of Zoom meetings.

* 🌍 Automatically translates to the users timezone
* ⚡ Entire site is 21 KB (!)
* 💪 100% Lighthouse performance score 
* 🤫 No network requests

## Architecture


* Static files (1 each of template HTML, CSS, JS) are deployed to S3 behind Cloudfront (CDN)
* Every hour [this project](https://github.com/AnalyzePlatypus/next-meeting-regenerate-schedule) regenerates the JSON schedule, injects it into the template HTML file, and invalidates the CDN.
* When the page is loaded, JS in the static page executes, parsing the injected JSON and rendering the schedule.


## Development

Custom build script powered by Gulp.

```bash
npm i
gulp # Watches source directory and autorebuilds on changes. 
# you'll need to manually reload the browder (Cmd + R in Chrome)
```

> Slow build systems should not exist. This build script is optimized to run everything blazing fast. In live rebuild mode the site rebuilds in less than 16ms. Production builds take less than 4 seconds (most of which is Tailwind stripping away all unused CSS styles)

## Deployment

`gulp build` creates three files in `dist`:

* `index.template.html`
* `styles.css`
* `scripts.js`

`index.template.html` **does not contain the schedule JSON** and is unusable on its own.
The `next-meeting-regenerate-schedule` Lambda pulls `index.template.html` from S3 every hour, injects the latest schedule JSON, and re-uploads it to S3 as a proper `index.html`.

This allows the static site to be up-to-date with practically no overhead - nothing is recompiled, we don't need to deploy the entire gulp workflow into the cloud or run an servers. Just a simple string replacement in a text (HTML) file.

```bash
gulp build # Builds dist directory
deploy.sh # Builds, uploads to S3, and calls the Lambda to generate the actual `index.html`.
```

## Thank You

* [Alpine.js](https://github.com/alpinejs/alpine) (JS microframework)
* [Clipboard.js](https://github.com/zenorocha/clipboard.js) (cross-platform clipboard lib)
* [Tailwind CSS](https://tailwindcss.com) (Totally awesome CSS utilities)
* [FeatherIcons](https://feathericons.com) Icons, embedded as SVGs
* [Gulp](https://gulpjs.com) (Build scripts) + a dozen Gulp plugins
* AWS S3, Cloudfront, & Lambda
* [Custom JSON schedule generator](https://github.com/AnalyzePlatypus/next-meeting-regenerate-schedule)


