"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUuid = exports.randomBackgammonDirection = exports.randomBackgammonColor = exports.randomBoolean = exports.generateId = void 0;
var uuid_1 = require("uuid");
Object.defineProperty(exports, "generateId", { enumerable: true, get: function () { return uuid_1.v4; } });
const randomBoolean = () => Math.random() > 0.5;
exports.randomBoolean = randomBoolean;
const randomBackgammonColor = () => (0, exports.randomBoolean)() ? 'black' : 'white';
exports.randomBackgammonColor = randomBackgammonColor;
const randomBackgammonDirection = () => (0, exports.randomBoolean)() ? 'clockwise' : 'counterclockwise';
exports.randomBackgammonDirection = randomBackgammonDirection;
const isValidUuid = (uuid) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid);
exports.isValidUuid = isValidUuid;
__exportStar(require("./Board"), exports);
__exportStar(require("./Checker"), exports);
__exportStar(require("./Cube"), exports);
__exportStar(require("./Dice"), exports);
__exportStar(require("./Game"), exports);
__exportStar(require("./Player"), exports);
