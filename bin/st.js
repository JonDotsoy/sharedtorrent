const
	colors = require("colors/safe");
	minimist = require( "minimist" ),
	path = require("path"),
	fs = require("fs"),
	sharedtorrent = require("../lib/sharedtorrent").sharedtorrent;

const log = console.log.bind(console);

const argv = minimist( process.argv.slice(2), {
	"boolean": [
		"help",
		"verbose",
		"version",
	],
	"default": {
		"file": "sharedtorrent.json",
	},
	"alias": {
		"h": "help",
		"f": "file",
		"V": "verbose",
		"v": "version",
	},
} );

const FILE_SHAREDTORRENT = path.resolve( process.cwd(), argv.file );

// console.log( JSON.stringify({ FILE_SHAREDTORRENT, argv }, null, 2) );
// console.log( "--------------------------------" );

const preloadSharedTorrent = function () {
	try {
		const stat = fs.statSync(FILE_SHAREDTORRENT);

		if (stat.isFile()) {
			try {
				return JSON.parse(fs.readFileSync(FILE_SHAREDTORRENT));
			} catch (ex) {
				return {};
			}
		} else {
			return {};
		}
	} catch (ex) {
		return {};
	}
}

const makeSharedTorrent = function (body) {
	fs.writeFileSync(FILE_SHAREDTORRENT, body);
}

const actionInit = () => {
	log(colors.yellow(`Initializing proyect.`));
	// sharedtorrent.init(FILE_SHAREDTORRENT, preloadSharedTorrent());

	let e = sharedtorrent.from(preloadSharedTorrent());

	makeSharedTorrent(e.toString());

	log("maked file " + colors.green(FILE_SHAREDTORRENT) + ":");
	log(e.toString());
}

const info = () => {
	log(String("-").repeat(50));
	log(`job: ${colors.green(String(argv["_"][0]).toLowerCase())}`);
	log(`Shared torrent file: ${colors.green(FILE_SHAREDTORRENT)}`);
	log(String("-").repeat(50));
}

const actionAddTorrent = (linkTorrent) => {
	log(colors.yellow(`Add torrent link.`));
	// sharedtorrent.init(FILE_SHAREDTORRENT, preloadSharedTorrent());

	let e = sharedtorrent.from(preloadSharedTorrent());

	e.addTorrent(linkTorrent);

	makeSharedTorrent(e.toString());

	log("update file " + colors.green(FILE_SHAREDTORRENT) + ":");
	log(e.toString());
}

const actionSetProp = (param, value = "") => {
	log(colors.yellow(`Set Prop ${colors.blue(param)}: ${colors.blue(value)}`));

	let e = sharedtorrent.from(Object.assign(preloadSharedTorrent(), {[param]: value}));

	makeSharedTorrent(e.toString());

	log("Update file " + colors.green(FILE_SHAREDTORRENT) + ":");
	log(e.toString());
}

const actionInspect = () => {
	log(JSON.stringify(preloadSharedTorrent(), null, 2));
}

const actionNoWork = () => {
	log(`${colors.yellow("Sorry No Working")}`);
}

info();
switch (String(argv["_"][0]).toLowerCase()) {
case "init": actionInit(); break;
case "inspect": actionInspect(); break;
case "add": actionAddTorrent(argv["_"][1]); break;
case "set": actionSetProp(String(argv["_"][1]).toLowerCase(), argv["_"].slice(2).join(" ")); break;
default: actionNoWork(); break;
}


