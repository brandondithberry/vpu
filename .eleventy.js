const { DateTime } = require("luxon");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const htmlmin = require("html-minifier");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require("markdown-it-attrs");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");

module.exports = function (eleventyConfig) {
  // Eleventy Navigation https://www.11ty.dev/docs/plugins/navigation/
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Merge data instead of overriding
  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true);

  // Add support for maintenance-free post authors
  // Adds an authors collection using the author key in our post frontmatter
  // Thanks to @pdehaan: https://github.com/pdehaan
  eleventyConfig.addCollection("authors", (collection) => {
    const blogs = collection.getFilteredByGlob("posts/*.md");
    return blogs.reduce((coll, post) => {
      const author = post.data.author;
      if (!author) {
        return coll;
      }
      if (!coll.hasOwnProperty(author)) {
        coll[author] = [];
      }
      coll[author].push(post.data);
      return coll;
    }, {});
  });

  // Date formatting (human readable)
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy");
  });

  // Date formatting (machine readable)
  eleventyConfig.addFilter("machineDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("yyyy-MM-dd");
  });

  // Minify CSS
  eleventyConfig.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  // Minify JS
  eleventyConfig.addFilter("jsmin", function (code) {
    let minified = UglifyJS.minify(code);
    if (minified.error) {
      console.log("UglifyJS error: ", minified.error);
      return code;
    }
    return minified.code;
  });

  // Minify HTML output
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }
    return content;
  });

  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy({ "favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "static/img": "static/img" });
  eleventyConfig.addPassthroughCopy({ "static/fonts": "static/fonts" });
  eleventyConfig.addPassthroughCopy({ "static/video": "static/video" });
  eleventyConfig.addPassthroughCopy({ "admin/": "admin" });
  eleventyConfig.addPassthroughCopy({
    "/_includes/assets/css/main.css": "assets/css/main.css",
  });
  eleventyConfig.addPassthroughCopy({
    "/_includes/assets/js/main.js": "assets/js/main.js",
  });

  eleventyConfig.addFilter("log", value => {
    console.log(value);
    return JSON.stringify(value);
  });

  eleventyConfig.addCollection("speakers", function (collection) {
    return collection.getFilteredByGlob("speakers/*.md");
  });

  eleventyConfig.addCollection("partners", function (collection) {
    return collection.getFilteredByGlob("partners/*.md");
  });

  eleventyConfig.addCollection("locations", function (collection) {
    return collection.getFilteredByGlob("locations/*.md");
  });

  eleventyConfig.addCollection("days", function (collection) {
    return collection.getFilteredByGlob("days/*.md");
  });

  /* Markdown Plugins */
  let options = {
    html: true,
    breaks: true,
    linkify: true,
  };
  let opts = {
    permalink: false,
  };

  const markdownLib = markdownIt(options)
    .use(markdownItAnchor, opts)
    .use(markdownItAttrs);
  eleventyConfig.setLibrary("md", markdownLib);

  // Add Markdown filter
  eleventyConfig.addFilter("markdown", (content) => {
    return markdownLib.render(content);
  });

  return {
    templateFormats: ["md", "njk", "liquid"],
    pathPrefix: "/",
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
  };
};
