import Ajv from 'ajv';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { AppConfig } from './models/generated/app-config.js';
import appConfigSchema from './schemas/json/app-config.json';

const ajv = new Ajv();
const validateConfig = ajv.compile<AppConfig>(appConfigSchema);

export type AppConfigSubset<T extends keyof AppConfig = never> = Pick<AppConfig, T>;

export function getConfiguration(): AppConfig {
	const currentDir = process.cwd();

	const configPath = path.resolve(currentDir, '.table-types.json');
	if (!fs.existsSync(configPath)) {
		throw new Error(`The config file at "${configPath}" does not exist`);
	}

	const configString = fs.readFileSync(configPath, { encoding: 'utf8' });
	const config = JSON.parse(configString);

	// Validate the loaded configuration
	const validationResult = validateConfig(config);
	if (!validationResult) {
		throw new Error('Invalid configuration: ' + JSON.stringify(validateConfig.errors, null, 2));
	}

	return config;
}

