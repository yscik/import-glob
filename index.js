var glob = require("glob");
var path = require("path");
var asyncReplace = require("async-replace");

module.exports = function(source)
{
  this.cacheable(false);
  var returnResult = this.async();


  var regex = /.?import + ?((\w+) from )?([\'\"])(.*?)\3/gm;
  var importModules = /import +(\w+) +from +([\'\"])(.*?)\2/gm;
  var importFiles = /import +([\'\"])(.*?)\1/gm;
  var importSass = /@import +([\'\"])(.*?)\1/gm;

  var resourceDir = path.dirname(this.resourcePath);

  function resolver(match, fromStatement, obj, quote, filename, offset, source, done)
  {
    if (!glob.hasMagic(filename)) return done(null, match);
    var [,prefix, pattern] = /^([^*\[?]*)(.*)$/.exec(filename)

    const promise =
    this.resolve(resourceDir, prefix, (err, basedir) => {
      done(null, replacer(prefix, path.dirname(basedir), match, fromStatement, obj, quote, pattern))
    });
  }

  function replacer(prefix, basedir, match, fromStatement, obj, quote, filename)
  {
    var modules = [];
    var withModules = false;

    var result = glob
      .sync(filename, {
        cwd: basedir
      }))
      .map(function(file, index) {
        var fileName = quote + prefix + file + quote;
        if (match.match(importSass)) {
          return '@import ' + fileName;
        } else if (match.match(importModules)) {
          var moduleName = obj + index;
          modules.push(moduleName);
          withModules = true;
          return 'import * as ' + moduleName + ' from ' + fileName;
        } else if (match.match(importFiles)) {
          return 'import ' + fileName;
        }
      })
      .join('; ');
    if (result && withModules) {
      result += '; let ' + obj + ' = [' + modules.join(', ') + ']';
    }
    return result;
  }

  asyncReplace(source, regex, resolver.bind(this), returnResult);

};
