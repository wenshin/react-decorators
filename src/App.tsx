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

  @mounted
  onlyMounted() {
    // 测试环境，did mount 会执行两遍
    console.log("only mounted");
  }

  @updated
  onlyUpdated() {
    console.log("only updated");
  }

  @rendered
  fetchData() {
    console.log("fetch data");
  }

  @shouldUpdate
  shouldUpdate() {
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
    const elems = Array.from(this.foo);
    elems[0].value++;
  };

  render() {
    const elems = Array.from(this.foo);
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Number {elems[0].value}</p>
          <button onClick={this.click}>Count</button>
        </header>
      </div>
    );
  }
}

export default App;
