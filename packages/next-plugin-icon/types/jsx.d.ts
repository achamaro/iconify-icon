declare namespace JSX {
  interface I
    extends React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > {
    icon?: string;
  }

  type Icon = Omit<I, "className"> & {
    class?: string;
  };

  interface IntrinsicElements {
    i: I;
    "i-con": Icon;
  }
}
