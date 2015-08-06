# grunt2bin

what if i could use the power of `grunt` with a global node package ?

I think that could be great.

I could take advantage of grunt power.

But i would not have to install again and again the same modules in every project.

Obviously, it can t be as personalized as regular grunt. Do i always need that much of power ?

So here is module to do such thing.

# usage

Install grunt2bin as local dependency of your module.

```npm i grunt2bin --save```

For each `binary` where you want to use `grunt`

```js
#!/usr/bin/env node

require('grunt2bin')(function(grunt, cwd){
  // at that very moment
  // the cwd has switched to your module location
  grunt.initConfig({
    'hello': {
      options: {
        'user': 'put your username here'
      }
    }
  })
  // in order to let you load your task regularly
  grunt.loadTasks('tasks')
  
  // initialize the default the target
  grunt.registerTask('default', ['hello'])
  
  // set the additional file to load within user's cwd.
  grunt.setUserGruntfile('grunt-hello.js')
})
```

See an example https://github.com/maboiteaspam/hello-grunt2bin


## License
See the [LICENSE](./LICENSE) file.
