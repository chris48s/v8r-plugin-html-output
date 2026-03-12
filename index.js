import { BasePlugin } from "v8r";

const header = `
<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
      <title>v8r validation results</title>
    </head>
    <body>
      <main>
        <h1>v8r validation results</h1>
`;

const footer = `
      </main>
    </body>
  </html>
`;

function escapeHtml(input) {
  const str = input == null ? "" : String(input);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getErrorTable(errors) {
  let table = "<table>";
  table += `
    <thead>
      <tr>
        <th>instancePath</th>
        <th>schemaPath</th>
        <th>keyword</th>
        <th>message</th>
      </tr>
    </thead>`;
  table += "<tbody>";

  for (const error of errors) {
    table += `
    <tr>
      <td>${escapeHtml(error.instancePath)}</td>
      <td>${escapeHtml(error.schemaPath)}</td>
      <td>${escapeHtml(error.keyword)}</td>
      <td>${escapeHtml(error.message)}</td>
    </tr>`;
  }

  table += "</tbody></table>";

  return table;
}

function isHttpUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getSchemaHtml(schema) {
  if (isHttpUrl(schema)) {
    return `<a href="${escapeHtml(schema)}">${escapeHtml(schema)}</a>`;
  }
  return `<code>${escapeHtml(schema)}</code>`;
}

class HtmlOutput extends BasePlugin {
  static name = "v8r-plugin-html-output";

  registerOutputFormats() {
    return ["html"];
  }

  getAllResultsLogMessage(results, format) {
    if (format !== "html") {
      return undefined;
    }

    let report = header;
    for (const result of results) {
      const icon = result.valid ? "✔" : "✖";
      if (Number.isInteger(result.documentIndex)) {
        report += `<h2>${icon} ${escapeHtml(result.fileLocation)}[${escapeHtml(result.documentIndex)}]</h2>`;
      } else {
        report += `<h2>${icon} ${escapeHtml(result.fileLocation)}</h2>`;
      }

      if (result.valid) {
        report += `<p>Passed validation against schema
          ${getSchemaHtml(result.schemaLocation)}</p>`;
      } else {
        report += `<p>Failed validation against schema
          ${getSchemaHtml(result.schemaLocation)}</p>`;
      }

      if (!result.valid) {
        report += `<h3>Errors (${(result.errors || []).length})</h3>`;
        report += getErrorTable(result.errors || []);
      }
    }

    report += footer;
    return report;
  }
}

export default HtmlOutput;
export { isHttpUrl, getSchemaHtml };
