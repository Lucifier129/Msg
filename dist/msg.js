/**
 *File: Msg.js
 *Author: Jade
 *Date: 2014.11.19
 */
;(function(global, undefined) {

	function isType(type) {
		return function(obj) {
			return toStr.call(obj) === '[object ' + type + ']'
		}
	}

	var objProto = Object.prototype
	var arrProto = Array.prototype

	var toStr = objProto.toString
	var hasOwn = objProto.hasOwnProperty

	var slice = arrProto.slice
	var push = arrProto.push

	var isObj = isType('Object')
	var isStr = isType('String')
	var isFn = isType('Function')
	var isArr = Array.isArray || isType('Array')

	function hasOwnKey(obj, key) {
		return obj != null && hasOwn.call(obj, key)
	}

	function getObjKeys(obj) {

		if (!isObj(obj)) {
			return []
		}

		if (Object.keys) {
			return Object.keys(obj)
		}

		var keys = []

		for (var key in obj) {
			if (hasOwnKey(obj, key)) {
				keys.push(key)
			}
		}

		return keys

	}

	function getObjValues(obj) {

		var keys = getObjKeys(obj)
		var len = keys.length
		var values = new Array(len)

		for (var i = 0; i < len; i += 1) {
			values[i] = obj[keys[i]]
		}

		return values
	}

	function each(obj, fn, context) {
		var len = obj.length

		if (len === +len && len) {
			for (var i = 0; i < len; i += 1) {
				if (fn.call(context || global, obj[i], i, obj) === false) {
					return obj
				}
			}
			return obj
		}

		for (var key in obj) {
			if (hasOwnKey(obj, key)) {
				if (fn.call(context || global, obj[key], key, obj) === false) {
					return obj
				}
			}
		}

		return obj
	}

	function extend() {
		var target = arguments[0]
		var deep

		if (typeof target === 'boolean') {
			deep = target
			target = arguments[1]
		}

		if (!isObj(target)) {
			return target
		}

		var sourceList = slice.call(arguments, deep ? 2 : 1)

		each(sourceList, function(source) {

			if (!isObj(source)) {
				return
			}

			each(source, function(value, key) {

				if (deep && isObj(value)) {
					var oldValue = target[key]

					target[key] = isObj(oldValue) ? oldValue : {}

					return extend(deep, target[key], value)
				}

				target[key] = value
			})
		})

		return target

	}

	function throwErr(msg) {
		throw new Error(msg)
	}

	function randomStr() {
		return 'Msg-' + Math.random().toString(36).substr(2)
	}

	var nextTick = typeof process !== 'undefined' && process.nextTick || function(fn) {
		return setTimeout(fn, 0)
	}

	function Msg() {

		if (!(this instanceof Msg)) {
			return new Msg()
		}

		this._reactions = {}

	}

	var msg = Msg.prototype = {

		_add: function(msgType, reaction) {

			var index = msgType.indexOf('.')
			var name

			if (index <= 0) {

				name = randomStr()

			} else {

				name = msgType.substr(index + 1)
				msgType = msgType.substr(0, index)

			}

			reactions = this._reactions[msgType] = this._reactions[msgType] || {}
			reactions[name] = reactions[name] || []
			reactions[name].push(reaction)

			return this

		},

		on: function(msgType, reaction) {

			if (!isFn(reaction)) {
				throwErr(reaction + '不是一个函数')
			}

			if (isStr(msgType)) {

				this._add(msgType, reaction)

			} else if (isArr(msgType)) {

				var that = this
				each(msgType, function(type) {
					if (isStr(type)) {
						that._add(type, reaction)
					}
				})
			}

			return this
		},

		_react: function(msgType) {

			if (isStr(msgType) && hasOwnKey(this._reactions, msgType)) {

				var that = this
				var data = slice.call(arguments, 1)
				var index = msgType.indexOf('.')
				var name

				function react(reactions, theName) {

					if (name === undefined || name === theName) {
						each(reactions, function(reaction) {
							reaction.msgType = msgType
							reaction.apply(global, data)
						})
					}
				}

				if (index === 0) {

					name = msgType.substr(1)

					each(this._reactions, function(_reactions, _msgType) {

						msgType = _msgType
						each(_reactions, react)

					})

				} else {

					if (index > 0) {
						name = msgType.substr(index + 1)
						msgType = msgType.substr(0, index)
					}

					each(this._reactions[msgType], react)

				}

			}

			return this
		},

		spread: function(msgType) {

			var that = this
			var args = slice.call(arguments)

			//不指定消息类型，触发所有事件反应
			if (!msgType) {
				args = args.slice(1)
				each(getObjKeys(this._reactions), function(type) {
					that._react.apply(that, [type].concat(args))
				})

				//散播单个消息类型
			} else if (isStr(msgType)) {

				this._react.apply(that, args)

				//散播一组消息类型
			} else if (isArr(msgType)) {
				args = args.slice(1)
				each(msgType, function(type) {
					that._react.apply(that, [type].concat(args))
				})

			}

			return this
		},

		off: function(msgType) {

			var that = this

			//不指定消息类型，取消所有
			if (!msgType) {

				this._reactions = {}

			} else {

				//根据是否有命名空间， 分情况取消消息订阅
				function off(theMsgType) {
					var index = theMsgType.indexOf('.')
					var name

					if (index === 0) {

						if (theMsgType in that._reactions) {
							that._reactions[theMsgType] = {}
						} else {
							name = theMsgType.substr(1)
							each(that._reactions, function(_reactions) {

								each(_reactions, function(reactions, theName) {
									if (name === theName) {
										_reactions[name] = []
									}
								})

							})
						}

					} else if (index > 0) {
						name = theMsgType.substr(index + 1)
						theMsgType = theMsgType.substr(0, index)
						that._reactions[theMsgType][name] = []
					} else {
						that._reactions[theMsgType] = {}
					}
				}

				//取消一组消息
				if (isArr(msgType)) {
					each(msgType, off);
				} else if (isStr(msgType)) {
					//取消一类
					off(msgType)
				}

			}

			return this

		}
	}

	extend(msg, {

		once: function(msgType, reaction) {
			var that = this

			msgType += '.once'

			function wrapper() {
				reaction.apply(global, arguments)
				that.off(msgType, wrapper)
			}

			return this._add(msgType, wrapper)

		},

		hold: function(msgType, times, reaction) {

			if (!(times === +times && times >= 0)) {
				throwErr(times + '不是一个正整数')
			}

			var that = this

			function wrapper() {
				if (--times <= 0) {
					reaction.apply(global, arguments)
				}
			}

			this._add(msgType, wrapper)

			return wrapper

		},

		tie: function(msgTypes, reaction) {

			if (!isFn(reaction)) {
				throwErr(reaction + '不是一个函数')
			}

			if (isArr(msgTypes)) {

				var total = 0
				var count = 0
				var cache = {}
				var data = {}

				each(msgTypes, function(msgType) {

					if (isStr(msgType)) {
						msgType = msgType.substr(0 , msgType.indexOf('.'))
						cache[msgType] = data[msgType] = 1
						total += 1
					}

				})

				function wrapper() {

					if (!hasOwnKey(cache, wrapper.msgType)) {
						return
					}

					delete cache[wrapper.msgType]

					data[wrapper.msgType] = arguments.length === 1 ? arguments[0] : slice.call(arguments)


					if (++count >= total) {

						var datas = []

						each(msgTypes, function(type) {
							if (isStr(type)) {
								type = type.substr(0 , type.indexOf('.'))
								cache[type] = 1
								datas.push(data[type])
							}
						})

						reaction.apply(global, datas)

					}
				}

				this.on(msgTypes, wrapper)

			} else if (isStr(msgTypes)) {

				this._add(msgTypes, reaction)

			}

			return this

		},

		tick: function() {
			var args = slice.call(arguments)
			var that = this

			nextTick(function() {
				that.spread.apply(that, args)
			})

			return this
		},

		delay: function(timeout) {
			var args = slice.call(arguments, 1)
			var that = this

			setTimeout(function() {
				that.spread.apply(that, args)
			}, timeout || 0)

			return this
		}
	})

	extend(msg, {
		isObj: isObj,
		isFn: isFn,
		isStr: isStr,
		isArr: isArr,
		keys: getObjKeys,
		has: hasOwnKey,
		values: getObjValues,
		each: each,
		extend: extend,
		nextTick: nextTick
	})

	if (typeof define === 'function') {

		define(function() {
			return Msg
		})

	} else if (typeof module !== 'undefined' && isObj(module.exports) && typeof exports !== 'undefined') {

		module.exports = Msg

	} else {

		global.Msg = Msg
	}

}(this));