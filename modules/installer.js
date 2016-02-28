module.exports = function (version, versionManifest, callback) {
	var request = require('request');
	const fs = require("fs");
	i = 0;
	while (version != versionManifest.versions[i].id) {
		i++;
	}
	function ensureExists(path, mask, cb) {
		if (typeof mask == 'function') { // allow the `mask` parameter to be optional
			cb = mask;
			mask = 0777;
		}
		fs.mkdir(path, mask, function(err) {
			if (err) {
				if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
				else cb(err); // something else went wrong
			} else cb(null); // successfully created folder
		});
	}
	ensureExists("./versions", function (e) {
		if (e) {
			console.error("Error making versions folder.");
			console.log(e);
			process.exit();
		}
		fs.access('./versions/' + version + '.jar', fs.R_OK, (err) => {
			if (!err) {
				callback();
			} else {
				console.log("Fetching version info...");
				request(versionManifest.versions[i].url, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						serverJarURL = JSON.parse(body).downloads.server.url;
						serverJarHash = JSON.parse(body).downloads.server.sha1;
						console.log("Downloading and verifying server from: " + serverJarURL);
						var crypto = require('crypto');
						var write = fs.createWriteStream('./versions/' + version + '.jar');
						request(serverJarURL).pipe(write).on('error', (e) => {
							console.error("Error downloading jar file.");
							console.log(e);
							process.exit();
						});;
						write.on('error', (e) => {
							console.error("Error saving jar file.");
							console.log(e);
							process.exit();
						});
						write.on('finish', () => {
							console.log("Download complete, now verifying...");
							var shasum = crypto.createHash('sha1');
							fs.createReadStream('./versions/' + version + '.jar').pipe(shasum);
							var sha = "";
							shasum.on('data', (chunk) => {
								sha += chunk.toString('hex');
							});
							shasum.on('end', function(){
								if (serverJarHash == sha) {
									console.log("Verified!");
									callback();
								} else {
									console.error("Hash invalid. Something went wrong. :(");
									process.exit();
								}
							});
						});
					} else if (error) {
						console.error("Error retrieving version info.");
						console.log(error);
						process.exit();
					}
				});
			}
		});
	});
};