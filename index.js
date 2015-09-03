var path = require('path')
var fs = require('fs-extra')
var semver = require('semver')
var osenv = require('osenv')
var editors = require('editors')
var gruntDescribe = require('grunt-describe')
var argv = require('minimist')(process.argv.slice(2));
var TasksWorkflow = require('./lib/tasks-workflow.js')
var pkg = require('./package.json')

//region main
/**
 * Struct of a program.
 * A software that offers
 * a configuration handle
 * and a run handle.
 *
 *
 * @constructor
 */
function Program () {
  /**
   * Handle to configure grunt
   * and load grunt tasks.
   *
   * @param grunt Grunt
   * @param cwd String
   */
  this.config = function(grunt, cwd){}
  /**
   * Handle to create and change a
   * grunt tasks workflow.
   *
   * @param main TasksWorkflow
   * @param grunt Grunt
   * @param cwd String
   */
  this.run = function(main, grunt, cwd){}
}

/**
 * Handles a program execution
 *
 * @param program
 */
function handleProgram  (program) {
  var cwd = process.cwd()

  // get a grunt instance
  var grunt = require('grunt')

  // load grunt and the tasks local to this module, if any.
  if (fs.existsSync (path.join(__dirname, 'tasks')))
    grunt.loadTasks(path.join(__dirname, 'tasks'))

  // Discover the path of the program implementing grunt2bin
  var caller = getCallerLocation()
  // it may be within a /lib/ or /bin/ folder within the module
  // so we may need to search for its top level location where the package.json exists.
  var moduleLocation = findPackageFileAlongPath(caller)
  var modulePkg = fs.existsSync(moduleLocation+'/package.json')
    ? require(moduleLocation+'/package.json')
    : {name: path.basename(caller), description: 'not provided', version: '0.0.0'}

  var userGruntfileName = modulePkg.name + '.js'

  // handle help and version command line arguments
  if(argv.version){
    return console.log('%s %s', pkg.name, pkg.version);
  }

  if(argv.help){
    return showusage(moduleLocation, modulePkg.name, 'Usage')
  }

  // we starts and editor,
  // to edit a Gruntfile
  if (argv.edit) {
    var pathToEdit = path.join(cwd, userGruntfileName)
    if ((argv.edit + '').match(/mine/)) {
      pathToEdit = path.basename(userGruntfileName, path.extname(userGruntfileName))
      pathToEdit = path.join(osenv.home(), pathToEdit)
      pathToEdit = path.join(pathToEdit, 'index.js')
    }

    // if it does not exists,
    // create it at first.
    if (!fs.existsSync(pathToEdit)) {
      var content = fs.readFileSync(path.join(__dirname, 'index-tpl.js')).toString()
      var v = semver.major(modulePkg.version) + '.' + semver.minor(modulePkg.version) + '.x'

      fs.mkdirsSync (path.dirname(pathToEdit))
      fs.writeFileSync(pathToEdit, content.replace('x.x.x', v))
    }

    return editors(pathToEdit, function (code, sig) {});
  }

  // this is a stub for grunt.
  // It requires a Gruntfile on cwd to run properly.
  // (this is big headache)
  var mainGruntfile = path.join(__dirname, 'Gruntfile.js');

  // load file on cwd to configure and update the tasks workflow.
  var userGrunt = null
  var userGruntfile = null
  userGruntfile = path.join(cwd, userGruntfileName)
  if (fs.existsSync(userGruntfile)) {
    userGrunt = require(userGruntfile)

    // check compatibility
    if (userGrunt.compat) {
      if (!semver.satisfies(modulePkg.version, userGrunt.compat)) {
        throw 'Oops! Your user grunt file is compatible with ' + userGrunt.compat
        + ', but ' + modulePkg.name +  ' version is ' + modulePkg.version
        + '.\nYou should review the user grunt file '
        + 'and update compat field accordingly.' ;
      }
    }
  }

  // program needs now to configure and load tasks
  // into grunt.
  // for that purpose, tasks loading,
  // we shall ensure the cwd is set to module location.
  grunt.file.setBase(moduleLocation || caller)
  program.config(grunt, cwd)

  grunt.setUserGruntfile = null; // ? can do that ?


  // Additionally, grunt2bin can help you to load
  // a file located in the system user folder,
  // something like $HOME.
  //
  var systemUserGrunt = null
  var systemUserGruntfile = null
  grunt.loadSystemUserGruntfile = function (what) {
    // can/must be called only from userGruntfile.
    what = what || 'config run'
    if (! systemUserGrunt && userGruntfileName) {
      var p = path.basename(userGruntfileName, path.extname(userGruntfileName))
      p = path.join(osenv.home(), p)
      systemUserGruntfile = path.join(p, 'index.js')
      if (fs.existsSync(systemUserGruntfile)) {
        systemUserGrunt = require(systemUserGruntfile)
      }

      if (systemUserGrunt) {
        // check compatibility
        if (systemUserGrunt.compat) {
          if (!semver.satisfies(modulePkg.version, systemUserGrunt.compat)) {
            throw 'Oops! Your user grunt file is compatible with ' + systemUserGrunt.compat
            + ', but ' + modulePkg.name +  ' version is ' + modulePkg.version
            + '.\nYou should review the user grunt file '
            + 'and update compat field accordingly.' ;
          }
        }
      }
    }

    if (what && systemUserGrunt) {
      if (what.match(/config/)) {
        systemUserGrunt && grunt.file.setBase(path.dirname(systemUserGruntfile))
        systemUserGrunt && systemUserGrunt.config && systemUserGrunt.config(grunt, cwd)
        grunt.file.setBase(path.dirname(userGruntfile))
      }
      if (what.match(/run/)) {
        systemUserGrunt && grunt.file.setBase(path.dirname(systemUserGruntfile))
        systemUserGrunt && systemUserGrunt.run && systemUserGrunt.run(main, grunt, cwd, TasksWorkflow)
        grunt.file.setBase(path.dirname(userGruntfile))
      }
    }

    return systemUserGrunt
  }

  // if there is no user grunt file within cwd
  // to possibly load a system user grunt file,
  // then grunt2bin will do that by default.
  if (!userGrunt) {
    grunt.loadSystemUserGruntfile('config')

    // otherwise, up to the userGrunt to load it, or not.
  } else if (userGrunt.config) {
    // if a userGruntFile has been set and exists,
    // apply the same behavior as program.
    grunt.file.setBase(path.dirname(userGruntfile))
    userGrunt.config(grunt, cwd)
  }

  // main is a workflow to be injected into grunt later.
  // it has helper methods to add / replace / remove / insert tasks.
  var main = new TasksWorkflow()
  grunt.file.setBase(moduleLocation || caller) // needed ?

  // program will now execute,
  // in fact nothing will really happens here
  // excepts maybe temporary files setup, and some static system checks
  // the purpose, in fact, is to build the tasks workflow.
  // in other words provides task with targets and proper configuration
  // to execute smoothly.
  // the execution of the workflow is delayed to later
  // and is entirely done by grunt.
  program.run(main, grunt, cwd, TasksWorkflow)

  // if there is no user grunt file within cwd
  // to possibly invoke the run handle of the system user file,
  //grunt2bin will do it.
  if (!userGrunt) {
    grunt.loadSystemUserGruntfile('run')

    // otherwise, up to the userGrunt to run it, or not.
  } else if (userGrunt.run) {
    grunt.file.setBase(path.dirname(userGruntfile)) // needed ?
    userGrunt.run(main, grunt, cwd, TasksWorkflow)
  }

  grunt.file.setBase(moduleLocation || caller) // needed ?

  // this command line options --only [task name]
  // remove all tasks excepts those matching given name.
  if (argv.only) {
    main.forEach(function(task){
      if (!task.name.match(argv.only)) {
        main.removeTask(task.name)
      }
    })
  }

  //
  // By now, the workflow is ready.
  // the configuration is finalised.
  //

  // grunt will now be configured
  // and made ready for execution.

  // set some general defaults options.
  grunt.option.init({
    gruntfile: mainGruntfile, // stub.
    base: cwd, // ensure we run into the cwd of the end user.
    // pass in some default options.
    verbose: !!argv.verbose,
    debug: !!argv.debug,
    force: !!argv.force
  });

  // translate the TasksWorkflow configuration
  // into a grunt configuration.
  // notes that it uses a different merge method than regular grunt.
  // Arrays of data will be merged.
  main.registerTo(grunt, 'default');

  // Instead of running the program,
  // user may want to inspect it.
  // --describe [something] interprets
  // the grunt configuration and its tasks
  // to display them in order.
  // if tasks are found their description are shown.
  // if targets are found their configuration are shown.
  if (argv.describe) {
    gruntDescribe(grunt, modulePkg, argv.describe)

  } else {
    // otherwise, lets run grunt now.
    //run the task
    grunt.tasks('default', {
      // this is needed even it s duplicate.
      gruntfile: mainGruntfile,
      base: cwd,
      // pass in some default options.
      verbose: !!argv.verbose,
      debug: !!argv.debug,
      force: !!argv.force
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

// exports the stuff to let you use it.
module.exports = {
  handleProgram: handleProgram,
  TasksWorkflow: TasksWorkflow
};
