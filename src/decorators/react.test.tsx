import React, { Component, PureComponent } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  initialize,
  mounted,
  rendered,
  shouldUpdate,
  pureState,
  deepState,
  state,
  willUnmount,
} from "./react";

test("@state foo = 1", () => {
  class Case extends Component {
    renderCount = 0;

    @state foo = 1;

    handleClick = () => {
      this.foo++;
    };

    handleSameValue = () => {
      const v = this.foo;
      this.foo = v;
    };

    render() {
      this.renderCount++;
      return (
        <div>
          <span>counter{this.foo}</span>
          <span>render{this.renderCount}</span>
          <button onClick={this.handleClick}>add</button>
          <button onClick={this.handleSameValue}>samevalue</button>
        </div>
      );
    }
  }
  render(<Case />);
  expect(screen.getByText(/counter1/i)).toBeInTheDocument();
  expect(screen.getByText(/render1/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("add"));
  expect(screen.getByText(/counter2/i)).toBeInTheDocument();
  expect(screen.getByText(/render2/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("samevalue"));
  expect(screen.getByText(/counter2/i)).toBeInTheDocument();
  expect(screen.getByText(/render2/i)).toBeInTheDocument();
});

test("@deepState foo = { bar: 1 }, update sub property", () => {
  class Case extends Component {
    renderCount = 0;

    @deepState foo = { bar: 1 };

    handleClick = () => {
      this.foo.bar++;
    };

    handleSameValue = () => {
      const v = this.foo.bar;
      this.foo.bar = v;
    };

    render() {
      this.renderCount++;
      return (
        <div>
          <span>counter{this.foo.bar}</span>
          <span>render{this.renderCount}</span>
          <button onClick={this.handleClick}>add</button>
          <button onClick={this.handleSameValue}>samevalue</button>
        </div>
      );
    }
  }
  render(<Case />);
  expect(screen.getByText(/counter1/i)).toBeInTheDocument();
  expect(screen.getByText(/render1/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("add"));
  expect(screen.getByText(/counter2/i)).toBeInTheDocument();
  expect(screen.getByText(/render2/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("samevalue"));
  expect(screen.getByText(/counter2/i)).toBeInTheDocument();
  expect(screen.getByText(/render2/i)).toBeInTheDocument();
});

test("@pureState foo = { bar: 1 }, should update by sub property", () => {
  class Case extends PureComponent {
    renderCount = 0;

    @pureState foo = { bar: 1 };

    handleClick = () => {
      this.foo.bar++;
    };

    handleSameValue = () => {
      const v = this.foo.bar;
      this.foo.bar = v;
    };

    render() {
      this.renderCount++;
      return (
        <div>
          <span>counter{this.foo.bar}</span>
          <span>render{this.renderCount}</span>
          <button onClick={this.handleClick}>add</button>
          <button onClick={this.handleSameValue}>samevalue</button>
        </div>
      );
    }
  }
  render(<Case />);
  expect(screen.getByText(/counter1/i)).toBeInTheDocument();
  expect(screen.getByText(/render1/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("add"));
  expect(screen.getByText(/counter2/i)).toBeInTheDocument();
  expect(screen.getByText(/render2/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("samevalue"));
  expect(screen.getByText(/counter2/i)).toBeInTheDocument();
  expect(screen.getByText(/render2/i)).toBeInTheDocument();
});

test("@state foo = { bar: 1 }, should not update by sub property", () => {
  class Case extends Component {
    renderCount = 0;

    @state foo = { bar: 1 };

    handleClick = () => {
      if (this.renderCount === 1) {
        this.foo = { bar: 2 };
      } else {
        this.foo.bar++;
      }
    };

    render() {
      this.renderCount++;
      return (
        <div>
          <span>counter{this.foo.bar}</span>
          <span>render{this.renderCount}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  expect(screen.getByText(/counter1/i)).toBeInTheDocument();
  expect(screen.getByText(/render1/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("add"));
  expect(screen.getByText(/counter2/i)).toBeInTheDocument();
  expect(screen.getByText(/render2/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("add"));
  expect(screen.getByText(/counter2/i)).toBeInTheDocument();
  expect(screen.getByText(/render2/i)).toBeInTheDocument();
});

test("@state foo: number, init with undefined", () => {
  class Case extends Component {
    @state foo?: number;

    handleClick = () => {
      if (this.foo === undefined) {
        this.foo = 1;
      } else {
        this.foo++;
      }
    };

    render() {
      return (
        <div>
          <span>counter{this.foo || 0}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  expect(screen.getByText(/counter0/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("add"));
  expect(screen.getByText(/counter1/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("add"));
  expect(screen.getByText(/counter2/i)).toBeInTheDocument();
});

test("@state foo = { bar: 1 }, update object", () => {
  class Case extends Component {
    @state foo = { bar: 1 };

    handleClick = () => {
      this.foo = { bar: 2 };
    };

    render() {
      return (
        <div>
          <span>{this.foo.bar}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/2/i);
  expect(linkElement).toBeInTheDocument();
});

test("@deepState foo = [{value: 1}], update element.value property", () => {
  class Case extends Component {
    @deepState foo = [{ value: 1 }];

    handleClick = () => {
      this.foo[0].value++;
    };

    render() {
      return (
        <div>
          <span>{this.foo[0].value}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/2/i);
  expect(linkElement).toBeInTheDocument();
});

test("@deepState foo = [], push elements", () => {
  class Case extends Component {
    @deepState foo: number[] = [];

    handleClick = () => {
      this.foo.push(1);
    };

    render() {
      return (
        <div>
          <span>{this.foo.length}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();
});

test("@deepState foo: Set<number> = new Set(), add elements", () => {
  class Case extends Component {
    @deepState foo: Set<number> = new Set();

    handleClick = () => {
      this.foo.add(this.foo.size + 1);
    };

    handleClear = () => {
      this.foo.clear();
    };

    handleDelete = () => {
      this.foo.delete(1);
    };

    render() {
      return (
        <div>
          <span>{this.foo.size}</span>
          <button onClick={this.handleClick}>add</button>
          <button onClick={this.handleClear}>clear</button>
          <button onClick={this.handleDelete}>delete</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByText(/add/i));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByText(/add/i));
  linkElement = screen.getByText(/2/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByText(/delete/i));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByText(/clear/i));
  linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();
});

test("@deepState foo: Set<object> = new Set(), update element property by change to Array", () => {
  class Case extends Component {
    @deepState foo: Set<{ value: number }> = new Set([{ value: 0 }]);

    handleClick = () => {
      const elems = Array.from(this.foo);
      elems[0].value++;
    };

    render() {
      const elems = Array.from(this.foo);
      return (
        <div>
          <span>{elems[0].value}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();
});

test("@deepState foo: Set<object> = new Set(), update element property by iterators", () => {
  class Case extends Component {
    @deepState foo: Set<{ value: number }> = new Set([{ value: 0 }]);

    count = 0;

    handleClick = () => {
      if (this.count === 0) {
        const elem = this.foo.values().next().value as { value: number };
        elem.value++;
      } else if (this.count === 1) {
        const [, v] = this.foo.entries().next().value as [
          unknown,
          { value: number }
        ];
        v.value++;
      } else if (this.count === 2) {
        this.foo.forEach((v) => {
          v.value++;
        });
      }
      this.count++;
    };

    render() {
      const elem = this.foo.values().next().value as { value: number };
      return (
        <div>
          <span>{elem.value}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/2/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/3/i);
  expect(linkElement).toBeInTheDocument();
});

test("@deepState foo = new Map(), add elements", () => {
  class Case extends Component {
    @deepState foo: Map<string, number> = new Map();

    handleClick = () => {
      this.foo.set(String(this.foo.size + 1), 1);
    };

    handleClear = () => {
      this.foo.clear();
    };

    handleDelete = () => {
      this.foo.delete("1");
    };

    render() {
      return (
        <div>
          <span>{this.foo.size}</span>
          <button onClick={this.handleClick}>add</button>
          <button onClick={this.handleClear}>clear</button>
          <button onClick={this.handleDelete}>delete</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByText(/add/i));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByText(/add/i));
  linkElement = screen.getByText(/2/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByText(/delete/i));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByText(/clear/i));
  linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();
});

test("@deepState foo: Map<string, object> = new Map(), update element property", () => {
  class Case extends Component {
    @deepState foo: Map<string, { value: number }> = new Map();

    count = 0;

    handleClick = () => {
      if (!this.foo.size) {
        this.foo.set("key", { value: 0 });
        return;
      }
      let elem: { value: number } | undefined;
      switch (this.count) {
        case 0:
          elem = this.foo.get("key");
          if (elem) {
            elem.value++;
          }
          break;

        case 1:
          elem = this.foo.values().next().value;
          if (elem) {
            elem.value++;
          }
          break;

        case 2:
          [, elem] = this.foo.entries().next().value;
          if (elem) {
            elem.value++;
          }
          break;

        case 3:
          this.foo.forEach((v) => {
            v.value++;
          });
          break;

        default:
          break;
      }
      this.count++;
    };

    render() {
      const elem = this.foo.get("key");
      return (
        <div>
          <span>{elem ? elem.value : 0}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/2/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/3/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/4/i);
  expect(linkElement).toBeInTheDocument();
});

test("@deepState foo = new WeakMap(), add elements", () => {
  class Case extends Component {
    @deepState foo: WeakMap<object, number> = new Map();
    key = () => {};

    handleClick = () => {
      this.foo.set(this.key, (this.foo.get(this.key) || 0) + 1);
    };

    render() {
      return (
        <div>
          <span>{this.foo.get(this.key) || 0}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();
});

test("@deepState foo = new WeakMap(), update element property", () => {
  class Case extends Component {
    @deepState foo: WeakMap<object, { value: number }> = new Map();
    key = () => {};

    handleClick = () => {
      const elem = this.foo.get(this.key);
      if (!elem) {
        this.foo.set(this.key, { value: 1 });
      } else {
        elem.value++;
      }
    };

    render() {
      const elem = this.foo.get(this.key);
      return (
        <div>
          <span>{elem ? elem.value : 0}</span>
          <button onClick={this.handleClick}>add</button>
        </div>
      );
    }
  }
  render(<Case />);
  let linkElement = screen.getByText(/0/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/1/i);
  expect(linkElement).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button"));
  linkElement = screen.getByText(/2/i);
  expect(linkElement).toBeInTheDocument();
});

test("@mounted foo = 1, should fail with not function type", () => {
  expect(() => {
    class Case extends Component {
      @mounted foo = 1;
      render() {
        return <div>test</div>;
      }
    }
    render(<Case />);
  }).toThrow(
    "foo is not a function, and can not use react lifecycle decorators"
  );
});

test("@mounted foo = () => {} and @mounted foo() {}, should call when DidMount", () => {
  let count = 0;
  class Case extends Component {
    @mounted foo = () => count++;
    @mounted bar() {
      count++;
    }
    render() {
      return <div>test</div>;
    }
  }
  render(<Case />);
  expect(count).toBe(2);
});

test("@rendered foo() {}, should call when DidMount and DidUpdate", () => {
  let count = 0;
  class Case extends Component {
    @state text = "";
    @rendered foo() {
      count++;
    }

    handleClick = () => {
      this.text = "test";
    };

    render() {
      return <div onClick={this.handleClick}>name:{this.text}</div>;
    }
  }
  render(<Case />);
  // call when did mount
  expect(count).toBe(1);
  // tigger did update
  fireEvent.click(screen.getByText(/name/));
  // call when did update
  expect(count).toBe(2);
});

test("@initialize init() {}, should call when DidMount and DidUpdate, and stop after return true", () => {
  let count = 0;
  class Case extends Component {
    @state text = "";
    @initialize init() {
      count++;
      if (count > 1) {
        // do some initial works
        // initialized
        return true;
      }
      return false;
    }

    handleClick = () => {
      this.text = "test";
    };

    render() {
      return <div onClick={this.handleClick}>name:{this.text}</div>;
    }
  }
  render(<Case />);
  // call when did mount, init return false
  expect(count).toBe(1);

  // tigger did update
  fireEvent.click(screen.getByText(/name/));
  // call when did update, init return true
  expect(count).toBe(2);

  // tigger did update
  fireEvent.click(screen.getByText(/name/));
  // will not call when did update
  expect(count).toBe(2);
});

test("@initialize init() {}, should call when DidMount and DidUpdate, and stop after return function, and call function when unmount", () => {
  let count = 0;
  class Case extends Component {
    @state text = "test";

    @initialize init() {
      if (count >= 1) {
        // stop
        return () => {
          count++;
        };
      }
      count++;
    }
    render() {
      return (
        <div onClick={() => (this.text = this.text + String(count))}>test</div>
      );
    }
  }
  class App extends Component {
    @state loading = true;
    stopLoading = () => {
      this.loading = false;
    };
    render() {
      return (
        <div>
          {this.loading && <Case />}
          <button onClick={this.stopLoading}>stop</button>
        </div>
      );
    }
  }
  render(<App />);
  // call when did mount, init return false
  expect(count).toBe(1);

  // tigger Case component did update
  fireEvent.click(screen.getByText(/test/));
  // call when did update, init return function
  expect(count).toBe(1);

  // tigger did update
  fireEvent.click(screen.getByText(/stop/));
  // will unmount case
  expect(count).toBe(2);
});

test("@shouldUpdate foo() {}, should call when shouldUpdate", () => {
  let count = 0;
  class Case extends Component {
    @state loading = false;
    // foo call before bar
    @shouldUpdate foo() {
      count++;
      if (count < 2) {
        return true;
      }
      return false;
    }
    @shouldUpdate bar() {
      count++;
      return true;
    }
    stopLoading = () => {
      this.loading = !this.loading;
    };
    render() {
      return <button onClick={this.stopLoading}>click</button>;
    }
  }
  render(<Case />);
  expect(count).toBe(0);

  fireEvent.click(screen.getByText(/click/));
  // call foo and bar
  expect(count).toBe(2);

  fireEvent.click(screen.getByText(/click/));
  // call foo only
  expect(count).toBe(3);

  fireEvent.click(screen.getByText(/click/));
  // call foo only
  expect(count).toBe(4);
});

test("@willUnmount foo() {}, should call when WillUnmount", () => {
  let count = 0;
  class Case extends Component {
    @willUnmount bar() {
      count++;
    }
    render() {
      return <div>test</div>;
    }
  }
  class App extends Component {
    @state loading = true;
    stopLoading = () => {
      this.loading = false;
    };
    render() {
      return (
        <div>
          {this.loading && <Case />}
          <button onClick={this.stopLoading}>stop</button>
        </div>
      );
    }
  }
  render(<App />);
  expect(count).toBe(0);
  fireEvent.click(screen.getByText(/stop/));
  expect(count).toBe(1);
});
