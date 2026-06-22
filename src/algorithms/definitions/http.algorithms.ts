/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';

interface ParsedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: string;
  auth?: { username: string; password: string };
  query?: string;
}

/**
 * Splits a shell-like command string into argv tokens, honouring single quotes,
 * double quotes (with \" \\ escapes), backslash escapes and `\`-newline line
 * continuations. Good enough for the curl commands users paste from API docs.
 */
const tokenizeShell = (input: string): string[] => {
  const tokens: string[] = [];
  let cur = '';
  let hasToken = false;
  let i = 0;
  const n = input.length;

  while (i < n) {
    const c = input[i];

    if (c === '\\') {
      if (input[i + 1] === '\n') { i += 2; continue; }
      if (input[i + 1] === '\r' && input[i + 2] === '\n') { i += 3; continue; }
      if (i + 1 < n) { cur += input[i + 1]; hasToken = true; i += 2; continue; }
      i++; continue;
    }

    if (c === "'") {
      hasToken = true;
      i++;
      while (i < n && input[i] !== "'") { cur += input[i]; i++; }
      i++;
      continue;
    }

    if (c === '"') {
      hasToken = true;
      i++;
      while (i < n && input[i] !== '"') {
        if (input[i] === '\\' && /["\\$`]/.test(input[i + 1] ?? '')) {
          cur += input[i + 1]; i += 2;
        } else {
          cur += input[i]; i++;
        }
      }
      i++;
      continue;
    }

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      if (hasToken) { tokens.push(cur); cur = ''; hasToken = false; }
      i++;
      continue;
    }

    cur += c; hasToken = true; i++;
  }

  if (hasToken) tokens.push(cur);
  return tokens;
};

/**
 * Heuristic: does a positional token look like an HTTP(S) URL? Used to avoid
 * mistaking a stray flag value for the URL. Accepts explicit http(s):// URLs and
 * scheme-less hosts (domain / IPv4 / localhost) with optional :port and /path or ?query.
 */
const looksLikeUrl = (token: string): boolean => {
  if (!token || /\s/.test(token)) return false;
  if (/^https?:\/\//i.test(token)) return true;
  return /^(localhost|[\w-]+(\.[\w-]+)+|\d{1,3}(\.\d{1,3}){3})(:\d+)?([/?].*)?$/i.test(token);
};

/**
 * Encodes a single --data-urlencode field, following curl's forms:
 *   "content"       -> percent-encode the whole content
 *   "=content"      -> percent-encode content (no name)
 *   "name=content"  -> name + "=" + percent-encode(content)
 */
const urlEncodeDataField = (raw: string): string => {
  if (raw.startsWith('@')) {
    throw new Error('CURL_REQUEST: file-based data (@file) is not supported');
  }
  const eq = raw.indexOf('=');
  if (eq === -1) return encodeURIComponent(raw);
  const name = raw.slice(0, eq);
  const value = raw.slice(eq + 1);
  return name ? `${name}=${encodeURIComponent(value)}` : encodeURIComponent(value);
};

/**
 * Parses a curl command string into an HTTP request descriptor.
 * Supports the common flags used for API calls: -X/--request, -H/--header,
 * -d/--data(-raw/-ascii/-binary), --data-urlencode, --json, -u/--user, -G/--get,
 * -b/--cookie, -A/--user-agent, -e/--referer. Cosmetic flags (-k, -s, -L,
 * --compressed, …) are ignored. File-based data (@file) and form uploads (-F)
 * are not supported.
 */
const parseCurl = (curlStr: string): ParsedRequest => {
  let tokens = tokenizeShell(curlStr.trim());
  if (tokens[0] === 'curl') tokens = tokens.slice(1);

  let method: string | undefined;
  const positional: string[] = [];
  const headers: Record<string, string> = {};
  let data: string | undefined;
  let auth: { username: string; password: string } | undefined;
  let isGet = false;
  let isJson = false;

  const appendData = (d: string) => {
    if (d.startsWith('@')) {
      throw new Error('CURL_REQUEST: file-based data (@file) is not supported');
    }
    data = data === undefined ? d : `${data}&${d}`;
  };

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    let flag = token;
    let inlineVal: string | undefined;
    if (token.startsWith('--') && token.includes('=')) {
      const eq = token.indexOf('=');
      flag = token.slice(0, eq);
      inlineVal = token.slice(eq + 1);
    }
    const valueOf = (): string => inlineVal ?? tokens[++i] ?? '';

    switch (flag) {
      case '-X': case '--request':
        method = valueOf(); break;
      case '-H': case '--header': {
        const h = valueOf();
        const idx = h.indexOf(':');
        if (idx > -1) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
        break;
      }
      case '-d': case '--data': case '--data-raw': case '--data-ascii': case '--data-binary':
        appendData(valueOf()); break;
      case '--data-urlencode':
        appendData(urlEncodeDataField(valueOf())); break;
      case '--json':
        isJson = true; appendData(valueOf()); break;
      case '-u': case '--user': {
        const u = valueOf();
        const ci = u.indexOf(':');
        auth = ci > -1
          ? { username: u.slice(0, ci), password: u.slice(ci + 1) }
          : { username: u, password: '' };
        break;
      }
      case '-G': case '--get': isGet = true; break;
      case '-b': case '--cookie': headers['Cookie'] = valueOf(); break;
      case '-A': case '--user-agent': headers['User-Agent'] = valueOf(); break;
      case '-e': case '--referer': headers['Referer'] = valueOf(); break;
      // Cosmetic flags with no value — ignore.
      case '-k': case '--insecure': case '-s': case '--silent': case '-L': case '--location':
      case '--compressed': case '-i': case '--include': case '-v': case '--verbose':
      case '-f': case '--fail': case '-#': case '--progress-bar':
        break;
      // Flags whose value we accept but ignore.
      case '-o': case '--output': case '-w': case '--write-out':
      case '--connect-timeout': case '--max-time':
        valueOf(); break;
      default:
        if (!flag.startsWith('-')) {
          positional.push(token);
        }
    }
    i++;
  }

  // Choose the URL: prefer a token that looks like one (filters out any stray
  // flag value); if there's exactly one positional token, trust it even if the
  // heuristic is unsure (handles unusual-but-unambiguous URLs).
  const url = positional.find(looksLikeUrl)
    ?? (positional.length === 1 ? positional[0] : undefined);
  if (!url) {
    throw new Error(
      'CURL_REQUEST: no URL found in the curl command' +
      (positional.length ? ` (candidates: ${positional.join(', ')})` : '')
    );
  }

  if (!method) method = data !== undefined && !isGet ? 'POST' : 'GET';
  method = method.toUpperCase();

  let query: string | undefined;
  if (isGet && data !== undefined) { query = data; data = undefined; }

  const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
  if (data !== undefined && !hasContentType) {
    headers['Content-Type'] = isJson
      ? 'application/json'
      : 'application/x-www-form-urlencoded';
  }

  // curl prepends http:// to scheme-less URLs; axios requires an explicit scheme.
  const fullUrl = /^https?:\/\//i.test(url) ? url : `http://${url}`;

  return { method, url: fullUrl, headers, data, auth, query };
};

const DEFAULT_TIMEOUT_MS = 30000;

export const HTTP_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'CURL_REQUEST',
    description:
      'Parses a curl command and performs the HTTP request, returning the response body as a ' +
      'string (JSON responses are stringified so they can be fed to GET_PROPERTY / PARSE_NUMBER). ' +
      'The curl command comes from the wired input if present, otherwise from the "curl" parameter. ' +
      'Supports -X, -H, -d/--data*, --json, -u, -G, -b, -A, -e. Throws on network errors and ' +
      'non-2xx responses (the status and body are included in the error).',
    inputs: [
      { name: 'curl', types: ['string'], description: 'Optional curl command string. Overrides the "curl" parameter when wired (e.g. a curl template stored on a node).', required: false },
    ],
    outputType: 'string',
    parameters: [
      { name: 'curl', type: 'string', description: 'The curl command to parse and execute (used when no curl input is wired).', required: false },
      { name: 'timeoutMs', type: 'number', description: 'Request timeout in milliseconds (default 30000).', required: false },
    ],
    run: async (input, params): AlgorithmRunResult => {
      const curlStr = typeof input === 'string' && input.trim() !== ''
        ? input
        : (params?.curl as string | undefined);
      if (typeof curlStr !== 'string' || curlStr.trim() === '') {
        throw new Error('CURL_REQUEST requires a curl command via the "curl" parameter or a wired input');
      }

      const req = parseCurl(curlStr);
      const timeout = params?.timeoutMs !== undefined ? Number(params.timeoutMs) : DEFAULT_TIMEOUT_MS;

      const url = req.query
        ? `${req.url}${req.url.includes('?') ? '&' : '?'}${req.query}`
        : req.url;

      try {
        const response = await axios({
          method: req.method,
          url,
          headers: req.headers,
          data: req.data,
          auth: req.auth,
          timeout: isNaN(timeout) ? DEFAULT_TIMEOUT_MS : timeout,
          maxRedirects: 5,
        });
        const body = response.data;
        return typeof body === 'string' ? body : JSON.stringify(body);
      } catch (error: any) {
        if (error?.response) {
          const body = typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);
          throw new Error(
            `CURL_REQUEST: HTTP ${error.response.status} ${error.response.statusText ?? ''} — ` +
            `${(body ?? '').slice(0, 500)}`
          );
        }
        throw new Error(`CURL_REQUEST: request failed — ${error?.message ?? String(error)}`);
      }
    },
  }),
];
