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

export function parsePythonRequests(raw: string): ParsedHttpRequest {
  const result: ParsedHttpRequest = { url: '', method: 'GET', headers: '', body: '' };

  // Detect method: requests.get/post/put/patch/delete or method=
  const methodCallMatch = raw.match(/requests\.(get|post|put|patch|delete|head|options)\s*\(/i);
  if (methodCallMatch) {
    result.method = methodCallMatch[1].toUpperCase();
  } else {
    const methodArgMatch = raw.match(/method\s*=\s*['"](\w+)['"]/i);
    if (methodArgMatch) result.method = methodArgMatch[1].toUpperCase();
  }

  // Extract URL
  const urlMatch = raw.match(/(?:requests\.\w+\s*\(\s*|url\s*=\s*)['"]([^'"]+)['"]/);
  if (urlMatch) result.url = urlMatch[1];

  // Extract headers dict
  const headersMatch = raw.match(/headers\s*=\s*(\{[^}]+\})/s);
  if (headersMatch) {
    try {
      // Convert Python dict to JSON: replace single quotes
      const jsonStr = headersMatch[1].replace(/'/g, '"');
      const parsed = JSON.parse(jsonStr);
      result.headers = JSON.stringify(parsed, null, 2);
    } catch {
      result.headers = headersMatch[1];
    }
  }

  // Extract json= or data= body
  const jsonBodyMatch = raw.match(/(?:json|data)\s*=\s*(\{[\s\S]*?\})\s*[,)]/);
  if (jsonBodyMatch) {
    try {
      const jsonStr = jsonBodyMatch[1].replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null');
      const parsed = JSON.parse(jsonStr);
      result.body = JSON.stringify(parsed, null, 2);
    } catch {
      result.body = jsonBodyMatch[1];
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

  // Extract headers object
  const headersMatch = raw.match(/headers\s*:\s*(\{[^}]+\})/s);
  if (headersMatch) {
    try {
      const jsonStr = headersMatch[1].replace(/'/g, '"');
      result.headers = JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      result.headers = headersMatch[1];
    }
  }

  // Extract body from JSON.stringify(...) or body: '...' or body: `...`
  const bodyStringifyMatch = raw.match(/body\s*:\s*JSON\.stringify\s*\((\{[\s\S]*?\})\s*\)/);
  const bodyDirectMatch = raw.match(/body\s*:\s*['"`](\{[\s\S]*?\})['"`]/);
  const bodyObjMatch = raw.match(/body\s*:\s*(\{[\s\S]*?\})\s*[,\n}]/);
  const bodyRaw = bodyStringifyMatch?.[1] || bodyDirectMatch?.[1] || bodyObjMatch?.[1];
  if (bodyRaw) {
    try {
      const cleaned = bodyRaw.replace(/'/g, '"');
      result.body = JSON.stringify(JSON.parse(cleaned), null, 2);
    } catch {
      result.body = bodyRaw;
    }
    if (!methodMatch) result.method = 'POST';
  }

  return result;
}

export function parseAxios(raw: string): ParsedHttpRequest {
  const result: ParsedHttpRequest = { url: '', method: 'GET', headers: '', body: '' };

  // Detect shorthand: axios.get/post/put/patch/delete('url', ...)
  const shorthandMatch = raw.match(/axios\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/i);
  if (shorthandMatch) {
    result.method = shorthandMatch[1].toUpperCase();
    result.url = shorthandMatch[2];
  }

  // Detect config style: axios({ method, url, ... })
  const methodMatch = raw.match(/method\s*:\s*['"`](\w+)['"`]/i);
  if (methodMatch) result.method = methodMatch[1].toUpperCase();

  const urlMatch = raw.match(/url\s*:\s*['"`]([^'"`]+)['"`]/);
  if (urlMatch) result.url = urlMatch[1];

  // Extract headers
  const headersMatch = raw.match(/headers\s*:\s*(\{[^}]+\})/s);
  if (headersMatch) {
    try {
      const jsonStr = headersMatch[1].replace(/'/g, '"');
      result.headers = JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      result.headers = headersMatch[1];
    }
  }

  // Extract data/body
  const dataMatch = raw.match(/data\s*:\s*(\{[\s\S]*?\})\s*[,\n}]/);
  if (dataMatch) {
    try {
      const cleaned = dataMatch[1].replace(/'/g, '"');
      result.body = JSON.stringify(JSON.parse(cleaned), null, 2);
    } catch {
      result.body = dataMatch[1];
    }
  }

  // For shorthand post/put/patch, second arg is body
  if (!dataMatch && shorthandMatch && ['POST', 'PUT', 'PATCH'].includes(result.method)) {
    const secondArgMatch = raw.match(/axios\.\w+\s*\(\s*['"`][^'"`]+['"`]\s*,\s*(\{[\s\S]*?\})\s*[,)]/);
    if (secondArgMatch) {
      try {
        const cleaned = secondArgMatch[1].replace(/'/g, '"');
        result.body = JSON.stringify(JSON.parse(cleaned), null, 2);
      } catch {
        result.body = secondArgMatch[1];
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
