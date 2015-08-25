var path = require('path')
var fs = require('fs')
var osenv = require('osenv')
var gruntDescribe = require('grunt-describe')
var argv = require('minimist')(process.argv.slice(2));
var TasksWorkflow = require('./lib/tasks-workflow.js')

//region main
function handleProgram(program){
  var cwd = process.cwd()

  var caller = getCallerLocation()
  var moduleLocation = findPackageFileAlongPath(caller)

  var grunt = require('grunt')
  if (fs.existsSync (path.join(__dirname, 'tasks')))
    grunt.loadTasks(path.join(__dirname, 'tasks'))

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

  grunt.file.setBase(moduleLocation || caller)
  program.config(grunt, cwd)

  userGrunt && grunt.file.setBase(path.dirname(userGruntfile))
  userGrunt && userGrunt.config && userGrunt.config(grunt, cwd)

  var systemUserGrunt = null
  var systemUserGruntfile = null
  grunt.loadSystemUserGruntfile = function (what) {
    // can/must be called only from userGruntfile.
    what = what || 'config run'
    if (userGruntfileName) {
      var p = path.basename(userGruntfileName, path.extname(userGruntfileName))
      p = path.join(osenv.home(), p)
      systemUserGruntfile = path.join(p, 'index.js')
      if (fs.existsSync(systemUserGruntfile)) {
        systemUserGrunt = require(systemUserGruntfile)
        if (what.match(/config/)) {
          systemUserGrunt && grunt.file.setBase(path.dirname(systemUserGruntfile))
          systemUserGrunt && systemUserGrunt.config && systemUserGrunt.config(grunt, cwd)
          grunt.file.setBase(path.dirname(userGruntfile))
        }
        if (what.match(/run/)) {
          systemUserGrunt && grunt.file.setBase(path.dirname(systemUserGruntfile))
          systemUserGrunt && systemUserGrunt.run && systemUserGrunt.run(main, grunt, cwd)
          grunt.file.setBase(path.dirname(userGruntfile))
        }
      }
    }
  }

  if (!userGrunt) {
    grunt.loadSystemUserGruntfile('config')
  }

  var main = new TasksWorkflow()
  grunt.file.setBase(moduleLocation || caller)
  program.run(main, grunt, cwd)

  userGrunt && grunt.file.setBase(path.dirname(userGruntfile))
  userGrunt && userGrunt.run && userGrunt.run(main, grunt, cwd)

  if (!userGrunt) {
    grunt.loadSystemUserGruntfile('run')
  }

  grunt.file.setBase(moduleLocation || caller)

  grunt.option.init({
    gruntfile: mainGruntfile,
    base: cwd,
    verbose: !!process.argv.join(' ').match(/--verbose/),
    debug: !!process.argv.join(' ').match(/--debug/)
  });

  if (argv.only) {
    main.forEach(function(task){
      if (!task.name.match(argv.only)) {
        main.removeTask(task.name)
      } else {
        console.log(task)
      }
    })
  }
  main.registerTo(grunt, 'default');

  if (argv.describe) {
    var pkg = fs.existsSync(moduleLocation+'/package.json')
      ? require(moduleLocation+'/package.json')
      : {name: path.basename(caller), description: 'not provided'}
    gruntDescribe(grunt, pkg, argv.describe)

  } else {
    //run the task
    grunt.tasks('default', {
      gruntfile: mainGruntfile,
      base: cwd,
      verbose: !!process.argv.join(' ').match(/--verbose/),
      debug: !!process.argv.join(' ').match(/--debug/),
      force: !!process.argv.join(' ').match(/--force/)
    })
  }
}
//endregion

//region utils
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
//endregion

module.exports = {
  handleProgram: handleProgram,
  TasksWorkflow: TasksWorkflow
};
