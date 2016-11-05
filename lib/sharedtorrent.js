const
	fs = require("fs"),
	path = require("path"),
	querystring = require("querystring"),
	url = require("url");

const toLower = (e) => String(e).toLowerCase();
const toUpper = (e) => String(e).toUpperCase();

const uncomposeMagent = (magnetLink) => {
	const lMagnet = url.parse(magnetLink);
	const bMagnet = querystring.parse(lMagnet.query);

	// console.log(bMagnet);
	const name = bMagnet.dn;
	const trackers = bMagnet.tr;
	const infoHash = bMagnet.xt;
	const magnet = magnetLink;
	const hash = toUpper(/[a-z0-9]+:[a-z0-9]+:([a-z0-9]+)/i.exec(infoHash)[1]);

	return {
		name,
		infoHash,
		hash,
		trackers,
		magnet,
	};
}

const magnetGetHash = (magnetLink) => {
}

const magnetArrayTorrentsWithNewMagent = function (lastTorrents, magnetLink) {
	const newTorrentsArray = lastTorrents;

	let originalManget;
	if (originalManget = lastTorrents.find((e) => uncomposeMagent(e.magnet).hash === uncomposeMagent(magnetLink).hash )) {
		newTorrentsArray.map((e)=> {
			if (uncomposeMagent(e.magnet).hash === uncomposeMagent(magnetLink).hash) {
				return Object.assign(originalManget, uncomposeMagent(magnetLink));
			} else {
				return e
			}
		});
	} else {
		newTorrentsArray.push(Object.assign(uncomposeMagent(magnetLink), {pubDate:Date.now()}));
	}

	return newTorrentsArray.sort((e,i) => {
		if (e.name > i.name) {
			return 1;
		} else if (e.name < i.name) {
			return -1;
		} else {
			return 0;
		}
	});
}


/* Instancia para el modelo sharedtorrent */
class sharedtorrent {
	constructor(initialBody) {
		this.body = Object.assign(
			{
				title:void 0,
				description:void 0,
				language:void 0,
				link:void 0,
				torrents: [],
			},
			initialBody
		);
	}

	addTorrent (magnetLink) {
		this.body = Object.assign(this.body, {torrents: magnetArrayTorrentsWithNewMagent(this.body.torrents, magnetLink)})
	}

	toString() {
		return JSON.stringify(this.body, null, 2);
	}

	toJSON() {
		return this.body;
	}

	/*
	 * Inicializa un objeto sharedtorrent desde un archivo.
	 */
	static from (initialBody) {
		return new this(initialBody);
	}
}



module.exports.sharedtorrent = sharedtorrent;
