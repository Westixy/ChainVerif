# ChainVerif

Verificator engine for asyncronous control and error generation

## Getting started

1. Install it `npm i chainverif`
2. Import him and create an instance
```js
const ChainVerif = require('chainverif')
const verifier = new ChainVerif()
```
3. Add rules
```js
verifier.addRule([
  {
    name: 'min',
    control: (c, [min]) => Number(c) > min,
    error: (c, [min]) => `need to be biger than` 
  }, {

  }
])
```
4. 

