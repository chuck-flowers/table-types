#!/usr/bin/env node

import { getServices } from './services.js';

getServices().then(async services => {
	await services.handler.execute();
	await services.close();
});

