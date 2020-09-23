"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = exports.RedisProvider = void 0;
const redisProvider_1 = require("./module/src/redisProvider");
Object.defineProperty(exports, "RedisProvider", { enumerable: true, get: function () { return redisProvider_1.RedisProvider; } });
const redisModule_1 = require("./module/redisModule");
Object.defineProperty(exports, "RedisModule", { enumerable: true, get: function () { return redisModule_1.RedisModule; } });
exports.redis = require("ioredis");
//# sourceMappingURL=index.js.map