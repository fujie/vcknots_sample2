"use strict";
/**
 * VCKnots Demo Server
 *
 * - port 3000 で HTML ページを配信
 * - API リクエストを port 8080 のバックエンドにプロキシ
 * - /callback の結果をトラッキングして Verifier ページにポーリング提供
 *
 * 起動方法:
 *   npx tsx demo/server.ts
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var node_http_1 = require("node:http");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
// プロジェクトルートから npx tsx demo/server.ts で実行する想定
var DEMO_DIR = (0, node_path_1.join)(process.cwd(), 'demo');
var BACKEND = (_a = process.env.BACKEND_URL) !== null && _a !== void 0 ? _a : 'http://localhost:8080';
var PORT = Number((_b = process.env.DEMO_PORT) !== null && _b !== void 0 ? _b : 3000);
var MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
};
// Verification result store (state → result)
var verificationResults = new Map();
function readBody(req) {
    return new Promise(function (resolve) {
        var data = '';
        req.on('data', function (chunk) { return (data += chunk.toString()); });
        req.on('end', function () { return resolve(data); });
    });
}
var server = (0, node_http_1.createServer)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var url, state, result, filePath, fullPath, ext, backendUrl, headers, _i, _a, _b, k, v, body, upstream, responseBody, params, state, payload, outHeaders_1, err_1;
    var _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                url = new URL((_c = req.url) !== null && _c !== void 0 ? _c : '/', "http://localhost:".concat(PORT));
                // ── Demo result polling ─────────────────────────────────
                if (req.method === 'GET' && url.pathname.startsWith('/demo/results/')) {
                    state = decodeURIComponent(url.pathname.slice('/demo/results/'.length));
                    result = verificationResults.get(state);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result !== null && result !== void 0 ? result : { verified: false }));
                    return [2 /*return*/];
                }
                // ── Static files ────────────────────────────────────────
                if (req.method === 'GET') {
                    filePath = url.pathname === '/' ? '/index.html' : url.pathname;
                    fullPath = (0, node_path_1.join)(DEMO_DIR, filePath);
                    if ((0, node_fs_1.existsSync)(fullPath) && !fullPath.includes('..')) {
                        ext = (0, node_path_1.extname)(fullPath);
                        res.writeHead(200, { 'Content-Type': (_d = MIME[ext]) !== null && _d !== void 0 ? _d : 'application/octet-stream' });
                        res.end((0, node_fs_1.readFileSync)(fullPath));
                        return [2 /*return*/];
                    }
                }
                _e.label = 1;
            case 1:
                _e.trys.push([1, 6, , 7]);
                backendUrl = "".concat(BACKEND).concat(url.pathname).concat(url.search);
                headers = {};
                for (_i = 0, _a = Object.entries(req.headers); _i < _a.length; _i++) {
                    _b = _a[_i], k = _b[0], v = _b[1];
                    if (typeof v === 'string' && k !== 'host')
                        headers[k] = v;
                }
                body = void 0;
                if (!(req.method !== 'GET' && req.method !== 'HEAD')) return [3 /*break*/, 3];
                return [4 /*yield*/, readBody(req)];
            case 2:
                body = _e.sent();
                _e.label = 3;
            case 3: return [4 /*yield*/, fetch(backendUrl, {
                    method: req.method,
                    headers: headers,
                    body: body !== null && body !== void 0 ? body : undefined,
                })];
            case 4:
                upstream = _e.sent();
                return [4 /*yield*/, upstream.text()
                    // Track /callback results for Verifier polling
                ];
            case 5:
                responseBody = _e.sent();
                // Track /callback results for Verifier polling
                if ((url.pathname === '/callback' || url.pathname === '/callback-kbjwt') &&
                    upstream.status === 200 &&
                    body) {
                    params = new URLSearchParams(body);
                    state = params.get('state');
                    if (state) {
                        payload = void 0;
                        try {
                            payload = JSON.parse(responseBody);
                        }
                        catch (_f) { }
                        verificationResults.set(state, {
                            verified: true,
                            timestamp: Date.now(),
                            payload: payload,
                        });
                    }
                }
                outHeaders_1 = {};
                upstream.headers.forEach(function (v, k) {
                    if (k !== 'transfer-encoding')
                        outHeaders_1[k] = v;
                });
                res.writeHead(upstream.status, outHeaders_1);
                res.end(responseBody);
                return [3 /*break*/, 7];
            case 6:
                err_1 = _e.sent();
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'backend_unavailable', message: String(err_1) }));
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
server.listen(PORT, function () {
    console.log("\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557\n\u2551         VCKnots Demo Server                  \u2551\n\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563\n\u2551  Demo UI:  http://localhost:".concat(PORT, "              \u2551\n\u2551  Backend:  ").concat(BACKEND.padEnd(33), "\u2551\n\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563\n\u2551  Pages:                                      \u2551\n\u2551    /issuer.html   - Issuer (\u767A\u884C\u8005)          \u2551\n\u2551    /wallet.html   - Wallet (\u30A6\u30A9\u30EC\u30C3\u30C8)      \u2551\n\u2551    /verifier.html - Verifier (\u691C\u8A3C\u8005)        \u2551\n\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n"));
});
