module.exports = function (version, versionManifest, callback) {
	var request = require('request');
	const fs = require("fs");
	i = 0;
	while (version != versionManifest.versions[i].id) {
		i++;
	}
	require('mkdirp')("./versions", function (e) {
		if (e) {
			console.error("Error making versions folder.");
			console.error(e);
			process.exit();
		}
		if (require('exists-file')('./versions/' + version + '.jar')) {
			callback();
		}
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
	});
};