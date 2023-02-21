import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { AppConfig } from './models/generated/app-config.js';

export type AppConfigSubset<T extends keyof AppConfig = never> = Pick<AppConfig, T>;

export function getConfiguration(): AppConfig {
	const currentDir = process.cwd();

	const configPath = path.resolve(currentDir, '.table-types.json');
	if (!fs.existsSync(configPath)) {
		throw new Error(`The config file at "${configPath}" does not exist`);
	}

	const configString = fs.readFileSync(configPath, { encoding: 'utf8' });
	const config: AppConfig = JSON.parse(configString);

	return config;
}

