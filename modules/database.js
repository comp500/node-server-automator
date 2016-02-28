module.exports = function (dbFile, worldFolder) {
	if (dbFile == null || worldFolder == null) {
		console.error("Um, what?");
		return false;
	}
	if (require('exists-file')(dbFile) != true) {
		try {
			require('mkdirp').sync(require("path").dirname(dbFile)); // ensure dbFile's location has a folder
			require("fs").writeFileSync(dbFile, JSON.stringify({}));
		} catch (e) {
			console.error("Error while writing main database file:");
			console.error(e);
			return false;
		}
	}
	
	return {
		saveFile: function (file, data) {
			try {
				const fs = require("fs");
				var mkdirp = require('mkdirp');
				mkdirp.sync(require("path").dirname(file));
				fs.writeFileSync(file, JSON.stringify(data));
				return true;
			} catch (e) {
				console.error("Error while writing file:");
				console.error(e);
				return false;
			}
		},
		readFile: function (file) {
			if (require('exists-file')(file)) {
				try {
					const fs = require("fs");
					var data = JSON.parse(fs.readFileSync(file, 'UTF-8'));
					return data;
				} catch (e) {
					console.error("Error while reading file:");
					console.error(e);
					return false;
				}
			} else {
				return false;
			}
		},
		checkWorldName: function (worldName) {
			var worldSanitised = require("sanitize-filename")(worldName);
			if (worldSanitised == "") {
				console.error("Name invalid.");
				return false;
			} else {
				if (require('exists-file')(worldFolder + worldSanitised + "/")) {
					console.error("World already exists!");
					return false;
				} else {
					return worldSanitised;
				}
			}
		},
		mapWorldFolder: function (worldName) { // has trailing slash
			if (worldName) {
				return worldFolder + worldName + "/";
			} else {
				console.error("[RARE ERROR] World name not specified");
				return false;
			}
		},
		mapFile: function (worldName) {
			if (worldName) {
				var folder = this.mapWorldFolder(worldName);
				if (folder) {
					return folder + "manifest.json";
				} else {
					return false;
				}
			} else {
				return dbFile;
			}
		},
		saveTag: function (file, data) {
			if (file == false) {
				console.error("Mapped file not found.");
				return false;
			}
			var dataOrig = this.readFile(file); // check for file exists
			var mergedData = null;
			if (dataOrig == false) {
				mergedData = data;
			} else {
				mergedData = require('deepmerge')(dataOrig, data);
			}
			return this.saveFile(file, mergedData);
		},
		readData: function (dataType, worldName) {
			if (dataType) {
				if (dataType == "world") {
					return this.readFile(this.mapFile(worldName));
				} else {
					return this.readFile(this.mapFile());
				}
			} else {
				console.error("Error: No dataType specified to readData.");
				return false;
			}
		},
		saveData: function (dataType, data) {
			if (dataType) {
				if (dataType == "world") {
					return this.saveTag(this.mapFile(data.name), data);
				} else {
					return this.saveTag(this.mapFile(), data);
				}
			} else {
				console.error("Error: No dataType specified to saveData.");
				return false;
			}
		},
		listWorlds: function () {
			if (require('exists-file')(worldFolder)) {
				return require("fs").readdirSync(worldFolder);
			} else {
				return {};
			}
		}
	};
}