import React, { Component } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { state } from "./react";

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

test("@state foo = { bar: 1 }, update sub property", () => {
  class Case extends Component {
    renderCount = 0;

    @state foo = { bar: 1 };

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

test("@state foo = [{value: 1}], update element.value property", () => {
  class Case extends Component {
    @state foo = [{ value: 1 }];

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

test("@state foo = [], push elements", () => {
  class Case extends Component {
    @state foo: number[] = [];

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

test("@state foo: Set<number> = new Set(), add elements", () => {
  class Case extends Component {
    @state foo: Set<number> = new Set();

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

test("@state foo: Set<object> = new Set(), update element property by change to Array", () => {
  class Case extends Component {
    @state foo: Set<{ value: number }> = new Set([{ value: 0 }]);

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

test("@state foo: Set<object> = new Set(), update element property by iterators", () => {
  class Case extends Component {
    @state foo: Set<{ value: number }> = new Set([{ value: 0 }]);

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

test("@state foo = new Map(), add elements", () => {
  class Case extends Component {
    @state foo: Map<string, number> = new Map();

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

test("@state foo: Map<string, object> = new Map(), update element property", () => {
  class Case extends Component {
    @state foo: Map<string, { value: number }> = new Map();

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

test("@state foo = new WeakMap(), add elements", () => {
  class Case extends Component {
    @state foo: WeakMap<object, number> = new Map();
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

test("@state foo = new WeakMap(), update element property", () => {
  class Case extends Component {
    @state foo: WeakMap<object, { value: number }> = new Map();
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
