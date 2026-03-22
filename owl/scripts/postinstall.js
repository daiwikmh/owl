#!/usr/bin/env node

const R  = "\x1b[0m";
const B  = "\x1b[1m";
const CY = "\x1b[36m";
const YE = "\x1b[33m";
const D  = "\x1b[2m";

console.log(`
${CY}${B}      ,___,${R}
${CY}${B}     (o   o)${R}
${CY}${B}     /)   (\\${R}
${CY}${B}    --"---"--${R}

${YE}${B}  OWL${R} ${D}v${process.env.npm_package_version || ""}${R}
${D}  Powered by OWS and MoonPay${R}

${D}  Get started:${R}
${D}    owl terminal --wallet main${R}
${D}    owl mcp${R}
${D}    owl --help${R}
`);
