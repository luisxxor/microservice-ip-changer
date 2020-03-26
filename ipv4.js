import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';

config();

function getLocations() {
	let locations = execSync(`expressvpn list all`).toString();
	locations = locations.trim().split('\n').slice(2);
	let pattern = /^\w+/;
	return locations.map(v => v.match(pattern)[0]);
}

const locationsFile = './locationsExpressVPN';
const currentIPv4File = './currentIPv4';
let locations = [];
let currentIPv4;

if (!existsSync(locationsFile)) {
	locations = getLocations();
	writeFileSync(locationsFile, locations.join('\n'));
	currentIPv4 = 0;
} else {
	locations = readFileSync(locationsFile, 'utf-8').trim().split('\n');

	if (!existsSync(currentIPv4File)) {
		currentIPv4 = 0;
	} else {
		currentIPv4 = parseInt(readFileSync(currentIPv4File));
		currentIPv4 = currentIPv4 == locations.length - 1 ? 0 : currentIPv4 + 1;
	}
}

writeFileSync(currentIPv4File, currentIPv4);

try {
	execSync(`expressvpn disconnect`);
} catch (error) {
	console.log(error.stderr);
}

try {
	execSync(`expressvpn connect ${locations[currentIPv4]}`);
} catch (error) {
	locations = getLocations();
	writeFileSync(locationsFile, locations.join('\n'));
	currentIPv4 = 0;
	writeFileSync(currentIPv4File, currentIPv4);
	console.log(error.stderr);
	console.log('Updated locations file and will try again in 15 minutes');
}

