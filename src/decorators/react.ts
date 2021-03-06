import { Component } from "react";

interface StateContext {
  /**
   * is pure component or not
   */
  isPure: boolean;
  /**
   * is deep proxy all property or not
   */
  isDeep: boolean;
}

type StateComponent = Component<unknown, Record<string, unknown>> & {
  _realtimeState: Record<string, unknown>;
  state: Record<string, unknown>;
};

/**
 * when use PureComponent，if you need update state by sub property like
 * ```
 * this.user.name = 'name'
 * this.users[0].name = 'name'
 * this.users.push({ name: 'name' })
 * ```
 * you need use pureState
 * @param target
 * @param prop
 * @param descriptor
 */
export function pureState<T>(
  target: Component,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    initializer?: () => T | null;
  }
) {
  state(target, prop, descriptor, {
    isPure: true,
    isDeep: true,
  });
}

/**
 * if you want update state by sub properties, you can use deepState.
 * this decorator will update state like bellow case.
 * ```
 * this.user.name = 'name'
 * this.users[0].name = 'name'
 * this.users.push({ name: 'name' })
 * ```
 * @param target
 * @param prop
 * @param descriptor
 */
export function deepState<T>(
  target: Component,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    initializer?: () => T | null;
  }
) {
  state(target, prop, descriptor, {
    isPure: false,
    isDeep: true,
  });
}

/**
 * shallow proxy component property to update state automaticly.
 * this decorator only update state like bellow case.
 * ```
 * this.user = new Set();
 * this.user = new Map();
 * this.user = 1;
 * this.user = "";
 * this.user = {
 *   id: 1,
 *   name: 'name',
 * }
 * ```
 * @param target
 * @param prop
 * @param descriptor
 * @param ctx
 */
export function state<T>(
  // target 为 prototype 对象
  target: Component,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    // class instance property type
    initializer?: () => T | null;
  },
  ctx?: StateContext
) {
  // property
  if (
    !descriptor ||
    descriptor.hasOwnProperty("initializer") ||
    descriptor.hasOwnProperty("value")
  ) {
    let initValue: any;
    if (descriptor) {
      initValue = descriptor.initializer
        ? descriptor.initializer()
        : descriptor.value;
    }
    const accessor = {
      get() {
        // the typescript may have a bug,
        // the this is the instance of Component,
        // but the typescript think it is the Component object
        const ins = this as unknown as StateComponent;
        // update initial value
        // _realtimeState will save the last value
        if (!ins.state) {
          ins.state = {};
        }
        if (!ins._realtimeState) {
          ins._realtimeState = {};
        }

        if (initValue !== undefined) {
          if (!ins.state.hasOwnProperty(prop)) {
            ins.state[prop] = initValue;
          }
          if (!ins._realtimeState.hasOwnProperty(prop)) {
            ins._realtimeState[prop] = initValue;
          }
        }

        if (!ctx || !ctx.isDeep) {
          return ins._realtimeState[prop];
        }

        const value = getChildProxy(
          ins._realtimeState[prop],
          function () {
            const obj = ins._realtimeState[prop];
            if (!obj || typeof obj !== "object") {
              new Error(
                `can not update state ${prop}, cause of type changed or removed`
              );
            }
            return obj;
          },
          function () {
            if (
              ctx &&
              ctx.isPure &&
              ins._realtimeState[prop] &&
              typeof ins._realtimeState[prop] === "object"
            ) {
              // if the sate of PureComponent, the ins.state[prop] will not rerender;
              ins.setState({
                [prop]: Object.assign({}, ins._realtimeState[prop]),
              });
            } else {
              ins.setState({ [prop]: ins._realtimeState[prop] });
            }
          }
        );
        return value;
      },
      set(v: any) {
        const ins = this as unknown as StateComponent;
        ins._realtimeState[prop] = v;
        // new state is not equal to old state, will update
        if (ins.state && ins.state[prop] !== v) {
          ins.setState({ [prop]: v });
        }
      },
    };
    if (!descriptor) {
      Object.defineProperty(target, prop, accessor);
    } else {
      delete descriptor.value;
      delete descriptor.initializer;
      delete descriptor.writable;
      Object.assign(descriptor, accessor);
    }
  }
}

/**
 * deal with Set, Map, WeakMap methods
 * @param t
 * @param p
 * @param v
 * @param update
 * @returns
 */
function getFunctionValue(
  t: object,
  p: string | symbol,
  v: unknown,
  update: () => void
): Function | undefined {
  /**
   * the Set, Map, WeakMap
   * 1. do not save element as a property of instance
   * 2. will check the instance type which call the methods
   * so can only hack the methods to trigger update
   */
  if (
    typeof v === "function" &&
    (t instanceof Set || t instanceof Map || t instanceof WeakMap)
  ) {
    if ((p as string) === "get") {
      return (k: string) => {
        const e = v.call(t, k);
        return getChildProxy(e, () => e, update);
      };
    }

    if ((p as string) === "forEach") {
      return (iter: (e: unknown, k: string) => void) => {
        return v.call(t, (e: unknown, k: string) => {
          return iter(
            getChildProxy(e, () => e, update),
            k
          );
        });
      };
    }

    if (["entries", "values", "keys", Symbol.iterator].includes(p as string)) {
      return () => {
        const iterator = v.call(t) as Iterator<unknown, unknown>;
        return {
          next() {
            const nextData = iterator.next();
            const nextValue = nextData.value;
            if ((p as string) === "entries") {
              const [k, e] = nextValue as [unknown, unknown];
              nextData.value = [k, getChildProxy(e, () => e, update)];
            } else {
              nextData.value = getChildProxy(
                nextValue,
                () => nextValue,
                update
              );
            }
            return nextData;
          },
          [Symbol.iterator]: function () {
            return this;
          },
        };
      };
    }

    if (["add", "set", "clear", "delete"].includes(p as string)) {
      return (...args: unknown[]) => {
        const ret = v.call(t, ...args);
        update();
        return ret;
      };
    }
    return v.bind(t);
  }
}

/**
 * 递归给属性添加代理
 * @param obj
 * @param getCurrentObj 获得最新的代理对象，用于更新
 * @param update 触发更新 state
 * @returns
 */
function getChildProxy(
  obj: unknown,
  getCurrentObj: () => any,
  update: () => void
): unknown {
  if (obj && typeof obj === "object") {
    return new Proxy(obj, {
      get(t: Record<string | symbol, unknown>, p) {
        const v = getChildProxy(
          t[p],
          function () {
            const currentTarget = getCurrentObj();
            if (currentTarget) {
              const newValue = currentTarget[p];
              if (!newValue || typeof newValue !== "object") {
                new Error(
                  `can not update state ${String(
                    p
                  )}, cause of type changed or removed`
                );
              }
              return newValue;
            }
          },
          update
        );
        const fn = getFunctionValue(t, p, v, update);
        return fn || v;
      },
      set(t: Record<string | symbol, unknown>, p, v) {
        const currentObj = getCurrentObj();
        if (currentObj === t) {
          // new value is not equal to old value, will update
          if (t[p] !== v) {
            t[p] = v;
            update();
          }
        } else if (currentObj) {
          // original target has changed
          if (currentObj[p] !== v) {
            // new value is not equal to old value, will update
            currentObj[p] = v;
            update();
          }
        } else {
          // original target has removed
          t[p] = v;
        }
        return true;
      },
    });
  }
  return obj;
}

/**
 * decorator 中判断函数有两种方式
 * 1. descriptor 中 value 值为函数（这是常规类方法）
 * 2. descriptor.initializer() 返回函数（这是通过属性方式定义函数）
 * @param prop
 * @param descriptor
 * @returns
 */
export function getInitValueAndValidateFunction<T>(
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    // class instance property type
    initializer?: () => T;
  }
) {
  let initValue: T | undefined;
  if (descriptor) {
    initValue = descriptor.initializer
      ? descriptor.initializer()
      : descriptor.value;
  }
  if (!descriptor || typeof initValue !== "function") {
    throw new Error(
      `${prop} is not a function, and can not use react lifecycle decorators`
    );
  }
  return initValue;
}

interface DecoratorContext {
  isCallOnce: boolean;
}

function hasCallOnce(ins: Component, prop: string, ctx?: DecoratorContext) {
  return Boolean(ctx && ctx.isCallOnce && (ins as any)[getCalledProp(prop)]);
}

function getCalledProp(prop: string) {
  return `_${prop}_isTruelyCalled`;
}

/**
 * decorator 中判断函数有两种方式
 * 1. descriptor 中 value 值为函数（这是常规类方法）
 * 2. descriptor.initializer() 返回函数（这是通过属性方式定义函数）
 * @param target
 * @param prop
 * @param descriptor
 */
export function mounted<T>(
  target: Component,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    // class instance property type
    initializer?: () => T;
  },
  ctx?: DecoratorContext
) {
  getInitValueAndValidateFunction(prop, descriptor);
  const componentDidMount = target.componentDidMount;
  target.componentDidMount = function (...args) {
    if (componentDidMount) {
      componentDidMount.apply(this, args);
    }
    if ((this as any)[prop] && typeof (this as any)[prop] === "function") {
      if (hasCallOnce(this, prop, ctx)) return;
      const ret = (this as any)[prop](...args);
      if (ctx) {
        // only when initializing can bindUnmount
        if (ctx.isCallOnce && typeof ret === "function") {
          bindUnmount(target, this, prop, ret);
        }
        (this as any)[getCalledProp(prop)] = Boolean(ret);
      }
    } else {
      throw new Error("react lifecycle decorators only used for function");
    }
  };
}

export function updated<
  P,
  S,
  SS,
  T = (
    prevProps?: Readonly<P>,
    prevState?: Readonly<S>,
    snapshot?: SS | undefined
  ) => void
>(
  target: Component<P, S, SS>,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    // class instance property type
    initializer?: () => T;
  },
  ctx?: DecoratorContext
) {
  getInitValueAndValidateFunction(prop, descriptor);
  const componentDidUpdate = target.componentDidUpdate;
  target.componentDidUpdate = function (...args) {
    if (componentDidUpdate) {
      componentDidUpdate.apply(this, args);
    }
    if ((this as any)[prop] && typeof (this as any)[prop] === "function") {
      if (hasCallOnce(this, prop, ctx)) return;
      const ret = (this as any)[prop](...args);
      if (ctx) {
        // only when initializing can bindUnmount
        if (ctx.isCallOnce && typeof ret === "function") {
          bindUnmount(target, this, prop, ret);
        }
        (this as any)[getCalledProp(prop)] = Boolean(ret);
      }
    } else {
      throw new Error("react lifecycle decorators only used for function");
    }
  };
}

export function shouldUpdate<T>(
  target: Component,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    // class instance property type
    initializer?: () => T;
  }
) {
  getInitValueAndValidateFunction(prop, descriptor);
  const shouldComponentUpdate = target.shouldComponentUpdate;
  target.shouldComponentUpdate = function (...args) {
    let isUpdate = true;
    if (shouldComponentUpdate) {
      isUpdate = shouldComponentUpdate.apply(this, args);
    }
    // if already do not allow update, return false
    if (!isUpdate) return isUpdate;

    if ((this as any)[prop] && typeof (this as any)[prop] === "function") {
      return (this as any)[prop](...args);
    } else {
      throw new Error("lifecycle decorator only used for function properties");
    }
  };
}

export function willUnmount<T>(
  target: Component,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    // class instance property type
    initializer?: () => T;
  }
) {
  getInitValueAndValidateFunction(prop, descriptor);
  const componentWillUnmount = target.componentWillUnmount;
  target.componentWillUnmount = function () {
    if (componentWillUnmount) {
      componentWillUnmount.call(this);
    }
    if ((this as any)[prop] && typeof (this as any)[prop] === "function") {
      (this as any)[prop]();
    } else {
      throw new Error("lifecycle decorator only used for function properties");
    }
  };
}

/**
 * auto call when will unmount.
 * @param target
 * @param ins
 * @param prop
 * @param fn
 * @returns
 */
function bindUnmount(target: Component, ins: Component, prop: string, fn: any) {
  if (!fn && typeof fn !== "function") return;
  (ins as any)._unmountCbs = (ins as any)._unmountCbs || {};
  // always cache the latest value
  (ins as any)._unmountCbs[prop] = fn;

  const componentWillUnmount = target.componentWillUnmount;
  target.componentWillUnmount = function () {
    if (componentWillUnmount) {
      componentWillUnmount.call(ins);
    }
    const cb = (ins as any)._unmountCbs[prop];
    if (cb) {
      cb.call(ins);
    }
  };
}

export function rendered<
  P,
  S,
  SS,
  T = (
    prevProps?: Readonly<P>,
    prevState?: Readonly<S>,
    snapshot?: SS | undefined
  ) => void
>(
  target: Component<P, S, SS>,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    // class instance property type
    initializer?: () => T;
  }
) {
  mounted(target, prop, descriptor);
  updated(target, prop, descriptor);
}

/**
 * call method once in didMount or didUpdate.
 * the method must return true or function to indicate method has been called.
 * if returned function, the function will called when unmount.
 * @param target
 * @param prop
 * @param descriptor
 */
export function initialize<
  P,
  S,
  SS,
  T = (
    prevProps?: Readonly<P>,
    prevState?: Readonly<S>,
    snapshot?: SS | undefined
  ) => boolean | Function
>(
  target: Component<P, S, SS>,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    // class instance property type
    initializer?: () => T;
  }
) {
  const ctx = {
    isCallOnce: true,
  };
  mounted(target, prop, descriptor, ctx);
  updated(target, prop, descriptor, ctx);
}
