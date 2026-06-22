"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_ALGORITHMS = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const axios_1 = require("axios");
const core_1 = require("./core");
/**
 * Splits a shell-like command string into argv tokens, honouring single quotes,
 * double quotes (with \" \\ escapes), backslash escapes and `\`-newline line
 * continuations. Good enough for the curl commands users paste from API docs.
 */
const tokenizeShell = (input) => {
    var _a;
    const tokens = [];
    let cur = '';
    let hasToken = false;
    let i = 0;
    const n = input.length;
    while (i < n) {
        const c = input[i];
        if (c === '\\') {
            if (input[i + 1] === '\n') {
                i += 2;
                continue;
            }
            if (input[i + 1] === '\r' && input[i + 2] === '\n') {
                i += 3;
                continue;
            }
            if (i + 1 < n) {
                cur += input[i + 1];
                hasToken = true;
                i += 2;
                continue;
            }
            i++;
            continue;
        }
        if (c === "'") {
            hasToken = true;
            i++;
            while (i < n && input[i] !== "'") {
                cur += input[i];
                i++;
            }
            i++;
            continue;
        }
        if (c === '"') {
            hasToken = true;
            i++;
            while (i < n && input[i] !== '"') {
                if (input[i] === '\\' && /["\\$`]/.test((_a = input[i + 1]) !== null && _a !== void 0 ? _a : '')) {
                    cur += input[i + 1];
                    i += 2;
                }
                else {
                    cur += input[i];
                    i++;
                }
            }
            i++;
            continue;
        }
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
            if (hasToken) {
                tokens.push(cur);
                cur = '';
                hasToken = false;
            }
            i++;
            continue;
        }
        cur += c;
        hasToken = true;
        i++;
    }
    if (hasToken)
        tokens.push(cur);
    return tokens;
};
/**
 * Parses a curl command string into an HTTP request descriptor.
 * Supports the common flags used for API calls: -X/--request, -H/--header,
 * -d/--data(-raw/-ascii/-binary), --json, -u/--user, -G/--get, -b/--cookie,
 * -A/--user-agent, -e/--referer. Cosmetic flags (-k, -s, -L, --compressed, …)
 * are ignored. File-based data (@file) and form uploads (-F) are not supported.
 */
const parseCurl = (curlStr) => {
    let tokens = tokenizeShell(curlStr.trim());
    if (tokens[0] === 'curl')
        tokens = tokens.slice(1);
    let method;
    let url;
    const headers = {};
    let data;
    let auth;
    let isGet = false;
    let isJson = false;
    const appendData = (d) => {
        if (d.startsWith('@')) {
            throw new Error('CURL_REQUEST: file-based data (@file) is not supported');
        }
        data = data === undefined ? d : `${data}&${d}`;
    };
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        let flag = token;
        let inlineVal;
        if (token.startsWith('--') && token.includes('=')) {
            const eq = token.indexOf('=');
            flag = token.slice(0, eq);
            inlineVal = token.slice(eq + 1);
        }
        const valueOf = () => { var _a; return (_a = inlineVal !== null && inlineVal !== void 0 ? inlineVal : tokens[++i]) !== null && _a !== void 0 ? _a : ''; };
        switch (flag) {
            case '-X':
            case '--request':
                method = valueOf();
                break;
            case '-H':
            case '--header': {
                const h = valueOf();
                const idx = h.indexOf(':');
                if (idx > -1)
                    headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
                break;
            }
            case '-d':
            case '--data':
            case '--data-raw':
            case '--data-ascii':
            case '--data-binary':
                appendData(valueOf());
                break;
            case '--json':
                isJson = true;
                appendData(valueOf());
                break;
            case '-u':
            case '--user': {
                const u = valueOf();
                const ci = u.indexOf(':');
                auth = ci > -1
                    ? { username: u.slice(0, ci), password: u.slice(ci + 1) }
                    : { username: u, password: '' };
                break;
            }
            case '-G':
            case '--get':
                isGet = true;
                break;
            case '-b':
            case '--cookie':
                headers['Cookie'] = valueOf();
                break;
            case '-A':
            case '--user-agent':
                headers['User-Agent'] = valueOf();
                break;
            case '-e':
            case '--referer':
                headers['Referer'] = valueOf();
                break;
            // Cosmetic flags with no value — ignore.
            case '-k':
            case '--insecure':
            case '-s':
            case '--silent':
            case '-L':
            case '--location':
            case '--compressed':
            case '-i':
            case '--include':
            case '-v':
            case '--verbose':
            case '-f':
            case '--fail':
            case '-#':
            case '--progress-bar':
                break;
            // Flags whose value we accept but ignore.
            case '-o':
            case '--output':
            case '-w':
            case '--write-out':
            case '--connect-timeout':
            case '--max-time':
                valueOf();
                break;
            default:
                if (!flag.startsWith('-') && url === undefined) {
                    url = token;
                }
        }
        i++;
    }
    if (!url)
        throw new Error('CURL_REQUEST: no URL found in the curl command');
    if (!method)
        method = data !== undefined && !isGet ? 'POST' : 'GET';
    method = method.toUpperCase();
    let query;
    if (isGet && data !== undefined) {
        query = data;
        data = undefined;
    }
    const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
    if (data !== undefined && !hasContentType) {
        headers['Content-Type'] = isJson
            ? 'application/json'
            : 'application/x-www-form-urlencoded';
    }
    return { method, url, headers, data, auth, query };
};
const DEFAULT_TIMEOUT_MS = 30000;
exports.HTTP_ALGORITHMS = [
    (0, core_1.createAlgorithm)({
        name: 'CURL_REQUEST',
        description: 'Parses a curl command and performs the HTTP request, returning the response body as a ' +
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
        run: (input, params) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const curlStr = typeof input === 'string' && input.trim() !== ''
                ? input
                : params === null || params === void 0 ? void 0 : params.curl;
            if (typeof curlStr !== 'string' || curlStr.trim() === '') {
                throw new Error('CURL_REQUEST requires a curl command via the "curl" parameter or a wired input');
            }
            const req = parseCurl(curlStr);
            const timeout = (params === null || params === void 0 ? void 0 : params.timeoutMs) !== undefined ? Number(params.timeoutMs) : DEFAULT_TIMEOUT_MS;
            const url = req.query
                ? `${req.url}${req.url.includes('?') ? '&' : '?'}${req.query}`
                : req.url;
            try {
                const response = yield (0, axios_1.default)({
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
            }
            catch (error) {
                if (error === null || error === void 0 ? void 0 : error.response) {
                    const body = typeof error.response.data === 'string'
                        ? error.response.data
                        : JSON.stringify(error.response.data);
                    throw new Error(`CURL_REQUEST: HTTP ${error.response.status} ${(_a = error.response.statusText) !== null && _a !== void 0 ? _a : ''} — ` +
                        `${(body !== null && body !== void 0 ? body : '').slice(0, 500)}`);
                }
                throw new Error(`CURL_REQUEST: request failed — ${(_b = error === null || error === void 0 ? void 0 : error.message) !== null && _b !== void 0 ? _b : String(error)}`);
            }
        }),
    }),
];
//# sourceMappingURL=http.algorithms.js.map