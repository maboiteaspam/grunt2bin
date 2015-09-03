# grunt2bin

Helper to use `grunt` with a node `binary` package.

It helps to take advantage of `grunt` power when you creates globally installed node package.

Provide a default configuration and a default workflow based on grunt.

Let `grunt2bin` provides the interfaces required by your end user to hack and configure your program.

Configuration and workflow can be overridden per folder and or per system user.

## usage

Install grunt2bin as local dependency of your module.

```npm i grunt2bin --save```

For each `binary` where you want to use `grunt`

```js
#!/usr/bin/env node

var grunt2bin = require('grunt2bin')
var TasksWorkflow = grunt2bin.TasksWorkflow

grunt2bin.handleProgram({

  // handleProgram expects
  // an Object with two keys.
  
  // grunt config to initialize or update
  config: function(grunt, cwd){
    grunt.initConfig({
      'user': ''
    })
    // load my super tasks
    grunt.loadTasks('tasks')
  },
  
  // grunt tasks workflow to build
  run: function(main){
    TasksWorkflow()
      .appendTask( TasksWorkflow.createTask('confirm_username'))
      .appendTask( TasksWorkflow.createTask('hello'))
      .packToTask('welcome',
      'This task inquire user to confirm the user name to use, then say hello.'
    ).appendTo(main);
  }
})
```

## pre defined command line arguments

`grunt2bin` handles several command line arguments out of the box.

    grunt2bin
    --describe [task / target name]     Show help and description about tasks.
    --only [task name]                  Keep tasks that match given name.
    --edit [mine|this]                  Starts an editor to edit the Gruntfile 
                                        located in $HOME or the cwd.
    
    Grunt
    --verbose                           Configure grunt verbosity
    --debug                             Configure grunt to more verbosity
    --force                             Force grunt to keep going on error
    
    boilerplate
    --version                           Show version of your program
    --help                              show help o your program (See showusage)
    
So you don t need to care about those.

## comprehensive workflow

To help you to build and check your workflow and its configuration,
you are invited to use `--describe [some]` option

```
[the program name] --describe [some string pattern]
```

Which would display something similar to this
```
sh> project-node --describe check_auth

PROJECT-BIN-NODE
bin helper to initialize a node project.

Tasks details for check_auth:

 -  Task CHECK_AUTH
    Ensure the various auth mechanism involved works properly 
    before anything is started.
    This task is an alias of
      - githubauth:svcs_check_auth

    Target GITHUBAUTH:SVCS_CHECK_AUTH
        "options": {
          "auth": {
            "type": "oauth",
            "token": "*****"
          },
          "config": {
            "version": "3.0.0"
          }
        }

```

## per folder configuration

To properly initialize a per folder program configuration file of a program implementing `grunt2bin`,
please use this command

```
[the program name] --edit [mine]
```

This will create a proper file to put your changes and update.



## examples

- https://github.com/maboiteaspam/hello-grunt2bin
- https://github.com/maboiteaspam/project-bin-node/tree/grunt2bin


## License
See the [LICENSE](./LICENSE) file.
