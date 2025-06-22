import { Connection } from 'vscode-languageserver';

export class Logger {
    private static instance: Logger;
    private connection?: Connection;

    private constructor() {}

    public static initialize(connection: Connection): Logger {
        Logger.instance = new Logger();
        Logger.instance.connection = connection;
        return Logger.instance;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private getTimestamp(): string {
        return new Date().toISOString();
    }

    public info(message: string): void {
        const msg = `[${this.getTimestamp()}] [INFO] ${message}`;
        this.connection?.console.info(msg);
        console.info(msg);
    }

    public warn(message: string): void {
        const msg = `[${this.getTimestamp()}] [WARN] ${message}`;
        this.connection?.console.warn(msg);
        console.warn(msg);
    }

    public error(message: string): void {
        const msg = `[${this.getTimestamp()}] [ERROR] ${message}`;
        this.connection?.console.error(msg);
        console.error(msg);
    }

    public debug(message: string): void {
        const msg = `[${this.getTimestamp()}] [DEBUG] ${message}`;
        this.connection?.console.log(msg);
        console.log(msg);
    }
}