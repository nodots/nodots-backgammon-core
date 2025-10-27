/**
 * Logger utility that prefixes all logs with '[Core]'
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LoggerOptions {
    level?: LogLevel;
    enableConsole?: boolean;
    includeCallerInfo?: boolean;
}
interface CallerInfo {
    functionName: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    stack?: string;
}
declare class Logger {
    private level;
    private enableConsole;
    private includeCallerInfo;
    private readonly prefix;
    constructor(options?: LoggerOptions);
    private shouldLog;
    private getCallerInfo;
    private formatMessage;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    setLevel(level: LogLevel): void;
    setConsoleEnabled(enabled: boolean): void;
    setIncludeCallerInfo(enabled: boolean): void;
    getDetailedCallerInfo(): CallerInfo | null;
}
export declare const logger: Logger;
export { Logger };
export declare const debug: (message: string, ...args: any[]) => void;
export declare const info: (message: string, ...args: any[]) => void;
export declare const warn: (message: string, ...args: any[]) => void;
export declare const error: (message: string, ...args: any[]) => void;
export declare const setLogLevel: (level: LogLevel) => void;
export declare const setConsoleEnabled: (enabled: boolean) => void;
export declare const setIncludeCallerInfo: (enabled: boolean) => void;
export declare const getDetailedCallerInfo: () => CallerInfo | null;
//# sourceMappingURL=logger.d.ts.map