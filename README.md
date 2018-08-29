# ChainVerif

Verificator engine for asyncronous control and error generation

Some verification pack like for strings or numbers will be available soon, I will mention them here when a new pack is ready. ;)

## Getting started

1. Install it `npm i chainverif`
2. Import him and create an instance
```js
const ChainVerif = require('chainverif')
const verifier = new ChainVerif()
```
3. Add rules
```js
verifier.addRules([
  {
    // just creating a simple rule
    name: 'minimalist',
    control: /minimalist/,
    error: 'Do not match minimalist',
  }, {
    // with functions
    name: 'number',
    control: c => c instanceof Number,
    error: `${c} is not an instance of Number`,
  }, {
    // with one argument
    name: 'min',
    control: (c, [min]) => Number(c) > min,
    error: (c, [min]) => `${c} need to be biger than ${min}`,
  }, {
    // with multiple arguments
    name: 'isBetween',
    control: (c, [min, max]) => c > Number(min) && c < Number(max),
    error: (c, [min, max]) => `${c} need to be between ${min} and ${max}`
  }, {
    // asyncronous
    name: 'asyncCheck',
    control: async c => await Auth.isConnected(c),
    error: async c => `${await Auth.getUserName(c)} is not connected !`,
  }, {
    // and can be mixed
    name: 'mixed',
    control: (c, [letuce, tomato]) => new Promise((res,rej) =>
      mix(letuce, tomato, (e,r) =>
        if(e) res(false)
        else res(true)
      )
    )
    error: {code : 418, text: `Cannot mix tomato and letuce (:`}
  }
])
```
4. Now verify some values
```js
  // some simple
  verifier.verify('number|min:3|isBetween:4,6', 5)
    .then(({result}) => result = true)
  verifier.verify('min:3|isBetween:4,6', '5')
    .then(({result}) => result = true)
  verifier.verify('number|min:3|isBetween:4,6', '5')
    .then(({result, errors}) => {
      result === false
      errors[0] === {
        result: false,
        rule: 'number',
        content: '5',
        args: [],
        error: `5 is not an instance if Number`,
      }
    })

  // with object as content
  verifier.verify('asyncCheck',  {id: 12, sessionHash: 'xxxx'})
    .then(...)
  
  // rules as object
  verifier.verifyItem({
    checks: [
      {name: 'mixed', args: [letuceObject, tomatoObject]},
      {name: 'asyncCheck', args: [] }
    ],
    content: somethingToCheck,
  })
  .then(...)

  // Many rules as object
  Verifier.verifyItems([item1, item2, ...])
  .then(results => results.map(({result}) => ...))

```
