module.exports = function (dataType, data, prompt) {
	if (dataType == "select") {
		for (i = 0; i < data.length; i++) {
			console.log((i + 1) + ") " + array[i]);
		}
	} else if (dataType == "select+") {
		for (i = 0; i < data.length; i++) {
			var meta = " (";
			for (var tag in data[i]){
				if (tag != "name") {
					meta += tag + ": " + data[i][tag];
				}
			}
			meta += ")";
			console.log((i + 1) + ") " + data[i].name + meta);
		}
	}
};