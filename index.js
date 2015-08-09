var path = require('path')
var fs = require('fs')

module.exports = function (program) {

  var cwd = process.cwd()

  var caller = getCallerLocation()

  var grunt = require('grunt')

  var mainGruntfile = path.join(__dirname, 'Gruntfile.js');

  grunt.file.setBase(caller)
  var userGruntfile = null
  grunt.setUserGruntfile = function(u){
    userGruntfile = path.join(cwd, u)
  }
  program(grunt, cwd)

  if (userGruntfile && !fs.existsSync(userGruntfile)) {
    userGruntfile = mainGruntfile
  }

  grunt.tasks('default', {
    gruntfile: userGruntfile,
    base: cwd
  })
}

function getCallerLocation () {

  var stack = new Error().stack.split('\n');
  stack.shift();stack.shift();stack.shift();
  var caller = stack.shift().match(/\(([^)]+)\)$/)
  if (!caller || !caller.length) {

    console.log('please report')
    console.log(new Error().stack)

    throw 'that is so weird.'
  }
  caller = path.dirname(caller[1])

  return caller;
}
