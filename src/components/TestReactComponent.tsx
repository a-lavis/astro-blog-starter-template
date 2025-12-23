import React from "react";

export const TestReactComponent = () => {
  const [loaded, setLoaded] = React.useState(false);

  const pathname =
    typeof window !== "undefined" ? window.location.pathname : undefined;

  if (!loaded || !pathname) {
    return (
      <>
        <h3>Pathname (not loaded): {pathname}</h3>
        <button onClick={() => setLoaded(true)}>Load Component</button>
      </>
    );
  } else {
    return (
      <>
        <h2>Pathname (loaded): {pathname}</h2>
        <p>Component Loaded!</p>
      </>
    );
  }
};
