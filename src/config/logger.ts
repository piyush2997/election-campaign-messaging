import { EnvConfig } from "./EnvConfig";
import winston from "winston";
import { LoggingWinston } from '@google-cloud/logging-winston';

const { combine, timestamp, printf } = winston.format;

export class Logger {
    private static winstonLogger: winston.Logger | null = null;
    private static isInitialized: boolean = false;

    public static initialize() {
        try {
            // Read log level with fallback
            let configuredLogLevel: string = EnvConfig.getOrDefault('LOG_LEVEL', 'info');
            if (['info', 'debug', 'warn', 'error'].indexOf(configuredLogLevel) == -1) {
                configuredLogLevel = 'info'; // Default fallback
            }

            // Create formatter for winston logger.
            let loggingFormat = this.getWinstonLoggingFormat();

            // Initialize logger
            this.winstonLogger = winston.createLogger({
                format: combine(timestamp(), loggingFormat),
                exitOnError: false, // Changed to false to prevent crashes
                level: configuredLogLevel
            });

            // Add console transport by default
            this.winstonLogger.add(
                new winston.transports.Console({
                    format: combine(timestamp(), loggingFormat),
                    level: configuredLogLevel
                })
            );

            // Add Google Cloud logging if configured
            if (EnvConfig.has('gcp_logs') && EnvConfig.get('gcp_logs') == '1') {
                try {
                    const serviceName = EnvConfig.getOrDefault('service_name', 'election-campaign-api');
                    let options = {
                        logName: serviceName,
                        format: combine(timestamp(), loggingFormat)
                    };
                    const loggingWinston = new LoggingWinston(options);
                    this.winstonLogger.add(loggingWinston);
                    console.log('Logger: Google Cloud logger configured successfully');
                } catch (gcpError) {
                    console.warn('Logger: Failed to configure Google Cloud logger:', gcpError);
                }
            }

            this.isInitialized = true;
            console.log(`Logger initialized with level: ${configuredLogLevel}`);

        } catch (error) {
            console.error('Failed to initialize logger:', error);
            // Fallback to console logging
            this.isInitialized = false;
        }
    }

    public static drawLine() {
        Logger.info('----------------------------------------------------------------------');
    }

    public static debug(...args: any[]) {
        if (this.isInitialized && this.winstonLogger) {
            try {
                this.winstonLogger.debug(args.join(' '));
            } catch (error) {
                console.debug(...args);
            }
        } else {
            console.debug(...args);
        }
    }

    public static info(...args: any[]) {
        if (this.isInitialized && this.winstonLogger) {
            try {
                this.winstonLogger.info(args.join(' '));
            } catch (error) {
                console.info(...args);
            }
        } else {
            console.info(...args);
        }
    }

    public static warn(...args: any[]) {
        if (this.isInitialized && this.winstonLogger) {
            try {
                this.winstonLogger.warn(args.join(' '));
            } catch (error) {
                console.warn(...args);
            }
        } else {
            console.warn(...args);
        }
    }

    public static error(...args: any[]) {
        if (this.isInitialized && this.winstonLogger) {
            try {
                this.winstonLogger.error(args.join(' '));
            } catch (error) {
                console.error(...args);
            }
        } else {
            console.error(...args);
        }
    }

    private static getWinstonLoggingFormat() {
        return printf((info) => {
            const serviceName = EnvConfig.getOrDefault('service_name', 'election-campaign-api');

            if (typeof info.message == 'string') {
                return `${serviceName}: ${info.level}: ${info.message}`;
            } else if (typeof info.message == 'object') {
                let str = `${info.timestamp} ${info.level}: `;
                Object.keys(info.message).forEach(function (key) {
                    let logItem = info.message[key];
                    if (logItem instanceof Error) {
                        str += logItem.message + " " + logItem.stack;
                    } else {
                        str += logItem;
                    }
                });
                return `${serviceName} ${str}`;
            }
            return `${serviceName}: ${info.level}: ${info.message}`;
        });
    }

    public static isLoggerInitialized(): boolean {
        return this.isInitialized;
    }
}