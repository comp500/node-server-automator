module.exports = function (dbFile, worldFolder) {
	return {
		saveFile: function (file, data) {
			
		},
		readFile: function (file) {
			
		},
		checkWorldName: function (worldName) {
			var worldSanitised = require("sanitize-filename")(worldName);
			if (worldSanitised == "") {
				console.error("Name invalid.");
				return false;
			} else {
				var existsFile = require('exists-file');
				if (existsFile(worldFolder + worldSanitised + "/")) {
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
			var dataOrig = readFile(file); // check for file exists
			var mergedData = null;
			if (dataOrig == false) {
				mergedData = data;
			} else {
				mergedData = require('deepmerge')(dataOrig, data);
			}
			return saveFile(file, mergedData);
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
		}
	};
}