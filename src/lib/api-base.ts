import path from 'path';
import winston from 'winston';
/**
 * Base class for CLI commands.
 *
 */
export class ApiBase {
  opts: any;
  logger: winston.Logger;
  debugFile: string | undefined;
  /**
   * Sets global options.
   *
   * @param {Object} opts Command options.
   */
  constructor(opts: any) {
    if (!opts) {
      opts = {};
    }
    this.opts = opts;
    this.logger = this.__setupLogger();
  }
  /**
   * Creates a logger object to log debug output.
   * @return {Object}
   */
  __setupLogger() {
    const level = this.opts.verbose ? 'debug' : 'warn';
    this.debugFile = path.join(process.cwd(), 'api-console-cli.log');
    const format = winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    );
    const logger = winston.createLogger({
      level,
      format,
      exitOnError: false,
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: this.debugFile, level: 'error'})
      ]
    });
    return logger;
  }
}
