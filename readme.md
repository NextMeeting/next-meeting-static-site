# Next Meeting Static Site

🔥 Blazing fast static site for browsing a list of Zoom meetings.

* 🌍 Automatically translates to the users timezone
* ⚡ Entire site is 21 KB (!)
* 💪 100% Lighthouse performance score 
* 🤫 No network requests, servers, APIs or databases

## Architecture


* Static files (1 each of template HTML, CSS, JS) are deployed to S3 behind Cloudfront (CDN)
* Every hour [this project](https://github.com/AnalyzePlatypus/next-meeting-regenerate-schedule) regenerates the JSON schedule, injects it into the template HTML file, and invalidates the CDN.
* When the page is loaded, JS in the static page executes, parsing the injected JSON and rendering the schedule.


## 🎉 NEW! Configuration

The build contains a large number of settings that must be configured before the first build.
There include the site title, color theme, links, and more!

Here's how to create one.
(You only need to do this once)

1. Create the `./configs` directory
2. Place `yoursite.js` in it (the name doesn't matter)
3. Example file contents should be:
```js
exports.default = {
  $SITE_DESCRIPTION: 'Join an our meetings anytime, anywhere! Choose from over 100 weekly meetings on Zoom!',
  $SITE_TITLE:'NextMeeting Site',
  $FULL_PAGE_URL:'https://mysite.com',
  $SITE_PROMO_BANNER_IMAGE: 'open_graph_promo_banner.jpg',
  $APPLE_TOUCH_ICON: 'apple-touch-icon.png',
  $FELLOWSHIP: 'My groups',
  $FEEDBACK_EMAIL_ADDRESS: "contact@example.com",
  $SOURCE_GOOGLE_SHEET_URL: 'https://docs.google.com/spreadsheets/d/****',
  $ADD_NEW_MEETING_URL: 'https://docs.google.com/forms/d/e/****',
  $THEME_LIGHT: 'theme-purple-light',
  $THEME_DARK: 'theme-purple-dark',
  $DEPLOY_ID: 'C5448DD7-F7AC-48FC-BC3B-A560FE8EF99A', // A random UUID
  $ANNOUNCEMENT_BAR_TEXT: 'Welcome to our brand new Zoom meeting site!.',
  $ANNOUNCEMENT_BAR_URL: '',
  $ANNOUNCEMENT_BAR_EMOJI: '🚀'
}
```
4. In your `.env`, set `BUILD_CONFIG_FILE` to `yoursite.js`

> Make sure to update the Open Graph banner with your new site details

## Color themes

The system now supports color theming for all controls.
The existing themes are:
* Purple (light)
* Purple (dark)
* Forest (light)
* Forest (dark)
* Tabasco (light)
* Tabasco (dark)
* Neptune (light)
* Neptune (dark)

To add more themes:

1. Add your theme colors as a class near the top of `styles.scss`
2. In `index.html`, add your new CSS classes to the `VALID_THEMES` array.
3. In your config file, set `$THEME_LIGHT` and `$THEME_DARK` to your new classes.

> Make sure to create a new site icon (`./favicons/apple-touch-icon.png`) and Open Graph banner to match your new theme colors


## Development

Custom build script powered by Gulp.

```bash
npm run watch # Watches source directory and autorebuilds on changes. 
npm run serve # Serve the files
# you'll need to manually reload the browser (Cmd + R in Chrome)
# Also you'll need to make a change to any source file to trigger an actual build

```

> Slow build systems should not exist. This build script is optimized to run everything blazing fast. In live rebuild mode the site rebuilds in less than 16ms. Production builds take less than 4 seconds (most of which is Tailwind stripping away all unused CSS styles)

> 🎉 New! 
> As of May 2022, development builds now *automatically generates and injects a list of fake meetings*, so no more hunting down for real JSON schedules, fiddling with the schedule generator, or manually tweaking timestamps! 😅
> Production builds still require the full schedule generator, so they can use Real Data™.


## Deployment

`npm run build`
This creates three files in `dist`:

* `<uuid>.template.html`
* `styles.css`
* `scripts.js`

`<uuid>.template.html` **does not contain the schedule JSON** and is unusable on its own.
The `next-meeting-regenerate-schedule` Lambda pulls the HTML from S3 every hour, injects the latest schedule JSON, and re-uploads it to S3 as a proper `index.html`.

This allows the static site to be up-to-date with practically no overhead - nothing is recompiled, we don't need to deploy the entire gulp workflow into the cloud or run any servers. Just a simple string replacement in a text (HTML) file.

```bash
gulp build # Builds dist directory
deploy.sh # Builds, uploads to S3, and calls the Lambda to generate the actual `index.html`.
```

### Multi-site deployment

We now support hosting multiple sites in the same S3 bucket.

To do so, the following changes have been made:

* Every site has a UUID that is used for all its URLs
* The build HTML file is now `<uuid>.template.html`
* All builds are deployed to the same S3 bucket and Cloudfront distribution
* All deployed sites share the same CSS and JS files
* The JSON schedule rebuilder rebuilds all the sites at once.


## Thank You

* [Alpine.js](https://github.com/alpinejs/alpine) (JS microframework)
* [Clipboard.js](https://github.com/zenorocha/clipboard.js) (cross-platform clipboard lib)
* [Tailwind CSS](https://tailwindcss.com) (Totally awesome CSS utilities)
* [FeatherIcons](https://feathericons.com) Icons, embedded as SVGs
* [Gulp](https://gulpjs.com) (Build scripts) + a dozen Gulp plugins
* AWS S3, Cloudfront, & Lambda
* [Custom JSON schedule generator](https://github.com/AnalyzePlatypus/next-meeting-regenerate-schedule)


