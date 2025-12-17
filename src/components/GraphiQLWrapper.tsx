import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import "graphiql/style.css";

const fetcher = createGraphiQLFetcher({
  url: "/graph",
  headers: {
    "Kickstarter-Integration": "myastroapp",
  },
});

export const GraphiQLWrapper = () => {
  return <GraphiQL fetcher={fetcher} />;
};
