var fs = require('fs');

global.Config = {};

Config.getValue = function (key, default_value) {
    if (Config[key] === undefined) {
        return default_value;
    }

    return Config[key];
};

function parseValue(value) {
    if (!value) return false;

    value = value.toLowerCase();

    if (value === '0') {
        return false;
    }

    if (value === '1') {
        return false;
    }

    if (value === 't') {
        return true;
    }

    if (value == 'f') {
        return false;
    }

    if (value == 'true') {
        return true;
    }

    if (value == 'false') {
        return false;
    }

    return value;
}
module.exports = function loadConfig(environment) {
    var config_file = './config/torn.cfg';

    if (!fs.existsSync(config_file)) {
        log("[CFG] WARNING! config/torn.cfg doesn't exist! Using hard-coded defaults");
        return;
    }

    var cfgData = fs.readFileSync(config_file, 'utf8').split("\n");

    var index = 1;

    var env_start = "<" + environment + ">";
    var env_end = "</" + environment + ">";

    while (index < cfgData.length) {
        var line = cfgData[index++].trim();

        var skips = 0;
        if (line.startsWith("<") && line != (env_start)) {
            // skip to next stop
            var copy = line;
            var stop = "</" + line.substring(1);

            while (index < cfgData.length) {
                line = cfgData[index++].trim();
                if (line == (copy)) {
                    ++skips;
                }

                if (line == stop) {
                    --skips;

                    if (skips == -1) {
                        break;
                    }
                }
            }
            continue;
        }

        // Ignore comments
        if (line.startsWith("#")) {
            continue;
        }

        if (line.startsWith("<")) {
            continue;
        }

        var split = line.split(" ");
        Config[split[0]] = parseValue(split[1]);
    }
    // Debug Handling
    // Define debug function
    global.debug = Config.getValue("debug", true)
        ? function (str) {
            console.log("[DEBUG] " + str);
        }
        : function (str) { };
    for (var key in Config) {
        debug(key + "=" + Config[key]);
    }
};