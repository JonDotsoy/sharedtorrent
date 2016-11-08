const
	fs = require("fs"),
	moment = require("moment-timezone"),
	path = require("path"),
	pkg = require("../package.json"),
	querystring = require("querystring"),
	url = require("url"),
	xml = require("xml");

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
	const comments = null;
	const hash = toUpper(/[a-z0-9]+:[a-z0-9]+:([a-z0-9]+)/i.exec(infoHash)[1]);

	return {
		name,
		infoHash,
		comments,
		hash,
		trackers,
		magnet,
	};
}

const magnetGetHash = (magnetLink) => {
}

/**
 * MagnetArrayTorrentsWithNewMagent description.
 * @todo Pro hacer
 * @exports magnetArrayTorrentsWithNewMagent
 * @param  {String} lastTorrents description
 * @param  {String} magnetLink   description
 * @return {String}              description
 */
const magnetArrayTorrentsWithNewMagent = module.exports.magnetArrayTorrentsWithNewMagent = function (lastTorrents, magnetLink) {
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
		newTorrentsArray.push(Object.assign(uncomposeMagent(magnetLink), {
			pubDate: moment(Date.now()).tz("UTC").format("ddd, DD MMM YYYY HH:mm:ss ZZ"),
		}));
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
				pubDate: moment(Date.now()).tz("UTC").format("ddd, DD MMM YYYY HH:mm:ss ZZ"),
				lastBuildDate: moment(Date.now()).tz("UTC").format("ddd, DD MMM YYYY HH:mm:ss ZZ"),
				link:void 0,
				linkrss:void 0,
				torrents: [],
			},
			initialBody
		);
	}

	addTorrent (magnetLink) {
		this.body = Object.assign(this.body, {
			lastBuildDate: moment(Date.now()).tz("UTC").format("ddd, DD MMM YYYY HH:mm:ss ZZ"),
			torrents: magnetArrayTorrentsWithNewMagent(this.body.torrents, magnetLink),
		});
	}

	toString() {
		return JSON.stringify(this.body, null, 2);
	}

	toJSON() {
		return this.body;
	}

	toXML({ indent = true } = {}) {
		let body = "";

		// HEAD
		if (indent) {
			body += "<?xml version='1.0' encoding='UTF-8' ?>\n<!DOCTYPE torrent PUBLIC \"-//bitTorrent//DTD torrent 0.1//EN\" \"http://xmlns.ezrss.it/0.1/dtd/\">\n\n";
		} else {
			body += "<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE torrent PUBLIC \"-//bitTorrent//DTD torrent 0.1//EN\" \"http://xmlns.ezrss.it/0.1/dtd/\">";
		}

		let items = [];

		for (var i = 0; i < this.body.torrents.length; i++) {
			let tr = this.body.torrents[i];

			let bodyItem = {
				"item": [
					{
						"title": { "_cdata": tr.name }
					},
					{
						"link": tr.magnet
					},
					{
						"comments": tr.comments,
					},
					{
						"pubDate": tr.pubDate,
					},
					{
						"torrent": [
							{
								_attr: {
									"xmlns": "http://xmlns.ezrss.it/0.1/"
								}
							},
							{
								"fileName": {_cdata: tr.name},
							},
							{
								"infoHash": tr.hash,
							},
							{
								"magnetURI": {_cdata: tr.magnet}
							},
							{
								"trackers": [
									{
										"group": [
											{
												_attr: {
													"order": "random"
												}
											},
											...tr.trackers.map((track) => {
												return {
													tracker: {
														_cdata: track
													}
												}
											})
										]
									}
								]
							}
						]
					}
				]
			};

			items.push(bodyItem);
		}


		body += xml({
			"rss": [
				{"_attr": {
					"version": "2.0",
					"xmlns:dc": "http://purl.org/dc/elements/1.1/"
				}},
				{
					"channel": [
						{
							"title": this.body.title,
						},
						{
							"description": this.body.description,
						},
						{
							"link": this.body.link,
						},
						{
							"language": this.body.language,
						},
						{
							"pubDate": moment(this.body.pubDate, (typeof this.body.pubDate === "number") ? "UNIX" : "ddd, DD MMM YYYY HH:mm:ss ZZ").tz("UTC").format("ddd, DD MMM YYYY HH:mm:ss ZZ"),
						},
						{
							"lastBuildDate": moment(this.body.pubDate, (typeof this.body.pubDate === "number") ? "UNIX" : "ddd, DD MMM YYYY HH:mm:ss ZZ").tz("UTC").format("ddd, DD MMM YYYY HH:mm:ss ZZ"),
						},
						{
							"docs": "http://blogs.law.harvard.edu/tech/rss",
						},
						{
							"generator": `${pkg.name} v${pkg.version}${(pkg.gitHead)?` [${pkg.gitHead.substring(0, 6)}]`:""}`
						},
						...items.sort((e,i) => {
							if (e.item[0].title._cdata > i.item[0].title._cdata) {
								return 1;
							} else if (e.item[0].title._cdata < i.item[0].title._cdata) {
								return -1;
							} else {
								return 0;
							}
						}),
					],
				},
			],
		}, {
			stream: false,
			indent,
		});

		return Buffer.from(body);
	}

	toMD() {
		let body = "";

		const parseLink = (str) => {
			return String(str).toLowerCase().replace(/\./g, '');
		}

		/*TITLE*/
		body += `# ${this.body.title}\n`;
		body += "\n";

		// INDEX
		body += `## Index\n`;

		body += this.body.torrents.
		sort(function (e,i) {
			if (e.name > i.name) {
				return 1;
			} else if (e.name < i.name) {
				return -1;
			} else {
				return 0
			}
		}).
		map(t => {
			return `- [${t.name}](#${parseLink(t.name)})`
		}).
		join("\n");

		body += "\n";
		body += "\n";

		if (this.body.linkrss) {
			body += "## RSS Feeds\n\n";
			body += "> [How do I import torrents from RSS feeds?](http://help.utorrent.com/customer/portal/articles/163700)\n\n";
			body += "```\n";
			body += `${this.body.linkrss}\n`;
			body += "```\n";
			body += "\n";
		}

		body += "## Details\n";


		body += this.body.torrents.
		sort(function (e,i) {
			if (e.name > i.name) {
				return 1;
			} else if (e.name < i.name) {
				return -1;
			} else {
				return 0
			}
		}).
		map(t => {
			let b = "";

			b += `##### ${t.name}\n`
			b += "```\n";
			b += `${t.magnet}\n`
			b += "```\n";

			return b
		}).
		join("\n");

		return Buffer.from(body);
	}

	/*
	 * Inicializa un objeto sharedtorrent desde un archivo.
	 */
	static from (initialBody) {
		return new this(initialBody);
	}
}



module.exports.sharedtorrent = sharedtorrent;
