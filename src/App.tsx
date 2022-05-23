import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import {
  rendered,
  mounted,
  updated,
  willUnmount,
  shouldUpdate,
  state,
} from "./decorators/react";

class App extends Component {
  // @state counter: Array<number> = [];
  // @state counter: Set<number> = new Set();
  @state foo: Set<{ value: number }> = new Set([{ value: 0 }]);
  // @ts-ignore
  @state bar: number;

  /**
   * 在 didMount 执行，多个方法时，按照定义的先后顺序执行
   */
  @mounted
  onlyMounted1() {
    // 测试环境，did mount 会执行两遍
    console.log("only mounted1");
  }

  /**
   * 在 didMount 执行
   */
  @mounted
  onlyMounted2() {
    // 测试环境，did mount 会执行两遍
    console.log("only mounted2");
  }

  /**
   * 在 didUpdate 执行
   */
  @updated
  onlyUpdated() {
    console.log("only updated");
  }

  /**
   * 在 didMount 和 didUpdate 都执行一次
   */
  @rendered
  fetchData() {
    console.log("fetch data");
  }

  @shouldUpdate
  shouldUpdate(prevProps: unknown, prevState: unknown) {
    console.log("should update");
    return true;
  }

  @willUnmount
  unmount() {
    console.log("will unmount");
  }

  click = () => {
    // this.counter.add(this.counter.size + 1);
    // this.counter.push(1);
    // const elems = Array.from(this.foo);
    // elems[0].value++;
    if (this.bar === undefined) {
      this.bar = 1;
    } else {
      this.bar++;
    }
  };

  render() {
    const elems = Array.from(this.foo);
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Number {elems[0].value}</p>
          <p>Number1 {this.bar || 0}</p>
          <button onClick={this.click}>Count</button>
        </header>
      </div>
    );
  }
}

export default App;
