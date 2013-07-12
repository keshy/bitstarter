#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var util = require('util');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlExists = function(url){
	if(url == null || !url.startsWith("http://")){	
	  console.log("%s is not a valid URL. Exiting", url);
	  process.exit(1);
	}
        return url.toString();
}



var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile, callback) {
    // use callbacks to report successful file parsing.
    // function to handle restler response
	var res = function(result,response){
		if(result instanceof Error){
			console.error('Error: ' + util.format(response.message));
			// throw empty callback indicating error
			return callback(null);
		} else {
				fs.writeFileSync(htmlfile, result);
                $ = cheerioHtmlFile(htmlfile);
 				var checks = loadChecks(checksfile).sort();
				var out = {};
				for(var ii in checks) {
				        var present = $(checks[ii]).length > 0;
				        out[checks[ii]] = present;
				}
				//throw callback with the dictionary of parsed html elements
				return callback(out);
		}	
	};
	return res;
	

};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
	if (typeof String.prototype.startsWith != 'function') {
  		// see below for better implementation!
	  String.prototype.startsWith = function (str){
	 	 return this.indexOf(str) == 0;
  	  };
	}
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --url <url>', 'URL to the html page to be verified', clone(assertUrlExists), HTMLFILE_DEFAULT)
        .parse(process.argv);
    // use checkHtmlFile for injecting restler response handlers    
    var checkjson = rest.get(program.url.toString()).on('complete', checkHtmlFile('sample', program.checks, function(data){
		if(data == null){
			console.log("No data returned!");
		}else {
			var outJson = JSON.stringify(data, null, 4);
			console.log(outJson);
		}
	})); 
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

