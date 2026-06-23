const fs = require('fs');
async function main() {
  const res = await fetch("https://openrouter.ai/api/v1/models");
  const data = await res.json();
  const freeModels = data.data.filter(m => m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0").map(m => m.id);
  console.log("Free models:", freeModels.slice(0, 10));
}
main();
