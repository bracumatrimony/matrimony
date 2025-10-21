const fs = require("fs");

let content = fs.readFileSync("BiodataEdit.jsx", "utf8");

// Fix EditableField components that don't have the required props
content = content.replace(
  /(<EditableField[\s\S]*?)(\n\s*\/?>)/g,
  (match, beforeClose, close) => {
    // Skip if already has both props
    if (
      beforeClose.includes("handleChange={handleChange}") &&
      beforeClose.includes("validationErrors={validationErrors}")
    ) {
      return match;
    }

    let result = beforeClose.trimEnd();

    // Add handleChange if missing
    if (!result.includes("handleChange={handleChange}")) {
      result += "\n                handleChange={handleChange}";
    }

    // Add validationErrors if missing
    if (!result.includes("validationErrors={validationErrors}")) {
      result += "\n                validationErrors={validationErrors}";
    }

    return result + close;
  }
);

fs.writeFileSync("BiodataEdit.jsx", content);
console.log("Fixed EditableField components");
