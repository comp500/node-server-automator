//http://s3.amazonaws.com/Minecraft.Download/versions/1.8.9/minecraft_server.1.8.9.jar
const readline = require('readline');
const fs = require('fs');

// create readline interface for querying user
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

// initiate database object variable
var db = {};

try {
	fs.accessSync('./db.json', fs.W_OK); // check if we can read database file, throws error if we can't
	db = JSON.parse(fs.readFileSync('./db.json', 'UTF-8')); // read database to object
} catch (e) {
	try {
		fs.writeFileSync('./db.json', JSON.stringify({'profiles': []})); // throws error if we have no write permissions, writes database
		data = fs.readFileSync('./db.json', 'UTF-8'); // check if we can read it back again, for parity purposes
		if (JSON.stringify({'profiles': []}) != data) {
			console.error("Error writing to db.json. We didn't get back what we wrote... FS corrupt?!");
			process.exit();
		}
		db = JSON.parse(data); // put database in object
	} catch (e) { // if we have no write permissions, print error
		console.error("Error writing to db.json. Is it locked?");
		process.exit();
	}
}

function listPrint(array) {
	for (i = 0; i < array.length; i++) {
		console.log((i + 1) + ") " + array[i]);
	}
}

function settingPrint(array) {
	for (i = 0; i < array.length; i++) {
		console.log(array[i]);
	}
}

// print profile list:
var profilesArray = [];
for (i = 0; i < db.profiles.length; i++) { // put data in array
	profilesArray.push(db.profiles[i].name);
}
profilesArray.push("New Profile");
listPrint(profilesArray);

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

function initProfile(profile) {
	ensureExists('./profiles', (e) => {
		if (e) {
		 	console.error("Error making profiles folder.");
			console.log(e);
			process.exit();
		} else {
			ensureExists('./profiles/' + profile.name, (e) => {
				if (e) {
					console.error("Error making profile folder.");
					console.log(e);
					process.exit();
				} else {
					configureProfile(profile);
				}
			});
		}
	});
}

function askSetting(setting, defaultSetting, callback) {
	rl.question(setting + ' (' + defaultSetting + '): ', (answer) => {
		rl.pause();
		if (answer == "") {
			callback(defaultSetting);
		} else {
			callback(answer);
		}
	});
}

function configureProfile(profile) {
	if (profile.properties == null) {
		profile.properties = {};
	}
	askSetting('MOTD', 'A Minecraft Server', (a) => {
		profile.properties.motd = a;
		console.log("Choose one of:");
		settingPrint(['Survival', 'Creative', 'Adventure', 'Spectator']);
		askSetting('Gamemode', 'Creative', (a) => {
			switch (a) {
				case "0":
					profile.properties.gamemode = 0;
					break;
				case "2":
					profile.properties.gamemode = 2;
					break;
				case "3":
					profile.properties.gamemode = 3;
					break;
				case "Survival":
					profile.properties.gamemode = 0;
					break;
				case "Adventure":
					profile.properties.gamemode = 2;
					break;
				case "Spectator":
					profile.properties.gamemode = 3;
					break;
				default:
					profile.properties.gamemode = 1;
			}
			askSetting('Online Mode', 'On', (a) => {
				switch (a) {
					case "On":
						profile.properties['online-mode'] = true;
						break;
					case "Off":
						profile.properties['online-mode'] = false;
						break;
					case "true":
						profile.properties['online-mode'] = true;
						break;
					case "false":
						profile.properties['online-mode'] = false;
						break;
					default:
						profile.properties['online-mode'] = true;
				}
				settingPrint(['Normal', 'Flat']);
				askSetting('Level Type', 'Normal', (a) => {
					switch (a) {
						case "Normal":
							profile.properties['level-type'] = "DEFAULT";
							break;
						case "Flat":
							profile.properties['level-type'] = "FLAT";
							break;
						default:
							profile.properties['level-type'] = "DEFAULT";
					}
					if (profile.properties['level-type'] == "FLAT") {
						console.log("Warning: Only works on 1.8+, for now:");
						presets = {
							"Classic Flat": "",
							"Tunneler's Dream": "3;minecraft:bedrock,230*minecraft:stone,5*minecraft:dirt,minecraft:grass;3;stronghold,biome_1,decoration,dungeon,mineshaft",
							"Water World": "3;minecraft:bedrock,5*minecraft:stone,5*minecraft:dirt,5*minecraft:sand,90*minecraft:water;24;biome_1,oceanmonument",
							"Overworld": "3;minecraft:bedrock,59*minecraft:stone,3*minecraft:dirt,minecraft:grass;1;stronghold,biome_1,village,decoration,dungeon,lake,mineshaft,lava_lake",
							"Snowy Kingdom": "3;minecraft:bedrock,59*minecraft:stone,3*minecraft:dirt,minecraft:grass,minecraft:snow_layer;12;biome_1,village",
							"Bottomless Pit": "3;2*minecraft:cobblestone,3*minecraft:dirt,minecraft:grass;1;biome_1,village",
							"Desert": "3;minecraft:bedrock,3*minecraft:stone,52*minecraft:sandstone,8*minecraft:sand;2;stronghold,biome_1,village,decoration,dungeon,mineshaft",
							"Redstone Ready": "3;minecraft:bedrock,3*minecraft:stone,52*minecraft:sandstone;2;"
						};
						presetsArray = ["Classic Flat", "Tunneler's Dream", "Water World", "Overworld", "Snowy Kingdom", "Bottomless Pit", "Desert", "Redstone Ready"];
						listPrint(presetsArray);
						rl.question('Select preset: ', (answer) => { // ask user what preset they want to use
							rl.pause();
							if (presetsArray[answer - 1] == null) { // zero-indexed arrays, so we use answer - 1
								console.log("Classic Flat selected");
							} else {
								console.log(presetsArray[answer - 1] + " selected");
								profile.properties['generator-settings'] = presets[presetsArray[answer - 1]];
							}
							db.profiles.push(profile);
							saveDB();
						});
					} else {
						db.profiles.push(profile);
						saveDB();
					}
				});
			});
		});
	});
}

function newProfile() {
	console.log("Loading minecraft versions...");
	var request = require('request');
	var profile = {};
	request('https://launchermeta.mojang.com/mc/game/version_manifest.json', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			versions = JSON.parse(body);
			rl.question('Name: ', (answer) => { // ask user what they want to call it
				if (profilesArray.indexOf(answer) === -1) {
					rl.pause();
					profile.name = answer;
					listPrint(['Latest Release', 'Latest Snapshot', 'Other Releases', 'Other Snapshots']);
					console.log("Or just enter a version number/ID.");
					rl.question('Select type of version: ', (answer) => { // ask user what profile they want to use
						rl.pause();
						var install = require("./modules/installer.js");
						switch (answer) {
							case "1":
								profile.version = versions.latest.release;
								console.log("Using version " + profile.version);
								install(profile.version, versions, () => {
									initProfile(profile);
								});
								break;
							case "2":
								profile.version = versions.latest.snapshot;
								console.log("Using version " + profile.version);
								install(profile.version, versions, () => {
									initProfile(profile);
								});
								break;
							case "3":
								var versionsArray = [];
								for (i = 0; i < versions.versions.length; i++) { // put data in array
									if (versions.versions[i].type == "release") {
										versionsArray.push(versions.versions[i].id);
									}
								}
								versionsArray.reverse();
								listPrint(versionsArray);
								rl.question('Select version: ', (answer) => { // ask user what profile they want to use
									rl.pause();
									if (versionsArray[answer - 1] == null) { // zero-indexed arrays, so we use answer - 1
										console.error("Invalid version.");
										process.exit();
									} else {
										console.log(versionsArray[answer - 1] + " selected");
										profile.version = versionsArray[answer - 1];
										install(profile.version, versions, () => {
											initProfile(profile);
										});
									}
								});
								break;
							case "4":
								var versionsArray = [];
								for (i = 0; i < versions.versions.length; i++) { // put data in array
									if (versions.versions[i].type == "snapshot") {
										versionsArray.push(versions.versions[i].id);
									}
								}
								versionsArray.reverse();
								listPrint(versionsArray);
								rl.question('Select version: ', (answer) => { // ask user what profile they want to use
									rl.pause();
									if (versionsArray[answer - 1] == null) { // zero-indexed arrays, so we use answer - 1
										console.error("Invalid version.");
										process.exit();
									} else {
										console.log(versionsArray[answer - 1] + " selected");
										profile.version = versionsArray[answer - 1];
										install(profile.version, versions, () => {
											initProfile(profile);
										});
									}
								});
								break;
							default:
								var versionsArray = [];
								for (i = 0; i < versions.versions.length; i++) { // put data in array
									versionsArray.push(versions.versions[i].id);
								}
								if (versionsArray.indexOf(answer) === -1) {
									console.log(answer + " isn't an option. :(");
									process.exit();
								} else {
									profile.version = answer;
									install(profile.version, versions, () => {
										initProfile(profile);
									});
								}
						}
					});
				} else {
					console.error("Profile name already exists.");
					process.exit();
				}
			});
		} else if (error) {
			console.error("Error retrieving minecraft version list.");
			console.log(error);
			process.exit();
		}
	});
}

function saveDB() {
	try {
		fs.writeFileSync('./db.json', JSON.stringify(db)); // try to save database
	} catch (e) {
		console.error("Error writing to db.json. Is it locked?");
		console.log("Tried to write: ");
		console.log(db);
		process.exit();
	}
}

function copyFiles(profile, callback) {
	fs.writeFile("./game/server.properties", require("minecraft-server-properties").stringify(profile.properties), function(err) {
		if(err) {
			return console.log(err);
		}
		fs.writeFile("./game/eula.txt", "eula=true", function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("The file was saved!");
			fs.link("./versions/" + profile.version + ".jar", "./game/" + profile.version + ".jar", function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("The file was saved!");
				var spawn = require('child_process').spawn;
				const ls = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', profile.version + '.jar', 'nogui'], {cwd: "./game/"});
				ls.stdout.pipe(process.stdout);
				ls.stderr.pipe(process.stdout);
				process.stdin.pipe(ls.stdin);

				ls.on('close', (code) => {
				  console.log(`child process exited with code ${code}`);
				  process.stdin.unpipe(ls.stdin);
				  process.exit();
				});
			});
		}); 
		console.log("The file was saved!");
	});
}

rl.question('Select profile: ', (answer) => { // ask user what profile they want to use
	rl.pause();
	if (profilesArray[answer - 1] == null) { // zero-indexed arrays, so we use answer - 1
		console.log("Invalid, making new profile.");
		newProfile();
	} else {
		console.log(profilesArray[answer - 1] + " selected");
		if (profilesArray[answer - 1] == "New Profile") {
			newProfile();
		} else {
			ensureExists('./game/', (e) => {
				if (e) {
					console.error("Error making game folder.");
					console.log(e);
					process.exit();
				} else {
					i = 0;
					while (profilesArray[answer - 1] != db.profiles[i].name) {
						i++;
					}
					var profile = db.profiles[i];
					copyFiles(profile, function(){});
				}
			});
		}
	}
});