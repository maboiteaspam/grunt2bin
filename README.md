# grunt2bin

what if i could use the power of `grunt` with a global node package ?

I think that could be great.

I could take advantage of grunt power.

But i would not have to install again and again the same modules in every project.

Also, one binary could take advantage of it to mix both cli an grunt interface within the same package.

Merge cli options with user defined settings via grunt is a mechanism 
that can offer flexibility to manage various behavior of the program 
depending on the current wd.


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
var TasksWorkflow = grunt2bin.TasksWorkflow

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
