# React-Use-Signals

This package is aimed to provide a comfortable and easy to use state management solution for React.

It is inspired by Vue's Signals API and is based on their [Reactivity in Depth Article](https://vuejs.org/guide/extras/reactivity-in-depth.html).

## Installation

For NPM users:
```bash 
npm install react-use-signals
```

For Yarn users:
```bash
yarn add react-use-signals
```

## Usage

### Creating a Signal

```jsx
// counterSignal.js
import { createSignal } from 'react-use-signals';

export const counterSignal = createSignal(0);

export const handleIncrement = () => {
  counterSignal.value += 1;
};
```

### Using a Signal

```jsx
import { counterSignal, handleIncrement } from './counterSignal';

const Counter = () => {
  const count = counterSignal.useStateAdapter();

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  );
};
```

### Reactivity

As you can see in the example above, the `Counter` component is subscribed to the `counterSignal` and will be re-rendered whenever the signal's value changes.

The example uses the `useStateAdapter` hook to create a local state for your component that is automatically updated whenever the signal's value changes.

Utility functions like handleIncrement in the example above can be used to update the signal's value and called from anywhere in your application, even outside of React components.

This eliminates the need for prop drilling and setters and makes it easy to share state between components.

### Complex Data Structures

Signals can hold any type of data, including complex data structures like objects and arrays.

```jsx
// userSignal.js

import { createSignal } from 'react-use-signals';

export const userSignal = createSignal({
  name: 'John Doe',
  age: 42,
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
  },
});

export const handleUpdateName = (name) => {
  userSignal.value.name = name;
};

export const handleUpdateStreet = (street) => {
  userSignal.value.address.street = street;
};
```

```jsx
import { userSignal, handleUpdateName, handleUpdateStreet } from './userSignal';

const User = () => {
  const user = userSignal.useStateAdapter();

  return (
    <div>
      <p>Name: {user.value.name}</p>
      <p>Street: {user.value.address.street}</p>

      <input
        type="text"
        value={user.value.name}
        onChange={(e) => handleUpdateName(e.target.value)}
        />
        <input
          type="text"
          value={user.value.address.street}
          onChange={(e) => handleUpdateStreet(e.target.value)}
        />
    </div>
  );
};
```

### Effects

There are two ways to create effects with Signals.

#### 1. Using the `useEffect` hook

Signals can be used with the `useEffect` hook just like any other React state.

```jsx
import { counterSignal } from './counterSignal';

const Counter = () => {
  const count = counterSignal.useStateAdapter();

  useEffect(() => {
    console.log(`Count: ${count.value}`);
  }, [count.value]);

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  );
};
```

#### 2. Using the `signalEffect` function

The signalEffect function allows you to create a function that will be called whenever the signal's value changes.
It is similar to the `useEffect` hook, but is designed to be used outside of React components.

Furthermore, it automatically knows which signals are used inside the function and doens't require a dependency array.

```jsx
import {signalEffect} from 'react-use-signals';
import { counterSignal } from './counterSignal';

signalEffect(() => {
  console.log(`Count: ${counterSignal.value}`);
});
```

### Typescript

Signals can be used with Typescript by providing a type argument to the `createSignal` function.

```jsx
import { createSignal } from 'react-use-signals';

type User = {
  name: string;
  age: number;
};

export const userSignal = createSignal<User>({
  name: 'John Doe',
  age: 42,
});
```

If no type argument is provided, the signal will infer the type from the initial value.
This can become problematic when the initial value is `null` or `undefined`, or an empty array or object.


The signal itself is a generic type that takes the type of the initial value as an argument.

```jsx
import { createSignal, Signal } from 'react-use-signals';

type User = {
  name: string;
  age: number;
};

export const userSignal: Signal<User> = createSignal({
  name: 'John Doe',
  age: 42,
});
```

### Stay in touch

If you have any questions or suggestions, feel free to open an issue on [Github](https://github.com/Personal-David-Kohen/React-Use-Signals.git).




