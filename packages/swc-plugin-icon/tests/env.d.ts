declare namespace JSX {
  interface Icon
    extends React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > {
    icon?: string;
  }

  interface IntrinsicElements {
    i: Icon;
    "i-con": Icon;
  }
}
