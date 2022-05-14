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
  // @state counter: Array<{ name: number }> = [];
  @state counter = {
    value: 1,
  };

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
    this.counter.value++;
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Number {this.counter.value}</p>
          <button onClick={this.click}>Count</button>
        </header>
      </div>
    );
  }
}

export default App;
