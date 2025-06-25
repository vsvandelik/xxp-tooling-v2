export class Logger {
    connection;
    static instance = new Logger();
    constructor(connection) {
        this.connection = connection;
    }
    static setupLogger(connection) {
        Logger.instance = new Logger(connection);
        return Logger.instance;
    }
    static getLogger() {
        return Logger.instance;
    }
    getTimestamp() {
        return new Date().toISOString();
    }
    info(message) {
        const msg = `[${this.getTimestamp()}] [INFO] ${message}`;
        this.connection?.console.info(msg);
        console.info(msg);
    }
    warn(message) {
        const msg = `[${this.getTimestamp()}] [WARN] ${message}`;
        this.connection?.console.warn(msg);
        console.warn(msg);
    }
    error(message) {
        const msg = `[${this.getTimestamp()}] [ERROR] ${message}`;
        this.connection?.console.error(msg);
        console.error(msg);
    }
    debug(message) {
        const msg = `[${this.getTimestamp()}] [DEBUG] ${message}`;
        this.connection?.console.log(msg);
        console.log(msg);
    }
}
//# sourceMappingURL=Logger.js.map