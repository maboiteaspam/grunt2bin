var path = require('path')
var fs = require('fs')
var osenv = require('osenv')

module.exports = function (program) {

  var cwd = process.cwd()

  var caller = getCallerLocation()
  var moduleLocation = findPackageFileAlongPath(caller)

  var grunt = require('grunt')

  var mainGruntfile = path.join(__dirname, 'Gruntfile.js');

  var userGruntfileName = null

  var userGrunt = null
  var userGruntfile = null
  grunt.setUserGruntfile = function(u){
    userGruntfileName = u
    userGruntfile = path.join(cwd, u)
    if (fs.existsSync(userGruntfile)) {
      userGrunt = require(userGruntfile)
    }
  }

  var systemUserGrunt = null
  var systemUserGruntfile = null
  grunt.loadSystemUserGruntfile = function (what) {
    // can/must be called only from userGruntfile.
    what = what || 'config run'
    if (userGruntfileName) {
      systemUserGruntfile = path.join(osenv.home(), userGruntfileName, 'index.js')
      if (fs.existsSync(systemUserGruntfile)) {
        systemUserGrunt = require(systemUserGruntfile)
        if (what.match(/config/)) {
          systemUserGrunt && grunt.file.setBase(path.dirname(systemUserGruntfile))
          systemUserGrunt && systemUserGrunt.config(grunt, cwd)
          grunt.file.setBase(userGruntfile)
        }
        if (what.match(/run/)) {
          systemUserGrunt && grunt.file.setBase(path.dirname(systemUserGruntfile))
          systemUserGrunt && systemUserGrunt.run(grunt, cwd)
          grunt.file.setBase(userGruntfile)
        }
      }
    }
  }

  grunt.file.setBase(moduleLocation || caller)
  program.config(grunt, cwd)

  userGrunt && grunt.file.setBase(path.dirname(userGruntfile))
  userGrunt && userGrunt.config(grunt, cwd)

  grunt.file.setBase(moduleLocation || caller)
  program.run(grunt, cwd)

  userGrunt && grunt.file.setBase(path.dirname(userGruntfile))
  userGrunt && userGrunt.run(grunt, cwd)

  grunt.file.setBase(moduleLocation || caller)
  grunt.tasks('default', {
    gruntfile: mainGruntfile,
    base: cwd,
    verbose: !!process.argv.join(' ').match(/--verbose/),
    debug: !!process.argv.join(' ').match(/--debug/)
  })
}

function getCallerLocation () {

  var stack = new Error().stack.split('\n');
  stack.shift();stack.shift();stack.shift();
  var caller = stack.shift().match(/\(([^)]+)\)$/)
  if (!caller || !caller.length) {

    console.error('please report')
    console.error(new Error().stack)

    throw 'that is so weird.'
  }
  caller = path.dirname(caller[1])

  return caller;
}

function findPackageFileAlongPath (p) {

  var found = false
  do{
    if (fs.existsSync(path.join(p, 'package.json'))) {
      var pk = require(path.join(p, 'package.json'))
      if (pk.bin) {
        Object.keys(pk.bin).forEach(function(name){
          var f = pk.bin[name]
          if (!found && fs.existsSync(path.join(p,f))) {
            found = true
          }
        })
      }
    }
    if (!found&& p.length>1) {
      p = path.resolve(p, '..')
    }
  }while(found);

  return p || found;
}
