# grunt2bin

Helper to use `grunt` with a node `binary` package.

It helps to take advantage of `grunt` power when you creates globally installed node package.

Provide a default configuration and a default workflow based on grunt.

Let `grunt2bin` provides the interfaces required by your end user to hack and configure your program.

Configuration and workflow can be overridden per folder and or per system user.

__What is the drawback ?__ Well, there is a reason grunt team does not explore that way, 
this module let you create situations where version dependency integrity 
is broken.

That is ain t so cool, _agreed_.

Now there could be someway to workaround that 
and still work with some safety guard to avoid most of the mess.

I ll try to evaluate that with this module.

Until then, here you go :

# usage

Install grunt2bin as local dependency of your module.

```npm i grunt2bin --save```

For each `binary` where you want to use `grunt`

```js
#!/usr/bin/env node

var grunt2bin = require('grunt2bin')
var TasksWorkflow = require('grunt2bin/lib/tasks-workflow.js')

grunt2bin.handleProgram({
  // This function expects
  // an Object with two keys.
  
  // config: To initialize the grunt config
  config: function(grunt, cwd){
    grunt.initConfig({
      'user': ''
    })
    // load my super tasks
    grunt.loadTasks('tasks')
    grunt.setUserGruntfile('grunt-hello.js')
  },
  
  // run: To initialize the tasks workflow.
  run: function(main, grunt, cwd){
    TasksWorkflow()
      .appendTask( TasksWorkflow.createTask('confirm_username'))
      .appendTask( TasksWorkflow.createTask('hello'))
      .packToTask('welcome',
      'Welcome user needs to get his user name first !`.'
    ).appendTo(main);
  }
})
```

See an example https://github.com/maboiteaspam/hello-grunt2bin


## License
See the [LICENSE](./LICENSE) file.
