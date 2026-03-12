import { describe, it } from "node:test";
import assert from "node:assert";
import HtmlOutput, { isHttpUrl, getSchemaHtml } from "./index.js";

describe("isHttpUrl", function () {
  it("accepts valid URLs", function () {
    assert.equal(isHttpUrl("http://example.com"), true);
    assert.equal(isHttpUrl("https://example.com"), true);
  });

  it("rejects invalid URLs", function () {
    assert.equal(isHttpUrl("/local/path.json"), false);
    assert.equal(isHttpUrl("not a url"), false);
    assert.equal(isHttpUrl("javascript:alert('foo')"), false);
  });
});

describe("getSchemaHtml", function () {
  it("renders URLs as a link", function () {
    assert.match(getSchemaHtml("http://example.com"), /^\<a href/);
  });

  it("renders local paths as a code block", function () {
    assert.match(getSchemaHtml("schema.json"), /^\<code/);
  });

  it("escapes special characters", function () {
    assert.match(
      getSchemaHtml("https://example.com/?foo=1&bar=2"),
      /https:\/\/example\.com\/\?foo=1&amp;bar=2/,
    );
    assert.equal(
      getSchemaHtml("javascript:alert('foo')"),
      "<code>javascript:alert(&#39;foo&#39;)</code>",
    );
    assert.equal(
      getSchemaHtml("<script>alert('foo')</script>"),
      "<code>&lt;script&gt;alert(&#39;foo&#39;)&lt;/script&gt;</code>",
    );
  });
});

describe("HtmlOutput.getAllResultsLogMessage", function () {
  it("renders expected output", function () {
    const plugin = new HtmlOutput();
    const results = [
      {
        fileLocation: "good.json",
        schemaLocation: "schema.json",
        valid: true,
        errors: [],
      },
      {
        fileLocation: "bad.json",
        schemaLocation: "https://example.com/schema.json",
        valid: false,
        errors: [
          {
            instancePath: "/a",
            schemaPath: "/p",
            keyword: "type",
            message: "should be integer",
          },
          {
            instancePath: "/b",
            schemaPath: "/q",
            keyword: "required",
            message: "is required",
          },
        ],
      },
    ];

    const report = plugin.getAllResultsLogMessage(results, "html");

    assert.match(report, /<h2>✔ good\.json<\/h2>/);
    assert.match(report, /<h2>✖ bad\.json<\/h2>/);

    assert.equal((report.match(/<table>/g) ?? []).length, 1);

    assert.equal((report.match(/<td>should be integer<\/td>/g) ?? []).length, 1);
    assert.equal((report.match(/<td>is required<\/td>/g) ?? []).length, 1);
  });
});
