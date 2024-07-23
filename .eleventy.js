const { DateTime } = require("luxon");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const htmlmin = require("html-minifier");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require("markdown-it-attrs");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");

module.exports = function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Deep merge data
  eleventyConfig.setDataDeepMerge(true);

  // Collections
  const createCollectionWithSlug = (name, globPattern) => {
    eleventyConfig.addCollection(name, (collection) => {
      return collection.getFilteredByGlob(globPattern).map((item) => {
        item.data.slug = item.fileSlug;
        return item;
      });
    });
  };

  // Custom filters
  // Add a filter to find a speaker by name
  eleventyConfig.addFilter("findBySlug", (slug, collection) => {
    return collection.find((item) => item.data.slug === slug);
  });

  eleventyConfig.addFilter("find", function (array, key, value) {
    return array.find((item) => item[key] === value);
  });

  // Define collections
  createCollectionWithSlug("speakers", "speakers/*.md");
  createCollectionWithSlug("partners", "partners/*.md");
  createCollectionWithSlug("locations", "locations/*.md");

  // Filters
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy");
  });

  eleventyConfig.addFilter("machineDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("yyyy-MM-dd");
  });

  eleventyConfig.addFilter("cssmin", (code) => {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addFilter("jsmin", (code) => {
    let minified = UglifyJS.minify(code);
    if (minified.error) {
      console.log("UglifyJS error: ", minified.error);
      return code;
    }
    return minified.code;
  });

  eleventyConfig.addFilter("markdown", (content) => {
    return markdownLib.render(content);
  });

  // Transforms
  eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
    }
    return content;
  });

  // Passthrough copy for static assets
  const staticFiles = [
    { "favicon.ico": "favicon.ico" },
    { "static/img": "static/img" },
    { "static/fonts": "static/fonts" },
    { "static/video": "static/video" },
    { "admin/": "admin" },
    { "/_includes/assets/css/main.css": "assets/css/main.css" },
    { "/_includes/assets/js/main.js": "assets/js/main.js" },
  ];

  staticFiles.forEach((file) => {
    eleventyConfig.addPassthroughCopy(file);
  });

  // Markdown Library Configuration
  const markdownLib = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  })
    .use(markdownItAnchor, { permalink: false })
    .use(markdownItAttrs);

  eleventyConfig.setLibrary("md", markdownLib);

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
