const
	colors = require("colors/safe"),
	fs = require("fs"),
	minimist = require( "minimist" ),
	path = require("path"),
	sharedtorrent = require("../lib/sharedtorrent").sharedtorrent;

const log = console.log.bind(console);
const toLower = (str) => str && String.prototype.toLowerCase.apply(str);
const toUpper = (str) => str && String.prototype.toUpperCase.apply(str);

const argv = minimist( process.argv.slice(2), {
	"boolean": [
		"help",
		"verbose",
		"version",
	],
	"default": {
		"file": "sharedtorrent.json",
		"output": ["rss", "xml"],
	},
	"alias": {
		"h": "help",
		"f": "file",
		"V": "verbose",
		"v": "version",
		"o": "output",
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

const actionAddTorrent = (linkTorrent, e=sharedtorrent.from(preloadSharedTorrent())) => {
	log(colors.yellow(`Add torrent link.`));
	// sharedtorrent.init(FILE_SHAREDTORRENT, preloadSharedTorrent());

	e.addTorrent(linkTorrent);

	makeSharedTorrent(e.toString());

	log("update file " + colors.green(FILE_SHAREDTORRENT) + ":");
	// log(e.toString());

	actionExportRSS(void 0, e);
	actionExportMarkdown(void 0, e);
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

const actionExportRSS = (SET_OUTFILE, e=sharedtorrent.from(preloadSharedTorrent())) => {
	log(colors.yellow(`Create RSS.`));

	const OUTFILE = path.resolve(SET_OUTFILE || `${e.body.title.replace(/\s/g,".")}.xml`);

	// makeSharedTorrent(e.toXML());

	log("Update file " + colors.green(OUTFILE) + ":");
	// fileWriteSync()
	// console.log()
	//

	fs.writeFileSync(OUTFILE, e.toXML());
}

const actionExportMarkdown = (SET_OUTFILE, e=sharedtorrent.from(preloadSharedTorrent())) => {
	log(colors.yellow(`Create Markdown file.`));

	const OUTFILE = path.resolve(SET_OUTFILE || `${e.body.title.replace(/\s/g,".")}.md`);

	// makeSharedTorrent(e.toXML());

	log("Update file " + colors.green(OUTFILE) + ":");

	fs.writeFileSync(OUTFILE, e.toMD());
}

const actionImport = (filetoimport) => {
	log(colors.yellow(`Import MAGENTS links.`));
	let f = fs.readFileSync(filetoimport).toString().split("\n");

	console.log( JSON.stringify(f, null, 2) );

	let e = sharedtorrent.from(preloadSharedTorrent());

	for (var i = f.length - 1; i >= 0; i--) {
		e.addTorrent(f[i]);
	}

	makeSharedTorrent(e.toString());

	log("update file " + colors.green(FILE_SHAREDTORRENT) + ":");
	log(e.toString());
}

const actionList = () => {
	log(colors.yellow(`List Titles.`));

	let e = sharedtorrent.from(preloadSharedTorrent());

	log(e.body.torrents.map(t=>t.name).join("\n"));
}

info();


switch (toLower(argv["_"][0])) {
case "init": actionInit(); break;
case "inspect": actionInspect(); break;
case "add": actionAddTorrent(argv["_"][1]); break;
case "set": actionSetProp(toLower(argv["_"][1]), argv["_"].slice(2).join(" ")); break;
case "xml":
case "rss": actionExportRSS(argv["_"][1]); break;
case "md":
case "markdown": actionExportMarkdown(argv["_"][1]); break;
case "import": actionImport(argv["_"][1]); break;
case "ls":
case "list": actionList(); break;
default: actionNoWork(); break;
}


