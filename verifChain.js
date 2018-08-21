class VerifChain {
  constructor() {
    this._rules = {}
  }

  /**
   * All rules that are already added to the component
   * @type {VerifyRule[]}
   */
  get rules() {
    return Object.values(this._rules)
  }

  /**
   * Add a rule
   * NB1 : Control param always return boolean but you can return a boolean as string like 'true' of 'false' and it will stop the verification chain
   * NB2 : error always return a string and recieve the contetn to check and his args (at least an array)
   *
   * @param {*} rule composed of {name: string, control: RegExp|function|Promise, error: string|Promise|function}
   * @see VerifyRule
   *
   * @return {VerifChain}
   */
  addRule(rule) {
    if (this._rules[rule.name] === undefined)
      this._rules[rule.name] =
        rule instanceof VerifyRule ? rule : new VerifyRule(rule)
    else throw new Erorr(`Rule "${rule.name}" already exists on verifChain`)
    return this
  }

  /**
   * Add rules
   *
   * @param {VerifyRule[]|any[]} rules
   * @see VerifyRule.addRule
   *
   * @returns {VerifyChain}
   */
  addRules(rules) {
    for (let rule of rules) this.addRule(rule)
    return this
  }

  /**
   * Used to verify a content with some rules defined by a string
   *
   * @async
   * @param {string} chainRule rules separated by '|' ; a rule can have multiple arguments separated by ':' (optional)
   * @param {any} content something to verify
   * @param {boolean?} stopOnError when is true, stop the verification on first error and return the result
   * @see VerifChain.parseRuleChain
   *
   * @return {*}
   */
  verify(chainRule, content, stopOnError) {
    return this._verify({
      checks: VerifChain.parseRuleChain(chainRule),
      content,
      stopOnError,
    })
  }

  /**
   * Used to verify a content with some rules
   *
   * @async
   * @param {*} checkParams comoposed of {checks: [{name: string, args:[]}], content: *, stopOnError = true}
   *
   * @return {*}
   */
  async _verify({ checks, content, stopOnError = true }) {
    let results = []
    for (let { name, args } of checks) {
      const rule = this._rules[name]
      let result = await rule.verify(content, args)
      let endAfterThis = false
      if (typeof result === 'string') {
        endAfterThis = true
        result = result === 'true'
      }
      const resultContent = { result, rule: name, content, args }
      results.push(resultContent)
      if (result === false) {
        resultContent.erorr = await rule.getError(content, args)
        if (stopOnError === true) return this._cleanResults(results)
      }
      if (endAfterThis === true) return this._cleanResults(results)
    }
    return this._cleanResults(results)
  }

  /**
   * just cleaning the result chain to have a better use
   */
  _cleanResults(results) {
    const resultsErrored = results.filter(a => a.result === false)
    return {
      result: resultsErrored.length === 0,
      errors: resultsErrored,
      results,
    }
  }
}
/**
 * String parser to extract an object of rules with args
 * @param {string} chain rules separated by '|' ; a rule can have multiple arguments separated by ':'
 *
 * @return {*}
 */
VerifChain.parseRuleChain = chain =>
  chain.split('|').map(r => {
    const match = r.match(/^(.+?)\:(.*)$/)
    if (match === null) return { name: r, args: [] }
    return { name: match[1], args: match[2].split(':') }
  })

/**
 * Class used to store a rule and promisify control and error
 */
class VerifyRule {
  /**
   * Constructor of a rule
   * NB1 : Control param always return boolean but you can return a boolean as string like 'true' of 'false' and it will stop the verification process when is a string (useful for rule like 'notRequired')
   * NB2 : Error param always return a string and recieve the contetn to check and his args (at least an array)
   *
   * @param {*} rule composed of {name: string, control: RegExp|function|Promise, error: string|Promise|function}
   */
  constructor({ name, control, error }) {
    /**
     * name of the rule
     * @type {string}
     */
    this.name = name
    this._control = VerifyRule.promisify.control(control)
    this._error = VerifyRule.promisify.error(error)
  }

  /**
   * Verify the content given with the args (if they exists)
   *
   * @param {*} content the thing to verify
   * @param {string[]} args arguments passed to the rule
   * @see VerifyRule
   *
   * @return {Promise}
   */
  verify(content, args) {
    return this._control(content, args)
  }

  /**
   * Generate an error from the content and args given
   *
   * @param {*} content the thing that failed to verify
   * @param {string[]} args arguments passed to the rule
   *
   * @return {Promise}
   */
  getError(content, args) {
    return this._error(content, args)
  }
}
/**
 * Object containing promisifiers used to promisify control and error
 * @static
 */
VerifyRule.promisify = {
  control: something => {
    if (something instanceof Promise) return something
    if (something instanceof RegExp)
      return (...args) => new Promise.resolve(something.test(...args))
    if (typeof something === 'function')
      return (...args) => new Promise.resolve(something(...args))
    throw new Error(`Can not promisify control of type "${typeof something}"`)
  },
  error: something => {
    if (something instanceof Promise) return something
    if (typeof something === 'string')
      return () => new Promise.resolve(something)
    if (typeof something === 'function')
      return (...args) => new Promise.resolve(something(...args))
    throw new Error(`Can not promisify error of type "${typeof something}"`)
  },
}
