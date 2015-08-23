var path = require('path')
var fs = require('fs')
var osenv = require('osenv')
var argv = require('minimist')(process.argv.slice(2));
var TasksWorkflow = require('./lib/tasks-workflow.js')

//region main
function handleProgram(program){
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

  main.registerTo(grunt, 'default');

  if (argv.describe) {
    var pkg = fs.existsSync(moduleLocation+'/package.json')
      ? require(moduleLocation+'/package.json')
      : {name: path.basename(caller), description: 'not provided'}
    describeGrunt(grunt, pkg, argv.describe)
  } else {
    //run the task
    grunt.tasks('default', {
      gruntfile: mainGruntfile,
      base: cwd,
      verbose: !!process.argv.join(' ').match(/--verbose/),
      debug: !!process.argv.join(' ').match(/--debug/)
    })
  }
}
//endregion

//region describe
function describeGrunt(grunt, pkg, keyword){

  var chalk = require('chalk')

  var fence = function(s, t){
    return s + t.replace(/(\n)/g, '\n'+s)
  }
  var removeFrontspace = function(t){
    return t.replace(/(\n\s*)/g, '\n')
  }
  var jsonFmt = function(o){
    var options = JSON.stringify(o || {}, null, 2).split('\n')
    options.shift()
    options.pop()
    return options.join('\n')
  }

  console.log('')
  console.log(chalk.bold.cyan(pkg.name.toUpperCase()))
  console.log(pkg.description)
  console.log('')

  if (keyword===true) {
    console.log('Tasks configured for this module:')
    console.log('')

    var topTask = grunt.task._tasks['default'];
    getAliasedTasks(topTask).forEach(function(name){
      var task = grunt.task._tasks[name];
      var description = grunt.config.get('global.descriptions.'+name) || '';
      console.log(chalk.magenta(' - ') + chalk.white.bold(name.toUpperCase()))
      console.log(fence('   ', removeFrontspace(description)))
      console.log('')
      console.log(fence('   ', 'Alias of'))
      console.log(fence('    - ', chalk.white(getAliasedTasks(task).join('\n'))))
      console.log('')
    })
  } else {
    console.log('Tasks details for ' + chalk.white(keyword) + ':')
    console.log('')

    var found = false;

    Object.keys(grunt.task._tasks).forEach(function(name){

      var task = grunt.task._tasks[name];
      var targets = grunt.config.get(task.name);
      var cName = chalk.white.bold(name.toUpperCase());

      if (name.match(keyword)) {
        found = true

        var description = grunt.config.get('global.descriptions.'+name) || 'no description for this task.';
        console.log(chalk.magenta(' -  ') + 'Task ' + cName)
        console.log(fence('      ', removeFrontspace(description)))

        if (targets) {
          console.log(fence('    ', 'Task targets are'))
          console.log(fence('      ', chalk.white(Object.keys(targets).join(', '))))
        } else {

          var aliases = getAliasedTasks(task)

          if (aliases.length) {
            console.log(fence('    ', 'This task is an alias of'))
            console.log(fence('      ', chalk.white(aliases.join(', '))))
          } else {
            console.log(fence('      ', chalk.yellow('This task has no targets.')))
          }

        }
        console.log('')
      }
      if (targets) {
        Object.keys(targets).forEach(function(target){
          if (target.match(keyword)) {
            found = true
            var t = cName+':'+chalk.white.bold(target.toUpperCase())

            var description = grunt.config.get('global.descriptions.'+name) || '';
            console.log(chalk.magenta(' -  ') + 'Target ' + t)
            if (description) {
              console.log(fence('    ', 'Task description'))
              console.log(fence('      ', removeFrontspace(description)))
            }

            var options = jsonFmt(targets[target])
            console.log('')
            if (options.length) {
              console.log(fence('    ', 'Target options are'))
              console.log(fence('      ', chalk.white(options)))
            } else {
              console.log(fence('    ', chalk.yellow('This target has no specific options.')))

              console.log('')
              var taskOptions = jsonFmt(targets)
              if (taskOptions.length) {
                console.log(fence('    ', 'However, here are ' + cName + ' Task options'))
                console.log(fence('      ', chalk.white(taskOptions)))
              } else {
                console.log(fence('    ', chalk.yellow(cName + ' Task no options.')))
              }
            }
            console.log('')
          }
        })
      }
    })

    if (!found) {
      grunt.log.error('There is not task or targets matching this search keywords !')
    }
  }
  console.log('')
}
function getAliasedTasks (task) {
  var aliasedTasks = []
  if (task.info.match(/^Alias for .*/)) {
    task.info
      .replace(/^Alias for\s+/, '')
      .replace(/\s+task[s]?[.]$/, '')
      .split(',')
      .forEach(function (aliased) {
        aliasedTasks.push(
          aliased.replace(/\s+$/, '').replace(/^\s+/, '').replace(/"/g, '')
        )
      });
  }
  return aliasedTasks
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
