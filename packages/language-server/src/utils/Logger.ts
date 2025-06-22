import { Connection } from 'vscode-languageserver';

export class Logger {
  private static instance: Logger = new Logger();

  private constructor(private connection?: Connection) {}

  static setupLogger(connection: Connection): Logger {
    Logger.instance = new Logger(connection);
    return Logger.instance;
  }
  static getLogger(): Logger {
    return Logger.instance;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  info(message: string): void {
    const msg = `[${this.getTimestamp()}] [INFO] ${message}`;
    this.connection?.console.info(msg);
    console.info(msg);
  }

  warn(message: string): void {
    const msg = `[${this.getTimestamp()}] [WARN] ${message}`;
    this.connection?.console.warn(msg);
    console.warn(msg);
  }

  error(message: string): void {
    const msg = `[${this.getTimestamp()}] [ERROR] ${message}`;
    this.connection?.console.error(msg);
    console.error(msg);
  }

  debug(message: string): void {
    const msg = `[${this.getTimestamp()}] [DEBUG] ${message}`;
    this.connection?.console.log(msg);
    console.log(msg);
  }
}
