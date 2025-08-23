export class EnvConfig {
    public static init() {
        //Read configuration file
        let configFile = null;

        //Read configuration file location from env.
        if (process.env.ENV_FILE_LOCATION) {
            configFile = process.env.ENV_FILE_LOCATION;
        }
        // check file from command line argument
        else {
            process.argv.forEach(function (val, index, array) {
                let arr = val.split(":");
                if (arr.length > 0 && arr[0] == "config") {
                    configFile = arr[1];
                }
            });
        }

        if (configFile == null) {
            // Automatically look for environment-specific config files
            const env = process.env.NODE_ENV || 'dev';
            const defaultConfigPath = `env/${env}.env`;

            console.info(`No specific config specified, looking for: ${defaultConfigPath}`);
            require("dotenv").config({ path: defaultConfigPath });
        } else {
            console.info("Reading configuration from", configFile);
            require("dotenv").config({ path: configFile });
        }
    }

    //Get configuration value method
    public static get(key: string): string {
        if (!process.env.hasOwnProperty(key)) {
            throw new Error("Missing configuration key " + key);
        } else {
            return process.env[key]!;
        }
    }

    //Get configuration value method with default
    public static getOrDefault(key: string, defaultValue: string): string {
        return process.env[key] || defaultValue;
    }

    //Get configuration value method
    public static set(key: string, value: string): void {
        process.env[key] = value;
    }

    //Check configuration key exists
    public static has(key: string): boolean {
        return process.env.hasOwnProperty(key);
    }

    // Get all environment variables as an object
    public static getAll(): NodeJS.ProcessEnv {
        return process.env;
    }

    // Get environment-specific configuration
    public static getEnvironment(): string {
        return this.getOrDefault('NODE_ENV', 'development');
    }

    // Get server port
    public static getPort(): number {
        const port = this.getOrDefault('PORT', '5000');
        return parseInt(port, 10);
    }

    // Check if running in development mode
    public static isDevelopment(): boolean {
        return this.getEnvironment() === 'development';
    }

    // Check if running in production mode
    public static isProduction(): boolean {
        return this.getEnvironment() === 'production';
    }

    // Check if running in test mode
    public static isTest(): boolean {
        return this.getEnvironment() === 'test';
    }
} 