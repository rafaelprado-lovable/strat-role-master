// Parses cURL commands and Python requests code into HTTP fields

export interface ParsedHttpRequest {
  url: string;
  method: string;
  headers: string; // JSON string
  body: string;    // JSON string
}

export function parseCurl(raw: string): ParsedHttpRequest {
  const result: ParsedHttpRequest = { url: '', method: 'GET', headers: '', body: '' };
  
  // Normalize: join line continuations, trim
  const cmd = raw.replace(/\\\s*\n/g, ' ').replace(/\\\s*$/gm, ' ').trim();
  
  // Extract URL (first thing that looks like a URL, or after curl)
  const urlMatch = cmd.match(/(?:curl\s+)?(?:--?\w+\s+(?:'[^']*'|"[^"]*"|\S+)\s+)*['"]?(https?:\/\/[^\s'"]+)['"]?/) 
    || cmd.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
  if (urlMatch) result.url = urlMatch[1];

  // Extract method: -X or --request
  const methodMatch = cmd.match(/(?:-X|--request)\s+['"]?(\w+)['"]?/i);
  if (methodMatch) result.method = methodMatch[1].toUpperCase();

  // Extract headers: -H or --header
  const headers: Record<string, string> = {};
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/gi;
  let hMatch;
  while ((hMatch = headerRegex.exec(cmd)) !== null) {
    const colonIdx = hMatch[1].indexOf(':');
    if (colonIdx > 0) {
      const key = hMatch[1].substring(0, colonIdx).trim();
      const val = hMatch[1].substring(colonIdx + 1).trim();
      headers[key] = val;
    }
  }
  if (Object.keys(headers).length > 0) {
    result.headers = JSON.stringify(headers, null, 2);
  }

  // Extract body: -d or --data or --data-raw or --data-binary
  const bodyMatch = cmd.match(/(?:-d|--data(?:-raw|-binary)?)\s+'([^']*)'/) 
    || cmd.match(/(?:-d|--data(?:-raw|-binary)?)\s+"([^"]*)"/);
  if (bodyMatch) {
    result.body = bodyMatch[1];
    // Try to prettify if JSON
    try {
      result.body = JSON.stringify(JSON.parse(bodyMatch[1]), null, 2);
    } catch { /* keep raw */ }
    // If has body and no explicit method, default to POST
    if (!methodMatch) result.method = 'POST';
  }

  return result;
}

// Extracts a balanced brace block starting from a given index
function extractBalancedBraces(str: string, startIdx: number): string | null {
  if (str[startIdx] !== '{') return null;
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') { depth--; if (depth === 0) return str.slice(startIdx, i + 1); }
  }
  return null;
}

// Find balanced dict assigned to a variable: `varName = { ... }` or `const varName = { ... }`
function extractVarDict(raw: string, varName: string): string | null {
  const regex = new RegExp(`(?:^|\\n)\\s*(?:const|let|var)?\\s*${varName}\\s*=\\s*\\{`, 'm');
  const m = regex.exec(raw);
  if (!m) return null;
  const braceStart = raw.indexOf('{', m.index + varName.length);
  return extractBalancedBraces(raw, braceStart);
}

function pythonDictToJson(raw: string): string {
  return raw
    .replace(/'/g, '"')
    .replace(/True/g, 'true')
    .replace(/False/g, 'false')
    .replace(/None/g, 'null')
    .replace(/,\s*([}\]])/g, '$1'); // trailing commas
}

export function parsePythonRequests(raw: string): ParsedHttpRequest {
  const result: ParsedHttpRequest = { url: '', method: 'GET', headers: '', body: '' };

  // Detect method
  const methodCallMatch = raw.match(/requests\.(get|post|put|patch|delete|head|options)\s*\(/i);
  if (methodCallMatch) {
    result.method = methodCallMatch[1].toUpperCase();
  } else {
    const methodArgMatch = raw.match(/method\s*=\s*['"](\w+)['"]/i);
    if (methodArgMatch) result.method = methodArgMatch[1].toUpperCase();
  }

  // Extract URL (direct string or variable)
  const urlDirectMatch = raw.match(/requests\.\w+\s*\(\s*['"]([^'"]+)['"]/);
  if (urlDirectMatch) {
    result.url = urlDirectMatch[1];
  } else {
    // URL from variable
    const urlCallMatch = raw.match(/requests\.\w+\s*\(\s*(\w+)/);
    if (urlCallMatch) {
      const varMatch = raw.match(new RegExp(`(?:^|\\n)\\s*${urlCallMatch[1]}\\s*=\\s*['"]([^'"]+)['"]`, 'm'));
      if (varMatch) result.url = varMatch[1];
    }
    // Fallback: url = "..."
    if (!result.url) {
      const urlVarMatch = raw.match(/(?:^|\n)\s*url\s*=\s*['"]([^'"]+)['"]/m);
      if (urlVarMatch) result.url = urlVarMatch[1];
    }
  }

  // Extract headers (inline or variable)
  const headersInlineMatch = raw.match(/headers\s*=\s*\{/);
  if (headersInlineMatch) {
    // Check if it's a kwarg (inside function call) or standalone assignment
    const standaloneDict = extractVarDict(raw, 'headers');
    if (standaloneDict) {
      try {
        result.headers = JSON.stringify(JSON.parse(pythonDictToJson(standaloneDict)), null, 2);
      } catch {
        result.headers = standaloneDict;
      }
    }
  }

  // Extract body: json=payload or json={...} or data=payload or data={...}
  const jsonKwargInline = raw.match(/(?:json|data)\s*=\s*\{/);
  if (jsonKwargInline) {
    const braceIdx = raw.indexOf('{', jsonKwargInline.index!);
    const block = extractBalancedBraces(raw, braceIdx);
    if (block) {
      try {
        result.body = JSON.stringify(JSON.parse(pythonDictToJson(block)), null, 2);
      } catch {
        result.body = block;
      }
    }
  } else {
    // json=variableName or data=variableName
    const jsonVarMatch = raw.match(/(?:json|data)\s*=\s*(\w+)/);
    if (jsonVarMatch && jsonVarMatch[1] !== 'True' && jsonVarMatch[1] !== 'False' && jsonVarMatch[1] !== 'None') {
      const varDict = extractVarDict(raw, jsonVarMatch[1]);
      if (varDict) {
        try {
          result.body = JSON.stringify(JSON.parse(pythonDictToJson(varDict)), null, 2);
        } catch {
          result.body = varDict;
        }
      }
    }
  }

  return result;
}

export function parseFetch(raw: string): ParsedHttpRequest {
  const result: ParsedHttpRequest = { url: '', method: 'GET', headers: '', body: '' };

  // Extract URL from fetch('url' or fetch("url"
  const urlMatch = raw.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
  if (urlMatch) result.url = urlMatch[1];

  // Extract method
  const methodMatch = raw.match(/method\s*:\s*['"`](\w+)['"`]/i);
  if (methodMatch) result.method = methodMatch[1].toUpperCase();

  // Extract headers object (balanced braces)
  const headersKw = raw.match(/headers\s*:\s*\{/);
  if (headersKw) {
    const braceIdx = raw.indexOf('{', headersKw.index!);
    const block = extractBalancedBraces(raw, braceIdx);
    if (block) {
      try {
        result.headers = JSON.stringify(JSON.parse(block.replace(/'/g, '"')), null, 2);
      } catch { result.headers = block; }
    }
  }

  // Extract body from JSON.stringify({...}) — balanced
  const stringifyKw = raw.match(/body\s*:\s*JSON\.stringify\s*\(\s*\{/);
  if (stringifyKw) {
    const braceIdx = raw.indexOf('{', stringifyKw.index! + 20);
    const block = extractBalancedBraces(raw, braceIdx);
    if (block) {
      try {
        result.body = JSON.stringify(JSON.parse(block.replace(/'/g, '"')), null, 2);
      } catch { result.body = block; }
    }
  }

  // Fallback: body: '{...}' or body: `{...}`
  if (!result.body) {
    const bodyDirectMatch = raw.match(/body\s*:\s*['"`](\{[\s\S]*?\})['"`]/);
    if (bodyDirectMatch) {
      try {
        result.body = JSON.stringify(JSON.parse(bodyDirectMatch[1].replace(/'/g, '"')), null, 2);
      } catch { result.body = bodyDirectMatch[1]; }
    }
  }

  if (result.body && !methodMatch) result.method = 'POST';

  return result;
}

export function parseAxios(raw: string): ParsedHttpRequest {
  const result: ParsedHttpRequest = { url: '', method: 'GET', headers: '', body: '' };

  // Helper: resolve a variable name to its string value from const/let/var declarations
  const resolveVar = (varName: string): string | null => {
    const varMatch = raw.match(new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*['"\`]([^'"\`]+)['"\`]`));
    return varMatch ? varMatch[1] : null;
  };

  // Detect shorthand: axios.get/post/put/patch/delete(urlOrString, ...)
  const shorthandMatch = raw.match(/axios\.(get|post|put|patch|delete|head|options)\s*\(\s*(['"`]([^'"`]+)['"`]|(\w+))/i);
  if (shorthandMatch) {
    result.method = shorthandMatch[1].toUpperCase();
    if (shorthandMatch[3]) {
      // Direct string literal
      result.url = shorthandMatch[3];
    } else if (shorthandMatch[4]) {
      // Variable reference — resolve it
      result.url = resolveVar(shorthandMatch[4]) || shorthandMatch[4];
    }
  }

  // Detect config style: axios({ method, url, ... })
  if (!shorthandMatch) {
    const methodMatch = raw.match(/method\s*:\s*['"`](\w+)['"`]/i);
    if (methodMatch) result.method = methodMatch[1].toUpperCase();
  }

  // URL from config object or standalone variable
  if (!result.url) {
    const urlPropMatch = raw.match(/url\s*:\s*['"`]([^'"`]+)['"`]/);
    if (urlPropMatch) result.url = urlPropMatch[1];
  }

  // Extract headers from config object (3rd arg or config style)
  const headersKw = raw.match(/headers\s*:\s*\{/);
  if (headersKw) {
    const braceIdx = raw.indexOf('{', headersKw.index!);
    const block = extractBalancedBraces(raw, braceIdx);
    if (block) {
      try {
        result.headers = JSON.stringify(JSON.parse(block.replace(/'/g, '"')), null, 2);
      } catch { result.headers = block; }
    }
  }

  // Extract data from config style: data: {...}
  const dataKw = raw.match(/data\s*:\s*\{/);
  if (dataKw) {
    const braceIdx = raw.indexOf('{', dataKw.index!);
    const block = extractBalancedBraces(raw, braceIdx);
    if (block) {
      try {
        result.body = JSON.stringify(JSON.parse(block.replace(/'/g, '"')), null, 2);
      } catch { result.body = block; }
    }
  }

  // For shorthand post/put/patch, second arg is the body (variable or object)
  if (!result.body && shorthandMatch && ['POST', 'PUT', 'PATCH'].includes(result.method)) {
    const afterFirstArg = raw.match(/axios\.\w+\s*\(\s*(?:['"`][^'"`]*['"`]|\w+)\s*,\s*(\w+)/);
    if (afterFirstArg) {
      const varName = afterFirstArg[1];
      // Resolve variable to balanced dict
      const varDict = extractVarDict(raw, varName);
      if (varDict) {
        try {
          result.body = JSON.stringify(JSON.parse(varDict.replace(/'/g, '"')), null, 2);
        } catch { result.body = varDict; }
      }
    }
  }

  return result;
}

export function detectAndParse(raw: string): ParsedHttpRequest {
  const trimmed = raw.trim();
  if (trimmed.startsWith('curl ') || trimmed.startsWith('curl\n')) {
    return parseCurl(trimmed);
  }
  if (trimmed.includes('requests.') || trimmed.includes('import requests')) {
    return parsePythonRequests(trimmed);
  }
  if (trimmed.includes('axios') || trimmed.includes('import axios')) {
    return parseAxios(trimmed);
  }
  if (trimmed.includes('fetch(') || trimmed.includes('fetch (')) {
    return parseFetch(trimmed);
  }
  // Fallback
  return parseCurl(trimmed);
}
