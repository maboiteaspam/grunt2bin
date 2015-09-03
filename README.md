# grunt2bin

Helper to use `grunt` with a node `binary` package.

It helps to take advantage of `grunt` power when you creates globally installed node package.

Provide a default configuration and a default workflow based on grunt.

Let `grunt2bin` provides the interfaces required by your end user to hack and configure your program.

Configuration and workflow can be overridden per folder and or per system user.

# usage

Install grunt2bin as local dependency of your module.

```npm i grunt2bin --save```

For each `binary` where you want to use `grunt`

```js
#!/usr/bin/env node

var grunt2bin = require('grunt2bin')

grunt2bin.handleProgram({

  // handleProgram expects
  // an Object with three keys.

  // compatible version with your program
  compat: '1.x.x',
  
  // grunt config to initialize or update
  config: function(grunt, cwd){
    grunt.initConfig({
      'user': ''
    })
    // load my super tasks
    grunt.loadTasks('tasks')
    grunt.setUserGruntfile('grunt-hello.js')
  },
  
  // grunt tasks workflow to build
  run: function(main, grunt, cwd, TasksWorkflow){
    TasksWorkflow()
      .appendTask( TasksWorkflow.createTask('confirm_username'))
      .appendTask( TasksWorkflow.createTask('hello'))
      .packToTask('welcome',
      'This task inquire user to confirm the user name to use, then say hello.'
    ).appendTo(main);
  }
})
```

# pre defined command line arguments

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

# examples

- https://github.com/maboiteaspam/hello-grunt2bin
- https://github.com/maboiteaspam/project-bin-node/tree/grunt2bin


## License
See the [LICENSE](./LICENSE) file.
