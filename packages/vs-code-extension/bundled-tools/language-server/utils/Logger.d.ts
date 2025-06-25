import { Connection } from 'vscode-languageserver';
export declare class Logger {
    private connection?;
    private static instance;
    private constructor();
    static setupLogger(connection: Connection): Logger;
    static getLogger(): Logger;
    private getTimestamp;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    debug(message: string): void;
}
//# sourceMappingURL=Logger.d.ts.map