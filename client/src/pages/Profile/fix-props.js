const fs = require("fs");

let content = fs.readFileSync("BiodataEdit.jsx", "utf8");


content = content.replace(
  /(<EditableField[\s\S]*?)(\n\s*\/?>)/g,
  (match, beforeClose, close) => {
    
    if (
      beforeClose.includes("handleChange={handleChange}") &&
      beforeClose.includes("validationErrors={validationErrors}")
    ) {
      return match;
    }

    let result = beforeClose.trimEnd();

    
    if (!result.includes("handleChange={handleChange}")) {
      result += "\n                handleChange={handleChange}";
    }

    
    if (!result.includes("validationErrors={validationErrors}")) {
      result += "\n                validationErrors={validationErrors}";
    }

    return result + close;
  }
);

fs.writeFileSync("BiodataEdit.jsx", content);
console.log("Fixed EditableField components");
