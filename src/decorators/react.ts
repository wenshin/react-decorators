import { Component } from "react";

export function state<T>(
  // target 为 prototype 对象
  target: Component,
  prop: string,
  descriptor?: TypedPropertyDescriptor<T> & {
    // class instance property type
    initializer?: () => T;
  }
) {
  // property
  if (!descriptor || descriptor.initializer || "value" in descriptor) {
    let initValue: any;
    if (descriptor) {
      initValue = descriptor.initializer
        ? descriptor.initializer()
        : descriptor.value;
    }
    const accessor = {
      get() {
        // 这里的 this 才是实际的组件实例
        const ins = this as unknown as Component<
          unknown,
          Record<string, unknown>
        >;
        if (initValue !== undefined) {
          if (!ins.state) {
            ins.state = {
              [prop]: initValue,
            };
          } else if (!ins.state.hasOwnProperty(prop)) {
            (ins.state as any)[prop] = initValue;
          }
        } else if (!ins.state) {
          ins.state = {};
        }
        const value = getChildProxy(
          ins.state[prop],
          function () {
            const obj = ins.state[prop];
            if (!obj || typeof obj !== "object") {
              new Error(
                `can not update state ${prop}, cause of type changed or removed`
              );
            }
            return obj;
          },
          function () {
            ins.setState({ [prop]: ins.state[prop] });
          }
        );
        // console.log("1111 get", prop, value);
        return value;
      },
      set(v: any) {
        // console.log("1111 set", prop, v);
        const ins = this as unknown as Component<
          unknown,
          Record<string, unknown>
        >;
        ins.setState({ [prop]: v });
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
      get(t, p) {
        const v = getChildProxy(
          (t as any)[p],
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
      set(t, p, v) {
        (t as any)[p] = v;
        const currentObj = getCurrentObj();
        if (currentObj) {
          // proxy target has changed, so need update property value again
          if (currentObj !== t) {
            currentObj[p] = v;
          }
          update();
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
function getInitValueAndValidateFunction<T>(
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
  }
) {
  getInitValueAndValidateFunction(prop, descriptor);
  const componentDidMount = target.componentDidMount;
  target.componentDidMount = function (...args) {
    if (componentDidMount) {
      componentDidMount.apply(this, args);
    }
    if ((this as any)[prop] && typeof (this as any)[prop] === "function") {
      (this as any)[prop](...args);
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
  }
) {
  getInitValueAndValidateFunction(prop, descriptor);
  const componentDidUpdate = target.componentDidUpdate;
  target.componentDidUpdate = function (...args) {
    if (componentDidUpdate) {
      componentDidUpdate.apply(this, args);
    }
    if ((this as any)[prop] && typeof (this as any)[prop] === "function") {
      (this as any)[prop](...args);
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
