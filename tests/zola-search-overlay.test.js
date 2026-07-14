const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

function loadSearchOverlay() {
  const context = {
    console,
    document: {
      readyState: "loading",
      addEventListener() {},
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
    },
    window: {
      addEventListener() {},
      setTimeout(callback) {
        callback();
      },
    },
  };
  context.window.window = context.window;
  context.window.document = context.document;
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("static/js/search-overlay.js", "utf8"), context);
  return context.window.ZolaSearchOverlay;
}

const searchOverlay = loadSearchOverlay();

assert(searchOverlay, "ZolaSearchOverlay helper should be exposed for testing");

const pipeline = {
  registered: [],
  registerFunction(fn, label) {
    this.registered.push(label);
  },
};

searchOverlay.registerKoreanPipeline({ Pipeline: pipeline });
assert.deepStrictEqual(pipeline.registered, [
  "trimmer-ko",
  "stopWordFilter-ko",
  "stemmer-ko",
]);

const excerpt = searchOverlay.createExcerpt("첫 줄입니다. 검색 테스트 문장입니다. 마지막 줄입니다.", "검색", 28);
assert(excerpt.includes("<mark>검색</mark>"), "excerpt should highlight the query");

const resultHtml = searchOverlay.renderResults([
  {
    ref: "/blog/example/",
    score: 3,
    doc: {
      title: "검색 테스트",
      body: "본문 검색 테스트입니다.",
    },
  },
], "검색");

assert(resultHtml.includes('href="/blog/example/"'), "result should link to the document");
assert(resultHtml.includes("<mark>검색</mark> 테스트"), "result should include the highlighted title");
assert(resultHtml.includes("<mark>검색</mark>"), "result should highlight matching terms");
